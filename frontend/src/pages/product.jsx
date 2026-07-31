import { NavLink, useParams } from 'react-router-dom';
import './product.css';
import { useCart } from '../context/cartContext';
import { useEffect, useState } from 'react';

import productApi from '../api/productApi';
import { getCategoryConfig } from '../utils/categoryConfig';
import { formatEuro, normalizeProduct } from '../utils/productHelpers';

/*export const produkte = [
  { name: "Becks", id: "001", price: "14.99", rating: 3.8, image: "becks.png", category: "bier", quantity: 0},
  { name: "Corona", id: "002", price: "19.99", rating: 3.4, image: "corona.png", category: "bier"  },
  { name: "Desperados", id: "003", price: "34.99", rating: 4.5, image: "desperados.png", category: "bier" },
  { name: "Merlot", id: "004", price: "9.99", rating: 2.8, image: "merlot.png", category: "wein" },
  { name: "Riesling", id: "005", price: "12.99", rating: 3.6, image: "riesling.png", category: "wein" },
  { name: "Jägermeister", id: "006", price: "14.99", rating: 1.1, image: "jägermeister.png", category: "schnaps" },
  { name: "Havana", id: "007", price: "12.99", rating: 3.8, image: "havana.png", category: "schnaps" },
  { name: "Veterano", id: "008", price: "5.99", rating: 4.9, image: "veterano.png", category: "schnaps" },

];*/

const rezensionen = [
    {username: "Mathis Gronewold", profilePicture: "profile_picture.png", rating: 5, evaluation: "Da geht mir einer ab!"},
    {username: "Lucas Mauermann", profilePicture: "profile_picture.png", rating: 1, evaluation: "Könnte kotzen."},
    {username: "Wesley Pabst", profilePicture: "profile_picture.png", rating: 3, evaluation: "Naja, weiss ja nicht..."},
    {username: "Mathis Gronewold", profilePicture: "profile_picture.png", rating: 5, evaluation: "Da geht mir einer ab!"},
    {username: "Lucas Mauermann", profilePicture: "profile_picture.png", rating: 1, evaluation: "Könnte kotzen."},
    {username: "Wesley Pabst", profilePicture: "profile_picture.png", rating: 3, evaluation: "Naja, weiss ja nicht..."},
    {username: "Mathis Gronewold", profilePicture: "profile_picture.png", rating: 5, evaluation: "Da geht mir einer ab!"},
    {username: "Lucas Mauermann", profilePicture: "profile_picture.png", rating: 1, evaluation: "Könnte kotzen."},
    {username: "Wesley Pabst", profilePicture: "profile_picture.png", rating: 3, evaluation: "Naja, weiss ja nicht..."},
    {username: "Mathis Gronewold", profilePicture: "profile_picture.png", rating: 5, evaluation: "Da geht mir einer ab!"},
    {username: "Lucas Mauermann", profilePicture: "profile_picture.png", rating: 1, evaluation: "Könnte kotzen."},
    {username: "Wesley Pabst", profilePicture: "profile_picture.png", rating: 3, evaluation: "Naja, weiss ja nicht..."},
]

function Product(){
    const { category, productName, categorySlug, productId } = useParams();
    const selectedCategory = getCategoryConfig(categorySlug || category);
    const requestedProductId = productId || productName;

    const { addItem } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [cartMessage, setCartMessage] = useState("");

    /*const product = produkte.find(
        p =>
            p.category === category &&
        p.name.toLowerCase() === productName
    );*/

    useEffect(() => {
        let ignoreResult = false;

        async function loadProduct() {
            setIsLoading(true);
            setLoadError("");
            setCartMessage("");

            try {
                const loadedProduct = await productApi.getProductById(requestedProductId);
                
                if (!ignoreResult) {
                    setProduct(normalizeProduct(loadedProduct));
                }
            } catch (error) {
                if (!ignoreResult) {
                    setLoadError("Produkt konnte nicht geladen werden.");
                    setProduct(null);
                }
            } finally {
                if (!ignoreResult) {
                    setIsLoading(false);
                }
            }
        }

        if (requestedProductId) {
            loadProduct();
        }

        return () => {
            ignoreResult = true;
        };
    }, [requestedProductId]);
    

    function handleAddToCart(){
        if (!product) { return; }
        
        addItem(product, quantity);
        setCartMessage(`${product.name} wurde in den Warenkorb gelegt.`);
    }

    if (isLoading) {
        return <p>Produkt wird geladen...</p>
    }
    if (!product?.name) {
        return (
            <div className="product-page">
                {loadError && <p className="text-danger">{loadError}</p>}
                <p>Das Produkt wurde nicht gefunden</p>
            </div>
        );
    }


    return(
        <div className='product-page'>
            {loadError && <p className='text-danger'>{loadError}</p>}
            {cartMessage && <p className='text-success'>{cartMessage}</p>}
            
            <div className='product-page-top'>
                <div >
                    <img className='product-picture' src={`/img/product_images/${product.image}` }alt={product.name} />
                </div>

                <div className='product-information'> 
                    <div className='blue-header'>
                        <strong>{product.name}</strong><p> -- {selectedCategory.name} (Kategorie)</p>
                    </div>
                    <div className='other-information'>
                        <p>{product.description || "Keine Beschreibung zu diesem Produkt vorhanden."}</p>
                        <p>{"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}{`(${product.rating})`}</p>
                        <p>{formatEuro(product.price)}</p>
                        {product.stock !== null && product.stock <= 15 && <p className='text-danger'>Nur noch {product.stock} verfügbar</p>}
                    </div>
                    <div className='cart-input'>
                        <input 
                            type="number" 
                            min="1" 
                            value={quantity} 
                            onChange={(e)=> {
                                setQuantity(parseInt(e.target.value))
                            }}
                        />
                        <button 
                            className='cart-button' 
                            type="button"
                            onClick={handleAddToCart}
                            disabled={product.stock === 0}
                        >
                            <img className="cart-at-product" src={`/img/cart-icon_white.png`} alt="In den Warenkorb" />
                        </button>
                    </div>
                </div>
            </div>

            <div className='product-page-bottom'>
                <div className='blue-header'>
                    Rezensionen
                </div>

                <div className='review-section'>
                    {rezensionen.map((rezension) => (
                        <div className='review-card'>
                            <div className='picture_and_name'>
                                <img className='profile-picture' src={`/img/${rezension.profilePicture}`} alt={rezension.username}></img>
                                <p>{rezension.username}</p>
                            </div>
                            <p>{"★".repeat(Math.round(rezension.rating))}{"☆".repeat(5 - Math.round(rezension.rating))}</p>
                            <p>{rezension.evaluation}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        
    )
}

export default Product