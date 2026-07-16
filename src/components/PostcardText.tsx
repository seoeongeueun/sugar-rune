import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { layoutNextLine, prepareWithSegments } from "@chenglou/pretext";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CircleObstacle = {
  pageIndex: number;
  cx: number;
  cy: number;
  radius: number;
};

type LayoutCursor = {
  segmentIndex: number;
  graphemeIndex: number;
};

type TextSlot = {
  left: number;
  right: number;
};

type TextInterval = {
  left: number;
  right: number;
};

type PositionedTextLine = {
  key: string;
  x: number;
  y: number;
  width: number;
  slotWidth: number;
  text: string;
};

type PositionedTextPage = PositionedTextLine[];

type PostcardTextProps = {
  content: string;
  width: number;
  height: number;
  obstacles: CircleObstacle[];
  pageIndex: number;
  onPageIndexChange: (pageIndex: number) => void;
};

const POSTCARD_TEXT_FONT =
  '20px "SpecialSymbols", "sonmat", system-ui, Avenir, Helvetica, Arial, sans-serif';
const POSTCARD_TEXT_LINE_HEIGHT = 30;
const POSTCARD_TEXT_LETTER_SPACING = 0;
const POSTCARD_TEXT_BOTTOM_PADDING = 8;

export const POSTCARD_STAMP_TEXT_GAP = 3;
export const POSTCARD_STAMP_TEXT_X_BIAS = 6;

function carveTextLineSlots(
  base: TextSlot,
  blockedIntervals: TextInterval[],
): TextSlot[] {
  let slots = [base];

  for (const blocked of blockedIntervals) {
    const nextSlots: TextSlot[] = [];

    for (const slot of slots) {
      if (blocked.right <= slot.left || blocked.left >= slot.right) {
        nextSlots.push(slot);
        continue;
      }

      if (blocked.left > slot.left) {
        nextSlots.push({
          left: slot.left,
          right: blocked.left,
        });
      }

      if (blocked.right < slot.right) {
        nextSlots.push({
          left: blocked.right,
          right: slot.right,
        });
      }
    }

    slots = nextSlots;
  }

  return slots.filter((slot) => slot.right - slot.left >= 0);
}

function circleIntervalForBand(
  obstacle: CircleObstacle,
  bandTop: number,
  bandBottom: number,
): TextInterval | null {
  const { cx, cy, radius } = obstacle;

  if (bandTop >= cy + radius || bandBottom <= cy - radius) {
    return null;
  }

  const minDy =
    cy >= bandTop && cy <= bandBottom
      ? 0
      : cy < bandTop
        ? bandTop - cy
        : cy - bandBottom;

  if (minDy >= radius) {
    return null;
  }

  const halfChord = Math.sqrt(radius * radius - minDy * minDy);

  return {
    left: cx - halfChord,
    right: cx + halfChord,
  };
}

function buildPostcardTextPages({
  prepared,
  width,
  height,
  obstacles,
}: {
  prepared: ReturnType<typeof prepareWithSegments>;
  width: number;
  height: number;
  obstacles: CircleObstacle[];
}): PositionedTextPage[] {
  if (width <= 0 || height <= 0) {
    return [];
  }

  const pages: PositionedTextPage[] = [];
  let cursor: LayoutCursor = {
    segmentIndex: 0,
    graphemeIndex: 0,
  };
  let lineKey = 0;
  let textExhausted = false;
  const layoutHeight = Math.max(0, height - POSTCARD_TEXT_BOTTOM_PADDING);

  while (!textExhausted) {
    const pageLines: PositionedTextLine[] = [];
    let lineTop = 0;
    const pageStartCursor = cursor;
    const pageObstacles = obstacles.filter(
      (obstacle) => obstacle.pageIndex === pages.length,
    );

    while (lineTop + POSTCARD_TEXT_LINE_HEIGHT <= layoutHeight) {
      const blockedIntervals = pageObstacles
        .map((obstacle) =>
          circleIntervalForBand(
            obstacle,
            lineTop,
            lineTop + POSTCARD_TEXT_LINE_HEIGHT,
          ),
        )
        .filter((interval): interval is TextInterval => interval !== null);

      const slots = carveTextLineSlots(
        { left: 0, right: width },
        blockedIntervals,
      ).sort((a, b) => a.left - b.left);

      for (const slot of slots) {
        const line = layoutNextLine(prepared, cursor, slot.right - slot.left);

        if (line === null) {
          textExhausted = true;
          break;
        }

        pageLines.push({
          key: `${pages.length}-${lineKey}-${cursor.segmentIndex}-${cursor.graphemeIndex}`,
          x: slot.left,
          y: lineTop,
          width: line.width,
          slotWidth: slot.right - slot.left,
          text: line.text.replace(/\s+$/, ""),
        });

        cursor = line.end;
        lineKey += 1;
      }

      if (textExhausted) {
        break;
      }

      lineTop += POSTCARD_TEXT_LINE_HEIGHT;
    }

    if (pageLines.length > 0) {
      pages.push(pageLines);
    }

    if (
      textExhausted ||
      (cursor.segmentIndex === pageStartCursor.segmentIndex &&
        cursor.graphemeIndex === pageStartCursor.graphemeIndex)
    ) {
      break;
    }
  }

  return pages;
}

export default function PostcardText({
  content,
  width,
  height,
  obstacles,
  pageIndex,
  onPageIndexChange,
}: PostcardTextProps) {
  const [fontRevision, setFontRevision] = useState(0);

  useEffect(() => {
    if (!("fonts" in document)) {
      return;
    }

    let isMounted = true;

    document.fonts.ready.then(() => {
      if (isMounted) {
        setFontRevision((revision) => revision + 1);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const prepared = useMemo(
    () =>
      prepareWithSegments(content, POSTCARD_TEXT_FONT, {
        whiteSpace: "pre-wrap",
        wordBreak: "normal",
        letterSpacing: POSTCARD_TEXT_LETTER_SPACING,
      }),
    [content, fontRevision],
  );

  const pages = useMemo(
    () =>
      buildPostcardTextPages({
        prepared,
        width,
        height,
        obstacles,
      }),
    [prepared, width, height, obstacles],
  );
  const pageCount = pages.length;
  const visiblePageIndex =
    pageCount === 0 ? 0 : Math.min(pageIndex, pageCount - 1);
  const lines = pages[visiblePageIndex] ?? [];

  useEffect(() => {
    onPageIndexChange(0);
  }, [content, onPageIndexChange]);

  useEffect(() => {
    if (pageIndex >= pageCount) {
      onPageIndexChange(Math.max(0, pageCount - 1));
    }
  }, [onPageIndexChange, pageCount, pageIndex]);

  const handlePreviousPage = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onPageIndexChange(Math.max(0, pageIndex - 1));
  };

  const handleNextPage = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onPageIndexChange(Math.min(pageCount - 1, pageIndex + 1));
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      aria-label={content}
    >
      {lines.map((line) => (
        <span
          key={line.key}
          aria-hidden="true"
          className="absolute block whitespace-pre"
          style={{
            left: `${line.x}px`,
            top: `${line.y}px`,
            width: `${line.slotWidth}px`,
            height: `${POSTCARD_TEXT_LINE_HEIGHT}px`,
            font: POSTCARD_TEXT_FONT,
            lineHeight: `${POSTCARD_TEXT_LINE_HEIGHT}px`,
            letterSpacing: `${POSTCARD_TEXT_LETTER_SPACING}px`,
          }}
        >
          {line.text}
        </span>
      ))}
      {visiblePageIndex > 0 && (
        <button
          type="button"
          aria-label="Previous text page"
          onClick={handlePreviousPage}
          className="fixed -left-2 top-1/2 z-60 flex -translate-y-1/2 black-button"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {visiblePageIndex < pageCount - 1 && (
        <button
          type="button"
          aria-label="Next text page"
          onClick={handleNextPage}
          className="fixed -right-2 top-1/2 z-60 -translate-y-1/2 black-button"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
