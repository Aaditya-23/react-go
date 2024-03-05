import { cn } from "@/utils/cn"
import { ComponentProps, forwardRef } from "react"

type TextAreaProps = ComponentProps<"textarea">

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
	({ className, ...props }, ref) => {
		return (
			<textarea
				className={cn(
					"w-full rounded-md bg-transparent px-2 py-1 text-sm font-normal outline-none ring-1 ring-gray-300 focus:ring-primary",
					className
				)}
				ref={ref}
				{...props}
			/>
		)
	}
)

export { TextArea }
