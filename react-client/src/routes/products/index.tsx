import { useUser } from "@/hooks/userUser"
import { useCart } from "@/lib/contexts/cart"
import { PageLayout } from "@/lib/modules/layouts"
import { Product } from "@/lib/types"
import { Button } from "@/lib/ui/button"
import { cn } from "@/utils/cn"
import { SERVER_URL } from "@/utils/constants"
import { formatPrice } from "@/utils/formaters"
import { randomImage } from "@/utils/product-images"
import {
	infiniteQueryOptions,
	useSuspenseInfiniteQuery,
} from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"

type RouteData = { products: Product[]; count: number }
type ProductProps = Product
type ProductPriceProps = {
	price: NonNullable<Product["price"]>
	discountPercentage: Product["discountPercentage"]
}

const routeQueryOptions = infiniteQueryOptions({
	queryKey: ["products"],
	queryFn: async ({ pageParam }) => {
		const res = await fetch(
			`${SERVER_URL}/product/${pageParam.offset}-${pageParam.limit}`
		)

		if (!res.ok) {
			throw new Error("Something went wrong!")
		}

		return res.json() as Promise<RouteData>
	},
	initialPageParam: { offset: 0, limit: 10 },
	getNextPageParam: (lastPage, _, lastPageParam) => {
		return lastPage.products.length === 0
			? undefined
			: { offset: lastPageParam.offset + 10, limit: 10 }
	},
})

export const Route = createFileRoute("/products/")({
	loader: async ({ context: { queryClient } }) => {
		return (
			queryClient.getQueryData(routeQueryOptions.queryKey) ??
			(await queryClient.fetchInfiniteQuery(routeQueryOptions))
		)
	},
	component: Component,
})

function Component() {
	const { data } = useSuspenseInfiniteQuery(routeQueryOptions)

	return (
		<PageLayout className="flex flex-wrap items-start justify-center gap-4 sm:justify-normal">
			{data.pages.map((page) =>
				page.products.map((product) => (
					<Product key={product.id} {...product} />
				))
			)}
		</PageLayout>
	)
}

function Product(props: ProductProps) {
	const { id, name, price, discountPercentage, variants } = props
	const { cart, addItem, removeItem } = useCart()
	const productQuantity =
		cart?.products?.find((p) => p.id === id)?.quantity ?? 0
	const navigate = useNavigate()
	const { hasSession } = useUser()

	return (
		<div
			onClick={() =>
				navigate({ to: `/products/$id`, params: { id: id.toString() } })
			}
			className="flex aspect-square w-72 flex-col transition-shadow hover:cursor-pointer"
		>
			<img
				src={randomImage()}
				className="h-1/2 w-full object-cover object-center"
				alt="product"
			/>
			<div className="flex flex-1 flex-col gap-2 border border-t-0 p-4">
				<span className="text-lg font-semibold capitalize">{name}</span>
				{price ? (
					<ProductPrice
						price={price}
						discountPercentage={discountPercentage}
					/>
				) : null}
				{variants.length > 0 ? (
					<Button variant="ghost" className="mt-auto capitalize">
						view
					</Button>
				) : productQuantity > 0 ? (
					<div className="mt-auto flex items-center gap-4">
						<Button
							size="sm"
							variant="ghost"
							onClick={(e) => {
								e.stopPropagation()
								addItem({ ...props })
							}}
						>
							<Plus />
						</Button>
						{productQuantity}
						<Button
							size="sm"
							variant="ghost"
							onClick={(e) => {
								e.stopPropagation()
								removeItem(id)
							}}
						>
							<Minus />
						</Button>
					</div>
				) : (
					<Button
						onClick={(e) => {
							e.stopPropagation()
							if (hasSession) {
								addItem({ ...props })
							} else {
								navigate({ to: "/auth" })
							}
						}}
						variant="ghost"
						className="mt-auto capitalize"
					>
						add to cart
					</Button>
				)}
			</div>
		</div>
	)
}

function ProductPrice(props: ProductPriceProps) {
	const { price, discountPercentage } = props
	const discountedPrice = discountPercentage
		? price - (price * discountPercentage) / 100
		: null

	return (
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
