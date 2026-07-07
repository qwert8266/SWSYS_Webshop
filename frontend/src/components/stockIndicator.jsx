import "./stockIndicator.css";

/**
 * Einheitliche Bestandsanzeige für alle Produktansichten.
 *
 * Erwartet ein StockInfo-Objekt vom dedizierten Stock-Endpunkt
 * (GET /products/:id/stock bzw. GET /products/stock).
 * Die Schwellwerte leben ausschließlich im Backend -- diese Komponente
 * rendert nur den vom Server gelieferten Status.
 */

const STATUS_PRESENTATION = {
  ok: {
    className: "stock-indicator--ok",
    label: () => "Auf Lager",
  },
  low: {
    className: "stock-indicator--low",
    label: (stock) => `Nur noch ${stock} verfügbar`,
  },
  critical: {
    className: "stock-indicator--critical",
    label: (stock) => `Fast ausverkauft – nur noch ${stock} Stück!`,
  },
  out_of_stock: {
    className: "stock-indicator--out",
    label: () => "Ausverkauft",
  },
};

function StockIndicator({ stockInfo, showInStock = false }) {
  // Solange keine Bestandsdaten geladen sind, nichts anzeigen
  // (verhindert ein kurzes Aufblitzen falscher Zustände)
  if (!stockInfo || !STATUS_PRESENTATION[stockInfo.status]) {
    return null;
  }

  // "Auf Lager" ist auf Übersichtsseiten meist nur Rauschen,
  // deshalb ist es standardmäßig ausgeblendet
  if (stockInfo.status === "ok" && !showInStock) {
    return null;
  }

  const presentation = STATUS_PRESENTATION[stockInfo.status];

  return (
    <p
      className={`stock-indicator ${presentation.className}`}
      role={stockInfo.status === "ok" ? undefined : "alert"}
    >
      {presentation.label(stockInfo.stock)}
    </p>
  );
}

export default StockIndicator;
