# Frontend

## Anwendung starten

Um die Frontend-Anwendung lokal zu starten, im frontend Verzeichnis:
### `npm start`

Nach dem Start ist die Anwendung unter [http://localhost:3000](http://localhost:3000) erreichbar.

Die Seite wird bei gespeicherte Änderungen neu geladen und vorgenommene Änderungen werden direkt angezeigt. 



## structure
    frontend 
    ├── public/                 # Statistische Dateien (HTML, Bilder, Icons, etc.)
    ├── src/                 
    │   ├── api/                # Kommunikation mit dem Backend (API-Aufrufe) 
    │   ├── components/         # Wiederverwendbare UI-Komponenten
    │   ├── pages/              # Seiten der Anwendung
    │   ├── routes/             # Routing-Konfiguration 
    │   ├── App.css             # Globale Styles 
    │   ├── App.jsx             # Hauptkomponenten der Anwendung
    │   └── index.js            # EInstiegspunkt
    └── Dockerfile              # Dockerfile for Frontend


