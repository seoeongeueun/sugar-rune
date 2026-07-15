import { useState, useEffect, useMemo, useRef, type PointerEvent } from "react";
import { twMerge } from "tailwind-merge";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { gsap } from "gsap";
import { formatDateForDb, parseNoteDate, shouldReclassify } from "@/lib";
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
  Stamp,
  Check,
} from "lucide-react";
import { useAuth, useNote } from "@/stores";
import { DeleteModal } from "@/components/modals";
import { ModalSimple } from "@/ui";

type POSTCARD_MODE = "view" | "edit" | "stamp";

type StampHeartId = "large" | "small";

type StampHeartPlacement = {
  x: number;
  y: number;
};

type StampDragState = {
  id: StampHeartId;
  offsetX: number;
  offsetY: number;
};

function clampStampPlacement(
  x: number,
  y: number,
  targetRect: DOMRect,
  containerRect: DOMRect,
): StampHeartPlacement {
  const maxX = Math.max(
    0,
    100 - (targetRect.width / containerRect.width) * 100,
  );
  const maxY = Math.max(
    0,
    100 - (targetRect.height / containerRect.height) * 100,
  );

  return {
    x: Math.min(Math.max(x, 0), maxX),
    y: Math.min(Math.max(y, 0), maxY),
  };
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
  const stampDragRef = useRef<StampDragState | null>(null);
  const [stampPlacements, setStampPlacements] = useState<
    Record<StampHeartId, StampHeartPlacement>
  >({
    large: { x: 62, y: 56 },
    small: { x: 8, y: 4 },
  });

  const MAX_CONTENT_LENGTH = 350; // Maximum number of characters allowed in the content

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

  const handleStampPointerDown = (
    event: PointerEvent<HTMLDivElement>,
    id: StampHeartId,
  ) => {
    if (mode !== "stamp") return;

    const front = postcardFrontRef.current;
    const target = event.currentTarget;

    if (!front) return;

    const frontRect = front.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    stampDragRef.current = {
      id,
      offsetX: event.clientX - targetRect.left,
      offsetY: event.clientY - targetRect.top,
    };
    target.setPointerCapture(event.pointerId);

    const nextX =
      ((event.clientX - frontRect.left - stampDragRef.current.offsetX) /
        frontRect.width) *
      100;
    const nextY =
      ((event.clientY - frontRect.top - stampDragRef.current.offsetY) /
        frontRect.height) *
      100;

    setStampPlacements((placements) => ({
      ...placements,
      [id]: clampStampPlacement(nextX, nextY, targetRect, frontRect),
    }));
  };

  const handleStampPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (mode !== "stamp" || !stampDragRef.current) return;

    const front = postcardFrontRef.current;
    const target = event.currentTarget;

    if (!front) return;

    const frontRect = front.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextX =
      ((event.clientX - frontRect.left - stampDragRef.current.offsetX) /
        frontRect.width) *
      100;
    const nextY =
      ((event.clientY - frontRect.top - stampDragRef.current.offsetY) /
        frontRect.height) *
      100;
    const id = stampDragRef.current.id;

    setStampPlacements((placements) => ({
      ...placements,
      [id]: clampStampPlacement(nextX, nextY, targetRect, frontRect),
    }));
  };

  const handleStampPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (stampDragRef.current) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    stampDragRef.current = null;
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
                <Stamp size={16} color="white" />
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
              <button
                type="button"
                aria-label="Save heart stamp positions"
                onClick={handleStampSaveClick}
                className="white-button px-2"
              >
                <Check size={16} color="white" />
              </button>
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
            className="front absolute inset-0 w-full h-full backface-hidden border-4 border-black outline-4 outline-postcard-background shadow-[0px_0px_0px_5px_var(--night)]"
          >
            <section className="flex flex-col w-[80%] h-[65%] place-center justify-start">
              <div className="flex flex-row items-center justify-between w-full pr-2 text-md">
                <div className="flex flex-row items-center w-fit mb-2 gap-2">
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
                <form id="postcard-content" className="w-full h-full text-lg">
                  <textarea
                    {...register("content")}
                    className="w-full h-full bg-transparent resize-none outline-background border-night/20 border rounded"
                    placeholder="Write your story here..."
                    value={content}
                    maxLength={MAX_CONTENT_LENGTH}
                    onChange={(e) => {
                      setContent(e.target.value);
                      setValue("content", e.target.value);
                    }}
                  />
                </form>
              ) : (
                <p className="whitespace-pre-line w-full h-full overflow-y-auto decoration-gray-400 text-lg">
                  {content}
                </p>
              )}
            </section>
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
