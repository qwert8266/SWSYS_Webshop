import "./legal.css";

function Impressum() {
  return (
    <main className="legal-page">
      <h1>Impressum</h1>
      <p className="legal-stand">Stand: Juli 2026</p>

      <h2>Angaben gemäß § 5 DDG</h2>
      <address>
        Ctrl+Alt+Deluxe GmbH
        <br />
        Musterstraße 1
        <br />
        12345 Musterstadt
        <br />
        Deutschland
      </address>

      <h2>Vertreten durch</h2>
      <p>Max Mustermann (Geschäftsführer)</p>

      <h2>Kontakt</h2>
      <p>
        Telefon: +49 (0) 123 456789
        <br />
        E-Mail: kontakt@ctrl-alt-deluxe.de
      </p>

      <h2>Registereintrag</h2>
      <p>
        Eintragung im Handelsregister.
        <br />
        Registergericht: Amtsgericht Musterstadt
        <br />
        Registernummer: HRB 12345
      </p>

      <h2>Umsatzsteuer-ID</h2>
      <p>
        Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:
        <br />
        DE123456789
      </p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        Max Mustermann
        <br />
        Musterstraße 1
        <br />
        12345 Musterstadt
      </p>

      <h2>EU-Streitschlichtung</h2>
      <p>
        Die Europäische Kommission stellt eine Plattform zur
        Online-Streitbeilegung (OS) bereit:{" "}
        <a
          href="https://ec.europa.eu/consumers/odr/"
          target="_blank"
          rel="noreferrer"
        >
          https://ec.europa.eu/consumers/odr/
        </a>
        .
        <br />
        Unsere E-Mail-Adresse finden Sie oben im Impressum.
      </p>

      <h2>Verbraucherstreitbeilegung</h2>
      <p>
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
        vor einer Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </main>
  );
}

export default Impressum;
