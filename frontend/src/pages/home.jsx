import React from "react";
import "./home.css";

function Home(){
    const categories = [
        {
            title: "Bier",
            image: "/img/Bier.png",
            text: "Hol dir bei uns deine Lieblingsbiere und spannende Spezialitäten, die du noch nie gesehen hast."
        },
        {
            title: "Wein & Sekt",
            image: "/img/Wein.png",
            text: "Entdecke ausgewählte Weine und Sekte für gemütliche Abende, Feiern oder besondere Anlässe."
        },
        {
            title: "Spirituosen",
            image: "/img/Spirituosen.png",
            text: "Entdecke hochwertige Spirituosen für Cocktails, Partys oder besondere Momente."
        },
        {
            title: "Softdrinks",
            image: "/img/Softdrinks.png",
            text:  "Von Klassikern bis zu neuen Sorten findest du hier alles für die perfekte Erfrischung."
        },
        {
            title: "Wasser",
            image: "/img/Wasser.png",
            text: "Still, medium oder spritzig – finde genau das Wasser, das zu dir passt."
        },
        {
            title: "Kaffee & Tee",
            image: "/img/Kaffee.png",
            text: "Von aromatischem Kaffee bis zu wohltuendem Tee – entdecke deine Lieblingsmomente in der Tasse."
        }
    ]


    return(
        <main>
        <section className="py-5 text-center container">
            <div className="col-lg-6 col-md-8 mx-auto">
            <h1 className="fw-light">Unsere Getränkevielfalt</h1>
            <p className="lead text-body-secondary">
              lorem ipsum
            </p>
            </div>
        </section>
        <div className="album py-5 bg-body-tertiary">
            <div className="container">
                <div className="category-grid">
                    {categories.map((category) => (
                            <div className="hover-container">
                                <img src={category.image} alt={category.title} />
                                <div className="overlay">
                                    <div className="overlay-text">
                                        <h3>{category.title}</h3>
                                        <p>{category.text}</p>
                                    </div>
                                </div>
                            </div>
                    ))}
                </div>
            </div>
        </div>
        </main>
);
}

export default Home;





