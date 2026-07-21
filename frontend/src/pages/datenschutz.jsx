import "./legal.css";

function Datenschutz() {
  return (
    <main className="legal-page">
      <h1>Datenschutzerklärung</h1>
      <p className="legal-stand">Stand: Juli 2026</p>


      <h2>1. Verantwortlicher</h2>
      <address>
        Ctrl+Alt+Deluxe GmbH
        <br />
        Musterstraße 1
        <br />
        12345 Musterstadt
        <br />
        E-Mail: datenschutz@ctrl-alt-deluxe.de
      </address>

      <h2>2. Welche Daten wir verarbeiten</h2>
      <h3>2.1 Kundenkonto und Registrierung</h3>
      <p>
        Bei der Registrierung erheben wir die von Ihnen angegebenen Daten:
        Anrede, Vor- und Nachname, Geburtsdatum (zur Altersprüfung nach dem
        Jugendschutzgesetz), Anschrift, E-Mail-Adresse, Telefonnummer sowie
        Ihr Passwort (verschlüsselt gespeichert). Bei Geschäftskunden
        zusätzlich den Unternehmensnamen. Rechtsgrundlage ist Art. 6 Abs. 1
        lit. b DSGVO (Vertragserfüllung) sowie hinsichtlich der Altersprüfung
        Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtung).
      </p>
      <h3>2.2 Bestellungen</h3>
      <p>
        Zur Abwicklung Ihrer Bestellungen verarbeiten wir Bestell-, Zahlungs-
        und Lieferdaten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. An
        Versand- und Zahlungsdienstleister geben wir nur die Daten weiter,
        die für die Lieferung bzw. Zahlungsabwicklung erforderlich sind.
      </p>
      <h3>2.3 Cookies</h3>
      <p>
        Unsere Website verwendet technisch notwendige Cookies, z. B. für den
        Warenkorb und die Anmeldung (Art. 6 Abs. 1 lit. f DSGVO, § 25 Abs. 2
        TDDDG). Nicht notwendige Cookies setzen wir nur mit Ihrer
        Einwilligung über den Cookie-Banner ein (Art. 6 Abs. 1 lit. a DSGVO,
        § 25 Abs. 1 TDDDG). Eine erteilte Einwilligung können Sie jederzeit
        mit Wirkung für die Zukunft widerrufen.
      </p>
      <h3>2.4 Kontaktformular</h3>
      <p>
        Wenn Sie uns über das Kontaktformular schreiben, verarbeiten wir Ihre
        Angaben zur Bearbeitung der Anfrage (Art. 6 Abs. 1 lit. b bzw. f
        DSGVO).
      </p>

      <h2>3. Speicherdauer</h2>
      <p>
        Wir speichern personenbezogene Daten nur so lange, wie es für die
        genannten Zwecke erforderlich ist oder gesetzliche
        Aufbewahrungspflichten (z. B. 6 bzw. 10 Jahre nach § 257 HGB, § 147
        AO für Geschäftsunterlagen) bestehen. Ihr Kundenkonto können Sie
        jederzeit in den Kontoeinstellungen löschen.
      </p>

      <h2>4. Weitergabe von Daten</h2>
      <p>
        Eine Übermittlung Ihrer Daten an Dritte findet nur statt, soweit dies
        zur Vertragsabwicklung erforderlich ist (z. B. Versanddienstleister,
        Zahlungsdienstleister), Sie eingewilligt haben oder wir gesetzlich
        dazu verpflichtet sind. Eine Übermittlung in Drittländer außerhalb
        der EU/des EWR findet nicht statt.
      </p>

      <h2>5. Ihre Rechte</h2>
      <p>Sie haben gegenüber uns folgende Rechte:</p>
      <ul>
        <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
        <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
        <li>Löschung (Art. 17 DSGVO)</li>
        <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
        <li>
          Widerspruch gegen die Verarbeitung auf Grundlage von Art. 6 Abs. 1
          lit. f DSGVO (Art. 21 DSGVO)
        </li>
        <li>
          Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft
          (Art. 7 Abs. 3 DSGVO)
        </li>
      </ul>
      <p>
        Darüber hinaus haben Sie das Recht, sich bei einer
        Datenschutzaufsichtsbehörde zu beschweren (Art. 77 DSGVO).
      </p>

      <h2>6. Datensicherheit</h2>
      <p>
        Wir übertragen Ihre Daten verschlüsselt (TLS) und speichern
        Passwörter ausschließlich als Hash. Unsere Systeme werden
        regelmäßig aktualisiert und gegen unbefugten Zugriff geschützt.
      </p>

      <h2>7. Änderungen dieser Datenschutzerklärung</h2>
      <p>
        Wir passen diese Datenschutzerklärung an, sobald Änderungen der
        Datenverarbeitung oder der Rechtslage dies erforderlich machen. Es
        gilt jeweils die hier veröffentlichte, aktuelle Fassung.
      </p>
    </main>
  );
}

export default Datenschutz;
