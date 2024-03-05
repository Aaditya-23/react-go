import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/admin")({
	beforeLoad: () => {
		const auth = localStorage.getItem("auth")
		if (!auth) {
			throw redirect({ to: "/auth", replace: true })
		}
	},
	component: () => <Outlet />,
})
