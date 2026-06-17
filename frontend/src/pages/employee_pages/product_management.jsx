import { NavLink, useParams } from 'react-router-dom';
import '../categories.css';
import { useState, useEffect } from 'react';

import productApi from "../../api/productApi";
import { useProd } from "../../context/productContext";
import { getCategoryConfig } from "../../utils/categoryConfig";
import { normalizeProduct, getProductImagePath, formatEuro } from '../../utils/productHelpers';

function ProductManagement({ category: fixedCategory }){
    const { categorySlug } = useParams();
    const selectedCategory = getCategoryConfig(fixedCategory || categorySlug);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const { createProduct,deleteProduct,getProducts } = useProd();

    const [productData, setProductData] = useState({
        name: "",
        description: "",
        image: "",
        price: 0,
        stock: 0,
        category: "",
    });

    const handleChange = (event) => {
    const { name, value } = event.target;

    setProductData({
      ...productData,
      [name]: value
    });
  };

    const[clickedAddProductButton, setClickedAddProductButton] = useState(false)

    useEffect(() => {
        let ignoreResult = false;

        async function loadProducts() {
            setIsLoading(true);
            setLoadError("");
            setCategoryProducts([]);

            try {
                const productsFromDatabase = await getProducts(); 
                
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
                        <input className='fs-5 border rounded ' type="text" placeholder='Produktname' name='name' value={productData.name} onChange={handleChange}/>
                    </div>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Beschreibung</label>
                        <input className='fs-5 border rounded ' type="text" placeholder='Beschreibung' name='description' value={productData.description} onChange={handleChange}/>
                    </div>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Bild</label>
                        <input className='fs-5 border rounded ' type="text" placeholder='Bild(Dateiname)' name='image' value={productData.image} onChange={handleChange}/>
                    </div>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Preis</label>
                        <input className='fs-5 border rounded ' type="text" placeholder='Preis(in Cent)' name='price' value={productData.price} onChange={handleChange}/>
                    </div>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Stock</label>
                        <input className='fs-5 border rounded ' type="text" placeholder='Stock' name='stock' value={productData.stock} onChange={handleChange}/>
                    </div>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Kategorie</label>
                        <input className='fs-5 border rounded ' type="text" placeholder='Kategorie' name='category' value={productData.category} onChange={handleChange}/>
                    </div>
                    
                    <div className='pb-2'>
                    <button className="btn text-white fs-5 align-self-center" style={{ backgroundColor: "#15406e" }} onClick={() => {setClickedAddProductButton(false);createProduct(productData)}}>Produkt hinzufügen</button>
                    </div>
                </div>
            </div>}
            <div className="d-flex flex-column align-items-center">
                <div className="d-flex flex-column align-items-end w-75">
                    {/* Suchleiste */}
                    <div className="navbar-search-shadow">
                        <form
                            className="navbar-search"
                            role="search"
                        >
                            <input
                            className="navbar-search-input form-control"
                            type="search"
                            placeholder="Produkt, Artikelnummer, Hersteller, ..."
                            aria-label='Suchleiste'
                            />

                            <button
                            className="btn btn-logoBlue navbar-search-btn"
                            type="submit"
                            aria-label='Suchen'
                            >
                            <img
                                className="navbar-search-icon"
                                src="/img/search-icon.svg"
                                alt="suchen"
                            />
                            </button>
                        </form>
                    </div>

                    <div className='d-flex flex-column align-items-center'>
                        <div className="d-flex flex-column border rounded align-items-left w-100">

                            
                            {categoryProducts.map((product) => (
                                <div className="d-flex flex-row align-items-center border rounded" style={{gap: "60px"}} key={product.id || product.name}>
                                    <div style={{width: "200px"}}>
                                        <NavLink 
                                            className="product_link" 
                                            to={`/sortiment/${selectedCategory.slug}/${encodeURIComponent(product.id)}`}>
                                            <img className="product_png w-75 ps-5" style={{width: "70px"}} src={getProductImagePath(product)} alt={product.name} />
                                            
                                        </NavLink>
                                    </div>
                                    {}
                                    <div style={{width: "400px"}}>
                                        <h3 className='w-25'>{product.name}</h3>
                                    </div>
                                    <p>{"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}</p>
                                    <strong>{formatEuro(product.price)}</strong>
                                    <div style={{width: "100px"}}>
                                        {product.stock !== null && (product.stock <= 15 && product.stock != 0) && <p className='text-danger'>Nur noch {product.stock} verfügbar</p>}
                                        {product.stock !== null && product.stock > 15 && <p className=''>Noch {product.stock} verfügbar</p>}
                                        {product.stock !== null && product.stock == 0 && <p className='text-danger'>Nicht mehr verfügbar</p>}
                                    </div>
                                    <button className="btn p-2 border-0 bg-transparent flex-shrink-0  cart-delete-button justify-content-end"
                                        type="button" onClick={() => {deleteProduct(product.id);console.log(product)}}>
                                        <img
                                        src="/img/trash.svg"
                                        className='cart-delete-icon'
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductManagement