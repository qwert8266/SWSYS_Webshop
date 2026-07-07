import { useEffect, useState } from "react";

import productApi from "../api/productApi";


export function useStockMap() {
  const [stockMap, setStockMap] = useState({});

  useEffect(() => {
    let ignoreResult = false;

    async function loadStocks() {
      try {
        const stockResponse = await productApi.getAllStock();

        if (!ignoreResult) {
          const map = {};
          for (const stockInfo of stockResponse?.stocks ?? []) {
            map[stockInfo.product_id] = stockInfo;
          }
          setStockMap(map);
        }
      } catch (error) {
        // Bestandsanzeige ist nicht kritisch: die Seite bleibt ohne
        // Indikator nutzbar, deshalb hier kein harter Fehler
        if (!ignoreResult) {
          setStockMap({});
        }
      }
    }

    loadStocks();

    return () => {
      ignoreResult = true;
    };
  }, []);

  return stockMap;
}
