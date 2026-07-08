import { formatEuro, getOfferPricing } from "../utils/productHelpers";
import "./productPrice.css";

/**
 * Einheitliche Preisanzeige für alle Produktansichten.
 *
 * Ohne Angebot wird nur der reguläre Preis angezeigt.
 * Im Angebot werden alter Preis (durchgestrichen), neuer Preis
 * und optional der Rabatt in Prozent angezeigt.
 */
function ProductPrice({ product, showDiscount = true, className = "" }) {
  if (!product) {
    return null;
  }

  const pricing = getOfferPricing(product);

  if (!pricing.isOnOffer) {
    return (
      <span className={`product-price ${className}`.trim()}>
        <strong>{formatEuro(pricing.currentPrice)}</strong>
      </span>
    );
  }

  return (
    <span className={`product-price product-price--offer ${className}`.trim()}>
      <s className="product-price-old">{formatEuro(pricing.originalPrice)}</s>
      <strong className="product-price-new">{formatEuro(pricing.currentPrice)}</strong>
      {showDiscount && (
        <span className="product-price-discount">-{pricing.discountPercent} %</span>
      )}
    </span>
  );
}

export default ProductPrice;
