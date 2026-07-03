import "./home.css";
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

function Home(){
    const categories = [
        {
            title: "Bier",
            image: "/img/Bier.png",
            text: "Hol dir bei uns deine Lieblingsbiere und spannende Spezialitäten, die du noch nie gesehen hast.",
            path: "/sortiment/Bier"
        },
        {
            title: "Wein & Sekt",
            image: "/img/Wein.png",
            text: "Entdecke ausgewählte Weine und Sekte für gemütliche Abende, Feiern oder besondere Anlässe.",
            path: "/sortiment/wein-sekt"
        },
        {
            title: "Spirituosen",
            image: "/img/Spirituosen.png",
            text: "Entdecke hochwertige Spirituosen für Cocktails, Partys oder besondere Momente.",
            path: "/sortiment/spirituosen"
        },
        {
            title: "Softdrinks",
            image: "/img/Softdrinks.png",
            text:  "Von Klassikern bis zu neuen Sorten findest du hier alles für die perfekte Erfrischung.",
            path: "/sortiment/softdrinks"
        },
        {
            title: "Wasser",
            image: "/img/Wasser.png",
            text: "Still, medium oder spritzig – finde genau das Wasser, das zu dir passt.",
            path: "/sortiment/wasser"
        },
        {
            title: "Kaffee & Tee",
            image: "/img/Kaffee.png",
            text: "Von aromatischem Kaffee bis zu wohltuendem Tee – entdecke deine Lieblingsmomente in der Tasse.",
            path: "/sortiment/kaffee&tee"
        }
    ]
    const slides = [
        {
            image: "/img/BierAngebote.png",
        },
        {
            image: "/img/Softdrinks_Wasser.png",
        },
        {
            image: "/img/Wein_Sekt.png",
        },
    ];

    const [slideIndex, setSlideIndex] = useState(0);

    useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((currentIndex) =>
        (currentIndex + 1) % slides.length
      );
    }, 10000);

    return () => clearInterval(interval);
    }, [slides.length]);

    function plusSlides(direction) {
        setSlideIndex((currentIndex) =>
        (currentIndex + direction + slides.length) % slides.length
        );
    }

    function currentSlide(index) {
        setSlideIndex(index);
    }


    return(
        <main>

        <div className="slideshow-container">
            {slides.map((slide, index) => (
                <div
                    key={index}
                    className={`mySlides slide-fade ${
                    index === slideIndex ? "active-slide" : ""
                     }`}
                >
        <div className="numbertext">
            {index + 1} / {slides.length}
        </div>

        <img
            src={slide.image}
            alt={slide.text}
            style={{ width: "100%" }}
        />

        <div className="text">{slide.text}</div>
        </div>
            ))}

        
        </div>

        <div style={{ textAlign: "center" }}>
            {slides.map((_, index) => (
                <span
                key={index}
                className={`dot ${
                    index === slideIndex ? "active-dot" : ""
                }`}
                onClick={() => currentSlide(index)}
                />
            ))}
        </div>
        <section className="py-5 text-center container">
            <div className="col-lg-6 col-md-8 mx-auto">
            <h1 className="fw-light">Getränkemarkt  <span className="gold">Schmidt + Söhne</span> </h1>
            </div>
        </section>
        <div className="album py-5 bg-body-tertiary">
            <h2 className="categoryHeader"> Unsere Getränkevielfalt </h2>
            <div className="container">
                <div className="category-grid">
                    {categories.map((category) => (
                            <NavLink
                                key={category.title}
                                className="hover-container"
                                to={category.path}
                            >
                                <img src={category.image} alt={category.title}/>
                                <div className="overlay">
                                    <div className="overlay-text">
                                        <h3>{category.title}</h3>
                                        <p>{category.text}</p>
                                    </div>
                                </div>
                            </NavLink>
                    ))}
                </div>
            </div>
        </div>
        </main>
);
}

export default Home;





