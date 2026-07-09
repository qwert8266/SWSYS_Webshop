import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useProductLists } from "../context/productListsContext";
import "./favoriteButton.css";

function FavoriteButton({
  productId,
  listType = "favorite",
  className = "",
  showLabel = false,
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isFavorite, isInWishlist, toggleFavorite, toggleWishlist } =
    useProductLists();
  const [isUpdating, setIsUpdating] = useState(false);

  const isActive =
    listType === "favorite"
      ? isFavorite(productId)
      : isInWishlist(productId);

  const label =
    listType === "favorite"
      ? isActive
        ? "Lieblingsprodukt"
        : "Als Lieblingsprodukt markieren"
      : isActive
        ? "Auf Wunschzettel"
        : "Zum Wunschzettel hinzufügen";

  async function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setIsUpdating(true);

    try {
      if (listType === "favorite") {
        await toggleFavorite(productId);
      } else {
        await toggleWishlist(productId);
      }
    } catch (error) {
      if (error.message === "LOGIN_REQUIRED") {
        navigate("/login");
      }
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <button
      type="button"
      className={`product-list-button ${listType} ${isActive ? "active" : ""} ${className}`}
      onClick={handleClick}
      disabled={isUpdating}
      aria-pressed={isActive}
      aria-label={label}
      title={label}
    >
      {listType === "favorite" ? (
        <span className="product-list-icon" aria-hidden="true">
          {isActive ? "❤︎" : "♡"}
        </span>
      ) : (
        <span className="product-list-icon" aria-hidden="true">
          {isActive ? "★" : "☆"}
        </span>
      )}
      {showLabel && <span className="product-list-label">{label}</span>}
    </button>
  );
}

export default FavoriteButton;
