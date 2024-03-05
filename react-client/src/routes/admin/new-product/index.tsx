import { Link, createFileRoute } from "@tanstack/react-router"
import { Button } from "@/lib/ui/button"
import { Input } from "@/lib/ui/input"
import ArrowLeft from "@/assets/arrow-left.svg"
import Info from "@/assets/info.svg"
import { Label } from "@/lib/ui/label"
import { PageLayout } from "@/lib/modules/layouts"
import { TextArea } from "@/lib/ui/text-area"
import { UseFormRegister } from "react-hook-form"
import { cn } from "@/utils/cn"
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table"
import { useProductForm } from "./-useProductForm"
import { NewProductForm, VariantDetails } from "@/lib/types"
import { VariantInput } from "./-components/variant-input"
import { useMemo } from "react"

export const Route = createFileRoute("/admin/new-product/")({
	component: NewProduct,
})

function getDiscountedPrice(price: string, discountPercentage: string) {
	const priceNumber = Number(price)
	const discountPercentageNumber = Number(discountPercentage)

	return priceNumber - (priceNumber * discountPercentageNumber) / 100
}

function NewProduct() {
	const {
		register,
		watch,
		errors,
		handleSubmit,
		variants,
		addVariant,
		removeVariant,
		updateVariant,
		validateVariantName,
		isMutationPending,
	} = useProductForm()
	const variantDetails = watch("variantDetails")
	const price = watch("price")
	const discountPercentage = watch("discountPercentage")
	const discountedPrice = getDiscountedPrice(price, discountPercentage)
	function validatePrice(price: string) {
		return variantDetails.length === 0
			? price === ""
				? "price is required if product has no variants"
				: true
			: true
	}

	return (
		<PageLayout className="flex flex-col gap-8">
			<div className="flex items-center gap-2">
				<Link
					disabled={isMutationPending}
					to=".."
					className="aria-disabled:cursor-not-allowed"
				>
					<img src={ArrowLeft} alt="back" className="w-4" />
				</Link>
				<span className="text-xl font-semibold">Add Product</span>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<Label title="name">
						<Input {...register("name", { required: true })} />
					</Label>

					<Label title="description">
						<TextArea
							className="h-24"
							{...register("description", { required: true })}
						/>
					</Label>
				</div>

				<div className="flex flex-col gap-2">
					<div className="flex flex-col gap-4 md:flex-row">
						<div className="flex flex-1 flex-col gap-1">
							<Label title="price">
								<Input
									type="number"
									min={0}
									{...register("price", {
										validate: validatePrice,
									})}
								/>
							</Label>
							<p className="text-xs text-red-500 first-letter:uppercase">
								{errors.price?.message}
							</p>
						</div>

						<Label className="flex-1" title="discount percentage">
							<Input
								type="number"
								min={0}
								{...register("discountPercentage")}
							/>
						</Label>
					</div>

					<div className="flex gap-2 text-sm font-medium">
						<img src={Info} className="w-4" />
						<span className="capitalize">final price:</span>
						<span
							className={cn(discountPercentage && "line-through")}
						>
							${price ? price : 0}
						</span>
						{discountPercentage ? (
							<span>${discountedPrice.toFixed(2)}</span>
						) : null}
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<span className="text-sm font-medium capitalize">
						variants
					</span>

					<div className="divide-y rounded-md border">
						{variants.map((v) => (
							<VariantInput
								key={v.name}
								defaultValue={v}
								onSubmit={(newVariant) =>
									updateVariant(v.name, newVariant)
								}
								onDiscard={() => removeVariant(v.name)}
								validateVariantName={validateVariantName}
							/>
						))}
						<VariantInput
							onSubmit={addVariant}
							validateVariantName={validateVariantName}
						/>
					</div>
				</div>

				<VariantsTable
					variantDetails={variantDetails}
					register={register}
				/>

				<div className="flex justify-end gap-3">
					<Button disabled={isMutationPending} variant="secondary">
						Cancel
					</Button>
					<Button disabled={isMutationPending} type="submit">
						Save
					</Button>
				</div>
			</form>
		</PageLayout>
	)
}

const variantColumnsHelper = createColumnHelper<VariantDetails>()

function VariantsTable({
	variantDetails: data,
	register,
}: {
	variantDetails: VariantDetails[]
	register: UseFormRegister<NewProductForm>
}) {
	const columns = useMemo(
		() => [
			variantColumnsHelper.display({
				header: "Name",
				cell: ({ row: { original } }) => {
					const variantNames = Object.keys(original).filter(
						(key) => !["price", "discountPercentage"].includes(key)
					)
					const variants = variantNames.map((name) => original[name])
					return variants.join(" / ")
				},
			}),
			variantColumnsHelper.accessor("price", {
				header: "Price",
				cell: ({ cell }) => (
					<Input
						placeholder="Enter Price"
						type="number"
						min={0}
						{...register(`variantDetails.${cell.row.index}.price`, {
							required: true,
						})}
					/>
				),
			}),
			variantColumnsHelper.accessor("discountPercentage", {
				header: "Discount Percentage",
				cell: ({ cell }) => (
					<Input
						placeholder="Enter Discount Percent"
						type="number"
						min={0}
						{...register(
							`variantDetails.${cell.row.index}.discountPercentage`
						)}
					/>
				),
			}),
		],
		[register]
	)

	const { getHeaderGroups, getRowModel } = useReactTable({
		columns,
		data,
		getCoreRowModel: getCoreRowModel(),
	})

	return (
		<table className="border-separate border-spacing-0 text-sm">
			<thead className="font-semibold">
				{getHeaderGroups().map((headerGroup, i) => (
					<tr key={i}>
						{headerGroup.headers.map((header, i) => (
							<td
								className={cn(
									"border-y border-r bg-gray-100 p-3 first:rounded-tl-md first:border-l last:rounded-tr-md",
									i === 0 && "w-1/2"
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
						className="first:[&:last-child_td]:rounded-bl-md last:[&:last-child_td]:rounded-br-md"
						key={i}
					>
						{row.getVisibleCells().map((cell, i) => (
							<td
								className="border-b border-r p-3 first:border-l"
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
