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

    const[reasonForContact, setReasonForContact] = useState("")


    return(
        <div className='center_everything'>
            <div className='basic-column'>
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

                <div className='beschreibung_div'>
                    <label className='blue_text'>Beschreibung</label>
                    <textarea className="input_beschreibung" placeholder='Tragen Sie hier Ihr Anliegen ein...'/>
                </div>

                <div className='contact_info'>
                    <label className='blue_text'>Kontakt</label>
                    <div className='align_left'>
                        <label className='blue_text'>Email</label>
                        <input className="inputs" placeholder='example@mail.com'/>
                    </div>

                    <div className='align_left'>
                        <label className='blue_text'>Telefonnummer</label>
                        <input className="inputs" placeholder='0173 1234567'/>
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
                <div>
                    <button className='blue_button'>Jetzt abschicken</button>
                </div>
            </div>
        </div>
    )
}

export default Contact