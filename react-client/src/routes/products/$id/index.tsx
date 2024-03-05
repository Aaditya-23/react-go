import { Product } from "@/lib/types"
import { SERVER_URL } from "@/utils/constants"
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import ArrowLeft from "@/assets/arrow-left.svg"
import { randomImage } from "@/utils/product-images"
import { cn } from "@/utils/cn"
import { formatPrice } from "@/utils/formaters"
import { useCart } from "@/lib/contexts/cart"
import { useState } from "react"
import { Button } from "@/lib/ui/button"
import { useUser } from "@/hooks/userUser"

type RouteData = { product: Product | null }
type PriceFieldProps = {
	price: number
	discountPercentage: number | null
}
type ProductActionProps = Product
type AddToCartProps = {
	selectedVariant: Record<string, string>
	product: Product
}

const routeQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["product", id],
		queryFn: async () => {
			const res = await fetch(`${SERVER_URL}/product/${id}`)
			if (!res.ok) {
				throw new Error("Something went wrong!")
			}

			return res.json() as Promise<RouteData>
		},
	})

function parseVariants(variants: Product["variants"]) {
	const parsedVariants: Record<string, string[]> = {}
	if (variants.length === 0) return parsedVariants

	const variantNames = Object.keys(variants[0]).filter(
		(key) => !["price", "discountPercentage"].includes(key)
	)

	variantNames.forEach((vName) => {
		const values = [
			...new Set(variants.map((variant) => variant[vName] as string)),
		]
		parsedVariants[vName] = values
	})

	return parsedVariants
}

function getProductInfo(
	price: Product["price"],
	discountPercentage: Product["discountPercentage"],
	variants: Product["variants"],
	selectedVariant: Record<string, string>
) {
	if (price !== null) {
		return {
			productPrice: price,
			productDiscountPercentage: discountPercentage,
		}
	}

	const variant = variants.filter((v) => {
		return (
			JSON.stringify({
				...v,
				price: undefined,
				discountPercentage: undefined,
			}) === JSON.stringify(selectedVariant)
		)
	})[0]

	return {
		productPrice: variant.price,
		productDiscountPercentage: variant.discountPercentage ?? null,
	}
}

export const Route = createFileRoute("/products/$id/")({
	loader: ({ params, context: { queryClient } }) =>
		queryClient.ensureQueryData(routeQueryOptions(params.id)),
	component: () => (
		<div className="flex min-h-dvh flex-col gap-12 p-5">
			<Link
				to="/products"
				className="flex w-max gap-3 border-b border-transparent text-sm hover:border-black"
			>
				<img src={ArrowLeft} className="w-3" /> <span>Products</span>
			</Link>
			<Component />
		</div>
	),
})

function Component() {
	const id = Route.useParams({ select: (params) => params.id })
	const {
		data: { product },
	} = useSuspenseQuery(routeQueryOptions(id))

	if (!product) {
		return (
			<p className="flex flex-1 items-center justify-center text-2xl font-medium">
				Not found 🥲
			</p>
		)
	} else {
		return (
			<div className="flex flex-col gap-5 sm:flex-row">
				<img
					src={randomImage()}
					className="max-h-[60vh] w-full object-cover sm:w-2/5 sm:min-w-[40%]"
				/>

				<div className="flex flex-col gap-5">
					<div className="flex flex-col gap-1">
						<span className="text-xl font-medium capitalize">
							name
						</span>
						<span className="capitalize text-gray-500">
							{product.name}
						</span>
					</div>

					<div className="flex flex-col gap-1">
						<span className="text-xl font-medium capitalize">
							description
						</span>
						<pre className="whitespace-pre-line break-all text-justify font-[inherit] text-gray-500">
							{product.description}{" "}
							mysuperlongmysuperlongmysuperlongmysuperlongmysuperlongmysuperlong
							;aldjls kdfj;las jflka sfjalks djflk jsdlkf jskldf
							jslkdfj lksfj slakf jkl;sdfj l;kj{" "}
						</pre>
					</div>

					<ProductActions {...product} />

					{/* {product.price ? (
						<PriceField
							price={product.price}
							discountPercentage={product.discountPercentage}
						/>
					) : null} */}
				</div>
			</div>
		)
	}
}

function ProductActions(props: ProductActionProps) {
	const { variants, price, discountPercentage } = props
	const [selectedVariant, setSelectedVariant] = useState<
		Record<string, string>
	>(() => {
		if (variants.length > 0) {
			return {
				...variants[0],
				price: undefined!,
				discountPercentage: undefined!,
			}
		}
		return {}
	})
	const parsedVariants = parseVariants(variants)

	const { productPrice, productDiscountPercentage } = getProductInfo(
		price,
		discountPercentage,
		variants,
		selectedVariant
	)

	function changeSelectedVariant(vName: string, value: string) {
		setSelectedVariant((p) => ({ ...p, [vName]: value }))
	}

	return (
		<>
			<PriceField
				discountPercentage={productDiscountPercentage}
				price={productPrice}
			/>

			{Object.keys(parsedVariants).map((vName) => (
				<div className="flex flex-col gap-1" key={vName}>
					<span className="text-xl font-medium capitalize">
						{vName}
					</span>
					<div className="flex gap-2">
						{parsedVariants[vName].map((value) => (
							<button
								type="button"
								className={cn(
									"cursor-pointer rounded p-1 text-xs capitalize hover:bg-primary/60 hover:text-white",
									selectedVariant[vName] === value &&
										"!bg-primary text-white"
								)}
								onClick={() =>
									changeSelectedVariant(vName, value)
								}
								key={value}
							>
								{value}
							</button>
						))}
					</div>
				</div>
			))}

			<AddToCart product={props} selectedVariant={selectedVariant} />
		</>
	)
}

function PriceField(props: PriceFieldProps) {
	const { price, discountPercentage } = props
	const discountedPrice = discountPercentage
		? price - (price * discountPercentage) / 100
		: null

	return (
		<div className="flex flex-col gap-1">
			<span className="text-xl font-medium capitalize">price</span>
			<div
				className={cn(
					"flex items-center gap-2",
					discountedPrice && "flex-row-reverse justify-end"
				)}
			>
				<span
					className={cn(
						"text-sm",
						discountedPrice && "text-xs text-gray-400 line-through"
					)}
				>
					{formatPrice(price)}
				</span>
				{discountedPrice ? (
					<span className="font-medium">
						{formatPrice(discountedPrice)}
					</span>
				) : null}
			</div>
		</div>
	)
}

function AddToCart(props: AddToCartProps) {
	const { selectedVariant, product } = props
	const { cart, addItem, removeItem } = useCart()
	const { hasSession } = useUser()
	const navigate = useNavigate()
	const hasVariants = product.variants.length > 0
	const inCart = (() => {
		if (!cart) return false
		if (hasVariants) {
			return cart?.products.findIndex(
				(p) =>
					p.id === product.id &&
					JSON.stringify(p.variant) ===
						JSON.stringify(selectedVariant)
			) === -1
				? false
				: true
		}

		return cart?.products.findIndex((p) => p.id === product.id) === -1
			? false
			: true
	})()
	const productQuantity = (() => {
		return (
			cart?.products
				.filter((p) => {
					if (p.id === product.id) {
						if (hasVariants) {
							return (
								JSON.stringify(p.variant) ===
								JSON.stringify(selectedVariant)
							)
						}
						return true
					}
					return false
				})
				.at(0)?.quantity ?? 0
		)
	})()
	function addToCart() {
		if (!hasSession) {
			navigate({ to: "/auth" })
		}
		if (hasVariants) {
			const variant = product.variants.filter(
				(v) =>
					JSON.stringify({
						...v,
						price: undefined,
						discountPercentage: undefined,
					}) === JSON.stringify(selectedVariant)
			)[0]

			addItem(product, variant)
		} else {
			addItem(product)
		}
	}

	if (inCart) {
		return (
			<div className="mt-auto flex items-center gap-4">
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						if (hasVariants) {
							const variant = product.variants.filter(
								(v) =>
									JSON.stringify({
										...v,
										price: undefined,
										discountPercentage: undefined,
									}) === JSON.stringify(selectedVariant)
							)[0]

							addItem(product, variant)
						} else {
							addItem(product)
						}
					}}
				>
					<Plus />
				</Button>
				{productQuantity}
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						if (hasVariants) {
							const variant = product.variants.filter(
								(v) =>
									JSON.stringify({
										...v,
										price: undefined,
										discountPercentage: undefined,
									}) === JSON.stringify(selectedVariant)
							)[0]

							removeItem(product.id, variant)
						} else {
							removeItem(product.id)
						}
					}}
				>
					<Minus />
				</Button>
			</div>
		)
	}

	return (
		<Button className="w-max" onClick={addToCart}>
			Add to cart
		</Button>
	)
}

function Minus() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={2}
			stroke="currentColor"
			className="h-4 w-4"
		>
			<path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
		</svg>
	)
}

function Plus() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={2}
			stroke="currentColor"
			className="h-4 w-4"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M12 4.5v15m7.5-7.5h-15"
			/>
		</svg>
	)
}
