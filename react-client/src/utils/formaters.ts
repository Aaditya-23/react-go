export function formatPrice(price: number) {
	const formater = Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2,
	})

	return formater.format(price)
}
