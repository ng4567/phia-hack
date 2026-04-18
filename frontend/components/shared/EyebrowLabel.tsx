import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'div' | 'p';
};

export function EyebrowLabel({ children, className, as: Tag = 'span' }: Props) {
  return (
    <Tag
      className={cn(
        'font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
