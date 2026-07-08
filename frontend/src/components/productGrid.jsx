import { NavLink } from "react-router-dom";
import { findCategoryConfig } from "../utils/categoryConfig";
import { formatEuro, getProductImagePath } from "../utils/productHelpers";
import FavoriteButton from "./favoriteButton";
import "./favoriteButton.css";
import StockIndicator from "./stockIndicator";

function getProductCategorySlug(product, categorySlug) {
  if (categorySlug) {
    return categorySlug;
  }

  return findCategoryConfig(product.category)?.slug || product.category;
}

function ProductGrid({ products, categorySlug, stockMap = {}, showListActions = true }) {
  if (!products.length) {
    return null;
  }

  return (
    <div className="product_row">
      {products.map((product) => {
        const slug = getProductCategorySlug(product, categorySlug);

        return (
          <div className="product" key={product.id || product.name}>
            {showListActions && product.id && (
              <div className="product-card-actions">
                <FavoriteButton productId={product.id} listType="favorite" />
                <FavoriteButton productId={product.id} listType="wishlist" />
              </div>
            )}
            <NavLink
              className="product_link"
              to={`/sortiment/${slug}/${encodeURIComponent(product.id)}`}
            >
              <img
                className="product_png"
                src={getProductImagePath(product)}
                alt={product.name}
              />
              <h3>{product.name}</h3>
            </NavLink>
            <p>
              {"★".repeat(Math.round(product.rating))}
              {"☆".repeat(5 - Math.round(product.rating))}
            </p>
            <strong>{formatEuro(product.price)}</strong>
            <StockIndicator stockInfo={stockMap[product.id]} />
          </div>
        );
      })}
    </div>
  );
}

export default ProductGrid;
