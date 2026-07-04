import { useNote } from "@/stores/noteStore";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";

type Props = {
  originalRef?: RefObject<HTMLDivElement | null>;
  deleteTrigger?: number;
};

export default function PostCardCut({ originalRef, deleteTrigger }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cardLeftRef = useRef<HTMLDivElement>(null);
  const cardRightRef = useRef<HTMLDivElement>(null);
  const closeNote = useNote((state) => state.closeNote);

  useEffect(() => {
    const card = cardRef.current;
    const originalCard = originalRef?.current;
    const originalContainer = originalCard?.querySelector(
      "#postcard-container",
    );
    if (!card || !originalCard || !originalContainer || !deleteTrigger) return;

    const left = cardLeftRef.current;
    const right = cardRightRef.current;
    if (!left || !right) return;

    const containerEl = originalContainer as HTMLElement;
    const prevTransition = containerEl.style.transition;

    gsap.killTweensOf(containerEl);

    // clear previous transition values for gsap animation
    containerEl.style.transition = "none";
    gsap.set(containerEl, { willChange: "transform", force3D: true });

    const tl = gsap.timeline();
    tl.to(containerEl, {
      rotationY: 180,
      rotateZ: -5,
      duration: 0.3,
      ease: "power2.out",
      overwrite: "auto",
    })
      .to(originalCard, { opacity: 0, duration: 0 }, ">0.2")
      .to(card, { opacity: 1, duration: 0 }, "<")
      .to(left, { rotateZ: -10, x: -10, duration: 1, delay: 0.1 }, ">")
      .to(right, { rotateZ: 10, y: 20, duration: 1 }, "<")
      .to(
        card,
        { opacity: 0, duration: 0.7, onComplete: () => closeNote() },
        ">-0.2",
      ); // close postcard on completion of the animation

    return () => {
      tl.kill();
      containerEl.style.transition = prevTransition;
      gsap.set(containerEl, { clearProps: "willChange" });
    };
  }, [originalRef, deleteTrigger]);

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
