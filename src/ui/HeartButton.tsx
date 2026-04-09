import type { MouseEventHandler, ReactNode } from "react";
import type { HeartColor } from "@/lib/constants";

type HeartButtonProps = {
  label: ReactNode;
  heartColor: HeartColor;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  className?: string;
  id?: string;
  ariaLabel?: string;
};

export function HeartButton({
  label,
  heartColor,
  onClick,
  disabled = false,
  className = "",
  ariaLabel,
}: HeartButtonProps) {
  const heartImageUrl = `/hearts/heart_${heartColor}_icon.png`;

  return (
    <button
      id="heart-button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`pointer-events-auto text-white shrink-0 bg-no-repeat bg-contain bg-center w-16 h-16 hover:brightness-75 text-center gap-2 flex flex-row items-center justify-center text-md disabled:opacity-70 disabled:hover:brightness-100 ${className}`.trim()}
      style={{
        backgroundImage: `url('${heartImageUrl}')`,
      }}
    >
      {label}
    </button>
  );
}
