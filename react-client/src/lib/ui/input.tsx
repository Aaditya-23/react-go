import { cn } from "@/utils/cn"
import { ComponentProps, forwardRef } from "react"

type InputProps = ComponentProps<"input">

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, ...props }, ref) => {
		return (
			<input
				className={cn(
					"w-full rounded-md bg-transparent p-2 text-sm font-normal outline-none ring-1 ring-gray-300 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-70",
					className
				)}
				ref={ref}
				{...props}
			/>
		)
	}
)

export { Input }
