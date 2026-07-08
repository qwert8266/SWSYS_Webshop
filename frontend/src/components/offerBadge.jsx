import { isOnOffer, getOfferPricing } from "../utils/productHelpers";
import "./offerBadge.css";

/**
 * Einheitliche Angebots-Kennzeichnung für alle Produktansichten.
 *
 * Zeigt standardmäßig "Im Angebot" an; mit showDiscount wird
 * stattdessen der konkrete Rabatt (z. B. "-20 %") angezeigt.
 */
function OfferBadge({ product, showDiscount = false, className = "" }) {
  if (!isOnOffer(product)) {
    return null;
  }

  const { discountPercent } = getOfferPricing(product);
  const label = showDiscount ? `-${discountPercent} %` : "Im Angebot";

  return (
    <span className={`offer-badge ${className}`.trim()}>
      {label}
    </span>
  );
}

export default OfferBadge;
