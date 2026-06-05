type AtlasLogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
  tagline?: boolean;
};

export function AtlasMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 96" role="img" aria-label="Atlas">
      <path d="M12 76c10.7-2.2 22.9-3.3 36.5-3.3S74 73.8 84 76c-11.2 2.7-23.1 4.1-35.8 4.1S23.4 78.7 12 76Z" fill="currentColor" />
      <path d="M18 47.8 30 38v31H18V47.8Z" fill="currentColor" />
      <path d="M33 32.5 45 22v47H33V32.5Z" fill="currentColor" />
      <path d="M48 17.8 60 8v61H48V17.8Z" fill="currentColor" />
      <path d="M63 36.5 75 43v26H63V36.5Z" fill="currentColor" />
      <path d="M78 49.5 88 55v14H78V49.5Z" fill="currentColor" />
    </svg>
  );
}

export function AtlasLogo({
  className = '',
  markClassName = '',
  wordmarkClassName = '',
  showWordmark = true,
  tagline = false
}: AtlasLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <AtlasMark className={`h-10 w-10 shrink-0 ${markClassName}`.trim()} />
      {showWordmark && (
        <span className="min-w-0">
          <span className={`atlas-wordmark block text-lg leading-none ${wordmarkClassName}`.trim()}>ATLAS</span>
          {tagline && (
            <span className="mt-1 block text-[0.62rem] font-semibold uppercase leading-tight text-slate-400">
              Operating system for modern strata
            </span>
          )}
        </span>
      )}
    </span>
  );
}
