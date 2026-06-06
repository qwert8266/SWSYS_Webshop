import { NavLink } from 'react-router-dom';
import './categories.css';

export const biere = [
  { name: "Becks", price: "14,99", rating: 3.8, img: "becks.png" },
  { name: "Corona", price: "19,99", rating: 3.4, img: "corona.png"  },
  { name: "Desperados", price: "34,99", rating: 4.5, img: "desperados.png" },
  { name: "Becks", price: "14,99", rating: 3.8, img: "becks.png" },
  { name: "Corona", price: "19,99", rating: 3.4, img: "corona.png"  },
  { name: "Desperados", price: "34,99", rating: 4.5, img: "desperados.png" },
  { name: "Becks", price: "14,99", rating: 3.8, img: "becks.png" },
  { name: "Corona", price: "19,99", rating: 3.4, img: "corona.png"  },
  { name: "Desperados", price: "34,99", rating: 4.5, img: "desperados.png" },
  { name: "Becks", price: "14,99", rating: 3.8, img: "becks.png" },
  { name: "Corona", price: "19,99", rating: 3.4, img: "corona.png"  },
  { name: "Desperados", price: "34,99", rating: 4.5, img: "desperados.png" },
];


export const weine = [
  { name: "Merlot", price: "9,99", rating: 2.8, img: "merlot.png" },
  { name: "Riesling", price: "12,99", rating: 3.6, img: "riesling.png" }
];

export const schnäpse = [
  { name: "Jägermeister", price: "14,99", rating: 1.0, img: "jägermeister.png" },
  { name: "Havana", price: "12,99", rating: 3.8, img: "havana.png" },
  { name: "Veterano", price: "5,99", rating: 5.0, img: "veterano.png" }
];

export const top_banners = [
    {png: "bier_top.png", sentence: "Bier geht doch immer!"},
    {png: "wein_top.png", sentence: "Wein in meinen Mund!"},
    {png: "schnaps_top2.png", sentence: "Ich fühl mich Osborne!"}
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
                <div className="product" key={product.name}>
                    
                    <NavLink className="product_link" to={"/"+product.name.toLowerCase()}>
                        <img className="product_png" src={`/img/product_images/${product.img}`} alt={product.name} />
                        <h3>{product.name}</h3>
                    </NavLink>
                    <p>{"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}</p>
                    <p>{product.price} €</p>

                </div>
            ))}
        </div>

        
        </div>
    )
}

export default Category