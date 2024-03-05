import { cn } from "@/utils/cn"
import { Navbar } from ".."

type PageLayoutProps = {
	className?: string
	children: React.ReactNode
}

export default function Index(props: PageLayoutProps) {
	const { children, className } = props

	return (
		<div className="space-y-5">
			<Navbar />
			<main className={cn("px-5 pb-5", className)}>{children}</main>
		</div>
	)
}
