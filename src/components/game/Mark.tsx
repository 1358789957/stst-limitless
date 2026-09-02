export function InfinityMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 32"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d="M20.5 16c0-6.2 4.6-11 10.2-11 8.4 0 12.2 11 21.1 11 5.6 0 10.2-4.8 10.2-11M51.5 16c0 6.2-4.6 11-10.2 11-8.9 0-12.7-11-21.1-11C14.6 16 10 20.8 10 27" />
      <path d="M8 9.5h56" strokeWidth="1.6" opacity="0.85" />
    </svg>
  );
}
