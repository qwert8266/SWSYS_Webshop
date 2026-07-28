# SWSYS_Webshop
Webshop eines Getränkegroßhändlers für das Modul Software System Engineering.

Entwickelt von Ctrl+Alt+Deluxe✨.


## structure

	SWSYS_Webshop
    ├── frontend                # Web Frontend 
    ├── server                  # Go Backend
    │   ├── database
	│   │   └── database.go     # database configuration 
    │   ├── handlers            # central logic
    │   ├── helpers             # token generation and password validation
    │   ├── middleware          # authentication and role based access
    │   ├── models              # data structures
    │   ├── routes              # api routing 
    │   ├── services            # mailing
    │   ├── .env                # enviroment variables
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


## API: 

Die API hat folgende Endpunkte:

	baseurl
	├── /health [GET]                                   public
	│
	├── /user
	│   ├── /register [POST]                            public
	│   ├── /login [POST]                               public
	│   ├── /password-reset
	│   │   ├── /request [POST]                         public
	│   │   └── /confirm [POST]                         public
	│   ├── /logout [POST]                              user
	│   ├── /me [GET]                                   user
	│   │   ├── /lists [GET]                            user
	│   │   ├── /favorites [GET]                        user
	│   │   │   └── /:productId [POST]                  user
	│   │   ├── /wishlist [GET]                         user
	│   │   │   └── /:productId [POST]                  user
	│   │   └── /password [PATCH]                       user
	│   ├── / [GET]                                     worker,admin,owner
	│   └── /:id
	│       ├── [GET]                                   admin,owner
	│       ├── [PATCH]                                 admin,owner
	│       ├── [DELETE]                                admin,owner
	│       └── /role [PUT]                             admin,owner
	│
	├── /products
	│   ├── / [GET]                                     public
	│   ├── /search [GET]                               public
	│   ├── /category [GET]                             public
	│   │   └── /:category [GET]                        public
	│   ├── /:id [GET]                                  public
	│   ├── /:id [PUT]                                  admin,owner
	│   ├── /:id [PATCH]                                admin,owner
	│   ├── /:id [DELETE]                               admin,owner
	│   │   └── /stock [GET]                            worker,admin,owner
	│   ├── /product_management [POST]                  admin,owner
	│   └── /stock [GET]                                worker,admin,owner
	│       └── /low [GET]                              worker,admin,owner
	│
	├── /order
	│   ├── / [POST]                                    user
	│   ├── /me [GET]                                   user
	│   ├── /:id [PUT]                                  worker,admin,owner
	│   │   └── /return-request [POST]                  user
	│   ├── / [GET]                                     worker,admin,owner
	│   └── /statistics [GET]                           worker,admin,owner
	│
	├── /sales
	│   ├── / [GET]                                     public
	│   ├── / [POST]                                    worker,admin,owner
	│   └── /:id [DELETE]                               worker,admin,owner
	│
	├── /category
	│   ├── / [GET]                                     public
	│   ├── / [POST]                                    worker,admin,owner
	│   ├── /:slug [PUT]                                worker,admin,owner
	│   └── /:slug [DELETE]                             worker,admin,owner
	│
	├── /cart
	│   ├── / [PUT]                                     user
	│   ├── / [DELETE]                                  user
	│   └── /me [GET]                                   user
	│
	└── /contact
	    ├── [POST]                                      user
	    └── [GET]                                       worker,admin,owner

#### Bestand (Stock)

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
