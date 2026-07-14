import type { MouseEventHandler, ReactNode } from "react";
import type { HeartColor } from "@/shared";
import { twMerge } from "tailwind-merge";

type HeartButtonProps = {
  label: ReactNode;
  heartColor: HeartColor;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  className?: string;
  id?: string;
  ariaLabel?: string;
  size?: "small" | "default";
};

export function HeartButton({
  label,
  heartColor,
  onClick,
  disabled = false,
  className = "",
  ariaLabel,
  size = "default",
}: HeartButtonProps) {
  const heartImageUrl = `/hearts/heart_${String(heartColor ?? "white")}_icon.png`;

  return (
    <button
      id="heart-button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={twMerge(
        `whitespace-nowrap pointer-events-auto text-white shrink-0 bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75 text-center gap-2 flex flex-row items-center justify-center text-lg disabled:opacity-70 disabled:hover:brightness-100`,
        size === "small" ? "w-10 h-10 tablet:w-12 tablet:h-12 text-md" : "",
        className,
      ).trim()}
      style={{
        backgroundImage: `url('${heartImageUrl}')`,
      }}
    >
      {label}
    </button>
  );
}
