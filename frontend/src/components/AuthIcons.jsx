export function IconEye({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function IconEyeOff({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.1A10.4 10.4 0 0 1 12 5c6 0 10 7 10 7a18.7 18.7 0 0 1-5.1 5.1M6.3 6.3A18.8 18.8 0 0 0 2 12s4 7 10 7a9.7 9.7 0 0 0 4.5-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
