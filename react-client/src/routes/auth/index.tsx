import { createFileRoute, useNavigate } from "@tanstack/react-router"
import Github from "@/assets/github.svg"
import ArrowRight from "@/assets/arrow-right.svg"
import ArrowLeft from "@/assets/arrow-left.svg"
import { useToast } from "@/lib/ui/use-toast"
import { useState } from "react"
import { Input } from "@/lib/ui/input"
import { Button } from "@/lib/ui/button"
import { useForm } from "react-hook-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { SERVER_URL } from "@/utils/constants"
import { cn } from "@/utils/cn"
import { useUser } from "@/hooks/userUser"

type Auth = { hasStarted: boolean; step: null | 1 | 2 }
type Form = { email: string }
type MutationResponse = { error: string } | { tokenId: number }

export const Route = createFileRoute("/auth/")({
	component: Component,
})

function Component() {
	const { error, success } = Route.useSearch({
		select: (params) => {
			const validatedParams = { error: "", success: "" }
			if ("error" in params) {
				validatedParams.error = params.error as string
			} else if ("success" in params) {
				validatedParams.success = params.success as string
			}

			return validatedParams
		},
	})
	const navigate = useNavigate()
	const { toast } = useToast()
	const {
		auth,
		handleSubmit,
		register,
		email,
		error: authError,
	} = useMagicLink()
	const user = useUser()

	if (error) {
		toast({ title: error, variant: "destructive" })
		navigate({ search: {}, to: "/auth", replace: true })
	} else if (success) {
		toast({ title: success })
		navigate({ search: {}, to: "/", replace: true })
		user.setSession()
	}

	if (auth.hasStarted) {
		if (auth.step === 1) {
			return (
				<form onSubmit={handleSubmit} className="flex flex-col gap-3">
					<div className="flex flex-col gap-1">
						<Input
							type="email"
							placeholder="Email address"
							className={cn("w-72", {
								"!ring-red-500": authError,
							})}
							{...register("email", { required: true })}
						/>
						<span className="text-xs font-medium capitalize text-red-500">
							{authError}
						</span>
					</div>

					<Button type="submit">Continue</Button>
					<button
						type="button"
						onClick={auth.cancel}
						className="mt-1 flex items-center justify-center gap-3 px-7 py-3 font-semibold capitalize text-primary hover:bg-gray-50"
					>
						<img src={ArrowLeft} className="w-5" />
						<span>other options</span>
					</button>
				</form>
			)
		} else {
			return (
				<p className="text-center">
					Keep this window open and in a new tab open the link we just
					sent to{" "}
					<span className="font-medium text-primary">{email}</span>.
				</p>
			)
		}
	} else {
		return (
			<div className="flex flex-col gap-14">
				<p className="text-center text-3xl font-medium capitalize leading-tight">
					create your
					<br />
					<span className="font-bold uppercase text-primary">
						reactgo
					</span>{" "}
					account
				</p>

				<div className="flex flex-col gap-3">
					<button
						className="flex items-center justify-center gap-3 border px-7 py-3 capitalize hover:bg-gray-50"
						onClick={() => {
							window.location.href =
								"https://github.com/login/oauth/authorize?client_id=Iv1.f2c8810c117fd3d0"
						}}
					>
						<img src={Github} className="w-5" />
						<span>continue with github</span>
					</button>

					<button
						onClick={auth.start}
						className="mt-5 flex items-center justify-center gap-3 px-7 py-3 font-semibold capitalize text-primary hover:bg-gray-50"
					>
						<span>continue with email</span>
						<img src={ArrowRight} className="w-5" />
					</button>
				</div>
			</div>
		)
	}
}

function useMagicLink() {
	const [auth, setAuth] = useState<Auth>({ hasStarted: false, step: null })
	const {
		register,
		handleSubmit,
		watch,
		reset: resetForm,
	} = useForm<Form>({
		defaultValues: { email: "" },
	})
	const navigate = useNavigate()

	const {
		mutate,
		data,
		reset: resetMutationState,
	} = useMutation({
		mutationFn: async (data: Form) => {
			const res = await fetch(`${SERVER_URL}/user/auth-with-email`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			})
			if (res.status >= 500) {
				throw new Error("Something went wrong")
			}

			return res.json() as Promise<MutationResponse>
		},
		onSuccess: (data) => {
			if ("tokenId" in data) {
				setAuth((p) => ({ ...p, step: 2 }))
			}
		},
	})

	const { isSuccess: isTokenRegistered } = useQuery({
		queryKey: ["check-magic-token", data] as const,
		queryFn: async ({ queryKey }) => {
			const data = queryKey[1]
			const tokenId = data && "tokenId" in data ? data.tokenId : null
			if (!tokenId) throw new Error("Token not found")

			const res = await fetch(
				`${SERVER_URL}/user/check-registered-magic-token`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ tokenId }),
				}
			)

			if (!res.ok) {
				throw new Error("Something went wrong")
			}

			return res.json()
		},
		enabled: data && "tokenId" in data ? true : false,
		retry: 170,
		retryDelay: (attempt) => {
			if (attempt <= 80) {
				return 1500
			} else {
				return 2000
			}
		},
	})

	if (isTokenRegistered) {
		navigate({ to: "/auth", search: { success: "auth successful" } })
	}

	const email = watch("email")

	function startAuth() {
		setAuth({ hasStarted: true, step: 1 })
	}
	function cancelAuth() {
		setAuth({ hasStarted: false, step: null })
		resetForm()
		resetMutationState()
	}
	const onSubmit = handleSubmit((data) => {
		mutate(data)
	})

	return {
		auth: { ...auth, start: startAuth, cancel: cancelAuth },
		register,
		email,
		error: data && "error" in data ? data.error : null,
		handleSubmit: onSubmit,
	}
}
