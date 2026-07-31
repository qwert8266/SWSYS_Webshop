# SWSYS_Webshop
Webshop eines Getränkegroßhändlers für das Modul Software System Engineering.

Entwickelt von Ctrl+Alt+Deluxe✨.

## Testdaten-Volumes aus Backup-Dateien erstellen

Für lokale Entwicklung und Tests können vorbereitete Docker-Volumes mit Testdaten aus den bereitgestellten `.tar.gz`-Dateien erstellt werden.

Die Backups enthalten bereits Beispielprodukte, Produktbilder und MongoDB-Testdaten.

### Enthaltene Dateien

* `product-images-backup.tar.gz`
* `mongo-data-backup.tar.gz`
* `mongo-config-backup.tar.gz`

### Voraussetzungen

* Docker Desktop oder Docker Engine ist installiert.
* Die Backup-Dateien befinden sich im aktuellen Arbeitsverzeichnis.
* Die Volumes `product-images`, `mongo-data` und `mongo-config` existieren noch nicht oder dürfen überschrieben werden.
* Es wird **PowerShell** verwendet.

---

#### Produktbilder-Volume erstellen

```powershell
docker volume create product-images | Out-Null; docker run --rm -v product-images:/volume -v ${PWD}:/backup alpine sh -c 'cd /volume && tar xzf /backup/product-images-backup.tar.gz'
```

---

#### MongoDB-Daten-Volume erstellen

```powershell
docker volume create mongo-data | Out-Null; docker run --rm -v mongo-data:/volume -v ${PWD}:/backup alpine sh -c 'cd /volume && tar xzf /backup/mongo-data-backup.tar.gz'
```

---

#### MongoDB-Konfigurations-Volume erstellen

```powershell
docker volume create mongo-config | Out-Null; docker run --rm -v mongo-config:/volume -v ${PWD}:/backup alpine sh -c 'cd /volume && tar xzf /backup/mongo-config-backup.tar.gz'
```

---

#### Anwendung starten

```powershell
docker compose up -d
```

---

### Erstellung prüfen

Beispiel für das Produktbilder-Volume:

```powershell
docker run --rm -v product-images:/data alpine sh -c 'find /data -type f | head'
```

Werden Dateien angezeigt, wurde das Volume erfolgreich erstellt.

---

### Anwendung starten

Nach dem Erstellen aller Volumes können die Container gestartet werden:

```powershell
docker compose up -d
```

Die Anwendung startet mit den enthaltenen Testdaten. 

Sobald alle Container gestartet sind, ist das Frontend über **Port 3000** erreichbar.
Das Backend läuft auf **Port 3001** 
---


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


