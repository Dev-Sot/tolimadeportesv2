interface Props {
  withWordmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-12 h-12',
};

export function Logo({ withWordmark = true, size = 'md', className }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <img
        src="/DeportesTolima.png"
        alt=""
        aria-hidden="true"
        className={`${SIZES[size]} object-contain shrink-0`}
      />
      {withWordmark && (
        <span className="font-bold text-lg tracking-tight">
          Canch<span className="text-primary">azo</span>
        </span>
      )}
    </span>
  );
}
