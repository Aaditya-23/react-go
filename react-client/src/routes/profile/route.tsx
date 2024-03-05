import { useUser } from "@/hooks/userUser"
import { PageLayout } from "@/lib/modules/layouts"
import { Button } from "@/lib/ui/button"
import { Input } from "@/lib/ui/input"
import { SERVER_URL } from "@/utils/constants"
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"

type RouteData = {
	name: string | null
	email: string
}

const routeQueryOptions = queryOptions({
	queryKey: ["profile"],
	queryFn: async () => {
		const res = await fetch(`${SERVER_URL}/user/profile`, {
			credentials: "include",
		})
		if (!res.ok) {
			throw new Error("Something went wrong")
		}

		return res.json() as Promise<RouteData>
	},
})

export const Route = createFileRoute("/profile")({
	beforeLoad: () => {
		const auth = localStorage.getItem("auth")
		if (!auth) {
			throw redirect({ to: "/auth", replace: true })
		}
	},
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData(routeQueryOptions),
	component: () => (
		<PageLayout>
			<Component />
		</PageLayout>
	),
})

function Component() {
	const { data } = useSuspenseQuery(routeQueryOptions)
	const navigate = useNavigate()
	const { destroySession } = useUser()
	async function logout() {
		await fetch(`${SERVER_URL}/user/logout`, {
			credentials: "include",
			method: "POST",
		})

		destroySession()
		navigate({ to: "/auth" })
	}

	return (
		<div className="mx-auto flex w-1/2 flex-col gap-4">
			<p className="mb-5 text-3xl font-medium capitalize">
				Your personal info.
			</p>
			<Input
				value={data.name ?? ""}
				placeholder="Your full name"
				disabled
			/>
			<Input value={data.email} disabled />
			<Button disabled>Update</Button>
			<Button className="bg-red-500" onClick={logout}>
				Logout
			</Button>
		</div>
	)
}
