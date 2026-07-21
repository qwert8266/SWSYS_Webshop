import { Link, NavLink, useParams } from 'react-router-dom';
import './product.css';
import { useCart } from '../context/cartContext';
import { useEffect, useState } from 'react';

import productApi from '../api/productApi';
import StockIndicator from '../components/stockIndicator';
import FavoriteButton from '../components/favoriteButton';
import '../components/favoriteButton.css';
import OfferBadge from '../components/offerBadge';
import FourOFour from './404';
import ProductPrice from '../components/productPrice';
import { formatEuro, formatVolume, getProductImagePath, getVariantLabel, normalizeProduct } from '../utils/productHelpers';

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
    const [selectedVariantKey, setSelectedVariantKey] = useState(null);
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
                    const normalizedProduct = normalizeProduct(loadedProduct);
                    setProduct(normalizedProduct);
                    setStockInfo(loadedStock);
                    setSelectedVariantKey(normalizedProduct.variants[0]?.key ?? null);
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
    

    const selectedVariant = product?.variants?.find(
        (variant) => variant.key === selectedVariantKey
    ) ?? null;

    const selectedVariantStock = stockInfo?.variants?.find((entry) => Number(entry.volume) === selectedVariant?.volume && Number(entry.packSize) === selectedVariant?.packSize);

    const availableStock = selectedVariantStock?.stock ?? selectedVariant?.stock ?? 0;
    const isOutOfStock = availableStock === 0;

    function handleAddToCart(){
        if (!product || isOutOfStock) { return; }

        const result = addItem(product, quantity, availableStock, selectedVariant);

        const variantLabel = selectedVariant ? ` (${getVariantLabel(selectedVariant)})` : "";

        if (result.added === 0) {
            setCartMessage("");
            setLoadError(`Keine weitere Menge verfügbar – es sind bereits ${availableStock ?? 0} Stück in deinem Warenkorb.`);
        } else if (result.capped) {
            setLoadError("");
            setCartMessage(`Nur ${result.added} von ${result.requested} Stück konnten hinzugefügt werden (Bestand: ${availableStock}).`);
        } else {
            setLoadError("");
            setCartMessage(`${product.name}${variantLabel} wurde in den Warenkorb gelegt.`);
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
                    
                        {/* Variantenauswahl */}
                        {product.variants.length > 0 && (
                            <div className='variant-selection'>
                                <p className='variant-selection-title'>Gebindegröße wählen:</p>
                                <div className='variant-options'>
                                    {product.variants.map((variant) => (
                                        <button
                                            key={variant.key}
                                            type='button'
                                            className={
                                                "variant-option" +
                                                (variant.key === selectedVariantKey ? " variant-option-selected" : "") +
                                                (variant.stock === 0 ? " variant-option-sold-out" : "")
                                            }
                                            onClick={() => setSelectedVariantKey(variant.key)}
                                        >
                                            <span className='variant-option-label'>{getVariantLabel(variant)}</span>
                                            <ProductPrice product={variant} showDiscount={false} className='variant-optional-price' />
                                            {/*<span className='variant-option-price'>{formatEuro(variant.price)}</span> */}
                                            {variant.depositPerPack > 0 && (
                                                <span className='variant-option-deposit'>
                                                    zzgl. {formatEuro(variant.depositPerPack)} Pfand
                                                </span>
                                            )}
                                            {variant.stock === 0 && (
                                                <span className='variant-option-stock text-danger'>Ausverkauft</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mb-2">
                            <ProductPrice
                                product={selectedVariant || product}
                            />
                        </div>
                        {selectedVariant && (
                            <p className='text-muted mb-3'>
                                zzgl. {formatEuro(selectedVariant.depositPerPack)} Pfand
                            </p>
                        )}
                        <StockIndicator 
                            stockInfo={selectedVariantStock || {stock: availableStock, status: availableStock === 0 ? "out_of_stock": availableStock <= 5 ? "critical" : availableStock <= 15 ? "low" : "ok"}} showInStock
                        />

                    </div>
                    <div className='cart-input'>
                        <input 
                            type="number" 
                            min="1" 
                            max={availableStock}
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
