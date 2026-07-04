import { ModalSimple } from "./ModalSimple";
import { ModalMoon } from "./ModalMoon";
import type { ModalProps } from "@/lib";

interface ModalContainerProps extends ModalProps {
  isSimple?: boolean;
}

export function Modal({
  isSimple = false,
  ...modalProps
}: ModalContainerProps) {
  const ModalComponent = isSimple ? ModalSimple : ModalMoon;
  return <ModalComponent {...modalProps} />;
}
