import React from "react";
import "./home.css";

function Home(){


    return(
        <main>
        <section className="py-5 text-center container">
            <div className="col-lg-6 col-md-8 mx-auto">
            <h1 className="fw-light">Album example</h1>
            <p className="lead text-body-secondary">
              Something short and leading about the collection below—its
              contents, the creator, etc. Make it short and sweet, but not too
              short so folks don't simply skip over it entirely.
            </p>
            </div>
        </section>
        <div className="album py-5 bg-body-tertiary">
            <div className="container">
                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                    <div className="col">
                        <div className="hover-container">
                            <img src="/img/Bier.jfif"/>
                            <div className="overlay">
                                <div className="overlay-text">
                                    <h3>Bier</h3>
                                    <p>
                                        Hol dir bei uns deine Lieblingsbiere und spannende Spezialitäten, die du noch nie gesehen hast.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </main>
);
}

export default Home;





