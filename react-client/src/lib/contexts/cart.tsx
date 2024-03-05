import { createContext, useContext, useEffect, useState } from "react"
import { Product } from "../types"
import { useMutation, useQuery } from "@tanstack/react-query"
import { SERVER_URL } from "@/utils/constants"
import { queryClient } from "@/main"

type ProductDetail = {
	id: number
	name: string
	price: number
	discountPercentage: number | null
	quantity: number
	variant: Record<string, string> | null
}

export type Cart = {
	id: number
	products: ProductDetail[]
}

type MutationData = {
	type: "add" | "remove"
	productId: number
	variant?: Record<string, string>
}

export type CartContext = {
	cart: Cart | null
	setCart: React.Dispatch<React.SetStateAction<Cart | null>>
	addItem: (product: Product, variant?: Product["variants"][0]) => void
	removeItem: (id: number, variant?: Product["variants"][0]) => void
}

export const CartContext = createContext<CartContext | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
	const [cart, setCart] = useState<Cart | null>(null)
	const { data, isSuccess } = useQuery({
		queryKey: ["cart"],
		queryFn: async () => {
			const res = await fetch(`${SERVER_URL}/cart`, {
				credentials: "include",
			})
			if (!res.ok) {
				throw new Error("Something went wrong")
			}

			return res.json() as Promise<Cart>
		},
	})

	const { mutate } = useMutation({
		mutationFn: async (data: MutationData) => {
			const res = await fetch(`${SERVER_URL}/cart`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(data),
			})
			if (!res.ok) {
				throw new Error("Something went wrong")
			}
			return res.json()
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["cart"] })
		},
	})

	const addItem: CartContext["addItem"] = (product, variant) => {
		if (!cart) return

		if (product.variants.length > 0) {
			if (!variant) return

			const index = cart.products.findIndex((p) => {
				return (
					p.id === product.id &&
					JSON.stringify(p.variant) ===
						JSON.stringify({
							...variant,
							price: undefined,
							discountPercentage: undefined,
						})
				)
			})

			if (index === -1) {
				const newProduct: ProductDetail = {
					id: product.id,
					name: product.name,
					price: variant.price,
					discountPercentage: variant.discountPercentage ?? null,
					quantity: 1,
					variant: {
						...variant,
						price: undefined!,
						discountPercentage: undefined!,
					},
				}

				setCart((p) => ({
					...p!,
					products: [...p!.products, newProduct],
				}))
			} else {
				setCart((p) => {
					return {
						...p!,
						products: p!.products.map((p, indx) => {
							if (indx === index) {
								return { ...p, quantity: p.quantity + 1 }
							}

							return p
						}),
					}
				})
			}

			mutate({
				type: "add",
				productId: product.id,
				variant: {
					...variant,
					price: undefined!,
					discountPercentage: undefined!,
				},
			})
		} else {
			const index = cart.products.findIndex((p) => p.id === product.id)
			if (index === -1) {
				const newProduct: ProductDetail = {
					id: product.id,
					name: product.name,
					price: product.price!,
					discountPercentage: product.discountPercentage,
					quantity: 1,
					variant: null,
				}
				setCart((p) => ({
					...p!,
					products: [...p!.products, newProduct],
				}))
			} else {
				setCart((p) => {
					return {
						...p!,
						products: p!.products.map((p, indx) => {
							if (indx === index) {
								return { ...p, quantity: p.quantity + 1 }
							}

							return p
						}),
					}
				})
			}

			mutate({
				type: "add",
				productId: product.id,
			})
		}
	}

	const removeItem: CartContext["removeItem"] = (id, variant) => {
		if (!cart) return

		const productCount = cart.products.reduce((acc, curr) => {
			return curr.id === id ? acc + 1 : acc
		}, 0)

		if (productCount > 1) {
			if (!variant) return

			const index = cart.products.findIndex((p) => {
				return (
					p.id === id &&
					JSON.stringify(p.variant) ===
						JSON.stringify({
							...variant,
							price: undefined,
							discountPercentage: undefined,
						})
				)
			})

			if (index === -1) return

			if (cart.products[index].quantity <= 1) {
				setCart((p) => ({
					...p!,
					products: p!.products.filter((prod) => prod.id !== id),
				}))
			} else {
				setCart((p) => ({
					...p!,
					products: p!.products.map((p, indx) => {
						if (indx === index) {
							return { ...p, quantity: p.quantity - 1 }
						}
						return p
					}),
				}))
			}

			mutate({
				type: "remove",
				productId: id,
				variant: {
					...variant,
					price: undefined!,
					discountPercentage: undefined!,
				},
			})
		} else {
			if (variant) return

			const index = cart.products.findIndex((p) => p.id === id)

			if (cart.products[index].quantity <= 1) {
				setCart((p) => ({
					...p!,
					products: p!.products.filter((prod) => prod.id !== id),
				}))
			} else {
				setCart((p) => ({
					...p!,
					products: p!.products.map((p, indx) => {
						if (indx === index) {
							return { ...p, quantity: p.quantity - 1 }
						}
						return p
					}),
				}))
			}

			mutate({
				type: "remove",
				productId: id,
			})
		}
	}

	useEffect(() => {
		if (isSuccess) {
			setCart({ ...data, products: data.products ?? [] })
		}
	}, [data, isSuccess])

	return (
		<CartContext.Provider value={{ cart, setCart, addItem, removeItem }}>
			{children}
		</CartContext.Provider>
	)
}

export function useCart() {
	const context = useContext(CartContext)
	if (!context) {
		throw new Error("useCart must be used within a CartProvider")
	}

	return context
}
