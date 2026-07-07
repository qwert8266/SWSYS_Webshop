import { useState, useEffect } from 'react';

import { useAuth } from "../../context/authContext";
import statisticsApi from "../../api/statisticsApi";



function Statistics(){

    const { user, accessToken, logout } = useAuth();

    const [statistics, setStatistics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");


    useEffect(() => {
        let ignore = false;

        async function loadStatistics() {
            setIsLoading(true);
            setLoadError("");

            try {
                const stats = await statisticsApi.getStatistics(accessToken);

                if (!ignore) {
                    setStatistics(stats);
                }
            } catch (error) {
                if (!ignore) {
                    setLoadError("Statistiken konnten nicht geladen werden.");
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        if (accessToken) {
            loadStatistics();
        }

        return () => {
            ignore = true;
        };
    }, [accessToken]);

    return(
    <div className='d-flex flex-column align-items-center'>
        <div className='d-flex flex-column align-items-center pt-3'>
            <label className='fs-1' style={{color: "#15406e"}}>Analyse-Dashboard</label>
            <label className='fs-3 pb-3'>Statistiken und andere Informationen</label>
        </div>
        <div className='d-flex flex-row gap-3 pb-3'>
            <div className="card shadow-sm border-0 " style={{ width: "400px" }}>
                <div className="card-body d-flex flex-column justify-content-center text-center">
                    <h6 className="text-uppercase mb-2 " style={{color: "#15406e"}}>
                        Gesamteinnahmen
                    </h6>

                    <h1 className="fw-bold text-success mb-0">
                        {statistics?.totalRevenue/100} €
                    </h1>

                    <small className="text-muted mt-2">
                        Umsatz aller Bestellungen
                    </small>
                </div>
            </div>

            <div className="card shadow-sm border-0" style={{ width: "400px" }}>
                <div className="card-body d-flex flex-column justify-content-center text-center">
                    <h6 className="text-uppercase mb-2 " style={{color: "#15406e"}}>
                        Bestellungen
                    </h6>

                    <h1 className="fw-bold text-success mb-0" >
                        {statistics?.totalOrders}
                    </h1>

                    <small className="text-muted mt-2">
                        Bestellungen aller Nutzer
                    </small>
                </div>
            </div>

            <div className="card shadow-sm border-0" style={{ width: "400px" }}>
                <div className="card-body d-flex flex-column justify-content-center text-center">
                    <h6 className="text-uppercase mb-2 " style={{color: "#15406e"}}>
                        Nutzerzahl
                    </h6>

                    <h1 className="fw-bold text-success mb-0">
                        {statistics?.registeredUsers}
                    </h1>

                    <small className="text-muted mt-2">
                        Nutzer der Plattform
                    </small>
                </div>
            </div>

        </div>

        <div className='d-flex flex-row gap-3 pb-3'>
            <div className="card shadow-sm border-0" style={{ width: "400px" }}>
                <div className="card-body d-flex flex-column justify-content-center text-center">
                    <h6 className="text-uppercase mb-2 " style={{color: "#15406e"}}>
                        Ø Bestellungswert
                    </h6>

                    <h1 className="fw-bold text-success mb-0">
                        {statistics?.averageOrderValue/100} €
                    </h1>

                    <small className="text-muted mt-2">
                        Durchschnittswert pro Bestellung
                    </small>
                </div>
            </div>

            <div className="card shadow-sm border-0" style={{ width: "400px" }}>
                <div className="card-body d-flex flex-column justify-content-center text-center">
                    <h6 className="text-uppercase mb-2 " style={{color: "#15406e"}}>
                        Verkaufte Produkte
                    </h6>

                    <h1 className="fw-bold text-success mb-0">
                        {statistics?.productsSold}
                    </h1>

                    <small className="text-muted mt-2">
                        Gesamtanzahl
                    </small>
                </div>
            </div>

            <div className="card shadow-sm border-0" style={{ width: "400px" }}>
                <div className="card-body d-flex flex-column justify-content-center text-center">
                    <h6 className="text-uppercase mb-2 " style={{color: "#15406e"}}>
                        Vorrat
                    </h6>

                    <h1 className="fw-bold text-success mb-0">
                        {statistics?.productsInStock}
                    </h1>

                    <small className="text-muted mt-2">
                        Gelagerte Produkte
                    </small>
                </div>
            </div>
        </div>

        <div className='d-flex flex-row gap-3 pb-5'>
            <div className="card shadow-sm border-0" style={{ width: "400px" }}>
                <div className="card-body d-flex flex-column justify-content-center text-center">
                    <h6 className="text-uppercase mb-2 " style={{color: "#15406e"}}>
                        Kleiner Vorrat
                    </h6>

                    <h1 className="fw-bold  mb-0" style={{color: "#c22929"}}>
                        {statistics?.lowStockProducts}
                    </h1>

                    <small className="text-muted mt-2">
                        Produkte mit geringen Lagerstand
                    </small>
                </div>
            </div>

            <div className="card shadow-sm border-0" style={{ width: "400px" }}>
                <div className="card-body d-flex flex-column justify-content-center text-center">
                    <h6 className="text-uppercase mb-2 " style={{color: "#15406e"}}>
                        Stornierungen
                    </h6>

                    <h1 className="fw-bold  mb-0" style={{color: "#c22929"}}>
                        {statistics?.canceledOrders}
                    </h1>

                    <small className="text-muted mt-2">
                        stornierte Bestellungen
                    </small>
                </div>
            </div>

            <div className="card shadow-sm border-0" style={{ width: "400px" }}>
                <div className="card-body d-flex flex-column justify-content-center text-center">
                    <h6 className="text-uppercase mb-2 " style={{color: "#15406e"}}>
                        Gesamteinnahmen
                    </h6>

                    <h1 className="fw-bold text-success mb-0">
                        500.000 €
                    </h1>

                    <small className="text-muted mt-2">
                        Umsatz aller Bestellungen
                    </small>
                </div>
            </div>
        </div>

    </div>
    )
}

export default Statistics