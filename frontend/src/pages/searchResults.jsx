import { useEffect, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";

import productApi from "../api/productApi";
import OfferBadge from "../components/offerBadge";
import ProductPrice from "../components/productPrice";
import StockIndicator from "../components/stockIndicator";
import { useStockMap } from "../hooks/useStockMap";
import { getCategoryConfig } from "../utils/categoryConfig";
import {
  getProductImagePath,
  normalizeProduct,
} from "../utils/productHelpers";

import "./categories.css";
import "./searchResults.css";

function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  // Bestände kommen gesammelt vom Stock-Endpunkt, nicht aus der Produkt-Response
  const stockMap = useStockMap();

  useEffect(() => {
    let ignoreResult = false;

    async function loadSearchResults() {
      if (query.length < 2) {
        setProducts([]);
        setLoadError("Bitte gib mindestens zwei Zeichen ein.");
        return;
      }

      setIsLoading(true);
      setLoadError("");

      try {
        const foundProducts = await productApi.searchProducts(query);

        if (!ignoreResult) {
          setProducts(foundProducts.map(normalizeProduct));
        }
      } catch (error) {
        if (!ignoreResult) {
          setProducts([]);
          setLoadError("Die Suche konnte nicht ausgeführt werden.");
        }
      } finally {
        if (!ignoreResult) {
          setIsLoading(false);
        }
      }
    }

    loadSearchResults();

    return () => {
      ignoreResult = true;
    };
  }, [query]);

  return (
    <main className="search-results-page">
      <h1>Suchergebnisse für „{query}“</h1>

      {isLoading && <p>Produkte werden gesucht …</p>}

      {loadError && (
        <p className="text-danger">{loadError}</p>
      )}

      {!isLoading &&
        !loadError &&
        products.length === 0 && (
          <p>Leider wurden keine passenden Produkte gefunden.</p>
        )}

      <div className="product_row">
        {products.map((product) => {
          const category = getCategoryConfig(product.category);

          return (
            <article className="product" key={product.id}>
              <OfferBadge
                product={product}
                showDiscount
                className="offer-badge--on-image"
              />
              <NavLink
                className="product_link"
                to={`/sortiment/${category.slug}/${encodeURIComponent(
                  product.id
                )}`}
              >
                <img
                  className="product_png"
                  src={getProductImagePath(product)}
                  alt={product.name}
                />

                <h3>{product.name}</h3>
              </NavLink>

              <ProductPrice product={product} />

              <StockIndicator stockInfo={stockMap[product.id]} />
            </article>
          );
        })}
      </div>
    </main>
  );
}

export default SearchResults;