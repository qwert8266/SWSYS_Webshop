import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./authContext";
import listApi from "../api/listApi";

const ProductListsContext = createContext(null);

function normalizeIdList(ids = []) {
  return ids.map((id) => String(id));
}

export function ProductListsProvider({ children }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const clearLists = useCallback(() => {
    setFavoriteIds([]);
    setWishlistIds([]);
    setIsLoading(false);
  }, []);

  const loadLists = useCallback(async () => {
    if (!accessToken) {
      clearLists();
      return;
    }

    setIsLoading(true);

    try {
      const response = await listApi.getLists(accessToken);
      setFavoriteIds(normalizeIdList(response?.favoriteProductIds));
      setWishlistIds(normalizeIdList(response?.wishlistProductIds));
    } catch (error) {
      console.warn("Produktlisten konnten nicht geladen werden.", error);
      clearLists();
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, clearLists]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      clearLists();
      return;
    }

    loadLists();
  }, [isAuthenticated, accessToken, loadLists, clearLists]);

  const isFavorite = useCallback(
    (productId) => favoriteIds.includes(String(productId)),
    [favoriteIds]
  );

  const isInWishlist = useCallback(
    (productId) => wishlistIds.includes(String(productId)),
    [wishlistIds]
  );

  const toggleFavorite = useCallback(
    async (productId) => {
      if (!accessToken) {
        throw new Error("LOGIN_REQUIRED");
      }

      const response = await listApi.toggleFavorite(productId, accessToken);
      const normalizedId = String(response.productId);

      setFavoriteIds((currentIds) => {
        if (response.active) {
          return currentIds.includes(normalizedId)
            ? currentIds
            : [...currentIds, normalizedId];
        }

        return currentIds.filter((id) => id !== normalizedId);
      });

      return response.active;
    },
    [accessToken]
  );

  const toggleWishlist = useCallback(
    async (productId) => {
      if (!accessToken) {
        throw new Error("LOGIN_REQUIRED");
      }

      const response = await listApi.toggleWishlist(productId, accessToken);
      const normalizedId = String(response.productId);

      setWishlistIds((currentIds) => {
        if (response.active) {
          return currentIds.includes(normalizedId)
            ? currentIds
            : [...currentIds, normalizedId];
        }

        return currentIds.filter((id) => id !== normalizedId);
      });

      return response.active;
    },
    [accessToken]
  );

  const value = useMemo(
    () => ({
      favoriteIds,
      wishlistIds,
      isLoading,
      isFavorite,
      isInWishlist,
      toggleFavorite,
      toggleWishlist,
      reloadLists: loadLists,
    }),
    [
      favoriteIds,
      wishlistIds,
      isLoading,
      isFavorite,
      isInWishlist,
      toggleFavorite,
      toggleWishlist,
      loadLists,
    ]
  );

  return (
    <ProductListsContext.Provider value={value}>
      {children}
    </ProductListsContext.Provider>
  );
}

export function useProductLists() {
  const context = useContext(ProductListsContext);

  if (!context) {
    throw new Error(
      "useProductLists muss innerhalb eines ProductListsProvider verwendet werden."
    );
  }

  return context;
}
