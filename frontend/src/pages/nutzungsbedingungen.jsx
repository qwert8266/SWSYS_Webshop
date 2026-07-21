import { Link } from "react-router-dom";
import "./legal.css";

function Nutzungsbedingungen() {
  return (
    <main className="legal-page">
      <h1>Nutzungsbedingungen</h1>
      <p className="legal-stand">Stand: Juli 2026</p>

      <h2>1. Geltungsbereich</h2>
      <p>
        Diese Nutzungsbedingungen regeln die Nutzung der Website und des
        Onlineshops der Ctrl+Alt+Deluxe GmbH (nachfolgend „Betreiber“).
        Sie gelten für alle Besucher der Website sowie für registrierte
        Nutzerinnen und Nutzer. Für Kaufverträge gelten ergänzend unsere{" "}
        <Link to="/agb">Allgemeinen Geschäftsbedingungen (AGB)</Link>.
      </p>

      <h2>2. Leistungsbeschreibung</h2>
      <p>
        Der Betreiber stellt eine Online-Plattform zum Stöbern in
        Getränkesortimenten, zur Verwaltung eines Kundenkontos, zur Nutzung
        eines Warenkorbs sowie zur Abgabe von Bestellungen bereit.
        Mitarbeitenden mit entsprechender Berechtigung stehen zusätzliche
        Verwaltungsfunktionen (z. B. Produkt- und Bestellverwaltung) zur
        Verfügung.
      </p>

      <h2>3. Registrierung und Kundenkonto</h2>
      <p>
        Für Bestellungen und bestimmte Funktionen ist ein Kundenkonto
        erforderlich. Bei der Registrierung sind wahrheitsgemäße und
        vollständige Angaben zu machen. Das Passwort ist geheim zu halten
        und darf nicht an Dritte weitergegeben werden. Der Nutzer ist für
        alle Aktivitäten verantwortlich, die über sein Konto erfolgen.
      </p>
      <p>
        Der Betreiber kann Konten sperren oder löschen, wenn konkrete
        Anhaltspunkte für einen Missbrauch, falsche Angaben oder
        Verstöße gegen diese Nutzungsbedingungen vorliegen.
      </p>

      <h2>4. Zulässige Nutzung</h2>
      <p>Die Website darf nur im Rahmen des vorgesehenen Zwecks genutzt werden. Untersagt ist insbesondere:</p>
      <ul>
        <li>die automatisierte Abfrage oder das Auslesen von Daten (Scraping, Bots), soweit nicht ausdrücklich erlaubt</li>
        <li>der Versuch, Sicherheitsmechanismen zu umgehen oder fremde Konten zu nutzen</li>
        <li>die Verbreitung rechtswidriger, beleidigender oder irreführender Inhalte über Kontakt- oder Supportfunktionen</li>
        <li>Handlungen, die die Verfügbarkeit oder Integrität der Plattform beeinträchtigen</li>
      </ul>

      <h2>5. Mitarbeiterbereich</h2>
      <p>
        Zugänge mit Mitarbeiter-, Admin- oder Owner-Rolle dürfen ausschließlich
        von berechtigten Personen genutzt werden. Der Zugang ist vertraulich
        zu behandeln. Unbefugte Nutzung interner Funktionen ist untersagt.
      </p>

      <h2>6. Verfügbarkeit</h2>
      <p>
        Der Betreiber bemüht sich um eine möglichst unterbrechungsfreie
        Verfügbarkeit der Website. Wartungsarbeiten, technische Störungen
        oder höhere Gewalt können jedoch zu vorübergehenden
        Einschränkungen führen. Ein Anspruch auf permanente Verfügbarkeit
        besteht nicht.
      </p>

      <h2>7. Urheber- und Nutzungsrechte</h2>
      <p>
        Texte, Bilder, Logos, Layouts und sonstige Inhalte der Website
        sind urheberrechtlich geschützt. Eine Vervielfältigung, Verbreitung
        oder öffentliche Wiedergabe außerhalb des privaten Gebrauchs bedarf
        der vorherigen Zustimmung des Betreibers.
      </p>

      <h2>8. Haftung</h2>
      <p>
        Der Betreiber haftet unbeschränkt bei Vorsatz und grober
        Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder
        Gesundheit. Bei einfacher Fahrlässigkeit haftet der Betreiber nur
        für die Verletzung wesentlicher Vertragspflichten, begrenzt auf den
        vertragstypischen, vorhersehbaren Schaden. Für Inhalte externer
        Links übernimmt der Betreiber keine Gewähr, sofern er nicht
        positive Kenntnis von rechtswidrigen Inhalten hat.
      </p>

      <h2>9. Datenschutz</h2>
      <p>
        Informationen zur Verarbeitung personenbezogener Daten finden Sie in
        unserer{" "}
        <Link to="/datenschutzerklärung">Datenschutzerklärung</Link>.
      </p>

      <h2>10. Änderungen</h2>
      <p>
        Der Betreiber kann diese Nutzungsbedingungen anpassen, wenn dies
        aufgrund rechtlicher, technischer oder wirtschaftlicher
        Entwicklungen erforderlich ist. Die jeweils aktuelle Fassung ist
        auf dieser Seite abrufbar.
      </p>

      <h2>11. Schlussbestimmungen</h2>
      <p>
        Es gilt das Recht der Bundesrepublik Deutschland. Sollten einzelne
        Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen
        Regelungen unberührt.
      </p>
    </main>
  );
}

export default Nutzungsbedingungen;
