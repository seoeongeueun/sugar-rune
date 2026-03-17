import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";

type Props = {
  originalRef?: RefObject<HTMLDivElement | null>;
};

export default function PostCardCut({ originalRef }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cardLeftRef = useRef<HTMLDivElement>(null);
  const cardRightRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   const card = cardRef.current;
  //   const originalCard = originalRef?.current;
  //   if (!card || !originalCard) return;

  //   const left = cardLeftRef.current;
  //   const right = cardRightRef.current;

  //   const tl = gsap.timeline();
  //   tl.to(originalCard, { opacity: 0, duration: 0, delay: 0.8 })
  //     .to(card, { opacity: 1, duration: 0 }, "<-0.1")
  //     .to(left, { rotateZ: -10, x: -10, duration: 0.5, delay: 0.1 }, "<")
  //     .to(right, { rotateZ: 10, y: 20, duration: 0.5 }, "<")
  //     .to(card, { opacity: 0, duration: 0.5 }, ">-0.2");

  //   return () => {
  //     tl.kill();
  //   };
  // }, [originalRef]);

  return (
    <article
      ref={cardRef}
      className="group mt-30 pointer-events-none opacity-0 fixed inset-0 -rotate-z-5 z-50 flex items-center justify-center"
    >
      <div
        ref={cardLeftRef}
        className="relative box-content p-16 pr-0 rounded-xs w-postcard-width-half h-postcard-height "
      >
        <div className="w-full h-full relative bg-postcard-background shadow-md">
          <div className="back bg-[url('/assets/logo.png')] bg-no-repeat bg-left bg-cover absolute inset-0 w-full h-full backface-hidden flex items-center justify-center bg-night border-2 border-r-0 border-amber-50 shadow-[3px_0px_0_6px_var(--night)]"></div>
        </div>
      </div>
      <div
        ref={cardRightRef}
        className="relative box-content p-16 pl-0 rounded-xs w-postcard-width-half h-postcard-height "
      >
        <div className="w-full h-full relative bg-postcard-background shadow-md">
          <div className="back bg-[url('/assets/logo.png')] bg-no-repeat bg-right bg-cover w-full h-full flex bg-night border-2 border-l-0 border-amber-50 shadow-[3px_0px_0_6px_var(--night)]"></div>
        </div>
      </div>
    </article>
  );
}
