import { SERVER_URL } from "@/utils/constants"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/auth/magic-link/")({
	validateSearch: (params: Record<string, unknown>) => ({
		token: (params.token as string) || "",
	}),
	loaderDeps: ({ search }) => search,
	loader: ({ deps, context: { queryClient } }) => {
		const { token } = deps
		if (!token) return { isTokenVerified: false }

		return queryClient.ensureQueryData({
			queryKey: ["register-magic-token", token],
			queryFn: async () => {
				const res = await fetch(
					`${SERVER_URL}/user/verify-magic-token`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ token }),
					}
				)
				if (!res.ok) throw new Error("Something went wrong")

				return res.json() as Promise<{ isTokenVerified: boolean }>
			},
		})
	},
	pendingComponent: PendingComponent,
	component: Component,
})

function Component() {
	const { isTokenVerified } = Route.useLoaderData()

	if (isTokenVerified) {
		return <p>Authentication successful. You can now close this tab.</p>
	} else {
		return (
			<p>
				Authentication failed. Your token may have expired or is
				incorrect.
			</p>
		)
	}
}

function PendingComponent() {
	return <div className="animate-spin"></div>
}
