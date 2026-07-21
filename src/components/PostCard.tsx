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
import {
  formatDateForDb,
  parseNoteDate,
  shouldReclassify,
  MAX_CONTENT_LENGTH,
  STAMP_SIZE_ORDER,
  STAMP_SIZE_REM,
  MAX_STAMPS,
} from "@/lib";
import { HEART_LIST } from "@/shared";
import {
  analyzeNoteHeartColor,
  createNote,
  notesQueryKeys,
  updateNote,
  userProfileQueryKeys,
  useDeleteNote,
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
} from "lucide-react";
import { useAuth, useNote } from "@/stores";
import { DeleteModal } from "@/components/modals";
import { ModalSimple } from "@/ui";
import type { StampData } from "@/lib";
import Stamp from "./Stamp";
import PostcardText, {
  POSTCARD_STAMP_TEXT_GAP,
  POSTCARD_STAMP_TEXT_X_BIAS,
  type CircleObstacle,
} from "./PostcardText";

type POSTCARD_MODE = "view" | "edit" | "stamp";

type PlacedStamp = StampData;

const DESIGN_POSTCARD_WIDTH_REM = 60;

type ParagraphMetrics = {
  width: number;
  height: number;
  offsetLeft: number;
  offsetTop: number;
  frontWidth: number;
  frontHeight: number;
  remPx: number;
  postcardScale: number;
};

interface FormData {
  content: string;
}

function areStampsEqual(left: PlacedStamp[], right: PlacedStamp[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((stamp, index) => {
    const otherStamp = right[index];

    return (
      otherStamp !== undefined &&
      stamp.id === otherStamp.id &&
      stamp.pageIndex === otherStamp.pageIndex &&
      stamp.size === otherStamp.size &&
      stamp.x === otherStamp.x &&
      stamp.y === otherStamp.y
    );
  });
}

function getLayoutOffsetWithin(
  element: HTMLElement,
  ancestor: HTMLElement,
): { left: number; top: number } {
  let left = 0;
  let top = 0;
  let currentElement: HTMLElement | null = element;

  while (currentElement && currentElement !== ancestor) {
    left += currentElement.offsetLeft;
    top += currentElement.offsetTop;
    currentElement = currentElement.offsetParent as HTMLElement | null;
  }

  return { left, top };
}

export default function PostCard() {
  const note = useNote((state) => state.note);
  const closeNote = useNote((state) => state.closeNote);
  const updateContent = useNote((state) => state.updateContent);
  const updateStamps = useNote((state) => state.updateStamps);

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
    stamps: note?.stamps ?? [],
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
  const deleteNoteMutation = useDeleteNote(user?.id);

  const heartColor =
    note?.heart_content || HEART_LIST[HEART_LIST.length - 1].color;
  const hasSavedNote = Boolean(note?.id);
  const showViewActions = mode === "view" && hasSavedNote;
  const showEditSaveAction = mode === "edit";
  const showStampSaveAction = mode === "stamp";

  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const postcardFrontRef = useRef<HTMLDivElement>(null);
  const paragraphRef = useRef<HTMLDivElement>(null);
  const stampIdRef = useRef(0);
  const [stamps, setStamps] = useState<PlacedStamp[]>([]);
  const [nextStampIndex, setNextStampIndex] = useState(0);
  const [textPageIndex, setTextPageIndex] = useState(0);
  const hasUnsavedChanges = useMemo(
    () =>
      content !== savedSnapshot.content ||
      heartColor !== savedSnapshot.heartColor ||
      !areStampsEqual(stamps, savedSnapshot.stamps),
    [content, heartColor, savedSnapshot, stamps],
  );
  const [paragraphMetrics, setParagraphMetrics] = useState<ParagraphMetrics>({
    width: 0,
    height: 0,
    offsetLeft: 0,
    offsetTop: 0,
    frontWidth: 0,
    frontHeight: 0,
    remPx: 16,
    postcardScale: 1,
  });
  const visibleStamps = useMemo(
    () => stamps.filter((stamp) => stamp.pageIndex === textPageIndex),
    [stamps, textPageIndex],
  );
  const textObstacles = useMemo<CircleObstacle[]>(
    () =>
      stamps.map((stamp) => {
        const diameter =
          STAMP_SIZE_REM[stamp.size] *
          paragraphMetrics.remPx *
          paragraphMetrics.postcardScale;

        return {
          pageIndex: stamp.pageIndex,
          cx:
            (stamp.x / 100) * paragraphMetrics.frontWidth -
            paragraphMetrics.offsetLeft +
            POSTCARD_STAMP_TEXT_X_BIAS,
          cy:
            (stamp.y / 100) * paragraphMetrics.frontHeight -
            paragraphMetrics.offsetTop,
          radius: diameter / 2 + POSTCARD_STAMP_TEXT_GAP,
        };
      }),
    [paragraphMetrics, stamps],
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
    setStamps(note?.stamps ?? []);
    stampIdRef.current =
      (note?.stamps ?? []).reduce(
        (nextId, stamp) => Math.max(nextId, stamp.id + 1),
        0,
      ) ?? 0;
    setSavedSnapshot({
      content: nextContent,
      date: nextDateKey,
      heartColor,
      stamps: note?.stamps ?? [],
    });
    setValue("content", nextContent);
    setMode(nextContent ? "view" : "edit");
  }, [heartColor, note?.content, note?.date, note?.stamps, setValue]);

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
      const paragraphOffset = getLayoutOffsetWithin(paragraph, front);
      const remPx = Number.parseFloat(
        window.getComputedStyle(document.documentElement).fontSize,
      );
      const safeRemPx = Number.isFinite(remPx) ? remPx : 16;
      const designPostcardWidth = DESIGN_POSTCARD_WIDTH_REM * safeRemPx;
      const postcardScale =
        designPostcardWidth > 0 ? front.clientWidth / designPostcardWidth : 1;

      setParagraphMetrics({
        width: paragraph.clientWidth,
        height: paragraph.clientHeight,
        offsetLeft: paragraphOffset.left,
        offsetTop: paragraphOffset.top,
        frontWidth: front.clientWidth,
        frontHeight: front.clientHeight,
        remPx: safeRemPx,
        postcardScale,
      });
    };

    updateTextLayoutMetrics();

    const resizeObserver = new ResizeObserver(updateTextLayoutMetrics);
    resizeObserver.observe(paragraph);
    resizeObserver.observe(front);
    window.addEventListener("resize", updateTextLayoutMetrics);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateTextLayoutMetrics);
    };
  }, [mode]);

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
            stamps,
          })
        : await createNote({
            content: nextContent,
            date: nextDateKey,
            userId: user.id,
            heartColor: nextHeartColor,
            stamps,
          });

      setContent(nextContent);
      setSavedSnapshot({
        content: nextContent,
        date: nextDateKey,
        heartColor: nextHeartColor,
        stamps,
      });
      updateContent(
        nextContent,
        nextHeartColor,
        nextDateKey,
        savedNote.id,
        stamps,
      );
      await queryClient.invalidateQueries({
        queryKey: notesQueryKeys.byUserId(user.id),
      });
      await queryClient.invalidateQueries({
        queryKey: userProfileQueryKeys.byUserId(user.id),
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

  const handleStampSaveClick = async () => {
    setSaveMessage(null);

    if (isSaving) {
      return;
    }

    if (!user) {
      setSaveMessage("Sign in before saving stamps.");
      return;
    }

    if (!note?.id) {
      setSaveMessage("Save the note before saving stamps.");
      return;
    }

    if (areStampsEqual(stamps, savedSnapshot.stamps)) {
      closeNote();
      return;
    }

    setIsSaving(true);

    try {
      await updateNote({
        id: note.id,
        content,
        date: noteDateKey,
        heartColor,
        stamps,
      });
      updateStamps(stamps);
      setSavedSnapshot((currentSnapshot) => ({
        ...currentSnapshot,
        stamps,
      }));
      await queryClient.invalidateQueries({
        queryKey: notesQueryKeys.byUserId(user.id),
      });
      setMode("view");
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "Failed to save stamps.",
      );
    } finally {
      setIsSaving(false);
    }
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

    const size = STAMP_SIZE_ORDER[nextStampIndex];
    const x =
      (event.nativeEvent.offsetX / event.currentTarget.clientWidth) * 100;
    const y =
      (event.nativeEvent.offsetY / event.currentTarget.clientHeight) * 100;

    setStamps((currentStamps) => [
      ...currentStamps,
      {
        id: stampIdRef.current++,
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

  const handleRemoveCard = async () => {
    if (!note?.id || !user) {
      setIsDeleteModalOpen(false);
      return;
    }

    setIsDeleting(true);
    setIsDeleteModalOpen(false);

    deleteNoteMutation.mutate(
      { id: note.id },
      {
        onSuccess: () => {
          setDeleteTrigger((prev) => prev + 1);
        },
        onError: (error) => {
          setIsDeleting(false);
          setSaveMessage(
            error instanceof Error ? error.message : "Failed to delete note.",
          );
        },
      },
    );
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

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.closest(
        "a, button, input, textarea, select, [contenteditable='true']",
      )
    ) {
      return;
    }

    cardRef.current?.focus();
  };

  return (
    <div
      ref={overlayRef}
      className="text-xl fixed inset-0 w-full h-full z-99 flex items-center justify-center bg-text/30"
    >
      <article
        ref={cardRef}
        tabIndex={-1}
        onClick={handleCardClick}
        className="pointer-events-auto group perspective-distant relative box-content p-4 tablet:p-16 rounded-xs w-postcard-width aspect-[var(--postcard-ratio)] tablet:aspect-auto tablet:h-postcard-height outline-none"
      >
        <div className="group-hover:opacity-100 desktop:opacity-0 justify-self-start w-full flex flex-row items-center justify-between transition-opacity group-hover:pointer-events-auto desktop:pointer-events-none py-4 px-1 z-60">
          <div className="flex flex-row gap-2">
            {showViewActions && (
              <button
                type="button"
                aria-label="Edit note"
                onClick={handleEditClick}
                className="white-button px-1 tablet:px-2"
              >
                <SquarePen color="white" className="w-6 h-6" />
              </button>
            )}
            {showViewActions && (
              <button
                type="button"
                aria-label="Edit heart stamp"
                className="white-button px-1 tablet:px-2"
                onClick={handleStampClick}
              >
                <StampIcon color="white" className="w-6 h-6" />
              </button>
            )}
            {showViewActions && (
              <button
                type="button"
                aria-label="Delete note"
                onClick={() => setIsDeleteModalOpen(true)}
                className="white-button px-1 tablet:px-2"
              >
                <Trash2 color="white" className="w-6 h-6" />
              </button>
            )}
            {showEditSaveAction && (
              <button
                type="button"
                aria-label="Save note"
                onClick={handleEditSaveClick}
                disabled={isSaving}
                className="white-button px-1 tablet:px-2"
              >
                {isSaving ? (
                  <LoaderCircle
                    color="white"
                    className="w-4 h-4 animate-spin"
                  />
                ) : (
                  <Save color="white" className="w-6 h-6" />
                )}
              </button>
            )}
            {showStampSaveAction && (
              <>
                <button
                  type="button"
                  aria-label="Save heart stamp positions"
                  onClick={handleStampSaveClick}
                  disabled={isSaving}
                  className="white-button flex-1 px-1 tablet:px-2 aspect-square w-auto"
                >
                  {isSaving ? (
                    <LoaderCircle
                      color="white"
                      className="animate-spin w-6 h-6"
                    />
                  ) : areStampsEqual(stamps, savedSnapshot.stamps) ? (
                    <Check color="white" className="w-6 h-6" />
                  ) : (
                    <Save color="white" className="w-6 h-6" />
                  )}
                </button>
                <button
                  type="button"
                  aria-label="Stamp size change"
                  className="white-button w-[22px] tablet:w-[27px] text-md font-sonmat"
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
                  className="white-button flex-1 px-1 tablet:px-2"
                >
                  <HeartOff color="white" className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
          <button
            type="button"
            aria-label="Close Postcard"
            onClick={handleCloseClick}
            className="white-button px-1 tablet:px-2"
          >
            <X color="white" className="w-6 h-6" />
          </button>
        </div>
        {saveMessage && (
          <p className="pointer-events-none absolute left-1/2 -bottom-16 z-70 w-[80%] text-center -translate-x-1/2 rounded-sm px-3 py-2 text-md text-white">
            {saveMessage}
          </p>
        )}
        {mode === "stamp" && (
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 tablet:-bottom-16 text-white text-md whitespace-nowrap">
            {stamps.length <= 0
              ? "Click on the postcard to add stamps"
              : `${visibleStamps.length} on this page · ${stamps.length} / ${MAX_STAMPS}`}
          </div>
        )}
        <div
          id="postcard-container"
          className={twMerge(
            "font-sonmat w-full h-full relative rotate-y-180 rotate-z-5 desktop:group-hover:rotate-y-0 desktop:group-hover:rotate-z-0 transform-3d transition-transform duration-300 bg-postcard-background shadow-md [article:focus-within_&]:rotate-y-0 [article:focus-within_&]:rotate-z-0",
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
            className={twMerge(
              "front absolute inset-0 w-full h-full backface-hidden overflow-hidden border-4 border-black outline-4 outline-postcard-background shadow-[0px_0px_0px_5px_var(--night)]",
              mode === "stamp" && "cursor-copy",
            )}
          >
            <section className="absolute left-[10%] top-0 flex h-full w-[80%] min-h-0 flex-col justify-start tablet:py-20">
              <div className="flex flex-row items-center mt-14 tablet:mt-6 tablet:mb-2 h-min justify-between w-full pr-2 text-sm tablet:text-md">
                <div className="flex flex-row items-center w-fit gap-2">
                  <span>Date</span>
                  <span className="text-background underline underline-offset-4 decoration-1">
                    {displayDate.toLocaleDateString().replace(/\//g, ". ")}
                  </span>
                  <img
                    src={`/hearts/heart_${heartColor}_icon.png`}
                    alt="heart"
                    className="w-6 h-6 tablet:w-8 tablet:h-8 object-contain tablet:mb-1"
                  />
                </div>
                <div className="text-sm">
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
                    className="w-full bg-transparent max-h-[90%] tablet:max-h-full resize-none outline-background border-night/20 border rounded"
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
                  className="relative min-h-0 max-h-[90%] tablet:max-h-full w-full flex-1 overflow-hidden"
                >
                  <PostcardText
                    content={content}
                    width={paragraphMetrics.width}
                    height={paragraphMetrics.height}
                    obstacles={textObstacles}
                    pageIndex={textPageIndex}
                    onPageIndexChange={handleTextPageIndexChange}
                  />
                </div>
              )}
            </section>

            {mode === "stamp" && (
              <div
                aria-label="Add stamp"
                className="absolute inset-0 z-40 cursor-copy"
                onClick={handlePostcardClick}
              />
            )}

            {mode !== "edit" &&
              stamps.map((stamp) => (
                <Stamp
                  key={stamp.id}
                  isVisible={stamp.pageIndex === textPageIndex}
                  heartColor={heartColor}
                  size={stamp.size}
                  x={stamp.x}
                  y={stamp.y}
                  scale={paragraphMetrics.postcardScale}
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
