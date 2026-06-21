

export function totalItems(orderItems){
  let itemCount = 0;
  for (let i = 0; i < orderItems.length; i++){
    itemCount += orderItems[i].quantity;
  }
  return((itemCount.toString()) + "x")
}

export function formatDateAndTime(){
  //TODO
}

export function formatEuro(valueInCents) {
  return (Number(valueInCents || 0) /100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}