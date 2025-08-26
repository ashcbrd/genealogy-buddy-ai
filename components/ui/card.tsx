import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-border hover:shadow-md",
        elevated: "shadow-md hover:shadow-lg border-border/50",
        outlined: "border-2 border-border bg-background shadow-none hover:shadow-sm",
        clean: "border-border/30 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-border",
        minimal: "border-none shadow-none bg-transparent hover:bg-accent/50 rounded-xl",
        interactive: "border-border hover:border-primary/50 hover:shadow-md cursor-pointer",
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1",
        scale: "hover:scale-[1.02]",
        both: "hover:-translate-y-1 hover:scale-[1.02]",
      }
    },
    defaultVariants: {
      variant: "default",
      hover: "none",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const cardTitleVariants = cva(
  "text-2xl font-semibold leading-none tracking-tight",
  {
    variants: {
      variant: {
        default: "text-foreground",
        primary: "text-primary",
        muted: "text-muted-foreground",
        accent: "text-accent-foreground",
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof cardTitleVariants> {}

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, variant, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(cardTitleVariants({ variant, className }))}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
  cardTitleVariants,
};
