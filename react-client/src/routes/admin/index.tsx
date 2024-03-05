import { PageLayout } from "@/lib/modules/layouts"
import { Product } from "@/lib/types"
import { SERVER_URL } from "@/utils/constants"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table"
import Trash from "@/assets/trash.svg"
import { cn } from "@/utils/cn"
import { useMutation, useQuery } from "@tanstack/react-query"
import { queryClient } from "@/main"
import { Button } from "@/lib/ui/button"

type RouteData = {
	products: Product[]
	count: number
}
const columnHelper = createColumnHelper<Product>()

export const Route = createFileRoute("/admin/")({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			offset: Number(search.offset ?? 0),
			limit: Number(search.limit ?? 10),
		}
	},
	component: Admin,
})

function Admin() {
	const searchParams = Route.useSearch()
	const { data } = useQuery({
		queryKey: ["admin-products", searchParams],
		queryFn: async () => {
			const response = await fetch(
				`${SERVER_URL}/product/${searchParams.offset}-${searchParams.limit}`
			)
			if (!response.ok) throw new Error("Something went wrong!")

			return response.json() as Promise<RouteData>
		},
		initialData: {
			products: [],
			count: 0,
		},
	})
	const navigate = useNavigate({ from: Route.fullPath })

	function goToPreviousPage() {
		navigate({
			search: (prev) => ({
				...prev,
				offset: prev.offset - prev.limit,
			}),
		})
	}
	function goToNextPage() {
		navigate({
			search: (prev) => ({
				...prev,
				offset: prev.offset + prev.limit,
			}),
		})
	}

	return (
		<PageLayout className="flex flex-col gap-4">
			<Link
				to="/admin/new-product"
				className="self-end bg-primary p-2 text-sm font-medium capitalize text-white"
			>
				new product
			</Link>
			<ProductsTable data={data.products} />

			<div className="flex gap-4 self-end">
				<Button
					variant="secondary"
					size="sm"
					onClick={goToPreviousPage}
					disabled={searchParams.offset <= 0}
				>
					Prev
				</Button>
				<Button
					variant="secondary"
					size="sm"
					onClick={goToNextPage}
					disabled={
						searchParams.limit + searchParams.offset >= data.count
					}
				>
					Next
				</Button>
			</div>
		</PageLayout>
	)
}

function ProductsTable(props: { data: RouteData["products"] }) {
	const { data } = props

	const { mutate, isPending } = useMutation({
		mutationFn: async (productId: number) => {
			const res = await fetch(`${SERVER_URL}/product/delete`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ productId }),
			})
			if (!res.ok) {
				throw new Error("Something went wrong!")
			}

			return res.json()
		},
		onSuccess: () => {
			queryClient.invalidateQueries()
		},
	})

	const columns = [
		columnHelper.accessor("name", {
			id: "name",
			header: "Name",
		}),
		columnHelper.accessor("price", {
			id: "price",
			header: "Price",
		}),
		columnHelper.accessor("variants", {
			id: "has-variants",
			header: "Has Variants",
			cell: (row) => (
				<span>{row.getValue().length > 0 ? "yes" : "no"}</span>
			),
		}),
		columnHelper.display({
			id: "actions",
			header: "Actions",
			cell: ({ row: { original } }) => (
				<button
					type="button"
					disabled={isPending}
					onClick={() => mutate(original.id)}
				>
					<img src={Trash} className="w-4" />
				</button>
			),
		}),
	]

	const { getHeaderGroups, getRowModel } = useReactTable({
		columns,
		data,
		getCoreRowModel: getCoreRowModel(),
	})

	return (
		<table className="w-full border-separate border-spacing-0 rounded-md border text-sm">
			<thead className="font-semibold">
				{getHeaderGroups().map((headerGroup, i) => (
					<tr key={i}>
						{headerGroup.headers.map((header, i) => (
							<td
								className={cn(
									"border-b px-2 py-3",
									header.column.columnDef.id === "price" &&
										"text-center",
									header.column.columnDef.id ===
										"has-variants" && "text-center",
									header.column.columnDef.id === "actions" &&
										"text-center",
									data.length === 0 && "border-b-0"
								)}
								key={i}
							>
								{flexRender(
									header.column.columnDef.header,
									header.getContext()
								)}
							</td>
						))}
					</tr>
				))}
			</thead>
			<tbody>
				{getRowModel().rows.map((row, i) => (
					<tr
						className="transition-colors hover:bg-gray-100 [&:last-child_td]:border-b-0"
						key={i}
					>
						{row.getVisibleCells().map((cell, i) => (
							<td
								className={cn(
									"border-b px-2 py-3",
									cell.column.columnDef.id === "select-all" &&
										"w-[10%]",
									cell.column.columnDef.id === "name" &&
										"w-1/2",
									cell.column.columnDef.id === "price" &&
										"w-[15%] text-center",
									cell.column.columnDef.id ===
										"has-variants" &&
										"w-[15%] text-center capitalize",
									cell.column.columnDef.id === "actions" &&
										"w-[10%] text-center"
								)}
								key={i}
							>
								{flexRender(
									cell.column.columnDef.cell,
									cell.getContext()
								)}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	)
}
