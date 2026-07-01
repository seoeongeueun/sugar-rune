import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  description?: string;
  children?: ReactNode;
  footer: ReactNode;
}

export function ModalSimple({
  title,
  description,
  children,
  footer,
}: ModalProps) {
  return (
    <div
      id="modal"
      className="fixed inset-0 w-full h-full bg-black/30 flex items-center justify-center z-99"
    >
      <div className="text-white text-lg w-postcard-height h-fit py-20 rounded-lg flex flex-col items-center justify-center gap-1 tablet:gap-8 border-24 border-background outline outline-white/50 bg-secondary">
        <img
          src="/hearts/heart_purple_icon.png"
          alt="Heart Icon"
          aria-hidden="true"
          className="w-8 tablet:w-10 h-auto animate-bounce [animation-duration:1.8s]"
        />
        <header className="flex flex-col items-center justify-center w-full mb-2 tablet:mb-0">
          <h1 className="leading-12 tablet:leading-20 font-bold!">{title}</h1>
          {description && <p className="text-center">{description}</p>}
        </header>
        {children}
        <footer className="text-lg flex flex-row items-center justify-between gap-2 w-full tablet:w-2/3">
          {footer}
        </footer>
      </div>
    </div>
  );
}
