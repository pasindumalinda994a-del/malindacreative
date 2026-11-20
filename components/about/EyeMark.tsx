type EyeMarkProps = {
  className?: string;
};

/**
 * Eye outline only (almond + iris ring cutout).
 * The middle ball is left open for RainbowPupil behind this mark.
 */
export function EyeMark({ className }: EyeMarkProps) {
  return (
    <svg
      viewBox="0 0 490 490"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path d="M245 123.7c-91.8 0-178.5 42.8-245 121.3 66.5 78.6 153.2 121.3 245 121.3S423.5 323.2 490 245C423.5 166.4 336.8 123.7 245 123.7zm0 223.6c-56.4 0-102.3-45.9-102.3-102.3S188.6 142.7 245 142.7 347.3 188.6 347.3 245 301.4 347.3 245 347.3z" />
    </svg>
  );
}
