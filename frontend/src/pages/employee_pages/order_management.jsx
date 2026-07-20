import '../categories.css';
import { useState, useEffect } from 'react';
import { useAuth } from "../../context/authContext";
import authApi from '../../api/authApi';

import orderApi from "../../api/orderApi";
import { formatEuro, totalItems } from '../../utils/orderHelpers';


// Übermittelt, Registriert, in Bearbeitung, Unterwegs, Zugestellt, Storniert, Rückerstattung veranlasst/bearbeitet
function OrderManagement(){

    const { accessToken } = useAuth(() => 
        localStorage.getItem("Schmidt-Soehne_AT"));

    const [openOrderID, setOpenOrderID] = useState("");

    const { isAuthenticated, isAuthLoading, user } = useAuth();

    const [allOrders, setAllOrders] = useState([]);
    const [users, setUsers] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const [isSearchBarEmpty, setIsSearchBarEmpty] = useState(false);
    const [activeSearch, setActiveSearch] = useState("");
    

    const [selectedOrder, setSelectedOrder] = useState({
        orderId: null,
        status: "",
    });

    const handleStatusChange = async (orderID,status) => {
        const updatedOrder = {
            orderId: orderID,
            status: status
        }
        setSelectedOrder(updatedOrder);
        await orderApi.updateOrder(updatedOrder, accessToken);
    }

    function handleSearch() {
        if(activeSearch === ""){
            setIsSearchBarEmpty(true);
        }else{
            setIsSearchBarEmpty(false)
        }
    }

    useEffect(() => {
            let ignoreResult = false;
    
            async function loadOrder() {
                setIsLoading(true);
                setLoadError("");
                setAllOrders([]);
    
                try {
                    const ordersFromDatabase = await orderApi.getAllOrders(accessToken); 
                    
                    if (!ignoreResult) {
                        setAllOrders(ordersFromDatabase)
                    }
                } catch (error) {
                    if (!ignoreResult) {
                        setLoadError("Produkte konnten nicht aus der Datenbank geladen werden.");
                    }
                } finally {
                    if (!ignoreResult) {
                        setIsLoading(false);
                    }
                }
                
            }
            loadOrder();

            async function loadUsers(){
                setIsLoading(true);
                setLoadError("");
                try{
                    const usersFromDatabase = await authApi.getUsers(accessToken);
                    if (!ignoreResult) {
                        const usersMap = {};
                        usersFromDatabase.forEach(user => {
                            usersMap[user.id] = user;
                        });
                        setUsers(usersMap);
                    }
                }catch(error){
                    setLoadError("Nutzer konnten nicht aus der Datenbank geladen werden.");
                }finally {
                    if (!ignoreResult) {
                        setIsLoading(false);
                    }
                }
            }
            loadUsers();
    
            return () => {
                ignoreResult = true;
            };
        }, [accessToken]);


    return(
        <div className='d-flex flex-column align-items-center gap-5'>
            

            <div className='d-flex flex-column align-items-center'>
                <label className='fs-1'>Bestellungsverwaltung</label>
                <label className='fs-3'>Statusänderungen und Rückerstattungen</label>
            </div>

            {/* Suchleiste */}
            <div className="navbar-search-shadow">
                <form
                    className="navbar-search"
                    role="search"
                >
                    <input
                    className="navbar-search-input form-control"
                    type="search"
                    placeholder="Produkt, Artikelnummer, Hersteller, ..."
                    aria-label='Suchleiste'
                    value={activeSearch}
                    onChange={(e)=>setActiveSearch(e.target.value)}
                    />

                    <button
                    className="btn btn-logoBlue navbar-search-btn"
                    type="submit"
                    aria-label='Suchen'
                    onClick={()=>{setOpenOrderID("");handleSearch()}}
                    >
                    <img
                        className="navbar-search-icon"
                        src="/img/search-icon.svg"
                        alt="suchen"
                    />
                    </button>
                </form>
            </div>

            <div className='pb-5'>
                
                <div className='d-flex flex-column border rounded align-items-center w-auto '>
                    <div className='d-flex flex-row gap-4 align-items-center px-3 py-3 fw-semibold border-bottom bg-light'>
                        <div style={{width: "40px", height: "40px"}}></div>
                        <label className='fs-5 text-center' style={{width: "380px"}}>Order-ID</label>
                        <label className='fs-5 text-center' style={{width: "150px"}}>Kundenname</label>
                        <label className='fs-5 text-center' style={{width: "100px"}}>Artikelzahl</label>
                        <label className='fs-5 text-center' style={{width: "120px"}}>Gesamtkosten</label>
                        <label className='fs-5 text-center' style={{width: "100px"}}>Bestellt am</label>
                        <label className='fs-5 text-center' style={{width: "230px"}}>Status</label>
                    </div>
                    {allOrders.filter(order =>
                                        isSearchBarEmpty ||
                                        order.orderId.includes(activeSearch) ||
                                        users[order.userId]?.firstName?.toLowerCase().includes(activeSearch.toLowerCase()) ||
                                        users[order.userId]?.lastName?.toLowerCase().includes(activeSearch.toLowerCase()) ||
                                        order.createdAt.includes(activeSearch)
                                    ).map((order) => (
                    
                    <div className='d-flex flex-column' key={order.orderId}>
                        <div className={`rounded-3 bg-white shadow-sm mb-3 overflow-hidden ${openOrderID === order.orderId ? "shadow" : ""}`}>
                        <div className='d-flex flex-row gap-4 align-items-center px-3 py-3'  >
                            <div className='' style={{width: "40px", height: "40px",borderCollapse: "collapse"}}>
                                {openOrderID === order.orderId &&
                                <button className='border rounded fs-5' style={{color: 'white', backgroundColor: "#ffffff"}} onClick={()=>setOpenOrderID("")}>
                                    <img style={{width: "40px", height: "40px"}} src="/img/dreieck_auf.png" alt="png" />
                                </button>
                                }
                                {openOrderID !== order.orderId &&
                                <button className='border rounded fs-5' style={{color: 'white', backgroundColor: "#ffffff"}} onClick={()=>setOpenOrderID(order.orderId)}>
                                    <img style={{width: "40px", height: "40px"}} src="/img/dreieck_zu.png" alt="png" />
                                </button>
                                }
                            </div>
                            <label className='fs-5' style={{width: "380px"}}>{order.orderId}</label>
                        
                            <label className='fs-5' style={{width: "150px"}}>
                                {users[order.userId]?.firstName}
                                {" "}
                                {users[order.userId]?.lastName}
                            </label>
                            <label className='fs-5 text-center' style={{width: "100px"}}>{totalItems(order.items)}</label>
                            <label className='fs-5 text-center' style={{width: "120px"}}>{formatEuro(order.totalPrice)}</label>
                            <label className='fs-5' style={{width: "100px"}}>{new Date(order.createdAt).toLocaleString("de-DE")}</label>
                            <div style={{ width: "230px" }}>
                                <select className='form-select fs-5 text-center' value={order.status} defaultValue={order.status} onChange={(e) => handleStatusChange(order.orderId, e.target.value)}>
                                    <option>Übermittelt</option>
                                    <option>Registiert</option>
                                    <option>In Bearbeitung</option>
                                    <option>Unterwegs</option>
                                    <option>Zugestellt</option>
                                    <option>Storniert</option>
                                </select>
                            </div>
                        </div>
                            
                            {openOrderID === order.orderId &&
                                <div className="border-top bg-light">

                                    <div className="row g-0">

                                        {/* Artikelliste */}
                                        <div className="col-lg-8 border-end">

                                            <div className="d-flex align-items-center px-4 py-3 bg-white border-bottom fw-bold">
                                                <div className="flex-grow-1">Artikelname</div>
                                                <div style={{width: "90px"}} className="text-center">Anzahl</div>
                                                <div style={{width: "120px"}} className="text-center">Einzelpreis</div>
                                                <div style={{width: "120px"}} className="text-center">Gesamtpreis</div>
                                            </div>

                                            {order.items.map((item) => (
                                                <div
                                                    key={item.productId}
                                                    className="d-flex align-items-center px-4 py-3 bg-white border-bottom"
                                                >
                                                    <div className="flex-grow-1 fs-5">
                                                        {item.name}
                                                    </div>

                                                    <div style={{width: "90px"}} className="text-center fs-5">
                                                        {item.quantity}x
                                                    </div>

                                                    <div style={{width: "120px"}} className="text-center fs-5">
                                                        {formatEuro(item.unitPrice)}
                                                    </div>

                                                    <div style={{width: "120px"}} className="text-center fs-5 fw-semibold">
                                                        {formatEuro(item.lineTotalPrice)}
                                                    </div>
                                                </div>
                                            ))}

                                        </div>

                                        {/* Aktionen */}
                                        <div className="col-lg-4 d-flex flex-column justify-content-center align-items-center gap-3 p-4 bg-white">

                                            <button
                                                className="btn text-white fw-semibold"
                                                style={{
                                                    backgroundColor: "#15406e",
                                                    width: "240px",
                                                    height: "52px"
                                                }}
                                            >
                                                Rückerstattung genehmigen
                                            </button>

                                            <button
                                                className="btn text-white fw-semibold"
                                                style={{
                                                    backgroundColor: "#932009",
                                                    width: "240px",
                                                    height: "52px"
                                                }}
                                            >
                                                Rückerstattung ablehnen
                                            </button>

                                        </div>

                                    </div>

                                </div>
                                }
                            
                        
                    </div>
                    </div>
                    ))}
                </div>
                
            </div>
        </div>
    )
}

export default OrderManagement