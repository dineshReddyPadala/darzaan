import React from 'react';
import { cn } from '../../utils/cn';
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white shadow-soft hover:bg-brand-hover',
  secondary: 'bg-surface text-ink ring-1 ring-inset ring-line-strong hover:bg-sunken',
  ghost: 'text-ink-muted hover:bg-sunken hover:text-ink',
  danger: 'bg-critical text-white hover:bg-critical/90',
  subtle: 'bg-brand-soft text-brand hover:bg-brand-muted'
};
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-11 px-4 text-[15px] rounded-xl',
  lg: 'h-14 px-6 text-base rounded-xl'
};
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string): string {
  return cn('inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2', variants[variant], sizes[size], extra);
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth,
  className,
  children,
  type = 'button',
  ...rest
}, ref) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, cn(fullWidth && 'w-full', className))} {...rest}>
      {icon}
      {children}
      {iconRight}
    </button>;
});