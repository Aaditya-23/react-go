import { PageLayout } from "@/lib/modules/layouts"
import { Link, createFileRoute } from "@tanstack/react-router"
import TrendingProducts from "@/lib/modules/trending-products"
import { Product } from "@/lib/types"
import { SERVER_URL } from "@/utils/constants"
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query"
import Github from "@/assets/github.svg"
import { useUser } from "@/hooks/userUser"

type RouteData = { products: Product[]; count: number }

const routeQueryOptions = queryOptions({
	queryKey: ["trending-products"],
	queryFn: async () => {
		const res = await fetch(`${SERVER_URL}/product/0-3`)
		if (!res.ok) throw new Error("Something went wrong")

		return res.json() as Promise<RouteData>
	},
	initialData: {
		products: [],
		count: 0,
	},
})

export const Route = createFileRoute("/")({
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData(routeQueryOptions),
	component: Home,
})

function Home() {
	const { data } = useSuspenseQuery(routeQueryOptions)
	const { hasSession } = useUser()

	return (
		<PageLayout className="flex flex-col gap-24 px-0">
			<div className="relative flex min-h-dvh">
				<div className="flex w-full items-center justify-center sm:w-1/2">
					<div className="flex flex-col gap-4">
						<p className="flex flex-col text-5xl uppercase tracking-wider sm:text-7xl">
							<span>your</span>
							<span>exclusive</span>
							<span>sitewide</span>
							<span>offer</span>
							<span>awaits</span>
						</p>
						{hasSession ? (
							<Link
								to="/products"
								className="w-max bg-primary p-2 font-medium uppercase tracking-wide text-white"
							>
								start shopping
							</Link>
						) : (
							<Link
								to="/auth"
								className="w-max bg-primary p-2 font-medium uppercase tracking-wide text-white"
							>
								signup now
							</Link>
						)}
					</div>
				</div>
				<img
					src="./hero.png"
					className="absolute right-0 -z-10 h-full w-full object-cover blur-sm sm:w-1/2"
				/>
			</div>

			<TrendingProducts data={data.products} />

			<Footer />
		</PageLayout>
	)
}

function Footer() {
	return (
		<footer className="items mt-24 flex flex-col items-center gap-2">
			<a href="#" className="hover:opacity-30">
				<img src={Github} className="w-5" />
			</a>

			<p className="text-sm font-medium text-slate-600">
				Made with{" "}
				<span className="font-semibold text-rose-600">React</span> and{" "}
				<span className="font-semibold text-rose-600">Go</span>
			</p>
		</footer>
	)
}
