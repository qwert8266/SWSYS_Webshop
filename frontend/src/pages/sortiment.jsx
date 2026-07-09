import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

import productApi from "../api/productApi";
import ProductGrid from "../components/productGrid";
import { CATEGORY_CONFIGS } from "../utils/categoryConfig";
import { normalizeProduct, isOnOffer } from "../utils/productHelpers";

import "./categories.css";
import "./sortiment.css";

const SUBCATEGORY_CONFIGS = CATEGORY_CONFIGS.filter(
  (category) => category.slug !== "angebote"
);

function Sortiment() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let ignoreResult = false;

    async function loadProducts() {
      setIsLoading(true);
      setLoadError("");

      try {
        const productsFromDatabase = await productApi.getProducts();

        if (!ignoreResult) {
          setProducts(productsFromDatabase.map(normalizeProduct));
        }
      } catch {
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
  }, []);

  const featuredProducts = useMemo(
    () => products.filter(isOnOffer),
    [products]
  );

  const productsByCategory = useMemo(
    () =>
      SUBCATEGORY_CONFIGS.map((category) => ({
        category,
        products: products.filter(
          (product) => product.category === category.dbCategory
        ),
      })),
    [products]
  );

  return (
    <div className="sortiment-page">
      <header className="sortiment-hero">
        <h1>Unser Sortiment</h1>
        <p>
          Entdecken Sie angesagte Angebote und stöbern Sie durch alle
          Getränkekategorien unseres Großhandels.
        </p>
      </header>

      {isLoading && <p className="sortiment-info">Produkte werden geladen...</p>}
      {loadError && <p className="sortiment-info text-danger">{loadError}</p>}

      {!isLoading && !loadError && (
        <>
          <section className="sortiment-section">
            <div className="sortiment-section-header">
              <h2>Angesagte Produkte</h2>
              <NavLink className="sortiment-section-link" to="/sortiment/angebote">
                Alle Angebote anzeigen
              </NavLink>
            </div>

            {featuredProducts.length > 0 ? (
              <ProductGrid products={featuredProducts} categorySlug="angebote" />
            ) : (
              <p className="sortiment-info">
                Aktuell sind keine Angebote hinterlegt.
              </p>
            )}
          </section>

          {productsByCategory.map(({ category, products: categoryProducts }) => (
            <section className="sortiment-section" key={category.slug}>
              <div className="sortiment-section-header">
                <h2>{category.name}</h2>
                <NavLink
                  className="sortiment-section-link"
                  to={`/sortiment/${category.slug}`}
                >
                  Zur Kategorie
                </NavLink>
              </div>

              {categoryProducts.length > 0 ? (
                <ProductGrid
                  products={categoryProducts}
                  categorySlug={category.slug}
                />
              ) : (
                <p className="sortiment-info">
                  In dieser Kategorie sind derzeit keine Produkte verfügbar.
                </p>
              )}
            </section>
          ))}
        </>
      )}
    </div>
  );
}

export default Sortiment;
