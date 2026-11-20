type EyeBrowProps = {
  /** Visible brand string along the arch. */
  label: string;
  /** Unique path id so left/right brows don’t clash. */
  pathId: string;
  className?: string;
};

/**
 * Curved brand eyebrow — “Malinda Creative” along a gentle arch via SVG textPath.
 */
export function EyeBrow({ label, pathId, className }: EyeBrowProps) {
  return (
    <svg
      viewBox="0 0 490 148"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={`pointer-events-none overflow-visible text-ink ${className ?? ""}`}
    >
      <defs>
        <path id={pathId} d="M 0 130 Q 245 14 490 130" fill="none" />
      </defs>
      <text
        className="fill-current uppercase"
        style={{
          fontFamily: "var(--font-display), serif",
          fontSize: 82,
          letterSpacing: "-0.035em",
        }}
      >
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          {label}
        </textPath>
      </text>
    </svg>
  );
}
