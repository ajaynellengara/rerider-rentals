import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'bg-[#f1f1f6] text-[#282c3f] border border-[#e9e9eb]',
        lightGrey: 'bg-[#f1f1f6] text-[#686b78]',
        orange: 'bg-[#fff3e8] text-[#fc8019] border border-[#fcd5b5]',
        available: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        rented: 'bg-blue-50 text-blue-700 border border-blue-200',
        info: 'bg-blue-50 text-blue-700 border border-blue-200',
        pending: 'bg-amber-50 text-amber-700 border border-amber-200',
        warning: 'bg-amber-50 text-amber-700 border border-amber-200',
        maintenance: 'bg-orange-50 text-orange-700 border border-orange-200',
        purple: 'bg-purple-50 text-purple-700 border border-purple-200',
        accident: 'bg-red-50 text-red-700 border border-red-200',
        destructive: 'bg-red-50 text-red-700 border border-red-200',
        completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        cancelled: 'bg-slate-100 text-slate-600 border border-slate-200',
        outline: 'border border-[#e9e9eb] text-[#282c3f] bg-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
