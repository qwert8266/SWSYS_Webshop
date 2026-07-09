import { useParams } from 'react-router-dom';
import './categories.css';
import { useState, useEffect } from 'react';

import productApi from "../api/productApi";
import categoryApi from "../api/categoryApi";
import ProductGrid from "../components/productGrid";
import StockIndicator from "../components/stockIndicator";
import { useStockMap } from "../hooks/useStockMap";
import { getCategoryPresentation } from "../utils/categoryConfig";
import { normalizeProduct, isOnOffer } from '../utils/productHelpers';


function Category({ category: fixedCategory }){
    const { categorySlug } = useParams();
    
    // Kategorie kommt aus der Route-Komponente oder aus der URL
    const requestedCategorySlug = fixedCategory || categorySlug;
    
    const [category, setCategory] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    // Bestände kommen gesammelt vom Stock-Endpunkt, nicht aus der Produkt-Response
    const stockMap = useStockMap();

    const categoryPresentation = getCategoryPresentation(requestedCategorySlug);


    useEffect(() => {
        let ignoreResult = false;

        async function loadProducts() {
            if (!requestedCategorySlug) {
                setLoadError("Kategorien konnte nicht geladen werden");
                return;
            }
            
            setIsLoading(true);
            setLoadError("");
            setCategoryProducts([]);

          
           try {
    const isOfferCategory = requestedCategorySlug === "angebote";

    const [categoriesFromDatabase, productsFromDatabase] = await Promise.all([
        categoryApi.getCategories(),
        isOfferCategory
            ? productApi.getProducts()
            : productApi.getProductsByCategory(requestedCategorySlug),
    ]);

    const selectedCategory = categoriesFromDatabase.find((databaseCategory) => {
        return databaseCategory.slug === requestedCategorySlug;
    });

    if (!ignoreResult) {
        setCategory(selectedCategory || {
            name: fixedCategory || categorySlug,
            slug: requestedCategorySlug
        });

        const normalizedProducts = (productsFromDatabase || []).map(normalizeProduct);
        setCategoryProducts(
            isOfferCategory ? normalizedProducts.filter(isOnOffer) : normalizedProducts
        );
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
    }, [categorySlug, fixedCategory, requestedCategorySlug]);


    return(
        <div className='category-page'>
            <div>
                <div>
                    <img 
                        className='picture_top' 
                        src={`/img/product_images/${categoryPresentation.banner.png}`} 
                        alt={category?.name || requestedCategorySlug}
                    />
                </div>
                <div className='sentence_top'>{categoryPresentation.banner.sentence}</div>
                <div className='sentence_below_top'>
                    Entdecken Sie neue Sorten oder genießen Sie ihre Favoriten.
                </div>
            </div>

            {isLoading && <p className="category-info">Produkte werden geladen...</p>}
            {loadError && <p className='category-info text-danger'>{loadError}</p>}

            {isLoading && !loadError && categoryProducts.length === 0 && (
                <p className='category-info'>Hoppla. Leider konnten wir keine Produkte finden.</p>
            )}

            <ProductGrid 
                products={categoryProducts} 
                categorySlug={category?.slug || requestedCategorySlug} 
                stockMap={stockMap}
            />
        </div>
    );
}

export default Category