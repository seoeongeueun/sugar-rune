import type { ModalProps } from "@/lib";

export function ModalSimple({
  title,
  description,
  children,
  footer,
  onClose,
  heartColor,
}: ModalProps) {
  return (
    <div
      id="modal"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      className="pointer-events-auto fixed inset-0 w-full h-full bg-black/40 flex items-center justify-center z-99"
    >
      <div className="text-white text-lg w-postcard-height h-fit py-20 rounded-lg flex flex-col items-center justify-center gap-1 tablet:gap-8 border-2 border-white outline-2 outline-night bg-white/40 backdrop-blur-xl drop-shadow-2xl">
        <img
          src={`/hearts/heart_${String(heartColor ?? "white")}_icon.png`}
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
