import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-[8px] text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-[#fc8019] text-[#282c3f] hover:bg-[#e37012] shadow-sm font-bold',
        orange: 'bg-[#fc8019] text-[#282c3f] hover:bg-[#e37012] shadow-sm font-bold',
        charcoal: 'bg-[#282c3f] text-white hover:bg-[#1e212f] shadow-sm',
        navy: 'bg-[#282c3f] text-white hover:bg-[#1e212f] shadow-sm',
        secondary: 'bg-[#f1f1f6] text-[#282c3f] hover:bg-[#e4e4eb]',
        outline: 'border border-[#e9e9eb] bg-white text-[#282c3f] hover:bg-[#f1f1f6]',
        ghost: 'text-[#686b78] hover:bg-[#f1f1f6] hover:text-[#282c3f]',
        destructive: 'bg-[#dc2626] text-white hover:bg-[#b91c1c] shadow-sm',
        link: 'text-[#fc8019] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
