import type { ModalProps } from "@/lib";

export function ModalMoon({
  title,
  description,
  children,
  footer,
  heartColor,
}: ModalProps) {
  return (
    <div className="fixed inset-0 w-full h-full bg-black/30 flex items-center justify-center z-99">
      <div className="text-white pt-16 pl-14 -ml-14 tablet:pt-24 tablet:pl-22 text-md w-postcard-height h-postcard-height rounded-full bg-night/30 drop-shadow-xl backdrop-blur-2xl shadow-[20px_20px_0px_30px_var(--gold),21px_21px_10px_34px_rgba(0,0,0,0.2)] tablet:shadow-[30px_30px_0px_40px_var(--gold)] flex flex-col items-center justify-center gap-1 tablet:gap-8 border border-white/50">
        <img
          src={`/hearts/heart_${String(heartColor ?? "white")}_icon.png`}
          alt="Heart Icon"
          aria-hidden="true"
          className="w-8 tablet:w-10 h-auto animate-bounce [animation-duration:1.8s]"
        />
        <header className="flex flex-col items-center justify-center w-full mb-2 tablet:mb-0">
          <h1 className="leading-12 tablet:leading-26 font-bold!">{title}</h1>
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
