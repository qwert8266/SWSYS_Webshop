import { NavLink } from 'react-router-dom';
import './categories.css';

export const biere = [
  { name: "Becks", preis: "14,99", img: "becks.png" },
  { name: "Corona", preis: "19,99", img: "corona.png"  },
  { name: "Desperados", preis: "34,99", img: "desperados.png" },
];


export const weine = [
  { name: "Merlot", preis: "9,99", img: "merlot.png" },
  { name: "Riesling", preis: "12,99", img: "riesling.png" }
];

export const schnäpse = [
  { name: "Jägermeister", preis: "14,99", img: "jägermeister.png" },
  { name: "Havana", preis: "12,99", img: "havana.png" },
  { name: "Veterano", preis: "5,99", img: "veterano.png" }
];

export const top_banners = [
    {png: "bier_top.png", sentence: "Bier geht doch immer!"},
    {png: "wein_top.png", sentence: "Wein in meinen Mund!"},
    {png: "schnaps_top.png", sentence: "Ich fühl mich Osborne!"}
]

function Category({ products, banner }){

    return(
        <div className='category-page'>
        <div>
            <div>
                <img className='picture_top' src={`/img/product_images/${banner.png}`} alt={banner.png}></img>
            </div>
            <div className='sentence_top'>
                {banner.sentence}
            </div>
            <div className='sentence_below_top'>
                Entdecken Sie neue Sorten oder genießen Sie ihre Favoriten.
            </div>
        </div>

        <div className="product_row">
            {products.map((product) => (
                <div className="produkt" key={product.name}>
                    
                    <NavLink className="product_link" to={"/"+product.name.toLowerCase()}>
                        <img className="product_png" src={`/img/product_images/${product.img}`} alt={product.name} />
                        <h3>{product.name}</h3>
                    </NavLink>
                    
                    <p>{product.preis} €</p>
                </div>
            ))}
        </div>
        </div>
    )
}

export default Category