import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
  type MouseEvent,
} from "react";
import { twMerge } from "tailwind-merge";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { gsap } from "gsap";
import { layoutNextLine, prepareWithSegments } from "@chenglou/pretext";
import {
  formatDateForDb,
  parseNoteDate,
  shouldReclassify,
  MAX_CONTENT_LENGTH,
  STAMP_SIZE_ORDER,
  MAX_STAMPS,
} from "@/lib";
import { HEART_LIST } from "@/shared";
import {
  analyzeNoteHeartColor,
  createNote,
  notesQueryKeys,
  updateNote,
} from "@/features";
import PostCardCut from "./PostCardCut";
import {
  Trash2,
  SquarePen,
  Save,
  LoaderCircle,
  X,
  Stamp as StampIcon,
  Check,
  HeartOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth, useNote } from "@/stores";
import { DeleteModal } from "@/components/modals";
import { ModalSimple } from "@/ui";
import type { StampSize } from "@/lib";
import Stamp from "./Stamp";

type POSTCARD_MODE = "view" | "edit" | "stamp";

type PlacedStamp = {
  id: number;
  pageIndex: number;
  heartColor: string;
  size: StampSize;
  x: number;
  y: number;
};

type ParagraphSize = {
  width: number;
  height: number;
};

type LayoutCursor = {
  segmentIndex: number;
  graphemeIndex: number;
};

type CircleObstacle = {
  pageIndex: number;
  cx: number;
  cy: number;
  radius: number;
};

type TextSlot = {
  left: number;
  right: number;
};

type PositionedTextLine = {
  key: string;
  x: number;
  y: number;
  width: number;
  text: string;
};

type PositionedTextPage = PositionedTextLine[];

const POSTCARD_TEXT_FONT = '20px "sonmat"';
const POSTCARD_TEXT_LINE_HEIGHT = 30;
const POSTCARD_TEXT_LETTER_SPACING = 0;
const MIN_TEXT_SLOT_WIDTH = 20;
const STAMP_TEXT_GAP = 0;
const POSTCARD_TEXT_BOTTOM_PADDING = 8;

function carveTextLineSlots(
  base: TextSlot,
  blockedIntervals: TextSlot[],
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
        nextSlots.push({ left: slot.left, right: blocked.left });
      }

      if (blocked.right < slot.right) {
        nextSlots.push({ left: blocked.right, right: slot.right });
      }
    }

    slots = nextSlots;
  }

  return slots.filter((slot) => slot.right - slot.left >= MIN_TEXT_SLOT_WIDTH);
}

function circleIntervalForBand(
  obstacle: CircleObstacle,
  bandTop: number,
  bandBottom: number,
): TextSlot | null {
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
        .filter((interval): interval is TextSlot => interval !== null);

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
          text: line.text,
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

function PostcardText({
  content,
  width,
  height,
  obstacles,
  pageIndex,
  onPageIndexChange,
}: {
  content: string;
  width: number;
  height: number;
  obstacles: CircleObstacle[];
  pageIndex: number;
  onPageIndexChange: (pageIndex: number) => void;
}) {
  const prepared = useMemo(
    () =>
      prepareWithSegments(content, POSTCARD_TEXT_FONT, {
        whiteSpace: "pre-wrap",
        letterSpacing: POSTCARD_TEXT_LETTER_SPACING,
      }),
    [content],
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
            width: `${line.width}px`,
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

interface FormData {
  content: string;
}

export default function PostCard() {
  const note = useNote((state) => state.note);
  const closeNote = useNote((state) => state.closeNote);
  const updateContent = useNote((state) => state.updateContent);

  const initialDate = parseNoteDate(note?.date);
  const initialDateKey = note?.date ?? formatDateForDb(initialDate);
  const [mode, setMode] = useState<POSTCARD_MODE>(
    note?.content ? "view" : "edit",
  );
  const [displayDate, setDisplayDate] = useState<Date>(initialDate);
  const [noteDateKey, setNoteDateKey] = useState(initialDateKey);
  const [savedSnapshot, setSavedSnapshot] = useState({
    content: note?.content || "",
    date: initialDateKey,
    heartColor: note?.heart_content || HEART_LIST[HEART_LIST.length - 1].color,
  });
  const [deleteTrigger, setDeleteTrigger] = useState<number>(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [content, setContent] = useState<string>(note?.content || "");

  const user = useAuth((state) => state.user);
  const queryClient = useQueryClient();

  const heartColor =
    note?.heart_content || HEART_LIST[HEART_LIST.length - 1].color;
  const hasSavedNote = Boolean(note?.id);
  const showViewActions = mode === "view" && hasSavedNote;
  const showEditSaveAction = mode === "edit";
  const showStampSaveAction = mode === "stamp";
  const hasUnsavedChanges = useMemo(
    () =>
      content !== savedSnapshot.content ||
      heartColor !== savedSnapshot.heartColor,
    [content, heartColor, savedSnapshot],
  );

  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const postcardFrontRef = useRef<HTMLDivElement>(null);
  const paragraphRef = useRef<HTMLDivElement>(null);
  const stampIdRef = useRef(0);
  const [stamps, setStamps] = useState<PlacedStamp[]>([]);
  const [nextStampIndex, setNextStampIndex] = useState(0);
  const [textPageIndex, setTextPageIndex] = useState(0);
  const [paragraphSize, setParagraphSize] = useState<ParagraphSize>({
    width: 0,
    height: 0,
  });
  const [textObstacles, setTextObstacles] = useState<CircleObstacle[]>([]);
  const visibleStamps = useMemo(
    () => stamps.filter((stamp) => stamp.pageIndex === textPageIndex),
    [stamps, textPageIndex],
  );

  const { register, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: {
      content: content,
    },
  });

  //sync content state with react form
  useEffect(() => {
    setValue("content", content);
  }, [content, setValue]);

  useEffect(() => {
    const nextContent = note?.content || "";
    const nextDate = parseNoteDate(note?.date);
    const nextDateKey = note?.date ?? formatDateForDb(nextDate);

    setDisplayDate(nextDate);
    setNoteDateKey(nextDateKey);
    setContent(nextContent);
    setSavedSnapshot({
      content: nextContent,
      date: nextDateKey,
      heartColor,
    });
    setValue("content", nextContent);
    setMode(nextContent ? "view" : "edit");
  }, [heartColor, note?.content, note?.date, setValue]);

  //refresh error state after 5 seconds
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  useEffect(() => {
    const overlay = overlayRef.current;
    const card = cardRef.current;

    if (!overlay || !card) return;

    const ctx = gsap.context(() => {
      gsap.set(overlay, { autoAlpha: 0 });
      gsap.set(card, {
        autoAlpha: 0,
        y: 72,
        scale: 0.84,
        rotationX: 12,
        rotationZ: -8,
        transformOrigin: "50% 50%",
        willChange: "transform, opacity",
      });

      gsap
        .timeline()
        .to(overlay, {
          autoAlpha: 1,
          duration: 0.18,
          ease: "power1.out",
        })
        .to(
          card,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            rotationZ: 0,
            duration: 0.85,
            ease: "back.out(1.35)",
            clearProps: "willChange",
          },
          "-=0.02",
        );
    }, overlay);

    return () => {
      ctx.revert();
    };
  }, []);

  useLayoutEffect(() => {
    const paragraph = paragraphRef.current;
    const front = postcardFrontRef.current;

    if (!paragraph || !front) return;

    const updateTextLayoutMetrics = () => {
      const paragraphRect = paragraph.getBoundingClientRect();
      const stampElements =
        front.querySelectorAll<HTMLElement>("[data-stamp-id]");

      setParagraphSize({
        width: paragraph.clientWidth,
        height: paragraph.clientHeight,
      });

      setTextObstacles(
        Array.from(stampElements).map((stampElement) => {
          const stampRect = stampElement.getBoundingClientRect();
          const diameter = Math.min(stampRect.width, stampRect.height);

          return {
            pageIndex: Number(stampElement.dataset.stampPage ?? 0),
            cx: stampRect.left + stampRect.width / 2 - paragraphRect.left,
            cy: stampRect.top + stampRect.height / 2 - paragraphRect.top,
            radius: diameter / 2 + STAMP_TEXT_GAP,
          };
        }),
      );
    };

    updateTextLayoutMetrics();

    const resizeObserver = new ResizeObserver(updateTextLayoutMetrics);
    resizeObserver.observe(paragraph);
    resizeObserver.observe(front);
    front
      .querySelectorAll<HTMLElement>("[data-stamp-id]")
      .forEach((stampElement) => resizeObserver.observe(stampElement));

    return () => resizeObserver.disconnect();
  }, [mode, stamps]);

  const handleTextPageIndexChange = useCallback((nextPageIndex: number) => {
    setTextPageIndex(nextPageIndex);
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!user) {
      setSaveMessage("Sign in before saving a note.");
      return;
    }

    const nextContent = data.content.trim();

    if (!nextContent || nextContent.length === 0) {
      setSaveMessage("Content is empty.");
      return;
    }

    // If no changes, skip the saving and anlaysis process and return early
    if (!hasUnsavedChanges) {
      console.log("No changes detected, skipping save.");
      setMode("view");
      return;
    }

    const reclassify = shouldReclassify(note?.content ?? "", nextContent);

    setIsSaving(true);
    setSaveMessage(
      reclassify ? "Changes detected! Reanalyzing heart color..." : null,
    );

    try {
      const nextDateKey = noteDateKey;

      //reanalyze the heart color if the content has changed enough
      const nextHeartColor = reclassify
        ? await analyzeNoteHeartColor(nextContent)
        : heartColor;

      const savedNote = note?.id
        ? await updateNote({
            id: note.id,
            content: nextContent,
            date: nextDateKey,
            heartColor: nextHeartColor,
          })
        : await createNote({
            content: nextContent,
            date: nextDateKey,
            userId: user.id,
            heartColor: nextHeartColor,
          });

      setContent(nextContent);
      setSavedSnapshot({
        content: nextContent,
        date: nextDateKey,
        heartColor: nextHeartColor,
      });
      updateContent(nextContent, nextHeartColor, nextDateKey, savedNote.id);
      await queryClient.invalidateQueries({
        queryKey: notesQueryKeys.byUserId(user.id),
      });
      setMode("view");
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "Failed to save note.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = () => {
    setSaveMessage(null);
    setMode("edit");
  };

  const handleStampClick = () => {
    setSaveMessage(null);
    setMode("stamp");
  };

  const handleStampSaveClick = () => {
    setSaveMessage(null);
    setMode("view");
  };

  const handleEditSaveClick = () => {
    if (isSaving) {
      return;
    }

    void handleSubmit(onSubmit)();
  };

  const handlePostcardClick = (event: MouseEvent<HTMLDivElement>) => {
    if (mode !== "stamp") return;
    if (stamps.length >= MAX_STAMPS) return;

    const frontRect = event.currentTarget.getBoundingClientRect();
    const size = STAMP_SIZE_ORDER[nextStampIndex];
    const x = ((event.clientX - frontRect.left) / frontRect.width) * 100;
    const y = ((event.clientY - frontRect.top) / frontRect.height) * 100;

    setStamps((currentStamps) => [
      ...currentStamps,
      {
        id: stampIdRef.current++,
        heartColor,
        size,
        pageIndex: textPageIndex,
        x: Math.min(Math.max(x, 0), 100),
        y: Math.min(Math.max(y, 0), 100),
      },
    ]);
  };

  const handleRemoveStamp = (id: number) => {
    setStamps((currentStamps) =>
      currentStamps.filter((stamp) => stamp.id !== id),
    );
  };

  const handleRemoveCard = () => {
    setIsDeleting(true);
    setIsDeleteModalOpen(false);
    setDeleteTrigger((prev) => prev + 1);
  };

  const handleConfirmClose = () => {
    setIsCloseModalOpen(false);
    closeNote();
  };

  const handleCloseClick = () => {
    if (hasUnsavedChanges) {
      setIsCloseModalOpen(true);
      return;
    }

    closeNote();
  };

  return (
    <div
      ref={overlayRef}
      className="text-xl fixed inset-0 w-full h-full z-99 flex items-center justify-center bg-text/30"
    >
      <article
        ref={cardRef}
        className="pointer-events-auto group perspective-distant relative box-content p-16 rounded-xs w-postcard-width h-postcard-height "
      >
        <div className="group-hover:opacity-100 opacity-0 justify-self-start w-full flex flex-row items-center justify-between transition-opacity group-hover:pointer-events-auto pointer-events-none py-4 px-1 z-60">
          <div className="flex flex-row gap-2">
            {showViewActions && (
              <button
                type="button"
                aria-label="Edit note"
                onClick={handleEditClick}
                className="white-button px-2"
              >
                <SquarePen size={16} color="white" />
              </button>
            )}
            {showViewActions && (
              <button
                type="button"
                aria-label="Edit heart stamp"
                className="white-button px-2"
                onClick={handleStampClick}
              >
                <StampIcon size={16} color="white" />
              </button>
            )}
            {showViewActions && (
              <button
                type="button"
                aria-label="Delete note"
                onClick={() => setIsDeleteModalOpen(true)}
                className="white-button px-2"
              >
                <Trash2 size={16} color="white" />
              </button>
            )}
            {showEditSaveAction && (
              <button
                type="button"
                aria-label="Save note"
                onClick={handleEditSaveClick}
                disabled={isSaving}
                className="white-button px-2"
              >
                {isSaving ? (
                  <LoaderCircle
                    size={16}
                    color="white"
                    className="animate-spin"
                  />
                ) : (
                  <Save size={16} color="white" />
                )}
              </button>
            )}
            {showStampSaveAction && (
              <>
                <button
                  type="button"
                  aria-label="Save heart stamp positions"
                  onClick={handleStampSaveClick}
                  className="white-button px-2 aspect-square w-auto"
                >
                  <Check size={16} color="white" />
                </button>
                <button
                  type="button"
                  aria-label="Stamp size change"
                  className="white-button text-md h-12 font-sonmat"
                  onClick={() =>
                    setNextStampIndex(
                      (prev) => (prev + 1) % STAMP_SIZE_ORDER.length,
                    )
                  }
                >
                  {`${STAMP_SIZE_ORDER[nextStampIndex].charAt(0).toUpperCase()}`}
                </button>
                <button
                  type="button"
                  aria-label="Clear all stamps"
                  onClick={() => setStamps([])}
                  className="white-button h-12 w-12"
                >
                  <HeartOff size={16} color="white" />
                </button>
              </>
            )}
          </div>
          <button
            type="button"
            aria-label="Close Postcard"
            onClick={handleCloseClick}
            className="white-button px-2"
          >
            <X size={16} />
          </button>
        </div>
        {saveMessage && (
          <p className="text-shadow pointer-events-none absolute left-1/2 -bottom-16 z-70 w-[80%] text-center -translate-x-1/2 rounded-sm px-3 py-2 text-md text-white">
            {saveMessage}
          </p>
        )}
        {mode === "stamp" && (
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-16 text-white text-md">
            {stamps.length <= 0
              ? "Click on the postcard to add stamps"
              : `${visibleStamps.length} on this page · ${stamps.length} / ${MAX_STAMPS}`}
          </div>
        )}
        <div
          id="postcard-container"
          className={twMerge(
            "font-sonmat w-full h-full relative rotate-y-180 rotate-z-5 group-hover:rotate-y-0 group-hover:rotate-z-0 transform-3d transition-transform duration-300 bg-postcard-background shadow-md",
            (mode === "edit" ||
              mode === "stamp" ||
              isDeleteModalOpen ||
              isCloseModalOpen ||
              isDeleting) &&
              "rotate-y-0 rotate-z-0",
          )}
        >
          <div className="back absolute inset-0 w-full h-full backface-hidden rotate-y-180 flex items-center justify-center bg-night border-2 border-amber-50 outline-night outline-6">
            <img
              src="/assets/logo.png"
              alt="logo"
              className="w-full h-auto object-contain absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mix-blend-screen"
            />
          </div>
          <div
            ref={postcardFrontRef}
            onClick={handlePostcardClick}
            className={twMerge(
              "front absolute inset-0 w-full h-full backface-hidden overflow-hidden border-4 border-black outline-4 outline-postcard-background shadow-[0px_0px_0px_5px_var(--night)]",
              mode === "stamp" && "cursor-copy",
            )}
          >
            <section className="flex flex-col w-[80%] h-full py-20 min-h-0 place-center justify-start">
              <div className="flex flex-row items-center mt-6 mb-2 h-min justify-between w-full pr-2 text-md">
                <div className="flex flex-row items-center w-fit gap-2">
                  <img
                    src={`/hearts/heart_${heartColor}_icon.png`}
                    alt="heart"
                    className="w-8 h-8 object-contain"
                  />
                  <span>Date</span>
                  <span className="text-background underline underline-offset-4 decoration-1">
                    {displayDate.toLocaleDateString().replace(/\//g, ". ")}
                  </span>
                </div>
                <div className=" text-sm">
                  <span
                    className={`${content.length >= MAX_CONTENT_LENGTH ? "text-background" : ""}`}
                  >
                    {content.length}
                  </span>{" "}
                  / {MAX_CONTENT_LENGTH}
                </div>
              </div>
              {mode === "edit" ? (
                <form
                  id="postcard-content"
                  className="w-full min-h-0 flex-1 text-lg"
                >
                  <textarea
                    {...register("content")}
                    className="w-full bg-transparent resize-none outline-background border-night/20 border rounded"
                    placeholder="Write your story here..."
                    value={content}
                    rows={8}
                    maxLength={MAX_CONTENT_LENGTH}
                    onChange={(e) => {
                      setContent(e.target.value);
                      setValue("content", e.target.value);
                    }}
                  />
                </form>
              ) : (
                <div
                  ref={paragraphRef}
                  className="relative min-h-0 w-full flex-1 overflow-hidden"
                >
                  <PostcardText
                    content={content}
                    width={paragraphSize.width}
                    height={paragraphSize.height}
                    obstacles={textObstacles}
                    pageIndex={textPageIndex}
                    onPageIndexChange={handleTextPageIndexChange}
                  />
                </div>
              )}
            </section>

            {stamps.map((stamp) => (
              <Stamp
                key={stamp.id}
                id={stamp.id}
                pageIndex={stamp.pageIndex}
                isVisible={stamp.pageIndex === textPageIndex}
                heartColor={stamp.heartColor}
                size={stamp.size}
                x={stamp.x}
                y={stamp.y}
                isEditable={mode === "stamp"}
                onRemove={() => handleRemoveStamp(stamp.id)}
              />
            ))}
          </div>
        </div>
      </article>
      {isDeleteModalOpen && showViewActions && (
        <DeleteModal
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={handleRemoveCard}
        />
      )}
      {isCloseModalOpen && (
        <ModalSimple
          title="Close Card?"
          description="Unsaved changes will be gone."
          onClose={() => setIsCloseModalOpen(false)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                className="bg-[url('/hearts/heart_white_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
              >
                <span className="z-10">No</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="bg-[url('/hearts/heart_purple_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
              >
                <span className="z-10">Yes</span>
              </button>
            </>
          }
        />
      )}
      <PostCardCut originalRef={cardRef} deleteTrigger={deleteTrigger} />
    </div>
  );
}
