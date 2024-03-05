import { useCart } from "@/lib/contexts/cart"
import { PageLayout } from "@/lib/modules/layouts"
import { Button } from "@/lib/ui/button"
import { useToast } from "@/lib/ui/use-toast"
import { queryClient } from "@/main"
import { SERVER_URL } from "@/utils/constants"
import { formatPrice } from "@/utils/formaters"
import { randomImage } from "@/utils/product-images"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/cart")({
	beforeLoad: () => {
		const auth = localStorage.getItem("auth")
		if (!auth) {
			throw redirect({ to: "/auth", replace: true })
		}
	},
	component: () => (
		<PageLayout className="mx-auto w-max max-w-full">
			<Component />
		</PageLayout>
	),
})

function Component() {
	const { cart } = useCart()
	const { mutate } = usePlaceOrder()
	const { toast } = useToast()
	const cartTotal =
		cart?.products.reduce((acc, curr) => {
			return (
				acc +
				(curr.price -
					(curr.price * (curr.discountPercentage ?? 0)) / 100) *
					curr.quantity
			)
		}, 0) ?? 0

	if (cart?.products.length === 0) {
		return (
			<p className="text-center font-semibold">
				Your cart is empty. Add products to place an order.
			</p>
		)
	}

	return (
		<div className="flex flex-col gap-12">
			{cart?.products.map((product) => (
				<div
					className="flex flex-col items-center gap-4 sm:flex-row"
					key={product.id}
				>
					<img
						src={randomImage()}
						className="aspect-square w-72 object-cover"
					/>
					<div className="flex flex-col">
						<span className="font-medium capitalize">
							{product.name}
						</span>

						<div className="my-2 flex flex-col gap-1">
							{Object.keys(product.variant || {}).map((vName) => (
								<div
									className="flex items-center gap-2 text-sm"
									key={vName}
								>
									<span className="block aspect-square w-2 rounded-full bg-primary" />
									<span className="capitalize">
										{vName} :{" "}
									</span>
									<span className="capitalize">
										{product.variant![vName]}
									</span>
								</div>
							))}
						</div>

						<div>
							<span className="text-gray-500">Qty: </span>
							<span className="font-medium">
								{product.quantity}
							</span>
						</div>

						<div>
							<span className="text-gray-500">Price: </span>
							<span className="font-medium">
								{formatPrice(
									(product.price -
										(product.price *
											(product.discountPercentage ?? 0)) /
											100) *
										product.quantity
								)}
							</span>
						</div>
					</div>
				</div>
			))}

			{cart && (
				<div className="flex flex-col gap-3">
					<div>
						<span className="font-medium capitalize">
							cart total:{" "}
						</span>
						<span>{cartTotal}</span>
					</div>
					<Button
						onClick={() => {
							mutate(undefined, {
								onSuccess: () => {
									toast({
										title: "Order Placed",
										description:
											"Your order has been placed",
									})
								},
								onError: () => {
									toast({
										title: "Error",
										description: "Something went wrong!",
										variant: "destructive",
									})
								},
							})
						}}
					>
						Place Order
					</Button>
				</div>
			)}
		</div>
	)
}

function usePlaceOrder() {
	const mutation = useMutation({
		mutationFn: async () => {
			const res = await fetch(`${SERVER_URL}/cart/order`, {
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				method: "POST",
			})
			if (!res.ok) {
				throw new Error("Something went wrong!")
			}

			return res.json()
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cart"] })
		},
	})

	return mutation
}
