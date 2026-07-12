import type { ReactNode } from "react";
import type { HeartColor } from "./constants";

//used in zustand store for note content management
export type Note = {
  id?: string;
  content: string;
  date?: string;
  heart_content: string;
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
