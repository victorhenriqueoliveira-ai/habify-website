import { cn } from "@/lib/utils";

/**
 * Small "+" marks at the four corners of a relatively-positioned parent —
 * a blueprint/drafting-canvas accent. Parent needs `relative`.
 */
export const CornerMarks = () => (
  <>
    {[
      "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
      "right-0 top-0 translate-x-1/2 -translate-y-1/2",
      "left-0 bottom-0 -translate-x-1/2 translate-y-1/2",
      "right-0 bottom-0 translate-x-1/2 translate-y-1/2",
    ].map((pos) => (
      <span
        key={pos}
        aria-hidden="true"
        className={cn("pointer-events-none absolute z-10 select-none text-border", pos)}
      >
        +
      </span>
    ))}
  </>
);

/**
 * Wraps a word/phrase with a hand-drawn-looking circle behind it — the
 * "highlight this key word" landing-page trick, used sparingly.
 */
export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span className={cn("relative inline-block whitespace-nowrap", className)}>
    <svg
      viewBox="0 0 220 70"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute -inset-x-[10%] -inset-y-[18%] h-[136%] w-[120%] text-primary"
    >
      <path
        d="M12 40 C 8 15, 40 6, 110 6 C 180 6, 212 15, 208 35 C 212 58, 175 65, 110 64 C 45 65, 8 60, 12 40 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
    <span className="relative">{children}</span>
  </span>
);
