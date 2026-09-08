import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const variants = cva("inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", {
  variants: {
    variant: { default: "bg-primary text-primary-foreground hover:opacity-90", ghost: "hover:bg-muted", outline: "border border-border bg-transparent hover:bg-muted" },
    size: { default: "h-8 px-3", icon: "size-8", sm: "h-7 px-2.5 text-xs" }
  }, defaultVariants: { variant: "default", size: "default" }
})
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof variants> {}
export function Button({ className, variant, size, ...props }: ButtonProps) { return <button className={cn(variants({ variant, size }), className)} {...props} /> }
