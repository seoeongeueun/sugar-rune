import { useState, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { gsap } from "gsap";
import {
  CALENDAR_START_YEAR,
  getSubmittedDate,
  HEART_LIST,
  parseNoteDate,
  getDateFormValues,
} from "@/lib";
import { createNote, notesQueryKeys, updateNote } from "@/features";
import PostCardCut from "./PostCardCut";
import { Trash2, SquarePen, Save, Crown, LoaderCircle, X } from "lucide-react";
import { useAuth, useNote } from "@/stores";
import { DeleteModal } from "@/components/modals";
import { ModalSimple } from "@/ui";

type POSTCARD_MODE = "view" | "edit";

interface FormData {
  month: string;
  day: string;
  year: string;
  content: string;
}

export default function PostCard() {
  const note = useNote((state) => state.note);
  const currentYear = new Date().getFullYear();
  const initialDate = parseNoteDate(note?.date);
  const [mode, setMode] = useState<POSTCARD_MODE>(
    note?.content ? "view" : "edit",
  );
  const [date, setDate] = useState<Date>(initialDate);
  const [deleteTrigger, setDeleteTrigger] = useState<number>(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // const [content, setContent] = useState<string>(
  //   "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 𖤐 ",
  // );
  const [content, setContent] = useState<string>(note?.content || "");
  const closeNote = useNote((state) => state.closeNote);
  const updateContent = useNote((state) => state.updateContent);
  const user = useAuth((state) => state.user);
  const queryClient = useQueryClient();

  const heartColor = note?.heart_content || HEART_LIST[0].color;
  const canDeleteNote = Boolean(note?.id);

  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const MAX_CONTENT_LENGTH = 300; // Maximum number of characters allowed in the content

  const { register, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: {
      ...getDateFormValues(initialDate),
      content: content,
    },
  });

  console.log("PostCard render", { note, content, date, mode });

  //sync content state with react form
  useEffect(() => {
    setValue("content", content);
  }, [content, setValue]);

  useEffect(() => {
    const nextContent = note?.content || "";
    const nextDate = parseNoteDate(note?.date);
    const nextDateValues = getDateFormValues(nextDate);

    setDate(nextDate);
    setContent(nextContent);
    setValue("month", nextDateValues.month);
    setValue("day", nextDateValues.day);
    setValue("year", nextDateValues.year);
    setValue("content", nextContent);
    setMode(nextContent ? "view" : "edit");
  }, [note?.content, note?.date, setValue]);

  //refresh error state after 5 seconds
  useEffect(() => {
    if (saveError) {
      const timer = setTimeout(() => {
        setSaveError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [saveError]);

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
      setSaveError("Sign in before saving a note.");
      return;
    }

    const nextDate = getSubmittedDate(data, date);
    const nextContent = data.content.trim();
    const minDate = new Date(CALENDAR_START_YEAR, 0, 1);
    const maxDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    if (nextDate < minDate || nextDate > maxDate) {
      setSaveError(
        `Date must be between ${CALENDAR_START_YEAR} and ${currentYear}.`,
      );
      return;
    }

    if (!nextContent || nextContent.length === 0) {
      setSaveError("Content is empty.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const nextDateValues = getDateFormValues(nextDate);
      const nextDateKey = `${nextDateValues.year}-${nextDateValues.month}-${nextDateValues.day}`;
      const savedNote = note?.id
        ? await updateNote({
            id: note.id,
            content: nextContent,
            date: nextDateKey,
            heartColor,
          })
        : await createNote({
            content: nextContent,
            date: nextDateKey,
            userId: user.id,
            heartColor,
          });

      setDate(nextDate);
      setValue("month", nextDateValues.month);
      setValue("day", nextDateValues.day);
      setValue("year", nextDateValues.year);
      setContent(nextContent);
      updateContent(nextContent, heartColor, nextDateKey, savedNote.id);
      await queryClient.invalidateQueries({
        queryKey: notesQueryKeys.byUserYear(user.id, nextDate.getFullYear()),
      });
      const previousYear = note?.date
        ? parseNoteDate(note.date).getFullYear()
        : nextDate.getFullYear();

      if (previousYear !== nextDate.getFullYear()) {
        await queryClient.invalidateQueries({
          queryKey: notesQueryKeys.byUserYear(user.id, previousYear),
        });
      }
      setMode("view");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save note.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleButtonClick = () => {
    if (isSaving) {
      return;
    }

    if (mode === "view") {
      setSaveError(null);
      setMode("edit");
    } else {
      void handleSubmit(onSubmit)();
    }
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
          <button
            type="button"
            onClick={handleButtonClick}
            disabled={isSaving}
            className="white-button px-2"
          >
            {isSaving ? (
              <LoaderCircle size={16} color="white" className="animate-spin" />
            ) : mode === "view" ? (
              <SquarePen size={16} color="white" />
            ) : (
              <Save size={16} color="white" />
            )}
          </button>
          {canDeleteNote ? (
            <div className="flex flex-row gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="white-button px-2"
              >
                <Trash2 size={16} color="white" />
              </button>
              <button
                type="button"
                aria-label="Close Postcard"
                onClick={() =>
                  content.length > 0 ? setIsCloseModalOpen(true) : closeNote()
                }
                className="white-button px-2"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label="Close Postcard"
              onClick={() =>
                content.length > 0 ? setIsCloseModalOpen(true) : closeNote()
              }
              className="white-button px-2"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {saveError && (
          <p className="text-shadow pointer-events-none absolute left-1/2 -bottom-16 z-70 w-max max-w-80 -translate-x-1/2 rounded-sm px-3 py-2 text-md text-white">
            {saveError}
          </p>
        )}
        <div
          id="postcard-container"
          className={twMerge(
            "w-full h-full relative rotate-y-180 rotate-z-5 group-hover:rotate-y-0 group-hover:rotate-z-0 transform-3d transition-transform duration-300 bg-postcard-background shadow-md",
            (mode === "edit" ||
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
          <div className="front bg-[url('/assets/frame.svg')] bg-no-repeat bg-center absolute inset-0 w-full h-full backface-hidden border-4 border-black outline-4 outline-postcard-background shadow-[0px_0px_0px_5px_var(--night)]">
            {mode === "edit" ? (
              <form
                id="postcard-content"
                className="flex flex-col w-[80%] h-[65%] place-center justify-between"
              >
                <div className="flex flex-row items-center justify-between w-full px-2 text-md">
                  <div className="flex flex-row items-center w-fit mb-2 gap-2">
                    <Crown fill="var(--color-night)" className="w-4 h-4" />
                    <span>Date</span>
                    <input
                      {...register("month", {
                        min: 1,
                        max: 12,
                        valueAsNumber: false,
                      })}
                      type="number"
                      className="w-16 px-1 bg-transparent border-b border-gray-300 focus:border-background outline-none text-center"
                      placeholder={getDateFormValues(date).month}
                      min="1"
                      max="12"
                      maxLength={2}
                    />
                    <span>.</span>
                    <input
                      {...register("day", {
                        min: 1,
                        max: 31,
                        valueAsNumber: false,
                      })}
                      type="number"
                      className="w-16 px-1 bg-transparent border-b border-gray-300 focus:border-background outline-none text-center"
                      placeholder={getDateFormValues(date).day}
                      min="1"
                      max="31"
                      maxLength={2}
                    />
                    <span>.</span>
                    <input
                      {...register("year", {
                        min: CALENDAR_START_YEAR,
                        max: currentYear,
                        valueAsNumber: false,
                      })}
                      type="number"
                      className="w-24 px-1 bg-transparent border-b border-gray-300 focus:border-background outline-none text-center"
                      placeholder={getDateFormValues(date).year}
                      min={CALENDAR_START_YEAR}
                      max={currentYear}
                      maxLength={4}
                    />
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
                <textarea
                  {...register("content")}
                  className="tracking-tighter px-4 w-full h-full text-lg bg-transparent resize-none outline-background"
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
              <section className="p-2 place-center text-md flex flex-col w-[80%] h-[65%] place-center justify-between">
                <div className="flex flex-row items-center w-fit mb-2 gap-2">
                  <Crown fill="var(--color-night)" className="w-4 h-4" />
                  <span>Date</span>
                  <span className="text-background underline underline-offset-4 decoration-1">
                    {date.toLocaleDateString().replace(/\//g, ". ")}
                  </span>
                </div>
                <p className="tracking-tighter w-full h-full overflow-y-auto  decoration-gray-400 text-lg">
                  {content}
                </p>
              </section>
            )}
            <div className="heart-sticker pointer-events-none rotate-z-10 absolute -bottom-6 right-0 p-8 ">
              <img
                src={`/hearts/heart_${heartColor}_icon.png`}
                alt="heart"
                className="w-60 h-60 object-contain"
              />
            </div>
            <div className="heart-sticker pointer-events-none -rotate-z-15 absolute top-2 left-8 p-8">
              <img
                src={`/hearts/heart_${heartColor}_icon.png`}
                alt="heart"
                className="w-20 h-20 object-contain"
              />
            </div>
          </div>
        </div>
      </article>
      {isDeleteModalOpen && canDeleteNote && (
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
