import { cn } from "@/utils/cn"
import { VariantProps, cva } from "class-variance-authority"
import { ComponentProps, forwardRef } from "react"

type ButtonProps = ComponentProps<"button"> &
	VariantProps<typeof buttonVariants>

const buttonVariants = cva(
	"font-semibold py-2 px-3 tracking-wide rounded-md disabled:cursor-not-allowed disabled:opacity-50",
	{
		variants: {
			variant: {
				primary: "bg-primary text-white",
				secondary: "border-primary border text-primary",
				ghost: "hover:bg-primary border-primary text-primary hover:text-white",
			},
			size: {
				sm: "text-xs",
				md: "text-sm",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "md",
		},
	}
)

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, type = "button", ...props }, ref) => {
		return (
			<button
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				type={type}
				{...props}
			/>
		)
	}
)

export { Button, buttonVariants }
