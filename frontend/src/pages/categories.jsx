import { NavLink, useParams } from 'react-router-dom';
import './categories.css';
import { useState, useEffect } from 'react';

import productApi from "../api/productApi";
import { getCategoryConfig } from "../utils/categoryConfig";
import { normalizeProduct, getProductImagePath, formatEuro } from '../utils/productHelpers';

/*export const biere = [
  { name: "Becks", price: "14.99", rating: 3.8, img: "becks.png" },
  { name: "Corona", price: "19.99", rating: 3.4, img: "corona.png"  },
  { name: "Desperados", price: "34.99", rating: 4.5, img: "desperados.png" },
];

export const weine = [
  { name: "Merlot", price: "9.99", rating: 2.8, img: "merlot.png" },
  { name: "Riesling", price: "12.99", rating: 3.6, img: "riesling.png" }
];

export const schnäpse = [
  { name: "Jägermeister", price: "14.99", rating: 1.0, img: "jägermeister.png" },
  { name: "Havana", price: "12.99", rating: 3.8, img: "havana.png" },
  { name: "Veterano", price: "5.99", rating: 5.0, img: "veterano.png" }
];

export const top_banners = [
    {png: "bier_top.png", sentence: "Bier geht doch immer!"},
    {png: "wein_top.png", sentence: "Wein in meinen Mund!"},
    {png: "schnaps_top.png", sentence: "Ich fühl mich Osborne!"}
]
*/

function Category({ category: fixedCategory }){
    const { categorySlug } = useParams();
    const selectedCategory = getCategoryConfig(fixedCategory || categorySlug);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        let ignoreResult = false;

        async function loadProducts() {
            setIsLoading(true);
            setLoadError("");
            setCategoryProducts([]);

            try {
                const productsFromDatabase = await productApi.getProductsByCategory(selectedCategory.dbCategory); 
                
                if (!ignoreResult) {
                    setCategoryProducts(productsFromDatabase.map(normalizeProduct))
                }
            } catch (error) {
                if (!ignoreResult) {
                    setLoadError("Produkte konnten nicht aus der Datenbank geladen werden.");
                }
            } finally {
                if (!ignoreResult) {
                    setIsLoading(false);
                }
            }
            
        }
        loadProducts();

        return () => {
            ignoreResult = true;
        };
    }, [selectedCategory.dbCategory]);


    return(
        <div className='category-page'>
            <div>
                <div>
                    <img 
                        className='picture_top' 
                        src={`/img/product_images/${selectedCategory.banner.png}`} 
                        alt={selectedCategory.name}
                    />
                </div>
                <div className='sentence_top'>{selectedCategory.banner.sentence}</div>
                <div className='sentence_below_top'>
                    Entdecken Sie neue Sorten oder genießen Sie ihre Favoriten.
                </div>
            </div>

            {isLoading && <p className="category-info">Produkte werden geladen...</p>}
            {loadError && <p className='category-info text-danger'>{loadError}</p>}

            {isLoading && !loadError && categoryProducts.length === 0 && (
                <p className='category-info'>Hoppla. Leider konnten wir keine Produkte finden.</p>
            )}

            <div className="product_row">
                {categoryProducts.map((product) => (
                    <div className="product" key={product.id || product.name}>
                        
                        <NavLink 
                            className="product_link" 
                            to={`/sortiment/${selectedCategory.slug}/${encodeURIComponent(product.id)}`}
                        >
                            <img className="product_png" src={getProductImagePath(product)} alt={product.name} />
                            <h3>{product.name}</h3>
                        </NavLink>
                        <p>{"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}</p>
                        <strong>{formatEuro(product.price)}</strong>
                        {product.stock !== null && product.stock <= 15 && <p className='text-danger'>Nur noch {product.stock} verfügbar</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Category