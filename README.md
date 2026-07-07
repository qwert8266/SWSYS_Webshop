# SWSYS_Webshop
Webshop eines Getränkegroßhändlers für das Modul Software System Engineering.

Entwickelt von Ctrl+Alt+Deluxe✨.


## structure
    SWSYS_Webshop
    ├── frontend                # Web Frontend 
    ├── server                  # Go Backend
    │   ├── config              # initial configuration
    │   │   └── connectToDB.go 
    │   ├── Dockerfile          # Dockerfile for Backend 
    │   ├── go.mod              # go modules 
    │   └── main.go             # Main server file
    └── docker-compose.yaml     # docker compose to build everything

### Server

- Go
- Gin  

### Web 

- React 
  - NodeJS
  - bootstrap

### DB

- MongoDB 

## API: Bestand (Stock)

Dedizierte Endpunkte für Bestandsabfragen. Die Schwellwerte sind zentral im Backend
definiert (`server/models/product.go`: `LowStockThreshold = 15`, `CriticalStockThreshold = 5`)
und werden vom Frontend nicht dupliziert.

| Methode | Pfad                   | Auth                 | Beschreibung |
|---------|------------------------|----------------------|--------------|
| GET     | `/products/stock`      | öffentlich           | Bestand aller Produkte inkl. Schwellwerte |
| GET     | `/products/:id/stock`  | öffentlich           | Bestand eines einzelnen Produkts |
| GET     | `/products/stock/low`  | worker, admin, owner | Alle Produkte mit Bestand ≤ 15, aufsteigend sortiert (Logistikpanel) |

Antwortmodell `StockInfo`:

```json
{
  "product_id": "8b6c9f9e-...",
  "name": "Becks",
  "category": "bier",
  "stock": 3,
  "status": "critical"
}
```

`status` wird serverseitig berechnet:

- `ok` – Bestand über 15
- `low` – Bestand ≤ 15
- `critical` – Bestand ≤ 5
- `out_of_stock` – Bestand 0 (Kauf im Frontend nicht möglich)

`/products/stock` und `/products/stock/low` liefern zusätzlich ein `thresholds`-Objekt
(`{ "low": 15, "critical": 5 }`) sowie die Liste unter `stocks`.
