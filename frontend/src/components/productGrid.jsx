import { NavLink } from "react-router-dom";
import { findCategoryConfig } from "../utils/categoryConfig";
import { getProductImagePath } from "../utils/productHelpers";
import FavoriteButton from "./favoriteButton";
import "./favoriteButton.css";
import OfferBadge from "./offerBadge";
import ProductPrice from "./productPrice";
import StockIndicator from "./stockIndicator";


function ProductGrid({ products, categorySlug, stockMap = {}, showListActions = true }) {
  if (!products.length) {
    return null;
  }

  return (
    <div className="product_row">
      {products.map((product) => {
        const slug = categorySlug;  // oder von dem Produkt

        return (
          <div className="product" key={product.id || product.name}>
            <OfferBadge product={product} showDiscount className="offer-badge--on-image" />
            {showListActions && product.id && (
              <div className="product-card-actions">
                <FavoriteButton productId={product.id} listType="favorite" />
                <FavoriteButton productId={product.id} listType="wishlist" />
              </div>
            )}
            <NavLink
              className="product_link"
              to={`/sortiment/${encodeURIComponent(slug)}/${encodeURIComponent(product.id)}`}
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
            <ProductPrice product={product} />
            <StockIndicator stockInfo={stockMap[product.id]} />
          </div>
        );
      })}
    </div>
  );
}

export default ProductGrid;
