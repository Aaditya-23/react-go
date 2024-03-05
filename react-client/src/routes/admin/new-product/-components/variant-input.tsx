import { Variant } from "@/lib/types"
import { Button } from "@/lib/ui/button"
import { Input } from "@/lib/ui/input"
import { Label } from "@/lib/ui/label"
import { useState } from "react"
import Trash from "@/assets/trash.svg"
import { DeepPartial, useFieldArray, useForm } from "react-hook-form"
import { cn } from "@/utils/cn"

type VariantInputProps = {
	defaultValue?: Variant
	validateVariantName: (variantName: string) => string | true
	onSubmit: (variant: Variant) => void
	onDiscard?: () => void
}

type InputSectionProps = {
	defaultValue?: Variant
	validateVariantName: (variantName: string) => string | true
	onSubmit: (variant: Variant) => void
	onDiscard: () => void
}

function VariantInput(props: VariantInputProps) {
	const { defaultValue, onSubmit, onDiscard, validateVariantName } = props
	const [open, setOpen] = useState(false)
	function openVariantInput() {
		setOpen(true)
	}
	function closeVariantInput() {
		setOpen(false)
	}
	function handleDiscard() {
		if (onDiscard) onDiscard()
		closeVariantInput()
	}
	function handleSubmit(data: Variant) {
		onSubmit(data)
		closeVariantInput()
	}

	if (open) {
		return (
			<InputSection
				defaultValue={defaultValue}
				onSubmit={handleSubmit}
				onDiscard={handleDiscard}
				validateVariantName={validateVariantName}
			/>
		)
	} else if (defaultValue) {
		return (
			<div className="flex items-center justify-between p-4">
				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium capitalize">
						{defaultValue.name}
					</p>
					<div className="flex gap-2">
						{defaultValue.values.map(({ value }, i) => (
							<span
								className="rounded-lg bg-gray-200 px-3 py-1 text-xs text-gray-700"
								key={i}
							>
								{value}
							</span>
						))}
					</div>
				</div>
				<Button
					variant="secondary"
					size="sm"
					onClick={openVariantInput}
				>
					Edit
				</Button>
			</div>
		)
	} else {
		return (
			<button
				onClick={openVariantInput}
				className="w-full py-3 text-sm font-semibold text-primary transition-colors hover:bg-gray-50"
			>
				Add Variant
			</button>
		)
	}
}

function InputSection(props: InputSectionProps) {
	const { defaultValue, validateVariantName, onSubmit, onDiscard } = props
	const {
		register,
		variantValues,
		handleSubmit,
		discardValue,
		errors,
		hasError,
		validateVariantValue,
	} = useVariant(defaultValue)

	function discardVariant() {
		onDiscard()
	}
	function submitVariant() {
		handleSubmit(onSubmit)
	}

	return (
		<div className="flex flex-col gap-4 p-4">
			<Label title="variant name">
				<div>
					<div className="flex items-center gap-4">
						<Input
							placeholder="Enter Variant name"
							{...register("name", {
								required: "Variant name is required",
								validate: (name) => {
									return name.trim() === defaultValue?.name
										? true
										: validateVariantName(name)
								},
							})}
						/>
						<button onClick={discardVariant} type="button">
							<img src={Trash} className="w-4" />
						</button>
					</div>
					{errors.name?.message}
				</div>
			</Label>

			<div className="flex flex-col gap-1.5">
				<span className="text-sm font-medium capitalize">
					variant values
				</span>
				<div className="flex flex-col gap-2">
					{variantValues.map((value, i) => (
						<div key={value.id} className="flex items-center gap-4">
							<Input
								className={cn(
									"placeholder:capitalize",
									hasError(i) && "!ring-red-500"
								)}
								placeholder={
									i === 0 ? "add value" : "add another value"
								}
								{...register(`values.${i}.value`, {
									validate: validateVariantValue,
								})}
							/>
							{i > 0 ? (
								<button
									onClick={() => discardValue(i)}
									type="button"
								>
									<img src={Trash} className="w-4" />
								</button>
							) : null}
						</div>
					))}
				</div>
				{errors.values?.message}
			</div>

			<Button onClick={submitVariant}>Done</Button>
		</div>
	)
}

function useVariant(defaultValue?: Variant) {
	const {
		register,
		control,
		watch,
		handleSubmit,
		formState: { errors },
		setError,
		clearErrors,
		getFieldState,
		getValues,
	} = useForm<Variant>({
		defaultValues: defaultValue ?? {
			name: "",
			values: [{ value: "" }],
		},
		reValidateMode: "onChange",
	})
	const { fields, append, remove } = useFieldArray({
		control,
		name: "values",
	})

	function validateVariantValues(values: DeepPartial<Variant["values"]>) {
		let hasDuplicateValues = false
		values.forEach((obj, i, self) => {
			if (obj?.value?.trim() === "") return
			const valueCount = self.reduce((acc, curr) => {
				if (curr?.value === undefined || obj?.value === undefined)
					return acc
				return curr.value.trim() === obj.value.trim() ? acc + 1 : acc
			}, 0)

			if (valueCount > 1) {
				hasDuplicateValues = true
			} else {
				clearErrors(`values.${i}.value`)
			}
		})

		if (hasDuplicateValues) {
			setError(`values`, {
				message: "variant cannot have duplicate values",
			})
		} else {
			clearErrors(`values`)
		}
	}
	function validateVariantValue(value: string) {
		if (value.trim() === "") return true
		const valueCount = getValues("values").reduce(
			(acc, curr) => (curr.value.trim() === value.trim() ? acc + 1 : acc),
			0
		)

		return valueCount > 1 ? false : true
	}
	function hasError(index: number) {
		const hasError = getFieldState(`values.${index}.value`).invalid
		return hasError
	}
	function discardValue(index: number) {
		remove(index)
	}
	function submitHandler(callback: (data: Variant) => void) {
		handleSubmit((data) => {
			const parsedData = parseVariantData(data)
			callback(parsedData)
		})()
	}
	function parseVariantData(data: Variant) {
		return {
			name: data.name.trim(),
			values: data.values
				.map((v) => ({ ...v, value: v.value.trim() }))
				.filter((v) => v.value !== ""),
		}
	}

	watch((data) => {
		const variantValues = data.values
		if (!variantValues) return

		validateVariantValues(variantValues)
		const lastValue = variantValues.at(-1)
		if (lastValue?.value !== undefined) {
			if (lastValue.value.trim() !== "") {
				append({ value: "" }, { shouldFocus: false })
			}
		}
	})

	return {
		register,
		variantValues: fields,
		hasError,
		discardValue,
		handleSubmit: submitHandler,
		errors,
		validateVariantValue,
	}
}

export { VariantInput }
