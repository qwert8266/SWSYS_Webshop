import { useState, useEffect, useMemo } from 'react';
import { NavLink } from "react-router-dom"
import { contactApi } from "../api/contactApi";
import { useAuth } from "../context/authContext";
import { normalizeProduct, getProductImagePath, formatEuro } from '../utils/productHelpers';
import productApi from '../api/productApi';

import './contact.css';

function Contact(){
    const [addedProducts, setAddedProducts] = useState(new Map());
    const [currentAmount, setCurrentAmount] = useState(0);
    const [search, setSearch] = useState(""); 
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
    

    const [reasonForContact, setReasonForContact] = useState("");
    const [description, setDescription] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const[sentForm, setSentForm] = useState(false);
    const[referenceNumber, setReferenceNumber] = useState("");
    const[errorMessage, setErrorMessage] = useState("");
    const[isSubmitting, setIsSubmitting] = useState(false);
    const { user, accessToken, isAuthenticated } = useAuth();

    const accountName = useMemo(() => {
        if (!isAuthenticated || !user) {
            return "Gast";
        }

        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
        return fullName;
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (!user) { return; }

        setEmail(user.email || "");
        setPhone(user.phone || "");
    }, [user]);

    async function handleSubmit(event) {
        event.preventDefault();
        setErrorMessage("");
        setIsSubmitting(true);

        try {
            const response = await contactApi.submitContactRequest({
                reason: reasonForContact,
                description,
                name: accountName,
                email,
                phone,
            }, accessToken);

            setReferenceNumber(response.referenceNumber);
            setSentForm(true);
        } catch (error) {
            setErrorMessage(error.message || "Kontaktanfrage konnte nicht abgesendet werden.");
        } finally {
            setIsSubmitting(false);
        }
    }

    useEffect(() => {
        const query = search.trim();

        if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
        }

        let ignoreResult = false;

        const timeoutId = setTimeout(async () => {
        setIsSuggestionsLoading(true);

        try {
            const foundProducts = await productApi.searchProducts(query);

            if (!ignoreResult) {
            setSuggestions(foundProducts.map(normalizeProduct).slice(0, 5));
            setShowSuggestions(true);
            }
        } catch (error) {
            if (!ignoreResult) {
            setSuggestions([]);
            setShowSuggestions(false);
            }
        } finally {
            if (!ignoreResult) {
            setIsSuggestionsLoading(false);
            }
        }
        }, 300);

        return () => {
        ignoreResult = true;
        clearTimeout(timeoutId);
        };
    }, [search]);

    async function handleAddProduct() {
        const query = search.trim();

        if (!query) {
            return;
        }

        try {
            const foundProducts = await productApi.searchProducts(query);

            const product = foundProducts.find(
                p => p.name.toLowerCase() === query.toLowerCase()
            );

            if (!product) {
                return;
            }

            setAddedProducts(prev => {
                const map = new Map(prev);

                const oldAmount = map.get(product) ?? 0;
                map.set(product, oldAmount + currentAmount);

                return map;
            });

            setSearch("");
            setCurrentAmount(0);

        } catch (err) {
            console.error(err);
        }
    }

    function getSuccessHeadline() {
        if (reasonForContact === "Karriere") {
            return "Vielen Dank für Ihre Bewerbung!";
        }
        if (reasonForContact === "Großbestellung") {
            return "Vielen Dank für Ihre Bestellung!";
        }

        return "Vielen Dank für Ihr Feedback!";
    }

    function getSuccessText() {
        if (reasonForContact === "Karriere") {
            return "Ihre Anfrage ist eingegangen und wird bearbeitet.";
        }
        if (reasonForContact === "Großbestellung") {
            return "Ihre Anfrage ist eingegangen. Bei Rückfragen werden wir uns bei Ihnen melden.";
        }

        return "Ihre Kontaktanfrage ist eingegamgen und wird in kürze von einem Mitarbeiter bearbeitet";
    }

    return(
        <div>
            <div>
                {!sentForm &&
                    <div className='center_everything'>
                        <form className='basic-column2' onSubmit={handleSubmit}>
                            <label className='blue_text_big'>Kontaktformular</label>
                            
                            {errorMessage &&
                                <label className='blue_text' style={{ color: "#b91c1c" }}>
                                    {errorMessage}
                                </label>
                            }

                            <div className='align_left'>
                                <label className='blue_text'>Anliegen</label>
                                <select 
                                    className='combobox' 
                                    value={reasonForContact} 
                                    onChange={(e)=> setReasonForContact(e.target.value)}
                                    required
                                >
                                    <option>Bitte auswählen...</option>
                                    <option>Karriere</option>
                                    <option>Beschwerde</option>
                                    <option>Großbestellung</option>
                                    <option>Sonstiges</option>
                                </select>
                            </div>

                            {reasonForContact === "Großbestellung" &&
                            <div className='großbestellung_container'>
                                <label className='blue_text_long'>Ausgewählte Produkte</label>
                                <div className='added_product_container'>
                                    {
                                        Array.from(addedProducts.entries()).map(([product, quantity]) => (
                                        <div className="added_product" key={product.id}>
                                            <label className='added_product_name'>{quantity}x {product.name}</label>
                                            <label className='added_product_single'>{quantity} x {formatEuro(product.price/100)}</label>
                                            <label className='added_product_total'>{formatEuro(quantity * Number(product.price/100))}</label>
                                        </div>
                                    ))
                                    }
                                    
                                </div>
                                <div className='search_container'>
                                    <div className='search_wrapper'>
                                        <input  className="search_input" 
                                                type="text" 
                                                placeholder='Produkte suchen...'
                                                value={search}
                                                onChange={(e)=>setSearch(e.target.value)}/>
                                        {search && (
                                            <div className="suggestions">
                                                {suggestions.map(product => (
                                                    <div key={product.id} onClick={()=>setSearch(product.name)}>
                                                        {product.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <input className="search_input_count" type="text" placeholder='Anzahl' value={currentAmount} onChange={(e)=> setCurrentAmount(Number(e.target.value))}/>
                                    <button className='addButton' type='button' onClick={()=>(handleAddProduct())}>+</button>
                                </div>
                            </div>
                            }

                            <div className='beschreibung_div'>
                                <label className='blue_text'>Beschreibung</label>
                                <textarea 
                                    className="input_beschreibung" 
                                    placeholder='Tragen Sie hier Ihr Anliegen ein...'
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <div className='contact_info'>
                                <label className='blue_text'>Kontakt</label>

                                <div className='align_left'>
                                    <label className='blue_text'>Name</label>
                                    <input 
                                        className="inputs" 
                                        value={accountName}
                                        readOnly
                                    />
                                </div>
                                
                                <div className='align_left'>
                                    <label className='blue_text'>Email</label>
                                    <input 
                                        className="inputs" 
                                        placeholder='example@mail.com'
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className='align_left'>
                                    <label className='blue_text'>Telefonnummer</label>
                                    <input 
                                        className="inputs" 
                                        placeholder='0173 1234567'
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}    
                                    />
                                </div>
                            </div>

                            {reasonForContact === "Karriere" &&
                                <div className='career_info'>
                                    <div>
                                        <label className='blue_text'>Anschreiben</label>
                                        <input className="file-input" type="file" />
                                    </div>

                                    <div>
                                        <label className='blue_text'>Lebenslauf</label>
                                        <input className="file-input" type="file" />
                                    </div>
                                </div>
                            }
                            
                            <div>
                                <button className='blue_button' type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Wird gesendet..." : "Jetzt abschicken" }
                                </button>
                            </div>

                        </form>
                    </div>
                }

                {sentForm &&
                    <div className='successful_order2'>
                        {reasonForContact === "Karriere" &&
                        <div className='sentIt'>
                            <label className='success_label2'>Vielen Dank für Ihre Bewerbung!</label>
                            <label className='success_label_minor2'>Sie können schon bald mit einer Rückmeldung rechnen.</label>
                        </div>
                        }
                        {(reasonForContact === "Beschwerde" || reasonForContact === "Sonstiges" ) &&
                        <div className='sentIt'>
                            <label className='success_label2'>Vielen Dank für Ihr Feedback!</label>
                            <label className='success_label_minor2'>Wir werden uns bald bei dir melden.</label>
                        </div>
                        }
                        {reasonForContact === "Großbestellung" &&
                        <div className='sentIt'>
                            <label className='success_label2'>Vielen Dank für deine Großbestellung!</label>
                            <label className='success_label_minor2'>Bei Rückfragen werden wir uns bei dir melden.</label>
                        </div>
                        }
                        <NavLink to="/home">
                            <button className='success_button' >Zurück zu unseren Produkten</button>
                        </NavLink>
                    </div>
                }
            </div>
        </div>
    )
}

export default Contact