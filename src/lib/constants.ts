//heart animations
export const OPEN_ANGLE = -Math.PI / 1.2857; // 140도
export const OPEN_SPEED = 4;
export const CALENDAR_START_YEAR = 2026;

//postcard constants
export const MAX_CONTENT_LENGTH = 350; // Maximum number of characters allowed in the content
export type StampSize = "small" | "medium" | "large";
export const STAMP_SIZE_ORDER: StampSize[] = ["small", "medium", "large"];
export const STAMP_SIZE_REM: Record<StampSize, number> = {
  small: 4,
  medium: 7,
  large: 11,
};
export const MAX_STAMPS = 5;
