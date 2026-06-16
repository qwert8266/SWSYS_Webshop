import { NavLink, useParams } from 'react-router-dom';
import '../categories.css';
import { useState, useEffect } from 'react';

import productApi from "../../api/productApi";
import { getCategoryConfig } from "../../utils/categoryConfig";
import { normalizeProduct, getProductImagePath, formatEuro } from '../../utils/productHelpers';

function ProductManagement({ category: fixedCategory }){
    const { categorySlug } = useParams();
    const selectedCategory = getCategoryConfig(fixedCategory || categorySlug);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const[clickedAddProductButton, setClickedAddProductButton] = useState(false)

    useEffect(() => {
        let ignoreResult = false;

        async function loadProducts() {
            setIsLoading(true);
            setLoadError("");
            setCategoryProducts([]);

            try {
                const productsFromDatabase = await productApi.getProducts(); 
                
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
            <div className='d-flex flex-column align-items-center pb-5'>
                <div className='sentence_top'>Produktverwaltung</div>
                <div className='sentence_below_top'>
                    Hinzufügen oder entfernen von Produkten.
                </div>
                {!clickedAddProductButton &&
                <button className="btn text-white fs-5 align-self-center" style={{ backgroundColor: "#15406e" }} onClick={() => setClickedAddProductButton(true)}>Produkt hinzufügen</button>
}
            </div>
            {isLoading && <p className="category-info">Produkte werden geladen...</p>}
            {loadError && <p className='category-info text-danger'>{loadError}</p>}

            {isLoading && !loadError && categoryProducts.length === 0 && (
                <p className='category-info'>Hoppla. Leider konnten wir keine Produkte finden.</p>
            )}

            {clickedAddProductButton &&
            <div className='d-flex justify-content-center'>
                <div className='d-flex flex-column align-items-center border rounded pt-2 w-50'>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Produktname</label>
                        <input className='fs-5 border rounded ' type="text" placeholder='Produktname'/>
                    </div>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Beschreibung</label>
                        <input className='fs-5 border rounded ' type="text" placeholder='Beschreibung'/>
                    </div>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Bild</label>
                        <input className='fs-5 border rounded ' type="text" placeholder='Bild(Dateiname)'/>
                    </div>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Preis</label>
                        <input className='fs-5 border rounded ' type="text" placeholder='Preis(in Cent)'/>
                    </div>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Stock</label>
                        <input className='fs-5 border rounded ' type="text" placeholder='Stock'/>
                    </div>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Kategorie</label>
                        <input className='fs-5 border rounded ' type="text" placeholder='Kategorie'/>
                    </div>
                    
                    <div className='pb-2'>
                    <button className="btn text-white fs-5 align-self-center" style={{ backgroundColor: "#15406e" }} onClick={() => setClickedAddProductButton(false)}>Produkt hinzufügen</button>
                    </div>
                </div>
            </div>}

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

export default ProductManagement