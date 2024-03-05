import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/auth")({
	component: () => (
		<div className="flex h-dvh items-center justify-center">
			<Outlet />
		</div>
	),
})
