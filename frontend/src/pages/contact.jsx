import { useState, useEffect, useMemo } from 'react';
import { NavLink } from "react-router-dom"
import { contactApi } from "../api/contactApi";
import { useAuth } from "../context/authContext";
import './contact.css';

export const produkte = [
    { name: "Becks", id: "001", price: "14.99", rating: 3.8, image: "becks.png", category: "bier", quantity: 0},
    { name: "Corona", id: "002", price: "19.99", rating: 3.4, image: "corona.png", category: "bier"  },
    { name: "Desperados", id: "003", price: "34.99", rating: 4.5, image: "desperados.png", category: "bier" },
    { name: "Merlot", id: "004", price: "9.99", rating: 2.8, image: "merlot.png", category: "wein" },
    { name: "Riesling", id: "005", price: "12.99", rating: 3.6, image: "riesling.png", category: "wein" },
    { name: "Jägermeister", id: "006", price: "14.99", rating: 1.1, image: "jägermeister.png", category: "schnaps" },
    { name: "Havana", id: "007", price: "12.99", rating: 3.8, image: "havana.png", category: "schnaps" },
    { name: "Veterano", id: "008", price: "5.99", rating: 4.9, image: "veterano.png", category: "schnaps" },
];

function Contact(){
    const addedProducts = []
    const [search, setSearch] = useState(""); 

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

    const suggestions = produkte.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase())
    );

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
                                    <div className='added_product'>
                                        <label> 6x Becks</label>
                                        <label> 6x19.99E</label>
                                        <label> 120.00E</label>
                                    </div>
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
                                    <input className="search_input_count" type="text" placeholder='Anzahl'/>
                                    <button className='addButton'>+</button>
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