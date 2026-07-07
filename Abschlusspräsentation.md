*Präsentation des gesamten Projekts sowie Live-Vorführung der Implementierung. Die Präsentation ist auf dem Level einer Stakeholder-/Investorenpräsentation zu halten. Die Stakeholder sollen vom Produkt überzeugt werden und idealerweise motiviert werden in weitere Features oder Erweiterungen zu investieren.*

	Dauer:
		Präsentation: 15min.
		Vorführung:    5min.

### Vorgehen

- Ausgangssituation identifizieren (Wesley)
	- welche Features werden benötigt
- Anforderungsdefinition (Lucas)
	- aus Projektpich
	- aus UseCase der Webseite
- Versionierung mit Git (Linus)
	- Branching in Features 
	- Pull requests mit review auf Development-Branches 
	- Zuordnung zu Issues und Milestones 
- Arbeitspakete definieren (Nico)
	- Github Issues 
	- Branches Issues zugeordnet 
	- Labels sinnvoll verwendet 
	- Subissues für geteilte Unteraufgaben 
	- Reviews bevor final gemerged wird 
	- Zuweisung von Bearbeitern der Issue 
	- Zuweisung von Reviewern, die nicht an dem Problem gearbeitet haben

### Entscheidungen

- Tech-Stack  
- Systemarchitektur (Linus)
	- Docker compose für: (Linus)
		- Netzwerk
		- Volumes
		- Mailpit für die Entwicklung der Mails 
	- Backend API in Go (Linus)
		- GIN Web Framework 
		- UUIDs 
		- Middleware 
			- Authentifizierung mit JWT Tokens
			- Rollenvergabe und Rechteverwaltung (Linus)
	- Frontend (Mathis)
		- React 
		- Strukturierung in Seiten 
		- Kapselung der Funktionalitäten 
		- Base API durch einzelne Untervarianten erweitert
- Datenbankmodell 
	- Entscheidung für das System (Linus)
	- Diagramm für Modell (Lucas)

- Welche Features müssen für V1.0 umgesetzt werden 
- Authentifizierung und Rollenvergabe (abstakt und konzeptionell) (Linus)
### Ergebnisse

- Wie Anforderungen umgesetzt wurden
- Mindestanforderungen  (Mathis)
- Umsetzung von Authentifizierung und Rollenvergabe (Linus)
- Mails (Wesley)
	- Passwort zurücksetzen
	- Kontaktformular 

### Features & Erweiterungen

- KI - Assistant mit animiertem Avatar 
- bessere, feinere Rollenvergabe (Linus)
- 24/7 professionelles Monitoring 
- besseres Mitarbeiterpanel
	- Mails wg.
		- Großbestellungen
		- Kontaktanfragen
		- Bewerbungen
	- Einsicht in Warenkörbe
	- Assistenz/Beratung
- Integration in ERP 
- gute mobile UI

### Fazit

kurz, alle 

### Demo 

- Registrieren 
- Anmelden 
- Konto 
- Produkte ansehen und suchen 
- Bestellen 
*jump to Mitarbeitersicht*
- Bestellung bearbeiten 
- Mitarbeiterfunktionen

*jump to Kunde*
- Kontoeinstellungen 
- Bestellhistorie 
- Mails
	- Passwort zurücksetzen
	- Großbestellung