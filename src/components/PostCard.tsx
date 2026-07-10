import { useState, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { gsap } from "gsap";
import { formatDateForDb, getSubmittedDate, HEART_LIST } from "@/lib";
import { createNote, notesQueryKeys } from "@/features";
import PostCardCut from "./PostCardCut";
import { Trash2, SquarePen, Save, Crown, LoaderCircle } from "lucide-react";
import { useAuth, useNote } from "@/stores";

type POSTCARD_MODE = "view" | "edit";

interface FormData {
  month: string;
  day: string;
  year: string;
  content: string;
}

export default function PostCard() {
  const [mode, setMode] = useState<POSTCARD_MODE>("view");
  const [date, setDate] = useState<Date>(new Date());
  const [deleteTrigger, setDeleteTrigger] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // const [content, setContent] = useState<string>(
  //   "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 𖤐 ",
  // );
  const [content, setContent] = useState<string>(
    useNote((state) => state.note?.content) || "",
  );
  const closeNote = useNote((state) => state.closeNote);
  const updateContent = useNote((state) => state.updateContent);
  const user = useAuth((state) => state.user);
  const queryClient = useQueryClient();

  const heartColor =
    useNote((state) => state.note?.heart_content) || HEART_LIST[0].color;

  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: {
      month: "",
      day: "",
      year: "",
      content: content,
    },
  });

  //sync content state with react form
  useEffect(() => {
    setValue("content", content);
  }, [content, setValue]);

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

    if (!nextContent || nextContent.length === 0) {
      setSaveError("Content is empty.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await createNote({
        content: nextContent,
        date: formatDateForDb(nextDate),
        userId: user.id,
        heartColor,
      });

      setDate(nextDate);
      setContent(nextContent);
      updateContent(nextContent, heartColor);
      await queryClient.invalidateQueries({
        queryKey: notesQueryKeys.byUserYear(user.id, nextDate.getFullYear()),
      });
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
    setDeleteTrigger((prev) => prev + 1);
  };

  return (
    <div
      ref={overlayRef}
      className="text-xl fixed inset-0 w-full h-full z-99 flex items-center justify-center bg-text/30"
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          e.stopPropagation();
          closeNote();
        }
      }}
    >
      <article
        ref={cardRef}
        className="pointer-events-auto group perspective-distant relative box-content p-16 rounded-xs w-postcard-width h-postcard-height "
      >
        <div className="group-hover:opacity-100 opacity-0 justify-self-start w-full flex flex-row items-center justify-between transition-opacity group-hover:pointer-events-auto pointer-events-none p-4 z-60">
          <button
            type="button"
            onClick={handleButtonClick}
            disabled={isSaving}
            className="bg-black rounded-full p-2 hover:bg-background transition-colors flex items-center justify-center"
          >
            {isSaving ? (
              <LoaderCircle size={16} color="white" className="animate-spin" />
            ) : mode === "view" ? (
              <SquarePen size={16} color="white" />
            ) : (
              <Save size={16} color="white" />
            )}
          </button>
          <button
            type="button"
            onClick={() => handleRemoveCard()}
            className="bg-black rounded-full p-2 hover:bg-background transition-colors flex items-center justify-center"
          >
            <Trash2 size={16} color="white" />
          </button>
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
            mode === "edit" && "rotate-y-0 rotate-z-0",
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
                <div className="flex flex-row items-end w-fit px-4 text-lg mb-4">
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
                      placeholder={new Date().toLocaleString("default", {
                        month: "2-digit",
                      })}
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
                      placeholder={new Date().toLocaleString("default", {
                        day: "2-digit",
                      })}
                      min="1"
                      max="31"
                      maxLength={2}
                    />
                    <span>.</span>
                    <input
                      {...register("year", {
                        min: 2000,
                        max: 9999,
                        valueAsNumber: false,
                      })}
                      type="number"
                      className="w-24 px-1 bg-transparent border-b border-gray-300 focus:border-background outline-none text-center"
                      placeholder={new Date().toLocaleString("default", {
                        year: "numeric",
                      })}
                      min="2000"
                      max="9999"
                      maxLength={4}
                    />
                  </div>
                </div>
                <textarea
                  {...register("content")}
                  className="p-4 w-full h-full bg-transparent resize-none outline-background"
                  placeholder="Write your story here..."
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setValue("content", e.target.value);
                  }}
                />
              </form>
            ) : (
              <section className="p-4 place-center text-lg flex flex-col w-[80%] h-[65%] place-center justify-between">
                <div className="flex flex-row items-center w-fit mb-2 gap-2">
                  <Crown fill="var(--color-night)" className="w-4 h-4" />
                  <span>Date</span>
                  <span className="text-background underline underline-offset-4 decoration-1">
                    {date.toLocaleDateString().replace(/\//g, ". ")}
                  </span>
                </div>
                <p className="w-full h-full overflow-y-auto  decoration-gray-400">
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
      <PostCardCut originalRef={cardRef} deleteTrigger={deleteTrigger} />
    </div>
  );
}
