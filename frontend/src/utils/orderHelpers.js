

export function getTotalItems(){
  //TODO
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