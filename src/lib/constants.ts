//heart animations
export const OPEN_ANGLE = -Math.PI / 1.2857; // 140도
export const OPEN_SPEED = 4;

export type HeartColor =
  | "red"
  | "yellow"
  | "green"
  | "pink"
  | "purple"
  | "black"
  | "white";

export const HEART_LIST: { color: HeartColor; hex: string; label: string }[] = [
  { color: "red", hex: "#fb120e", label: "Love" },
  { color: "yellow", hex: "#f7c331", label: "Surprise" },
  { color: "green", hex: "#4bf53d", label: "Friendship" },
  { color: "pink", hex: "#eb77b4", label: "Affection" },
  { color: "purple", hex: "#9b59b6", label: "Lust / Desire" },
  { color: "black", hex: "#0a0b0f", label: "Hatred / Fear" },
  { color: "white", hex: "#f0eff4", label: "Purity" },
];
