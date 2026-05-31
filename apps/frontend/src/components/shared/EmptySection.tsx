import * as React from 'react';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  subtitle?: string;
  className?: string;
};

export function EmptySection({ title, subtitle, className }: Props) {
  return (
    <div
      className={cn(
        'w-full py-10',
        'flex flex-col items-center justify-center',
        'border border-stone-200 rounded-xl',
        className
      )}
    >
      <p className="text-stone-300 text-sm text-center font-normal">{title}</p>
      {subtitle && (
        <p className="text-stone-200 text-xs text-center font-normal mt-1">{subtitle}</p>
      )}
    </div>
  );
}
