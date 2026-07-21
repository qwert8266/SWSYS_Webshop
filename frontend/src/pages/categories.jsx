import { useParams } from 'react-router-dom';
import './categories.css';
import { useState, useEffect } from 'react';

import productApi from "../api/productApi";
import categoryApi from "../api/categoryApi";
import saleApi from "../api/saleApi";
import ProductGrid from "../components/productGrid";
import { useStockMap } from "../hooks/useStockMap";
import { getCategoryBannerPath, normalizeProduct, isOnOffer, getSaleBannerPath } from '../utils/productHelpers';

/** Loads one dynamic category and displays its banner, sentence and assigned products */
function Category({ category: fixedCategory }){
    const { categorySlug } = useParams();
    const requestedCategorySlug = fixedCategory || categorySlug;
    
    const [category, setCategory] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const stockMap = useStockMap();
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
                const [categoriesResponse, productResponse, salesResponse] = await Promise.all([
                    categoryApi.getCategories(),
                    isOfferCategory ? productApi.getProducts() : productApi.getProductsByCategory(requestedCategorySlug),
                    isOfferCategory ? saleApi.getSales() : Promise.resolve([]),
                ]); 
                
                const categoryList = Array.isArray(categoriesResponse) ? categoriesResponse : [];
                const selectedCategory = categoryList.find((item) => item.slug === requestedCategorySlug);

                if (!isOfferCategory && !selectedCategory) {
                    if (!ignoreResult) {
                        setCategory(null);
                        setLoadError("Diese Kategorie existiert nicht oder wurde entfernt");
                    }
                    return;
                }

                if (!ignoreResult) {
                    setCategory(selectedCategory || {
                        name: "Angebot",
                        slug: "angebot",
                        sentence: "Unsere aktuellen Angebote"
                    });

                    const normalizedProducts = (Array.isArray(productResponse) ? productResponse : []).map(normalizeProduct);
                    setCategoryProducts(isOfferCategory ? normalizedProducts.filter(isOnOffer) : normalizedProducts);
                    setSales(Array.isArray(salesResponse) ? salesResponse : []);
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
        return () => { ignoreResult = true;};
    }, [requestedCategorySlug, isOfferCategory]);

    const categoryBanner = getCategoryBannerPath(category);

    return(
        <div className='category-page'>
            {category && (

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
                        <img className='picture_top' src={categoryBanner} alt={category.name} />
                    )}
                </div>
                <div className='sentence_top'>{category.sentence || category.name}</div>
                <div className='sentence_below_top'>
                    Entdecken Sie neue Sorten oder genießen Sie ihre Favoriten.
                </div>
            </div>
            )}

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