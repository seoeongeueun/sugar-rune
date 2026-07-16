import { helpPages } from "@/lib";
import { HEART_LIST } from "@/shared";
import type { HelpPage } from "@/lib";
import { ModalSimple } from "@/ui";
import { useState } from "react";

export default function HelpModal() {
  const [pageIndex, setPageIndex] = useState(0);

  const heartColor = HEART_LIST[pageIndex % HEART_LIST.length].color;

  return (
    <ModalSimple
      key={helpPages[pageIndex].page}
      title={helpPages[pageIndex].title}
      heartColor={heartColor}
      description={helpPages[pageIndex].description ?? ""}
      footer={
        <>
          <button
            type="button"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
            className="disabled:opacity-30 bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
            style={{
              backgroundImage: `url('/hearts/heart_${HEART_LIST[(pageIndex - 1 + HEART_LIST.length) % HEART_LIST.length].color}_icon.png')`,
            }}
          >
            <span className="z-10">Back</span>
          </button>
          <button
            type="button"
            disabled={pageIndex === helpPages.length - 1}
            onClick={() =>
              setPageIndex((prev) => Math.min(helpPages.length - 1, prev + 1))
            }
            className="bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
            style={{
              backgroundImage: `url('/hearts/heart_${heartColor}_icon.png')`,
            }}
          >
            <span className="z-10">Next</span>
          </button>
        </>
      }
      onClose={() => {}}
    >
      <div className="flex flex-col gap-4 text-lg font-sonmat leading-8 px-2 text-center">
        {helpPages[pageIndex].image && (
          <img
            src={helpPages[pageIndex].image}
            alt={helpPages[pageIndex].title}
            className="rounded black-button"
          />
        )}
        <p className="whitespace-pre-line px-8">
          {helpPages[pageIndex].content}
        </p>
      </div>
    </ModalSimple>
  );
}
