import { cn } from "@/utils/cn"
import { ComponentProps, forwardRef } from "react"

type CheckboxProps = Omit<ComponentProps<"input">, "type">

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
	({ className, children, ...props }, ref) => {
		return (
			<div className={cn("flex items-center gap-2", className)}>
				<input
					className="h-3 w-3"
					type="checkbox"
					ref={ref}
					{...props}
				/>
				{children}
			</div>
		)
	}
)

export { Checkbox }
