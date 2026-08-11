export const product = {
  name: 'Summer Comfort Sandals',
  price: 1000,
  pairOfferPrice: 1600,
  currency: 'Rs',
  delivery: { valley: 0, outside: 100 },
  images: [
    '/products/sandal-1.jfif',
    '/products/sandal-2.jpg',
    '/products/sandal-3.jpg',
    '/products/sandal-4.webp'
  ]
};
export function unitPrice(quantity: number) { return quantity >= 2 ? product.pairOfferPrice / 2 : product.price; }
export function subtotal(quantity: number) { return quantity >= 2 ? (Math.floor(quantity / 2) * product.pairOfferPrice) + (quantity % 2) * product.price : product.price; }
export const money = (amount: number) => `Rs ${amount.toLocaleString('en-IN')}`;
