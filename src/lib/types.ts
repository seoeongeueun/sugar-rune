import type { ReactNode } from "react";
import type { HeartColor } from "@/shared";
import type { StampSize } from "./constants";

//used in zustand store for note content management
export type StampData = {
  id: number;
  pageIndex: number;
  size: StampSize;
  x: number;
  y: number;
};

export type Note = {
  id?: string;
  content: string;
  date?: string;
  heart_content: string;
  stamps?: StampData[];
};

//used in modal components for props typing
export interface ModalProps {
  title: string;
  description?: string;
  children?: ReactNode;
  footer: ReactNode;
  onClose?: () => void;
  heartColor?: HeartColor;
}
