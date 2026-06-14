export type OfferLineLike = {
  quantity: number;
  unitPrice: string;
};

export function calcOfferTotals(lineItems: OfferLineLike[], discountPercent?: number) {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * Number.parseFloat(item.unitPrice),
    0,
  );
  const discountAmount = discountPercent ? subtotal * (discountPercent / 100) : 0;
  return {
    subtotal: subtotal.toFixed(2),
    total: (subtotal - discountAmount).toFixed(2),
  };
}
