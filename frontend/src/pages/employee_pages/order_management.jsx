import { NavLink, useParams } from 'react-router-dom';
import '../categories.css';
import { useState, useEffect } from 'react';
import { useAuth } from "../../context/authContext";
import authApi from '../../api/authApi';

import orderApi from "../../api/orderApi";
import { formatEuro, totalItems } from '../../utils/orderHelpers';


// Übermittelt, Registriert, In Bearbeitung, Unterwegs, Zugestellt, Storniert, Rückerstattung veranlasst/bearbeitet
function OrderManagement(){

    const { accessToken } = useAuth(() => 
        localStorage.getItem("Schmidt-Soehne_AT"));

    const [openOrderID, setOpenOrderID] = useState("");

    const [allOrders, setAllOrders] = useState([]);
    const [users, setUsers] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    

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
                        usersFromDatabase.forEach(user => {
                            users[user.id] = user;
                        });
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
                    />

                    <button
                    className="btn btn-logoBlue navbar-search-btn"
                    type="submit"
                    aria-label='Suchen'
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
                    <div className='d-flex flex-row border border-3 rounded gap-4 ps-3 pe-4 pt-2 align-items-center'>
                        <div style={{width: "40px", height: "40px"}}></div>
                        <label className='fs-5 text-center' style={{width: "380px"}}>Order-ID</label>
                        <label className='fs-5 text-center' style={{width: "150px"}}>Kundenname</label>
                        <label className='fs-5 text-center' style={{width: "100px"}}>Artikelzahl</label>
                        <label className='fs-5 text-center' style={{width: "120px"}}>Gesamtkosten</label>
                        <label className='fs-5 text-center' style={{width: "100px"}}>Bestellt am</label>
                        <label className='fs-5 text-center' style={{width: "155px"}}>Status</label>
                        <label className='fs-5 text-center' style={{width: "230px"}}>Rückerstattungsstatus</label>
                    </div>
                    {allOrders.map((order) => (
                    <div className='d-flex flex-column'>
                        <div className='wrapper rounded' style={{border: (openOrderID === order.orderId) ? "3px solid black" : "3px grey",}}>
                        <div className='d-flex flex-row gap-4 ps-3 pe-4 pt-2 pb-2 align-items-center' key={order.orderId} style={{border: (openOrderID === order.orderId) ? "3px solid black" : "3px grey"}}>
                            <div className='' style={{width: "40px", height: "40px",borderCollapse: "collapse"}}>
                                {openOrderID === order.orderId &&
                                <button className='border rounded fs-5' style={{color: 'white', backgroundColor: "#ffffff"}} onClick={()=>setOpenOrderID("")}>
                                    <img style={{width: "40px", height: "40px"}} src="/img/dreieck_auf.png" alt="png" />
                                </button>
                                }
                                {openOrderID != order.orderId &&
                                <button className='border rounded fs-5' style={{color: 'white', backgroundColor: "#ffffff"}} onClick={()=>setOpenOrderID(order.orderId)}>
                                    <img style={{width: "40px", height: "40px"}} src="/img/dreieck_zu.png" alt="png" />
                                </button>
                                }
                            </div>
                            <label className='fs-5' style={{width: "380px"}}>{order.orderId}</label>
                            {/** TODO: Name zu jeder ID raussuchen. */}
                            <label className='fs-5' style={{width: "150px"}}>
                                {users[order.userId]?.firstName}
                                {" "}
                                {users[order.userId]?.lastname}
                            </label>
                            <label className='fs-5 text-center' style={{width: "100px"}}>{totalItems(order.items)}</label>
                            <label className='fs-5 text-center' style={{width: "120px"}}>{formatEuro(order.totalPrice)}</label>
                            <label className='fs-5' style={{width: "100px"}}>{new Date(order.createdAt).toLocaleString("de-DE")}</label>
                            <select className='rounded border fs-5 text-center' defaultValue={order.status} onChange={(e) => handleStatusChange(order.orderId, e.target.value)}>
                                <option>Übermittelt</option>
                                <option>Registiert</option>
                                <option>In Bearbeitung</option>
                                <option>Unterwegs</option>
                                <option>Zugestellt</option>
                                <option>Storniert</option>
                            </select>
                            <div style={{width: "230px", height:"30px"}}>
                                <label className='fs-5'>Rückerstattung beantragt</label>
                            </div>
                            
                        </div>
                            
                            {openOrderID === order.orderId &&
                            <div className='d-flex flex-row'>
                            <div className='d-flex flex-column' style={{border: "1px solid black", width: "700px",}}>
                                <div className='d-flex flex-row  gap-4 ps-3 pe-4 pt-2 pb-2 align-items-center' style={{border: "2px solid black" }}>
                                    <label className='fs-5 text-center' style={{width: "40px"}}></label>
                                    <label className='fs-5' style={{width: "100px"}}>Artikelname</label>
                                    <label className='fs-5 text-center' style={{width: "100px"}}>Anzahl</label>
                                    <label className='fs-5 text-center' style={{width: "100px"}}>Einzelpreis</label>
                                    <label className='fs-5 text-center' style={{width: "100px"}}>Gesamtpreis</label>
                                    <label className='fs-5 text-center' style={{width: "100px"}}></label>
                                </div> 
                                {order.items.map((item) => (
                                    <div className='d-flex flex-row gap-4 ps-3 pe-4 pt-2 pb-2 align-items-center'>
                                        <label className='fs-5 text-center' style={{width: "40px"}}></label>
                                        <label className='fs-5' style={{width: "100px"}}>{item.name}</label>
                                        <label className='fs-5 text-center' style={{width: "100px"}}>{item.quantity}x</label>
                                        <label className='fs-5 text-center' style={{width: "100px"}}>{formatEuro(item.unitPrice)}</label>
                                        <label className='fs-5 text-center' style={{width: "100px"}}>{formatEuro(item.lineTotalPrice)}</label>
                                        <label className='fs-5 text-center' style={{width: "100px"}}></label>
                                        
                                    </div> 
                                ))}
                            </div>
                            <div className='d-flex flex-row justify-content-end w-100'>
                                <button className='border rounded fs-5' style={{color: 'white', backgroundColor: "#15406e", width: "145px", height:"70px"}}>Rückerstattung genehmigen</button>
                                <button className='border rounded fs-5' style={{color: 'white', backgroundColor: "#932009", width: "145px", height:"70px"}}>Rückerstattung ablehnen</button>
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