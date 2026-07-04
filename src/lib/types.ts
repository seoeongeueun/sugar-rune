import type { ReactNode } from "react";
import { HEART_LIST } from "@/lib";

//used in zustand store for note content management
export type Note = {
  content: string;
  heart_content: string;
};

//used in modal components for props typing
export interface ModalProps {
  title: string;
  description?: string;
  children?: ReactNode;
  footer: ReactNode;
  onClose?: () => void;
  heartColor?: keyof typeof HEART_LIST;
}
