import { Link, NavLink, useParams } from 'react-router-dom';
import './product.css';
import { useCart } from '../context/cartContext';
import { useEffect, useState } from 'react';

import productApi from '../api/productApi';
import StockIndicator from '../components/stockIndicator';
import FavoriteButton from '../components/favoriteButton';
import '../components/favoriteButton.css';
import { getProductImagePath, normalizeProduct } from '../utils/productHelpers';
import OfferBadge from '../components/offerBadge';
import ProductPrice from '../components/productPrice';
import FourOFour from './404';

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
    const requestedCategorySlug = categorySlug || category;
    const requestedProductId = productId || productName;

    const { addItem } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [product, setProduct] = useState(null);
    const [stockInfo, setStockInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [cartMessage, setCartMessage] = useState("");
    const [productNotFound, setProductNotFound] = useState(false);
    const [slideIndex, setSlideIndex] = useState(0);


    useEffect(() => {
        let ignoreResult = false;

        async function loadProduct() {
            setIsLoading(true);
            setLoadError("");
            setCartMessage("");
            setProductNotFound(false);

            try {
                // Produktdaten und Bestand kommen aus getrennten Endpunkten:
                // der Stock-Endpunkt liefert den zentral berechneten Status
                // (ok / low / critical / out_of_stock) gleich mit
                const [loadedProduct, loadedStock] = await Promise.all([
                    productApi.getProductById(requestedProductId),
                    productApi.getProductStock(requestedProductId),
                ]);

                if (!ignoreResult) {
                    setProduct(normalizeProduct(loadedProduct));
                    setStockInfo(loadedStock);
                }
            } catch (error) {
                if (!ignoreResult) {
                    if(error.status === 404){
                        setProductNotFound(true);
                    }
                    
                    setLoadError("Produkt konnte nicht geladen werden.");
                    setProduct(null);
                    setStockInfo(null);
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
    
    const productCategories = Array.isArray(product?.categories) ? product.categories : [];
    const selectedCategory = productCategories.find((productCategory) => {
        return productCategory?.slug === requestedCategorySlug;
    }) || productCategories[0] || null;
    

    // Bei stock === 0 (Status "out_of_stock") ist kein Kauf möglich
    const isOutOfStock = stockInfo?.status === "out_of_stock" || product?.stock === 0;

    function handleAddToCart(){
        if (!product || isOutOfStock) { return; }

        // Der Warenkorb deckelt die Menge am aktuellen Bestand,
        // damit Überbestellungen gar nicht erst entstehen
        const result = addItem(product, quantity, stockInfo?.stock);

        if (result.added === 0) {
            setCartMessage("");
            setLoadError(`Keine weitere Menge verfügbar – es sind bereits ${stockInfo?.stock ?? 0} Stück in deinem Warenkorb.`);
        } else if (result.capped) {
            setLoadError("");
            setCartMessage(`Nur ${result.added} von ${result.requested} Stück konnten hinzugefügt werden (Bestand: ${stockInfo?.stock}).`);
        } else {
            setLoadError("");
            setCartMessage(`${product.name} wurde in den Warenkorb gelegt.`);
        }
    }

    

    function changeSlide(direction) {
    setSlideIndex((currentIndex) =>
        (currentIndex + direction + product.images.length) % product.images.length
    );
}



    if (productNotFound || !selectedCategory) {
    return <FourOFour />;
}

    if (isLoading) {
        return <p>Produkt wird geladen...</p>
    }
    if (!product?.name) {
        return (
            <FourOFour/>
        );
    }



    return(
        <div className='product-page'>
            {loadError && <p className='text-danger'>{loadError}</p>}
            {/*{cartMessage && <p className='text-success'>{cartMessage}</p>} */}
            
            <div className='product-page-top'>
                <div className='d-flex flex-column'>
                    <div className="slideshow-container">
                        

                        {!product.images || product.images?.length === 0 ? (
                            <img src={getProductImagePath(product)} alt={product.name} style={{ width: "600px", height: "600px" }}/>
                        ) : (
                        product.images?.map((image, index) => (
                            <div
                                key={index}
                                className={`mySlides slide-fade ${
                                    index === slideIndex ? "active-slide" : ""
                                }`}
                            >
                                <img
                                    src={getProductImagePath({ images: [image] })}
                                    alt={product.name}
                                    style={{ width: "600px", height: "600px" }}
                                />
                            </div>
                        )))}
                    </div>

                    <div style={{ textAlign: "center"}}>
                        {(product.images && product.images?.length > 0) &&
                        <span className="arrow left" onClick={() => changeSlide(-1)}> ❮ </span>}
                        {product.images?.map((_, index) => (
                            <span
                                key={index}
                                className={`dotProductPage ${
                                    index === slideIndex ? "active-dot" : ""
                                }`}
                                onClick={() => setSlideIndex(index)}
                            />
                        ))}
                        {(product.images && product.images?.length > 0) &&
                        <span className="arrow right" onClick={() => changeSlide(1)}> ❯ </span>}
                    </div>
                </div>
                <div className='product-information'> 
                    <div className='blue-header'>
                        <strong>{product.name}</strong>
                        <p className='fs-6'>
                            Kategorie: {" "}
                            {(selectedCategory?.slug) ? (
                                <Link to={`/sortiment/${selectedCategory.slug}`}>{selectedCategory.name}</Link>
                            ) : (
                                selectedCategory.name
                            )} 
                        </p>     
                    </div>
                    <div className='other-information'>
                        <OfferBadge product={product} />
                        <p>{product.description || "Keine Beschreibung zu diesem Produkt vorhanden."}</p>
                        <p>{"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}{`(${product.rating})`}</p>
                        <p><ProductPrice product={product} /></p>
                        {/* Status kommt vom Backend -- kein hardcodierter Schwellwert mehr */}
                        <StockIndicator stockInfo={stockInfo} showInStock />
                    </div>
                    <div className='cart-input'>
                        <input 
                            type="number" 
                            min="1" 
                            max={stockInfo?.stock}
                            value={quantity} 
                            onChange={(e)=> {
                                setQuantity(parseInt(e.target.value))
                            }}
                        />
                        <button 
                            className='cart-button' 
                            type="button"
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                            title={isOutOfStock ? "Dieses Produkt ist ausverkauft" : "In den Warenkorb"}
                        >
                            <img className="cart-at-product" src={`/img/cart-icon_white.png`} alt="In den Warenkorb" />
                        </button>
                    </div>
                    <div className="product-page-actions">
                        <FavoriteButton
                            productId={product.id}
                            listType="favorite"
                            className="with-label"
                            showLabel
                        />
                        <FavoriteButton
                            productId={product.id}
                            listType="wishlist"
                            className="with-label"
                            showLabel
                        />
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
