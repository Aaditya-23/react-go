import { useUser } from "@/hooks/userUser"
import { Link } from "@tanstack/react-router"
import Cart from "@/assets/cart.svg"
import Profile from "@/assets/profile.svg"
import { useCart } from "@/lib/contexts/cart"

export default function Index() {
	const user = useUser()
	const { cart } = useCart()

	return (
		<nav className="flex items-center justify-between border-b p-2 ">
			<Link to="/">
				<h1 className="font-semibold">React-Go</h1>
			</Link>

			<ul className="flex gap-3 text-sm font-medium capitalize">
				<li className="hover:underline">
					<Link to="/products">products</Link>
				</li>
				<li className="hover:underline">
					<Link to="/admin" search={{ offset: 0, limit: 10 }}>
						admin
					</Link>
				</li>
			</ul>
			{user.hasSession ? (
				<div className="flex items-center gap-3">
					<Link to="/cart" className="relative">
						<img src={Cart} className="h-5 w-5" />
						<span className="absolute right-0 top-0 z-10 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary px-1 text-[10px] text-white">
							{cart?.products?.length}
						</span>
					</Link>
					<Link to="/profile">
						<img src={Profile} className="h-5 w-5" />
					</Link>
				</div>
			) : (
				<Link
					to="/auth"
					className="border border-primary p-2 text-xs font-semibold text-primary hover:bg-primary hover:text-white"
				>
					Signup / Login
				</Link>
			)}
		</nav>
	)
}
