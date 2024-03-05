import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"
import "./index.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/lib/ui/toaster"
import { CartProvider } from "./lib/contexts/cart"

export const queryClient = new QueryClient()
export const router = createRouter({
	routeTree,
	context: {
		queryClient,
	},
	defaultPreloadStaleTime: 0,
	defaultPreload: "intent",
})

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}

function App() {
	return (
		<>
			<RouterProvider router={router} />
			<Toaster />
		</>
	)
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<CartProvider>
				<App />
			</CartProvider>
		</QueryClientProvider>
	</React.StrictMode>
)
