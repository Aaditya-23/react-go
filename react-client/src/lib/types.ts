export type NewProductForm = {
	name: string
	description: string
	price: string
	discountPercentage: string
	variantDetails: VariantDetails[]
}
export type Variant = { name: string; values: { value: string }[] }
export type VariantDetails = Record<string, string> & {
	price: string
	discountPercentage?: string
}

export type Product = {
	id: number
	name: string
	description: string
	price: number | null
	discountPercentage: number | null
	variants: (Record<string, string | number> & {
		price: number
		discountPercentage?: number
	})[]
}
