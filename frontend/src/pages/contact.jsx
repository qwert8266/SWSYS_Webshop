import { useState } from 'react';
import { NavLink } from "react-router-dom"
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
    const suggestions = produkte.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase())
    );

    const[reasonForContact, setReasonForContact] = useState("");
    const[sentForm, setSentFrom] = useState(false)
    const[triedToSend, setTriedToSend] = useState(false)

    const [formData, setFormData] = useState({
    description: "",
    email: "",
    phone: "",
    });

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData({
        ...formData,
        [name]: value
        });
    };

    async function handleSubmit(formData) {
    
        let hasErrors = false;

        if(reasonForContact === ""){
            hasErrors = true;
        }

        if(formData.description === ""){
            hasErrors = true;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(formData.email)){
            hasErrors = true;
        }
        if(formData.phone.length < 11){
            hasErrors = true;
        }

        if(hasErrors){
            setTriedToSend(true)
            setTimeout(() => {
                setTriedToSend(false);
            }, 5000)
            
        }else{
            setSentFrom(true)
        }

        
        
    }


    return(
        <div>
            <div>
                {!sentForm &&
                <div className='center_everything'>
                    <div className='basic-column2'>
                        <label className='blue_text_big'>Kontaktformular</label>
                        
                        
                        <div className='align_left'>
                            <label className='blue_text'>Anliegen</label>
                            <select className='combobox' value={reasonForContact} onChange={(e)=> setReasonForContact(e.target.value)}>
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
                                    <label> 6x19.99€</label>
                                    <label> 120.00€</label>
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
                            <textarea className="input_beschreibung" placeholder='Tragen Sie hier Ihr Anliegen ein...' name="description" onChange={handleChange}/>
                        </div>

                        <div className='contact_info'>
                            <label className='blue_text'>Kontakt</label>
                            <div className='align_left'>
                                <label className='blue_text'>Email</label>
                                <input className="inputs" placeholder='example@mail.com' name="email" onChange={handleChange}/>
                            </div>

                            <div className='align_left'>
                                <label className='blue_text'>Telefonnummer</label>
                                <input className="inputs" placeholder='0173 1234567' name="phone" onChange={handleChange}/>
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
                        {triedToSend &&
                        <div className="d-flex flex-column border rounded align-items-center justify-content-center " style={{height: "80px", width:"100%", alignItems: 'center', backgroundColor: 'red', color: 'white'}}>
                            <label className='fs-3'>Das hat leider nicht geklappt.</label>
                            <label className='fs-3'>Bitte überprüfen sie Ihre Eingaben.</label>
                        </div>
                        }
                        
                        <div>
                            <button className='blue_button' onClick={()=>{handleSubmit(formData)}}>Jetzt abschicken</button>
                        </div>
                    </div>
                </div>
            }
            </div>
            <div>
        {sentForm &&
            <div className='successful_order2 pb-5'>
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
                <div className='sentIt'>
                    <NavLink to="/home">
                        <button className='success_button' >Zurück zu unseren Produkten</button>
                    </NavLink>
                </div>
            </div>
        }
        </div>
      </div>
    )
}

export default Contact