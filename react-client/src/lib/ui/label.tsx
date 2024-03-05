import { cn } from "@/utils/cn"
import { ComponentProps, forwardRef } from "react"

type LabelProps = ComponentProps<"label"> & {
	title: string
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
	({ title, children, className, ...props }, ref) => {
		return (
			<label
				className={cn(
					"flex flex-col gap-1.5 text-sm font-medium capitalize",
					className
				)}
				ref={ref}
				{...props}
			>
				<span>{title}</span>
				{children}
			</label>
		)
	}
)

export { Label }
