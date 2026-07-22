import { NavLink } from 'react-router-dom';
import '../categories.css';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from "../../context/authContext";

import categoryApi from "../../api/categoryApi";
import { useProd } from "../../context/productContext";
import { normalizeProduct, getProductImagePath, formatEuro } from '../../utils/productHelpers';
import CategoryManagementModal from '../../components/categoryManagementModal';

function ProductManagement(){
    // Produktliste und Ladezustand der Produktverwaltung
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [categories, setCategories] = useState([]);
    const [categoryLoadError, setCategoryLoadError] = useState("");
    const [modifyErrorMessage, setModifyErrorMessage] = useState("");
    const [showCategoryManagement, setShowCategoryManagement] = useState(false);

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
    const { accessToken} = useAuth();

    // Setzt die verstecken Datei-Inputs zurück, damit entfernte Bilder sauber erneut gewählt werden können
    const [imageInputKey, setImageInputKey] = useState(0);
    const [modifyImageInputKey, setModifyImageInputKey] = useState(0);

    // Fomulardaten für das Erstellen eines neuen Produkts
    const [productData, setProductData] = useState({
        id: 0,
        name: "",
        description: "",
        images: [],
        variants: [createEmptyVariant()],
        categorySlugs: [],
    });

    /**
     * Formulardaten für das Bearbeiten eines Produkts
     * - existingImages sind bereits gepsiehcerte Bildpfade,
     * - newImages sind neue File-Uploads,
     * - removedImages merkt sich, welche bestehenden Bilder beim Speichern im Backend gelöscht werden sollen
     */
    const [productDataModify, setProductDataModify] = useState({
        id: 0,
        name: "",
        description: "",
        existingImages: [],
        newImages: [],
        removedImages: [],
        variants: [createEmptyVariant()],
        categorySlugs: [],
    });

    /** Ermöglicht schnellere Prüfung, ob eine Kategorie im Erstellen-Formular ausgewählt ist */
    const selectedCreateCategorySlugs = useMemo(
        () => new Set (productData.categorySlugs ?? []),
        [productData.categorySlugs]
    );

    /** Ermöglicht schnellere Prüfung, ob eine Kategorie im Bearbeiten-Formular ausgewählt ist */
    const selectedModifyCategorySlugs = useMemo(
        () => new Set (productData.categorySlugs ?? []),
        [productData.categorySlugs]
    );
    
    /** Erstellt eine leere Variante */
    function createEmptyVariant() {
        return {
            price: "",
            volume: "",
            packSize: "",
            deposit: "",
            crateDeposit: "",
            stock: "",
            discount: null,
        };
    }

    /** Aktualisiert Eingabefelder des Erstellen-Formulars */
    const handleChange = (event) => {
        const { name, value } = event.target;

        setProductData((currentProductData) => ({
            ...currentProductData,
            [name]: value
        }));
    };

    /** Aktualisiert Eingabefelder des Bearbeiten-Formulars */
    const handleChange2 = (event) => {
        const { name, value } = event.target;

        setProductDataModify((currentProductData) => ({
            ...currentProductData,
            [name]: value
        }));
    };

    /** Ändert ein Feld einer Produktvariante */
    const handleVariantChange = (variantIndex, fieldName, value, modify = false) => {
        const setter = modify ? setProductDataModify : setProductData;
        setter((currentProductData) => ({
            ...currentProductData,
            variants: currentProductData.variants.map((variant, index) => 
                index === variantIndex ? {...variant, [fieldName]: value } : variant
            ),
        }));
    }

    /** Fügt dem jeweiligen Formular eine weitere Variante hinzu */
    const handleAddVariant = (modify = false) => {
        const setter = modify ? setProductDataModify : setProductData;
        setter((currentProductData) => ({
            ...currentProductData,
            variants: [...currentProductData.variants, createEmptyVariant()],
        }));
    };

    /** Entfernt eine Variante. Eine muss bestehen bleiben */
    const handleRemoveVariant = (variantIndex, modify = false) => {
        const setter = modify ? setProductDataModify : setProductData;
        setter((currentProductData) => {
            if (currentProductData.variants.length <= 1) return currentProductData;
            const variant = currentProductData.variants[variantIndex];
            if (modify && Number(variant?.discount || 0) > 0) return currentProductData;
            return {
                ...currentProductData,
                variants: currentProductData.variants.filter((_, index) => index !== variantIndex)
            };
        });
    };

    /** Konvertiert die camelCase-Schreibweise in das API-Format */
    function variantsToApi(variants) {
        return variants.map((variant) => {
            const discountValue = Number(variant.discount);
            const apiVariant = {
                price: Number(variant.price),
                volume: Number(variant.volume),
                pack_size: Number(variant.packSize),
                deposit: Number(variant.deposit || 0),
                crate_deposit: Number(variant.crateDeposit || 0),
                stock: Number(variant.stock),
            };

            if (Number.isFinite(discountValue) && discountValue > 0) {
                apiVariant.discount = discountValue;
            }

            return apiVariant;
        });
    }

    /** Speichert die ausgewählten Bilddateien für den Upload */
    const handleImageChange = (event) => {
        setProductData((currentProductData) => ({
            ...currentProductData,
            images: Array.from(event.target.files || []),
        }));
    };

    /** Entfernt ein einzelnes Bild aus der aktuellen Auswahl */ 
    const handleRemoveSelectedImage = (imageIndexToRemove) => {
        setProductData((currentProductData) => ({
            ...currentProductData,
            images: currentProductData.images.filter((_, imageIndex) => {
                return imageIndex !== imageIndexToRemove;
            }),
        }));

        setImageInputKey((currentKey) => currentKey + 1);
    };

    /** 
     * fügt beim Bearbeiten weitere Bilddateien zur Upload-Auswahl hinzu 
     * Bestehende neue Dateien bleiben erhalten, damit der Nutzer mehrfach Dateien nachwählen kann
     */
    const handleModifyImageChange = (event) => {
        const selectedImages = Array.from(event.target.files || []);

        setProductDataModify((currentProductData) => ({
            ...currentProductData,
            newImages: [
                ...(currentProductData.newImages || []),
                ...selectedImages,
            ],
        }));

        setModifyImageInputKey((currentKey) => currentKey + 1);
    }

    /** 
     * Markiert ein bereits gespeichertes Produktbild als gelöscht 
     * Es wird aus der Vorschau entfernt und zusätzlich in removedImages gespeichert, 
     * damit das Backend es aus dem Docker-Volume löschen kann
    */
    const handleRemoveExistingModifyImage = (imageToRemove) => {
        setProductDataModify((currentProductData) => ({
            ...currentProductData,
            existingImages: (currentProductData.existingImages || []).filter((image) => {
                return image !== imageToRemove;
            }),
            removedImages: [
                ...(currentProductData.removedImages || []),
                imageToRemove,
            ],
        }));
    };

    /** Entfernt ein neu ausgewähltes, aber noch nicht hochgeladenes Bild */
    const handleRemoveNewModifyImage = (imageIndexToRemove) => {
        setProductDataModify((currentProductData) => ({
            ...currentProductData,
            newImages: (currentProductData.newImages || []).filter((_, imageIndex) => {
                return imageIndex !== imageIndexToRemove;
            }),
        }));

        setModifyImageInputKey((currentKey) => currentKey + 1);
    }

    /** Fügt eine Kategorie zur Auswahl hinzu oder entfernt sie wieder */
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

    /** Ändert die Kategorie-Auswahl beim Bearbeiten eines Produktes */
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

    /** 
     * Erstellt aus Formularwerten und ausgewählten Kategorien und Bilddateien ein neues Produkt 
     * Produktdaten werden als JSON in FormData.data übertragen
     */
    const handleCreateProduct = async () => {
        const variantError = validateProductVariants(productData.variants);
        if (variantError) {
            setShowNotSuccessfulLabel(true);
            setTimeout(() => setShowNotSuccessfulLabel(false), 5000);
            return;
        }
        
        const selectedCategorieSlugs = new Set(
            productData.categorySlugs ?? []
        );

        const selectedCategories = categories.filter((category) =>
            selectedCategorieSlugs.has(category.slug)
        );
        //categories.filter((category) => {
        //    return productData.categorySlugs.includes(category.slug);
        //});

        // Payload enthält nur fachliche Produktdaten
        const productPayload = {
            name: productData.name,
            description: productData.description,
            product_variants: variantsToApi(productData.variants),
            categories: selectedCategories,
        };

        const formData = new FormData();
        formData.append("data", JSON.stringify(productPayload));

        // Mehrere Bilder werden demselben Feldnamen angehängt
        productData.images.forEach((imageFile) => {
            formData.append("image", imageFile);
        });
        
        try{
            const createdProduct = await createProduct(formData, accessToken);

            setCategoryProducts((currentProducts) => [
                normalizeProduct(createdProduct),
                ...currentProducts,
            ]);

            setShowSuccessCreateLabel(true);
            setClickedAddProductButton(false);
            setProductData({
                id: 0,
                name: "",
                description: "",
                images: [],
                variants: [createEmptyVariant()],
                categorySlugs: [],
            });

            setTimeout(() => {
                setShowSuccessCreateLabel(false);
            }, 5000)
        }catch{
            setShowNotSuccessfulLabel(true)
            setTimeout(() => {
            setShowNotSuccessfulLabel(false);
            }, 5000)
        }
    }

    /** Speichert Änderungen an einem bestehenden Produkt */
    const handleUpdateProduct = async () => {
        setModifyErrorMessage("");

        const validationMessage = validateModifyProductForm();
        if (validationMessage) {
            setModifyErrorMessage(validationMessage);
            return;
        }
        
        const selectedCategorieSlugs = new Set(
            productDataModify.categorySlugs ?? []
        );

        const selectedCategories = categories.filter((category) =>
            selectedCategorieSlugs.has(category.slug)
        );
        
        // retainedImages bleibt erhalten
        // newImages werden neu hochgeladen
        // removedImages löscht 
        const retainedImages = productDataModify.existingImages || [];
        const newImages = productDataModify.newImages || [];
        const uploadedImagePaths = newImages.map((imageFile) => {
            return buildUploadedImagePath(productDataModify.id, imageFile);
        });
        const mergedImages = [
            ...retainedImages,
            ...uploadedImagePaths,
        ];

         const productPayload = {
            product_id: productDataModify.id,
            name: productDataModify.name,
            description: productDataModify.description,
            product_variants: variantsToApi(productDataModify.variants),
            categories: selectedCategories,

            // Liste beschreibt, welche bereits gespeicherten Bilder erhalten bleiben soll
            images: mergedImages,
            removed_images: productDataModify.removedImages || [],
        };

       
        const updateBody = buildProductUpdateFormData(productPayload, newImages);

        try{
            const updatedProduct = await updateProduct(productDataModify.id, updateBody, accessToken);

            setModifyErrorMessage("");
            setShowModifyWindow(false);
            setProductToModify(null);

            // Falls das backend kein vollständiges Produkt zurückgibt, 
            // wird das Anzeigeprodukt lokal aus den Formulardaten aufgebaut
            const updateProductForList = normalizeProduct({
                ...productToModify,
                ...productPayload,
                ...(updatedProduct && updatedProduct.product_id ? updatedProduct : {}),
                id: productPayload.product_id,
                product_id: productPayload.product_id,
                images: mergedImages,
            });
            
            // Aktualisiert nur das bearbeitete Produkt in der lokalen Liste
            setCategoryProducts((currentProducts) =>
                currentProducts.map((product) => {
                    if (product.id !== productPayload.product_id) {
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
            
            setModifyErrorMessage("Produkt konnte nicht gespeichert werden. Bitte prüfe deine Eingabe.");

            setTimeout(() => {
                setShowNotSuccessfulLabel(false);
            }, 5000)
            
            return
        }
        
    }

    /** Löscht ein Produkt nach Bestätigung aus der Datenbank */
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

        setCategoryProducts((currentProducts) => 
            currentProducts.filter((product) => {
                const currentProductId = product?.id;
                return currentProductId !== productID;
            })
        );
    
        setShowSuccessDeleteLabel(true);

        setTimeout(() => {
            setShowSuccessDeleteLabel(false);
        }, 5000)
    }   

    /** Überprüft die Eingabe der Änderungen */
    function validateModifyProductForm() {
        const allowedImageExtensions = [".png", ".jpg", ".jpeg", ".webp"];
        const retainedImages = productDataModify.existingImages || [];
        const newImages = productDataModify.newImages || [];

        if (!productDataModify.name || productDataModify.name === "") {
            return "Bitte gib einen Produktnamen an";
        }

        if (!productDataModify.description || productDataModify.description === "") {
            return "Bitte gib eine Produktbeschreibung an";
        }

        // nach entfernen bestehender Bilder muss mind. ein altes oder neues Produktbild übrig bleiben
        if (retainedImages.length === 0 && newImages.length === 0) {
            return "Bitte hinterlege mindestens ein Produktbild";
        }

        // Dateiendungen werden geprüft
        const hasInvalidNewImage = newImages.some((imageFile) => {
            const fileName = String(imageFile?.name || "").toLowerCase();

            return !allowedImageExtensions.some((extension) => {
                return fileName.endsWith(extension);
            })
        })

        if (hasInvalidNewImage) {
            return "Das neue Produktbild muss eine gültige Dateiendung besitzen: .png, .jpg, .jpeg oder .webp";
        }

        const variantError = validateProductVariants(productDataModify.variants);
        if (variantError) {
            return variantError;
        }

        if ((productDataModify.categorySlugs || []).length === 0) {
            return "Bitte wähle mindestens eine Kategorie aus";
        }

        return "";
    }

    /** Prüft alle Varianten sowie die eindeutige Kombination aus Volumen und Packungsgröße */
    function validateProductVariants(variants) {
        if (!Array.isArray(variants) || variants.length === 0) return "Bitte hinterlege mindestens eine Produktvariante";

        const variantKey = new Set();
        for (const variant of variants) {
            if (Number(variant.price) <= 0) return "Bitte gib einen gültigen Preis is Cent an";
            if (Number(variant.volume) <= 0) return "Bitte gib ein gültiges Volumen an";
            if (Number(variant.packSize) <= 0) return "Bitte gib eine gültige Packungsgröße an";
            if (Number(variant.deposit || 0) < 0 || Number(variant.crateDeposit || 0) < 0) return "Pfandwerte dürfen nicht negativ sein";
            if (Number(variant.stock) < 0) return "Bitte gib einen gültigen Lagerbestand an";

            const discount = Number(variant.discount || 0);
            if (variant.discount !== null && variant.discount !== "" && (discount < 0 || discount > 100)) {
                return "Rabatt muss zwischen 0 und 100 Prozent liegen";
            }

            const key = `${Number(variant.volume)}-${Number(variant.packSize)}`;
            if (variantKey.has(key)) return "Volumen und Packungsgröße müssen je Variante eindeutig sein";
            variantKey.add(key);
        }
        
        return "";
    }

    /** Rendert Variantenfelder */
    function renderVariantInputs(variants, modify = false) {
        return (variants || []).map((variant, variantIndex) => {
            const hasActiveSale = Number(variant.discount || 0) > 0;
            const fields = [
                ["price", "Preis", "Preis in Cent"],
                ["volume", "Volumen", "Volumen in ml"],
                ["packSize", "Packungsgröße", "z.B. 25"],
                ["deposit", "Flaschenpfand", "Pfand in Cent"],
                ["crateDeposit", "Kistenpfand", "Pfand in Cent"],
                ["stock", "Bestand", "Lagerbestand"],
                ["discount", "Rabatt", "Rabatt in % (optional)"],
            ];

            return (
                <div key={variantIndex} className='border rounded p-3 mb-3 w-100' style={{ maxWidth: "520px" }}>
                    <div className='d-flex justify-content-between align-items-center mb-2'>
                        <strong>Variante {variantIndex + 1}</strong>
                        <div className='d-flex align-items-center gap-2'>
                            {hasActiveSale && <span className='badge bg-danger'>{variant.discount} % Angebot</span>}
                            {variants.length > 1 && !hasActiveSale && (
                                <button 
                                    type="button" 
                                    className='btn btn-sm btn-outline-danger' 
                                    onClick={() => handleRemoveVariant(variantIndex, modify)}
                                >
                                    Entfernen
                                </button>
                            )}
                        </div>
                    </div>
                    {fields.map(([fieldName, label, placeholder]) => (
                        <div className='d-flex flex-row align-items-center pb-2' key={fieldName}>
                            <label className='fs-6 me-3' style={{ width: "150px" }}>{label}</label>
                            <input
                                className='fs-6 border rounded'
                                type="number"
                                min={fieldName === "discount" ? "0" : "0"}
                                max={fieldName === "discount" ? "100" : undefined}
                                placeholder={placeholder}
                                value={variant[fieldName] ?? ""}
                                disabled={modify && hasActiveSale && (fieldName === "volume" || fieldName === "packSize")}
                                onChange={(event) => handleVariantChange(variantIndex, fieldName, event.target.value, modify)}
                            />
                        </div>
                    ))}
                </div>
            );
        });
    }

    /** Ermittelt den Kategorie-Slug für Produktlinks */
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

    /** Ermittelt die Kategorie-Slugs eines Produktes */
    function getCategorySlugsFromProduct(product) {
        if (!Array.isArray(product?.categories)) {
            return [];
        }

        return product.categories
            .map((category) => category.slug)
            .filter((slug) => slug);
    }

    /** Ermittelt alle bereits gespeicherten Bildpfade eines Produktes */
    function getProductImages(product) {
        if (Array.isArray(product?.images) && product.images.length > 0) {
            return product.images.filter((image) => image);
        }

        if (product?.image) {
            return [product.image];
        }

        return [];
    }

    /** Ermittelt einen lesbaren Dateinamen aus einem Bildpfad */
    function getImageFileName(imagePath) {
        return String(imagePath || "").split(/[\\/]/).pop() || "Produktbild";
    }

    /** Ermittelt den Vorschaubildpfad für ein einzelnes gespeichertes Produktbild */ 
    function getProductImagePreviewPath(imagePath) {
        return getProductImagePath({
            images: [imagePath],
            image: imagePath,
        });
    }

    /** Baut den Bildpfad nach dem Speicherschema des backends: /images/<product-id>/<datei> */
    function buildUploadedImagePath(productID, imageFile) {
        return `${productID}/${imageFile.name}`;
    }

    /** Erstellt den multipart/form-data Body für Änderungen an Produktbildern  */
    function buildProductUpdateFormData(productPayload, newImages) {
        const formData = new FormData();

        // productApi.updateProduct liest die id für die URL aus productData.id
        // FormData selbst transportiert die ID zusätzlich im JSON-Teil
        formData.id = productPayload.product_id;
        //formData.append("id", productPayload.product_id);
        formData.append("data", JSON.stringify(productPayload));

        newImages.forEach((imageFile) => {
            formData.append("image", imageFile);
        });

        return formData;
    }


    /** Steuert ob das Formular zum Hinzufügen eines neuen Produkts sichtbar ist */
    const[clickedAddProductButton, setClickedAddProductButton] = useState(false)

    /** Lädt verfügbare Kategorien für die Checkbox-Auswahl */
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

    /** Lädt die Produktliste beim Öffnen der Produktverwaltung  */ 
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
            {/* Kleine Styles für die Hover-Buttons der Bildauswahl */}
            <style>{`
                .selected-product-image-row .selected-product-image-remove-button,
                .modify-product-image-card .modify-product-image-remove-button {
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.15s ease-in-out;
                }

                .selected-product-image-row:hover .selected-product-image-remove-button,
                .selected-product-image-remove-button:focus,
                .modify-product-image-card:hover .modify-product-image-remove-button,
                .modify-product-image-remove-button:focus {
                    opacity: 1;
                    pointer-events: auto;
                }

                .modify-product-image-preview {
                    width: 64px;
                    height: 64px;
                    object-fit: contain;
                }
            `}</style>
            
            <div className='d-flex flex-column align-items-center pb-2 gap-3'>
                <div className='sentence_top'>Produktverwaltung</div>
                <div className='sentence_below_top'>
                    Hinzufügen, bearbeiten oder entfernen von Produkten.
                </div>
                {!clickedAddProductButton &&
                <div className="d-flex flex-column align-items-center" style={{width: "600px"}}>
                    <div className='pb-5'>
                        <button className="btn text-white fs-5 align-self-center" style={{ backgroundColor: "#15406e" }} onClick={() => setClickedAddProductButton(true)}>Produkt hinzufügen</button>
                        <button className='btn btn-outline-primary fs-5' onClick={() => setShowCategoryManagement(true)}>Kategorien verwalten</button>
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

                        <div className='d-flex flex-row align-items-center start-50 pb-2'>
                            <label className='fs-5 me-3 mb-5' style={{ width: "150px" }}>Bild</label>

                            <div className="d-flex flex-column mb-4" style={{ width: "230px" }}>
                                <label 
                                    htmlFor='product-images'
                                    className='btn btn-light fs-6 mb-1 border '
                                >
                                    Dateien auswählen
                                </label>

                                <input
                                    id="product-images"
                                    className='d-none'
                                    multiple
                                    type="file"
                                    accept="image/png,image/jpg,image/jpeg,image/webp"
                                    onChange={handleImageChange}
                                />

                                {/* Ausgewählte Dateien werden unter dem Button angezeigt und können eizeln entfernt werden */}
                                {productData.images.length > 0 && (
                                    <div className='small text-muted'>
                                        {productData.images.map((image, imageIndex) => (
                                            <div
                                                key={`${image.name}-${image.lastModified}-${imageIndex}`}
                                                className="selected-product-image-row d-flex align-items-center justify-content-between gap-2 rounded px-2 py-1"
                                            >
                                                <span className="text-truncate">
                                                    {image.name}
                                                </span>

                                                <button
                                                    type="button"
                                                    className="selected-product-image-remove-button btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center p-0 flex-shrink-0"
                                                    style={{ width: "22px", height: "22px", lineHeight: "1" }}
                                                    aria-label={`${image.name} entfernen`}
                                                    title='Bild entfernen'
                                                    onClick={() => handleRemoveSelectedImage(imageIndex)}
                                                >
                                                    x
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {productData.images.length === 0 && (
                                    <div className='small text-muted'>
                                        Keine Bilder ausgewählt
                                    </div>
                                )}
            
                            </div>
                        </div>
                        
                        <div className='flex flex-column align-items-center start-50 px-3 pb-2'>
                            <div className='d-flex align-items-center justify-content-between mb-2' style={{ maxWidth: "520px" }}>
                                <label className='fs-5 mb-0'>Produktvarianten</label>
                                
                                <button 
                                    type="button"
                                    className='btn btn-link btn-sm'
                                    onClick={() => handleAddVariant(false)}
                                >
                                    + Variante hinzufügen
                                </button>
                            </div>
                            <div className='d-flex flex-column align-items-center pb-2'>
                                {renderVariantInputs(productData.variants)}
                            </div>
                        </div>
                        
                        <div className='d-flex flex-row align-items-center pb-2'>
                            <label className='fs-5 me-3' style={{ width: "150px" }}>Kategorie</label>
                            
                            <div 
                                className="list-group border rounded overflow-auto" 
                                style={{ width: "230px", maxHeight: "150px"}}
                            >
                               {categoryLoadError && (
                                    <div classname="list-group-item text-danger">
                                        {categoryLoadError}
                                    </div>
                                )}

                                {!categoryLoadError && categories.length === 0 && (
                                    <div className='list-group-item text-center'>
                                        <div className='text-muted mb-2'>Keine Kategorien verfügbar</div>
                                        <button type="button" className='btn btn-sm btn-outline-primary' onClick={() => setShowCategoryManagement(true)}>
                                            Erste Kategorie anlegen
                                        </button>
                                    </div>
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
                                            checked={selectedCreateCategorySlugs.has(category.slug)}
                                            onChange={() => handleCategoryToggle(category.slug)}
                                        />
                                        {category.name}
                                    </label>
                                ))}
                            </div>
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
                                        <h3 className='w-75'>{product.name}</h3>
                                    </div>
                                    <p>{"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}</p>

                                    <div className='d-flex flex-column' style={{width: "290px"}}>
                                        {(product.variants || []).map((variant, variantIndex) => (
                                            <div key={`${variant.volume}-${variant.packSize}-${variantIndex}`} className='small border-bottom py-1'>
                                                <strong>{variant.packSize} x {String(Number(variant.volume))}ml</strong>
                                                {" - "}{formatEuro(variant.price)}
                                                {" - Bestand: "}{variant.stock}
                                                {" - Pfand: "}{formatEuro(Number(variant.depositPerPack ?? (Number(variant.packSize || 0) * Number(variant.deposit || 0) + Number(variant.crateDeposit || 0))))}
                                                {Number(variant.discount || 0) > 0 && <span className='badge bg-danger ms-2'>-{variant.discount} %</span>}
                                            </div>
                                        ))}
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
                                                existingImages: getProductImages(product),
                                                newImages: [],
                                                removedImages: [],
                                                variants: (product.variants || []).map((variant) => ({
                                                    price: Math.round(Number(variant.price) * 100),
                                                    volume: variant.volume,
                                                    packSize: variant.packSize,
                                                    deposit: Math.round(Number(variant.deposit || 0) * 100),
                                                    crateDeposit: Math.round(Number(variant.crateDeposit || 0) * 100),
                                                    stock: variant.stock,
                                                    discount: variant.discount ?? null,
                                                })),
                                                categorySlugs: getCategorySlugsFromProduct(product),
                                            });
                                            setModifyImageInputKey((currentKey) => currentKey + 1);
                                            setModifyErrorMessage("");
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
                <div 
                    className="d-flex flex-column bg-white p-4 pb-5 rounded align-items-center gap-3"
                    style={{ minWidth: "620px", maxHeight: "90vh", overflowY: "auto" }}
                >
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
                        {/*<input className='fs-5 border rounded ' type="text" placeholder='Bild(Dateiname)' name='image' value={productDataModify.image} onChange={handleChange2}/>*/}

                        <div className="d-flex flex-column gap-2">
                            {/* Bereits gespeicherte Bilder liegen als PFad im Produkt und werden als Vorschau angezeigt */}
                            <div className='d-flex flex-wrap gap-2'>
                                {(productDataModify.existingImages || []).length === 0 && (productDataModify.newImages || []).length === 0 && (
                                    <div className='small text-danger'>
                                        Keine Bilder hinterlegt
                                    </div>
                                )}

                                {(productDataModify.existingImages || []).map((imagePath) => (
                                    <div
                                        key={imagePath}
                                        className='modify-product-image-card position-relative border rounded p-1 d-flex flex-column align-items-center'
                                        style={{ width: "92px" }}
                                    >
                                        <img
                                            className='modify-product-image-preview'
                                            src={getProductImagePreviewPath(imagePath)}
                                            alt={getImageFileName(imagePath)}
                                        />
                                        <span className='small text-muted text-truncate w-100 text-center' title={getImageFileName(imagePath)}>
                                            {getImageFileName(imagePath)}
                                        </span>

                                         <button
                                            type="button"
                                            className='modify-product-image-remove-button btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 d-flex align-items-center justify-content-center p-0'
                                            style={{ width: "22px", height: "22px", transform: "translate(35%, -35%)" }}
                                            title = "Bild entfernen"
                                            onClick={() => handleRemoveExistingModifyImage(imagePath)}
                                         >
                                            x
                                         </button>
                                    </div>
                                ))}
                            </div>

                            {/* Neue Bilder sind noch nicht gespeichert und werden erst beim Klick auf Speichern hochgeladen */}
                            {(productDataModify.newImages || []).length > 0 && (
                                <div className='small text-muted d-flex flex-column gap-1'>
                                    <strong>Neue Bilder:</strong>
                                    {(productDataModify.newImages || []).map((imageFile, imageIndex) => (
                                        <div
                                            key={`${imageFile.name}-${imageFile.lastModified}-${imageIndex}`}
                                            className='selected-product-image-row d-flex align-items-center justify-content-between gap-2 rounded px-2 py-1'
                                        >
                                            <span className='text-truncate'>
                                                {imageFile.name}
                                            </span>

                                            <button
                                                type='button' /* btn-outline-danger rounded-circle */
                                                className='selected-product-image-remove-button btn btn-sm  d-flex align-items-center justify-content-center p-0 flex-shrink-0'
                                                style={{ width: "22px", height: "22px", lineHeight: "1" }}
                                                aria-label={`${imageFile.name} entfernen`}
                                                title="Bild entfernen"
                                                onClick={() => handleRemoveNewModifyImage(imageIndex)}
                                            >
                                                x
                                            </button>
                                        </div>
                                    ))}
                                </div>

                            )}

                            {/* Weitere Bilder werden zum bestehenden Produkt ergänzt, bestehende Bilder bleiben erhalten */}
                            <label
                                htmlFor="modify-product-images"
                                className='btn btn-outline-secondary fs-6 mb-0 align-self-start'
                            >
                                {(productDataModify.existingImages || []).length === 0 ? "Bilder hinzufügen" : "Weitere Bilder hinzufügen" }
                            </label>

                            <input 
                                key={modifyImageInputKey}
                                id="modify-product-images"
                                className='d-none'
                                multiple
                                type='file'
                                accept='image/png, image/jpg, image/jpeg, image/webp'
                                onChange={handleModifyImageChange}
                            />
                        </div>

                    </div>
                    <div className='flex flex-column align-items-center start-50 px-3 pb-2'>
                        <div className='d-flex align-items-center justify-content-between mb-2' style={{ maxWidth: "520px" }}>
                            <label className='fs-5 mb-0'>Produktvarianten</label>
                            <button
                                type="button"
                                className='btn btn-link mb-2'
                                onClick={() => handleAddVariant(true)}
                            >
                                + Variante hinzufügen
                            </button>
                        </div>
                        <div className='d-flex flex-column align-items-center pb-2'>
                                {renderVariantInputs(productDataModify.variants, true)}
                            </div>
                    </div>
                    <div className='d-flex flex-row align-items-center pb-2'>
                        <label className='fs-5 me-3' style={{ width: "150px" }}>Kategorie</label>
                        
                        <div 
                            className="list-group border rounded overflow-auto" 
                            style={{ width: "230px", maxHeight: "150px"}}
                        >

                            {categoryLoadError && (
                                <div className="list-group-item text-danger">
                                    {categoryLoadError}
                                </div>
                            )}

                            {!categoryLoadError && categories.length === 0 && (
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
                                        checked={selectedModifyCategorySlugs.has(category.slug)}
                                        onChange={() => handleModifyCategoryToggle(category.slug)}
                                    />
                                    {category.name}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-secondary"
                            onClick={() => { 
                                setModifyErrorMessage("");    
                                setShowModifyWindow(false);
                                    
                            }}
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
                    
                    {/* Validierungs und Speicherfehler werden direkt unter den Buttons ausgegeben */}
                    {modifyErrorMessage && (
                        <div className="bottom-0 alert alert-danger text-center shadow-sm py-2 px-3 mb-0 ">
                            {modifyErrorMessage}
                        </div>
                    )}

                </div>
            </div>
        )}

        {/* Fenster zum Bearbeiten / Hinzufügen einer Kategorie */}
        {showCategoryManagement && (
            <CategoryManagementModal
                categories={categories}
                accessToken={accessToken}
                onClose={() => setShowCategoryManagement(false)}
                onCategoriesChange={(nextCategories) => {
                    setCategories(Array.isArray(nextCategories) ? nextCategories : []);
                    setCategoryLoadError("");
                }}
            />
        )}
        </div>
    );
}

export default ProductManagement