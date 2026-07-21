import { useParams } from 'react-router-dom';
import './categories.css';
import { useState, useEffect } from 'react';

import productApi from "../api/productApi";
import categoryApi from "../api/categoryApi";
import saleApi from "../api/saleApi";
import ProductGrid from "../components/productGrid";
import { useStockMap } from "../hooks/useStockMap";
import { getCategoryPresentation } from "../utils/categoryConfig";
import { normalizeProduct, isOnOffer, getSaleBannerPath } from '../utils/productHelpers';


function Category({ category: fixedCategory }){
    const { categorySlug } = useParams();
    const requestedCategorySlug = fixedCategory || categorySlug;
    
    const [category, setCategory] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const stockMap = useStockMap();

    const categoryPresentation = getCategoryPresentation(requestedCategorySlug);
    const isOfferCategory = requestedCategorySlug === "angebote";

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
            setSales([]);

            try {
                const productRequest = isOfferCategory
                    ? productApi.getProducts()
                    : productApi.getProductsByCategory(requestedCategorySlug);

                const [categoriesFromDatabase, productsFromDatabase, salesFromDatabase] = await Promise.all([
                    categoryApi.getCategories(),
                    productRequest,
                    isOfferCategory ? saleApi.getSales() : Promise.resolve([]),
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
                    setSales(Array.isArray(salesFromDatabase) ? salesFromDatabase : []);
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
    }, [categorySlug, fixedCategory, requestedCategorySlug, isOfferCategory]);

    return(
        <div className='category-page'>
            <div>
                <div>
                    {isOfferCategory && sales.length > 0 ? (
                        sales.map((sale) => {
                            const bannerSrc = getSaleBannerPath(sale);

                            if (!bannerSrc) {
                                return null;
                            }

                            return (
                                <img
                                    key={sale.sale_id}
                                    className='picture_top'
                                    src={bannerSrc}
                                    alt={`Angebot ${sale.discount} %`}
                                />
                            );
                        })
                    ) : (
                        <img 
                            className='picture_top' 
                            src={`/img/product_images/${categoryPresentation.banner.png}`} 
                            alt={category?.name || requestedCategorySlug}
                        />
                    )}
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