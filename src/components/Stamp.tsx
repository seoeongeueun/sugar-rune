import { twMerge } from "tailwind-merge";
import type { MouseEvent } from "react";
import { X } from "lucide-react";
import type { StampSize } from "@/lib/constants";

type StampProps = {
  id: number;
  pageIndex: number;
  isVisible: boolean;
  heartColor: string;
  size: StampSize;
  x: number;
  y: number;
  isEditable: boolean;
  onRemove: () => void;
};

const stampSizeClass: Record<StampSize, string> = {
  small: "w-16",
  medium: "w-28",
  large: "w-44",
};

export default function Stamp({
  id,
  pageIndex,
  isVisible,
  heartColor,
  size,
  x,
  y,
  isEditable,
  onRemove,
}: StampProps) {
  const handleRemoveClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRemove();
  };

  return (
    <div
      data-stamp-id={id}
      data-stamp-page={pageIndex}
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
      className={twMerge(
        "aspect-square rounded-full absolute z-50 -translate-x-1/2 -translate-y-1/2 select-none",
        !isVisible && "invisible pointer-events-none",
        isEditable && "hover:bg-background/20",
      )}
    >
      {isEditable && (
        <button
          type="button"
          aria-label="Remove Stamp"
          onClick={handleRemoveClick}
          className="relative top-4 left-full z-50 black-button"
        >
          <X className="w-4 h-4 text-night" />
        </button>
      )}
      <img
        src={`/hearts/heart_${heartColor}_icon.png`}
        alt="Heart Stamp"
        aria-hidden="true"
        draggable={false}
        className={twMerge(
          "pointer-events-none object-cover h-auto aspect-square",
          stampSizeClass[size],
        )}
      />
    </div>
  );
}
