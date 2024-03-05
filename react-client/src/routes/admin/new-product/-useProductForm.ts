import { NewProductForm, Variant, VariantDetails } from "@/lib/types"
import { useToast } from "@/lib/ui/use-toast"
import { SERVER_URL } from "@/utils/constants"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"

function useProductForm() {
	const {
		register,
		watch,
		handleSubmit,
		getValues,
		setValue,
		formState: { errors },
		reset,
	} = useForm<NewProductForm>({
		defaultValues: {
			name: "",
			description: "",
			price: "",
			discountPercentage: "",
			variantDetails: [],
		},
	})
	const { mutate, isPending } = useMutation({
		mutationFn: async (data: NewProductForm) => {
			const res = await fetch(`${SERVER_URL}/product`, {
				headers: { "Content-Type": "application/json" },
				method: "POST",
				credentials: "include",
				body: JSON.stringify(parseNewProductForm(data)),
			})

			if (!res.ok) {
				throw new Error("Something went wrong!")
			}

			return res.json()
		},
		onSuccess: () => {
			resetForm()
			toast({ title: "Product added!" })
		},
		onError: (error) => {
			toast({ title: error.message })
		},
	})
	const { toast } = useToast()

	const [variants, setVariants] = useState<Variant[]>([])

	function addVariant(variant: Variant) {
		setVariants((p) => [...p, variant])
		addVariantDetails(variant)
	}
	function removeVariant(variantName: string) {
		setVariants((p) => p.filter((v) => v.name !== variantName))
		removeVariantDetails(variantName)
	}
	function updateVariant(variantName: string, variant: Variant) {
		removeVariant(variantName)
		addVariant(variant)
	}
	function addVariantDetails(variant: Variant) {
		const variantDetails = getValues("variantDetails")
		if (variantDetails.length === 0) {
			const newVariantDetails: NewProductForm["variantDetails"] = []
			variant.values.forEach(({ value }) => {
				newVariantDetails.push({
					price: "",
					discountPercentage: "",
					[variant.name]: value,
				})
			})
			setValue("variantDetails", newVariantDetails)
		} else {
			const oldVariantDetails = getValues("variantDetails")
			const newVariantDetails: VariantDetails[] = []

			variant.values.forEach(({ value }) => {
				oldVariantDetails.forEach((oldVariant) => {
					newVariantDetails.push({
						...oldVariant,
						[variant.name]: value,
					})
				})
			})
			setValue("variantDetails", newVariantDetails)
		}
	}
	function removeVariantDetails(variantName: string) {
		const variantDetails = getValues("variantDetails")
		const newVariantDetails = variantDetails.map((vd) => {
			delete vd[variantName]
			return vd
		})
		const uniqueVariantDetails = [
			...new Set(newVariantDetails.map((vd) => JSON.stringify(vd))),
		].map((vd) => JSON.parse(vd)) as VariantDetails[]
		setValue("variantDetails", uniqueVariantDetails)
	}
	function validateVariantName(variantName: string) {
		const variantNames = variants.map((v) => v.name)
		return variantNames.includes(variantName)
			? "variant already exists"
			: true
	}
	function resetForm() {
		reset()
		setVariants([])
	}
	const onSubmit = handleSubmit((data) => {
		const { dismiss } = toast({
			title: "Adding product...",
			duration: Infinity,
		})
		mutate(data, {
			onSettled: () => {
				dismiss()
			},
		})
	})

	return {
		register,
		errors,
		watch,
		variants,
		handleSubmit: onSubmit,
		addVariant,
		removeVariant,
		updateVariant,
		validateVariantName,
		isMutationPending: isPending,
	}
}

function parseNewProductForm(data: NewProductForm) {
	return {
		...data,
		price: parseFloat(data.price),
		discountPercentage: data.discountPercentage
			? parseFloat(data.discountPercentage)
			: undefined,
		variants: data.variantDetails.map((vd) => ({
			...vd,
			price: parseFloat(vd.price),
			discountPercentage: vd.discountPercentage
				? parseFloat(vd.discountPercentage)
				: undefined,
		})),
	}
}

export { useProductForm }
