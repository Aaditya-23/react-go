import { Product } from "@/lib/types"
import { randomImage } from "@/utils/product-images"
import { Link } from "@tanstack/react-router"

type TrendingProductsProps = {
	data: Product[]
}

export default function Index(props: TrendingProductsProps) {
	const { data } = props

	return (
		<div className="flex flex-col gap-12">
			<p className="text-center font-medium capitalize">
				trending products
			</p>

			<div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
				{data.map((product, i) => (
					<TrendingProduct key={i} product={product} />
				))}
			</div>
		</div>
	)
}

function TrendingProduct(props: { product: Product }) {
	const { product } = props

	return (
		<Link
			to="/products/$id"
			params={{ id: product.id.toString() }}
			className="group relative flex h-96 w-72 flex-col items-center justify-center overflow-hidden"
		>
			<img
				src={randomImage()}
				className="absolute inset-0 -z-10 h-full w-full object-cover transition-all group-hover:scale-110 group-hover:blur-lg"
			/>
			<span className="p-2 capitalize text-white underline opacity-0 group-hover:opacity-100">
				{product.name}
			</span>
		</Link>
	)
}
