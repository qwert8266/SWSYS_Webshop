import { NavLink, useParams } from 'react-router-dom';
import '../categories.css';
import { useState, useEffect } from 'react';
import { useAuth } from "../../context/authContext";

import categoryApi from "../../api/categoryApi";
import productApi from "../../api/productApi";
import { useProd } from "../../context/productContext";
import { getCategoryConfig } from "../../utils/categoryConfig";
import { normalizeProduct, getProductImagePath, formatEuro } from '../../utils/productHelpers';

function ProductManagement(){
    // Produktliste und Ladezustand der Produktverwaltung
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [categories, setCategories] = useState([]);
    const [categoryLoadError, setCategoryLoadError] = useState("");

    // Statusmeldungen für erfolgreiche oder fehlgeschlagene Aktionen
    const [showSuccessCreateLabel, setShowSuccessCreateLabel] = useState(false);
    const [showSuccessModifyLabel, setShowSuccessModifyLabel] = useState(false);
    const [showSuccessDeleteLabel, setShowSuccessDeleteLabel] = useState(false);
    const [showNotSuccessfulLabel, setShowNotSuccessfulLabel] = useState(false);

    // Produkt und Dialogstatus für den Löschvorgang
    const [productToDelete, setProductToDelete] = useState(null);
    const [showAreYouSureDialog, setShowAreYouSureDialog] = useState(false);

    // Produkt und Dialog für die Bearbeitung
    const [productToModify, setProductToModify] = useState(null);
    const [showModifyWindow, setShowModifyWindow] = useState(false);

    // API-Funktionen aus dem Produkt-Context
    const { createProduct,updateProduct,deleteProduct,getProducts } = useProd();
    const { user, accessToken, logout } = useAuth();

    // Fomulardaten für das Erstellen eines neuen Produkts
    const [productData, setProductData] = useState({
        id: 0,
        name: "",
        description: "",
        image: "",
        price: null,
        stock: null,
        categorySlugs: [],
    });

    // Formulardaten für das Bearbeiten eines Produkts
    const [productDataModify, setProductDataModify] = useState({
        id: 0,
        name: "",
        description: "",
        image: "",
        price: null,
        stock: null,
        categorySlugs: [],
    });

    // Aktualisiert Eingabefelder des Erstellen-Formulars
    const handleChange = (event) => {
    const { name, value } = event.target;

        setProductData({
            ...productData,
            [name]: 
            name === "price" || name === "stock" || name === "id" ? Number(value) : value,
        });
    };

    // Aktualisiert Eingabefelder des Bearbeiten-Formulars
    const handleChange2 = (event) => {
    const { name, value } = event.target;

        setProductDataModify({
            ...productDataModify,
            [name]: 
            name === "price" || name === "stock" || name === "id" ? Number(value) : value,
        });
    };

    // Fügt eine Kategorie zur Auswahl hinzu oder entfernt sie wieder
    const handleCategoryToggle = (categorySlug) => {
        setProductData((currentProductData) => {
            const categoryIsSelected = currentProductData.categorySlugs.includes(categorySlug);

            if (categoryIsSelected) {
                return {
                    ...currentProductData,
                    categorySlugs: currentProductData.categorySlugs.filter((slug) => slug !== categorySlug),
                };
            }

            return {
                ...currentProductData,
                categorySlugs: [...currentProductData.categorySlugs, categorySlug],
            };
        });
    };

    const handleModifyCategoryToggle = (categorySlug) => {
        setProductDataModify((currentProductData) => {
            const currentCategorySlugs = currentProductData.categorySlugs || [];
            const categoryIsSelected = currentCategorySlugs.includes(categorySlug);

            if (categoryIsSelected) {
                return {
                    ...currentProductData,
                    categorySlugs: currentCategorySlugs.filter((slug) => slug !== categorySlug),
                };
            }

            return {
                ...currentProductData,
                categorySlugs: [...currentCategorySlugs, categorySlug],
            };
        });
    };

    // Erstellt aus Formularwerten und ausgewählten Kategorien ein neues Produkt
    const handleCreateProduct = async () => {
        const selectedCategories = categories.filter((category) => {
            return productData.categorySlugs.includes(category.slug);
        });

        const productPayload = {
            name: productData.name,
            description: productData.description,
            image: productData.image,
            price: productData.price,
            stock: productData.stock,
            categories: selectedCategories,
        };
        
        try{
            const createdProduct = await createProduct(productPayload, accessToken);

            setCategoryProducts((currentProducts) => [
                createdProduct,
                ...currentProducts,
            ]);

            setShowSuccessCreateLabel(true);
            setClickedAddProductButton(false);
            setProductData({
                id: 0,
                name: "",
                description: "",
                image: "",
                price: null,
                stock: null,
                categorySlugs: [],
            })

            setTimeout(() => {
                setShowSuccessCreateLabel(false);
            }, 5000)

        }catch{
            setShowNotSuccessfulLabel(true)
            setTimeout(() => {
            setShowNotSuccessfulLabel(false);
            }, 5000)
            return
        }

        
    }

    // Speichert Änderungen an einem bestehenden Produkt
    const handleUpdateProduct = async () => {
        const selectedCategories = categories.filter((category) => {
            return (productDataModify.categorySlugs || []).includes(category.slug);
        });
        
         const productPayload = {
            id: productDataModify.id,
            name: productDataModify.name,
            description: productDataModify.description,
            image: productDataModify.image,
            price: productDataModify.price,
            stock: productDataModify.stock,
            categories: selectedCategories,
        };

        try{
            await updateProduct(productPayload, accessToken);

            setShowModifyWindow(false);
            setProductToModify(null);

            const updateProductForList = normalizeProduct({
                ...productToModify,
                ...productPayload,
                product_id: productPayload.id,
            })
            

            setCategoryProducts((currentProducts) =>
                currentProducts.map((product) => {
                    if (product.id !== productPayload.id) {
                        return product;
                    }

                    return updateProductForList;
                })
            );

            setShowSuccessModifyLabel(true);

            setTimeout(() => {
                setShowSuccessModifyLabel(false);
            }, 5000)

        }catch (error){
            setShowNotSuccessfulLabel(true)
            
            setTimeout(() => {
                setShowNotSuccessfulLabel(false);
            }, 5000)
            
            return
        }
        
    }

    // Löscht ein Produkt nach Bestätigung aus der Datenbank
    const handleDeleteProduct = async (productID) => {
        try{
            await deleteProduct(productID, accessToken)
        }catch{
           setShowNotSuccessfulLabel(true)
            setTimeout(() => {
            setShowNotSuccessfulLabel(false);
            }, 5000)
            return 
        }
    
        setShowSuccessDeleteLabel(true);

        setTimeout(() => {
            setShowSuccessDeleteLabel(false);
        }, 5000)
    }   

    // Läft alle Produkte erneut aus dem Backend
    const loadProducts = async () => {
        setIsLoading(true);
        setLoadError("");
        setCategoryProducts([]);

        try {
            const productsFromDatabase = await getProducts();
            setCategoryProducts(productsFromDatabase.map())
        } catch (error) {
            setLoadError("Produkte konnten nicht aus der Datenbank geladen werden.")
        } finally {
            setIsLoading(false);
        }
    };

    // Sucht eine Kategorie anhand ihres Slugs
    function getCategoryBySlug(slug) {
        return categories.find((category) => category.slug === slug);
    }

    // Ermittelt den Kategorie-Slug für Produktlinks
    function getProductCategorySlug(product) {
        const productCategories = Array.isArray(product.categories) ? product.categories : [];

        if (productCategories.length === 0) {
            return "";
        }

        const productCategory = productCategories[0];

        const matchingCategory = categories.find((category) => {
            return (
                category.slug === productCategory.slug ||
                category.name === productCategory.name
            );
        });

        return (
            matchingCategory?.slug ||
            productCategory.slug ||
            ""
        );
    }

    // Ermittelt die Kategorie-Slugs eines Produktes
    function getCategorySlugsFromProduct(product) {
        if (!Array.isArray(product?.categories)) {
            return [];
        }

        return product.categories
            .map((category) => category.slug)
            .filter((slug) => slug);
    }

    // Baut die Produktdaten passend zum Backend-Modell zusammen
    function buildProductPayload(data) {
        const selectedCategory = getCategoryBySlug(data.categorySlug);

        return {
            name: data.name,
            description: data.description,
            image: data.image,
            price: data.price,
            stock: data.stock,
            categories: selectedCategory ? [selectedCategory] : [],
        };
    }

    // Steuert ob das Formular zum Hinzufügen eines neuen Produkts sichtbar ist
    const[clickedAddProductButton, setClickedAddProductButton] = useState(false)

    // Lädt verfügbare Kategorien für die Checkbox-Auswahl
    useEffect(() => {
        let ignoreResult = false;

        async function loadCategories() {
            setCategoryLoadError("");

            try {
                const categoriesFromDatabase = await categoryApi.getCategories();

                if (!ignoreResult) {
                    setCategories(Array.isArray(categoriesFromDatabase) ? categoriesFromDatabase : []);
                }
            } catch {
                if (!ignoreResult) {
                    setCategories([]);
                    setCategoryLoadError("Kategorien konnten nicht aus der Datenbank geladen werden.");
                }
            }
        }
        loadCategories();

        return () => {
            ignoreResult = true;
        };
    }, []);

    // Lädt die Produktliste beim Öffnen der Produktverwaltung 
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
    }, [getProducts]);


    return(
        <div className='category-page'>
            <div className='d-flex flex-column align-items-center pb-2 gap-3'>
                <div className='sentence_top'>Produktverwaltung</div>
                <div className='sentence_below_top'>
                    Hinzufügen, bearbeiten oder entfernen von Produkten.
                </div>
                {!clickedAddProductButton &&
                <div className="d-flex flex-column align-items-center" style={{width: "600px"}}>
                    <div className='pb-5'>
                        <button className="btn text-white fs-5 align-self-center" style={{ backgroundColor: "#15406e" }} onClick={() => setClickedAddProductButton(true)}>Produkt hinzufügen</button>
                    </div>
                    <div style={{height: "80px",width: "100%"}}>
                        {showSuccessCreateLabel &&
                            <div className="text-center shadow alert alert-success mb-2">
                                <label className='fs-3'>Produkt hinzugefügt!</label>  
                            </div>
                        }
                        {showSuccessModifyLabel &&
                            <div className="text-center shadow alert alert-success mb-2">
                                <label className='fs-3'>Produkt angepasst.</label>
                            </div>
                        }
                        {showSuccessDeleteLabel &&
                            <div className="d-flex flex-column border rounded align-items-center justify-content-center " style={{height: "80px", width:"100%", alignItems: 'center', backgroundColor: 'green', color: 'white'}}>
                                <label className='fs-3'>Produkt gelöscht.</label>
                                <label className='fs-3'>Fürs Anzeigen bitte Seite neu laden.</label>
                            </div>
                        }
                    </div>
                </div>
                }
            </div>
            {isLoading && <p className="category-info">Produkte werden geladen...</p>}
            {loadError && <p className='category-info text-danger'>{loadError}</p>}

            {isLoading && !loadError && categoryProducts.length === 0 && (
                <p className='category-info'>Hoppla. Leider konnten wir keine Produkte finden.</p>
            )}

            {/* Formular zum Hinzufügen eines neues Produkts */}
            {clickedAddProductButton &&
            <div className='d-flex justify-content-center pb-5 pt-2'>
                <div className="position-relative w-50">
                    
                    {showNotSuccessfulLabel &&
                        <div
                            className="position-absolute bottom-100 w-100 d-flex flex-column align-items-center shadow alert alert-danger mb-2" 
                        >
                            <label className='fs-5'>Es gab einen Fehler.</label>
                            <label className='fs-6'>Bitte Eingaben prüfen!</label>
                        </div>
                    }

                    <div className='d-flex flex-column align-items-center border rounded pt-2'>
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
                            <input className='fs-5 border rounded ' type="text" placeholder='Bild(bier.png)' name='image' value={productData.image} onChange={handleChange}/>
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
                            
                            <div 
                                className="list-group border rounded overflow-auto" 
                                style={{ width: "230px", maxHeight: "150px"}}
                            >
                                {categories.length === 0 && (
                                    <span className='text-muted'>Keine Kategorien verfügbar</span>
                                )}

                                {/* Kategorien werden als Mehrfachauswahl gespeichert */}
                                {categories.map((category) => (
                                    <label 
                                        key={category.slug} 
                                        className="fs-6 list-group-item d-flex align-items-center gap-2 py-1"
                                    >
                                        <input
                                            type="checkbox"
                                            className="form-check-input m-0"
                                            checked={(productData.categorySlugs || []).includes(category.slug)}
                                            onChange={() => handleCategoryToggle(category.slug)}
                                        />
                                        {category.name}
                                    </label>
                                ))}

                            </div>

                            {/*<select 
                                className="fs-5 border rounded" 
                                style={{ width: "230px" }} 
                                placeholder='Kategorie' 
                                name='categorySlug' 
                                value={productData.categorySlug} 
                                onChange={handleChange}
                            >
                                <option value="">Kategorie auswählen</option>
                                
                                {categories.map((category) => (
                                    <option key={category.slug} value={category.slug}>
                                        {category.name}
                                    </option>
                                ))}
                            </select> */}

                            {/**<input className='fs-5 border rounded ' type="text" placeholder='Kategorie' name='category' value={productData.category} onChange={handleChange}/>*/}
                        </div>
                        
                        <div className='pb-2'>
                        <button 
                            className="btn text-white fs-5 align-self-center" 
                            style={{ backgroundColor: "#15406e" }} 
                            onClick={() => {
                                handleCreateProduct();
                            }}
                        >
                            Produkt hinzufügen
                        </button>
                        </div>
                    </div>
                </div>
            </div>}
            <div className="d-flex flex-column align-items-center">
                <div className="d-flex flex-column align-items-center w-75">
                    {/* Suchleiste */}
                    <div className="navbar-search-shadow pb-3">
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

                            {/* Produktliste zum verwalten, bearbeiten und löschen */}
                            {categoryProducts.map((product) => (
                                <div className="d-flex flex-row align-items-center border rounded pe-4" style={{gap: "50px"}} key={product.id }>
                                    <div style={{width: "200px"}}>
                                        <NavLink 
                                            className="product_link" 
                                            to={`/sortiment/${getProductCategorySlug(product)}/${encodeURIComponent(product.id)}`}>
                                            <img className="product_png w-75 ps-5" style={{width: "70px"}} src={getProductImagePath(product)} alt={product.name} />
                                            
                                        </NavLink>
                                    </div>
                                    
                                    <div style={{width: "400px"}}>
                                        <h3 className='w-25'>{product.name}</h3>
                                    </div>
                                    <p>{"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}</p>
                                    <strong style={{width: "80px", textAlign: 'right'}}>{formatEuro(product.price)}</strong>
                                    <div style={{width: "100px"}}>
                                        {product.stock !== null && (product.stock <= 15 && product.stock !== 0) && <p className='text-danger'>Nur noch {product.stock} verfügbar</p>}
                                        {product.stock !== null && product.stock > 15 && <p className=''>Noch {product.stock} verfügbar</p>}
                                        {product.stock !== null && product.stock === 0 && <p className='text-danger'>Nicht mehr verfügbar</p>}
                                    </div>
                                    <button 
                                        className="btn p-2 border-0 bg-transparent flex-shrink-0  cart-delete-button justify-content-end"
                                        type="button" 
                                        onClick={() => {
                                            setProductToModify(product);
                                            
                                            setProductDataModify({
                                                id: product.id,
                                                name: product.name,
                                                description: product.description,
                                                image: product.image,
                                                price: Math.round(product.price * 100),
                                                stock: product.stock,
                                                categorySlugs: getCategorySlugsFromProduct(product),
                                            });

                                            setShowModifyWindow(true);
                                        }}>
                                        <img
                                        src="/img/settings.png"
                                        className='cart-delete-icon'
                                        alt="modify"
                                        />
                                    </button>
                                    <button className="btn p-2 border-0 bg-transparent flex-shrink-0  cart-delete-button justify-content-end"
                                        type="button" onClick={() => {setProductToDelete(product);setShowAreYouSureDialog(true)}}>
                                        <img
                                        src="/img/trash.svg"
                                        className='cart-delete-icon'
                                        alt="delete cart"
                                        />
                                    </button>


                                    
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {/* Sicherheitsabfrage vor dem Löschen */}
            {showAreYouSureDialog && (
            <div
                className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                style={{
                    backgroundColor: "rgba(0,0,0,0.2)",
                    zIndex: 9999
                }}
            >
                <div className="d-flex flex-column bg-white p-4 rounded align-items-center gap-3">
                    <h3>Produkt wirklich löschen?</h3>
                    <h3>Dies kann nicht rückgängig gemacht werden!</h3>

                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowAreYouSureDialog(false)}
                        >
                            Abbrechen
                        </button>

                        <button
                            className="btn btn-danger"
                            onClick={() => {
                                handleDeleteProduct(productToDelete.id);
                                setShowAreYouSureDialog(false);
                            }}
                        >
                            Löschen
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Fenster zum Bearbeiten eines Produkts */}
        {showModifyWindow && (
            <div
                className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                style={{
                    backgroundColor: "rgba(0,0,0,0.2)",
                    zIndex: 9999
                }}
            >
                <div className="d-flex flex-column bg-white p-4 rounded align-items-center gap-3">
                    <h3>Produktanpassung</h3>

                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Produktname</label>
                        <input className='fs-5 border rounded ' type="text" placeholder='Produktname' name='name' value={productDataModify.name} onChange={handleChange2}/>
                    </div>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Beschreibung</label>
                        <input className='fs-5 border rounded ' type="text" placeholder='Beschreibung' name='description' value={productDataModify.description} onChange={handleChange2}/>
                    </div>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Bild</label>
                        <input className='fs-5 border rounded ' type="text" placeholder='Bild(Dateiname)' name='image' value={productDataModify.image} onChange={handleChange2}/>
                    </div>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Preis</label>
                        <input className='fs-5 border rounded ' type="text" placeholder='Preis(in Cent)' name='price' value={productDataModify.price} onChange={handleChange2}/>
                    </div>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Stock</label>
                        <input className='fs-5 border rounded ' type="text" placeholder='Stock' name='stock' value={productDataModify.stock} onChange={handleChange2}/>
                    </div>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Kategorie</label>
                        
                        <div 
                            className="list-group border rounded overflow-auto" 
                            style={{ width: "230px", maxHeight: "150px"}}
                        >
                            {categories.length === 0 && (
                                <span className='text-muted'>Keine Kategorien verfügbar</span>
                            )}

                            {/* Kategorien werden als Mehrfachauswahl gespeichert */}
                            {categories.map((category) => (
                                <label 
                                    key={category.slug} 
                                    className="fs-6 list-group-item d-flex align-items-center gap-2 py-1"
                                >
                                    <input
                                        type="checkbox"
                                        className="form-check-input m-0"
                                        checked={(productDataModify.categorySlugs || []).includes(category.slug)}
                                        onChange={() => handleModifyCategoryToggle(category.slug)}
                                    />
                                    {category.name}
                                </label>
                            ))}

                        </div>

                        {/*<div 
                            className='fs-5 border rounded' 
                            type="text" 
                            placeholder='Kategorie' 
                            name='category' 
                            defaultValue={productToModify.category} 
                            onChange={handleChange2}
                        >
                            
                        </div>*/}
                    </div>

                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowModifyWindow(false)}
                        >
                            Abbrechen
                        </button>
                        <button
                            className="btn text-white fs-5 align-self-center" style={{ backgroundColor: "#15406e" }}
                            onClick={() => {
                                handleUpdateProduct();
                            }}
                        >
                            Speichern
                        </button>

                        
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}

export default ProductManagement