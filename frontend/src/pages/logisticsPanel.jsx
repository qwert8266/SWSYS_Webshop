import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import productApi from "../api/productApi";
import StockIndicator from "../components/stockIndicator";
import { useAuth } from "../context/authContext";
import { getCategoryConfig } from "../utils/categoryConfig";

import "./logisticsPanel.css";

// Rollen, die das Logistikpanel sehen dürfen.
// Muss zu RoleAuth("admin", "worker", "owner") im Backend passen.
const EMPLOYEE_ROLES = ["worker", "admin", "owner"];


function LogisticsPanel() {
  const { user, accessToken, isAuthLoading } = useAuth();

  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [thresholds, setThresholds] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const isEmployee = EMPLOYEE_ROLES.includes(user?.role);

  useEffect(() => {
    let ignoreResult = false;

    async function loadLowStockProducts() {
      setIsLoading(true);
      setLoadError("");

      try {
        const stockResponse = await productApi.getLowStockProducts(accessToken);

        if (!ignoreResult) {
          setLowStockProducts(stockResponse?.stocks ?? []);
          setThresholds(stockResponse?.thresholds ?? null);
        }
      } catch (error) {
        if (!ignoreResult) {
          setLoadError(error.message || "Produkte mit niedrigem Bestand konnten nicht geladen werden.");
        }
      } finally {
        if (!ignoreResult) {
          setIsLoading(false);
        }
      }
    }

    if (accessToken && isEmployee) {
      loadLowStockProducts();
    }

    return () => {
      ignoreResult = true;
    };
  }, [accessToken, isEmployee]);

  if (isAuthLoading) {
    return <p className="m-4">Anmeldung wird geprüft...</p>;
  }

  // Das Backend würde den Request ohnehin mit 403 ablehnen,
  // aber so bekommen Kunden eine verständliche Meldung statt eines Fehlers
  if (!isEmployee) {
    return (
      <main className="logistics-page">
        <h1>Logistikpanel</h1>
        <p className="text-danger">
          Dieser Bereich ist nur für Mitarbeiter zugänglich.
        </p>
      </main>
    );
  }

  return (
    <main className="logistics-page">
      <h1>Logistikpanel</h1>

      {isLoading && <p>Bestände werden geladen...</p>}
      {loadError && <p className="text-danger">{loadError}</p>}

      {!isLoading && !loadError && lowStockProducts.length === 0 && (
        <p className="text-success">
          Alles im grünen Bereich – kein Produkt liegt unter dem Schwellwert.
        </p>
      )}

      {lowStockProducts.length > 0 && (
        <table className="table logistics-table">
          <thead>
            <tr>
              <th scope="col">Produkt</th>
              <th scope="col">Kategorie</th>
              <th scope="col">Bestand</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {lowStockProducts.map((stockInfo) => {
              const category = getCategoryConfig(stockInfo.category);

              return (
                <tr key={stockInfo.product_id}>
                  <td>
                    <NavLink
                      to={`/sortiment/${category.slug}/${encodeURIComponent(stockInfo.product_id)}`}
                    >
                      {stockInfo.name}
                    </NavLink>
                  </td>
                  <td>{category.name}</td>
                  <td>{stockInfo.stock}</td>
                  <td>
                    <StockIndicator stockInfo={stockInfo} showInStock />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}

export default LogisticsPanel;
