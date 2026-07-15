import { twMerge } from "tailwind-merge";
import type { MouseEvent } from "react";
import { X } from "lucide-react";

export type StickerSize = "small" | "medium" | "large";

type StickerProps = {
  heartColor: string;
  size: StickerSize;
  x: number;
  y: number;
  isEditable: boolean;
  onRemove: () => void;
};

const stickerSizeClass: Record<StickerSize, string> = {
  small: "w-16",
  medium: "w-28",
  large: "w-44",
};

export default function Sticker({
  heartColor,
  size,
  x,
  y,
  isEditable,
  onRemove,
}: StickerProps) {
  const handleRemoveClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRemove();
  };

  return (
    <div
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
      className={twMerge(
        "aspect-square hover:border rounded-full absolute z-50 -translate-x-1/2 -translate-y-1/2 select-none",
        isEditable && "hover:border-background/20",
      )}
    >
      {isEditable && (
        <button
          type="button"
          aria-label="Remove Sticker"
          onClick={handleRemoveClick}
          className="relative top-4 left-full z-50 black-button"
        >
          <X className="w-4 h-4 text-night" />
        </button>
      )}
      <img
        src={`/hearts/heart_${heartColor}_icon.png`}
        alt="Heart Sticker"
        aria-hidden="true"
        draggable={false}
        className={twMerge(
          "pointer-events-none object-cover h-auto aspect-square",
          stickerSizeClass[size],
        )}
      />
    </div>
  );
}
