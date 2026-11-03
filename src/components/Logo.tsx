export function Logo({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" className="fill-table" />
      <rect x="16" y="8" width="32" height="48" rx="7" className="fill-cream" />
      <rect x="18" y="10" width="14" height="22" className="fill-uno-red" />
      <rect x="32" y="10" width="14" height="22" className="fill-uno-yellow" />
      <rect x="18" y="32" width="14" height="22" className="fill-uno-green" />
      <rect x="32" y="32" width="14" height="22" className="fill-uno-blue" />
      <ellipse cx="32" cy="32" rx="9" ry="13" className="fill-white" />
    </svg>
  );
}
