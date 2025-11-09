import * as React from "react";
import { Slot as SlotPrimitive } from "radix-ui";;
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground rounded-xl shadow-sm hover:shadow-md hover:bg-primary/95",
        destructive:
          "bg-destructive text-white rounded-xl shadow-sm hover:shadow-md hover:bg-destructive/95",
        outline:
          "border border-border bg-background rounded-xl hover:bg-secondary/50 hover:border-border/80",
        secondary:
          "bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80",
        ghost:
          "rounded-xl hover:bg-secondary/60",
        link: "text-primary underline-offset-4 hover:underline rounded-md"
      },
      size: {
        default: "h-11 px-6 py-2.5 has-[>svg]:px-5",
        sm: "h-9 rounded-lg gap-1.5 px-4 text-xs has-[>svg]:px-3.5",
        lg: "h-12 rounded-xl px-8 text-base has-[>svg]:px-7",
        icon: "size-11 rounded-xl"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? SlotPrimitive.Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
