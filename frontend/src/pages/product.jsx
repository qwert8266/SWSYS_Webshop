import { NavLink, useParams } from 'react-router-dom';
import './product.css';

export const produkte = [
  { name: "Becks", price: "14,99", rating: 3.8, img: "becks.png", category: "bier"},
  { name: "Corona", price: "19,99", rating: 3.4, img: "corona.png", category: "bier"  },
  { name: "Desperados", price: "34,99", rating: 4.5, img: "desperados.png", category: "bier" },
  { name: "Merlot", price: "9,99", rating: 2.8, img: "merlot.png", category: "wein" },
  { name: "Riesling", price: "12,99", rating: 3.6, img: "riesling.png", category: "wein" },
  { name: "Jägermeister", price: "14,99", rating: 1.0, img: "jägermeister.png", category: "schnaps" },
  { name: "Havana", price: "12,99", rating: 3.8, img: "havana.png", category: "schnaps" },
  { name: "Veterano", price: "5,99", rating: 5.0, img: "veterano.png", category: "schnaps" },

];

function Product({}){
    const { category, productName } = useParams();

    const product = produkte.find(
        p =>
            p.category === category &&
        p.name.toLowerCase() === productName
    );

    return(
        <div className='product-page'>
            <div >
                <img className='product-picture' src={`/img/product_images/${product.img}` }alt={product.name}></img>
            </div>

            <div className='product-information'> 
                <div className='product-name'>
                    {product.name}
                </div>
                <div className='other-information'>
                    <p>Info 1: ...</p>
                    <p>Info 2: ...</p>
                    <p>Info 3: ...</p>
                    <p>{"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}{"("+product.rating+")"}</p>
                    <p>{product.price}€</p>
                </div>
                <div className='cart-input'>
                    <input type="number" min="1" defaultValue="1" />
                    <button className='cart-button'>
                        <img className="cart-at-product" src={`/img/cart-icon_white.png`} alt="+" />
                    </button>
                </div>
            </div>

            
        </div>
    )
}

export default Product