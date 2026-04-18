'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'accent' | 'ghost' | 'inverse';
type Size = 'sm' | 'md' | 'lg';

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type LinkProps = CommonProps & {
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

const base =
  'inline-flex items-center justify-center gap-2 font-sans font-medium transition-all duration-200 ease-editorial disabled:opacity-40 disabled:pointer-events-none select-none rounded-full border';

const variants: Record<Variant, string> = {
  primary:
    'bg-bg-tertiary border-line-visible text-ink-primary hover:bg-[#e5e5e5] hover:-translate-y-px',
  accent:
    'bg-accent-purple border-accent-purple text-white hover:bg-[#4a256a] hover:-translate-y-px',
  ghost:
    'bg-transparent border-line-visible text-ink-primary hover:bg-bg-secondary',
  inverse:
    'bg-white border-white text-ink-primary hover:bg-[#f0f0f0]',
};

const sizes: Record<Size, string> = {
  sm: 'px-5 py-2 text-sm',
  md: 'px-7 py-3 text-[15px]',
  lg: 'px-9 py-4 text-[17px]',
};

export function PillButton(props: ButtonProps | LinkProps) {
  const { variant = 'primary', size = 'md', className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ('href' in props && props.href) {
    const { href, onClick } = props;
    return (
      <Link href={href} onClick={onClick} className={classes}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } =
    props as ButtonProps;
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
