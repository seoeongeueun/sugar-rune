import { useState, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { useForm } from "react-hook-form";
import { HEART_COLORS } from "@/lib/constants";
import PostCardCut from "./PostCardCut";
import { Trash2, SquarePen, Save, Crown } from "lucide-react";
import { useNote } from "@/stores";

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
  const [content, setContent] = useState<string>(
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 𖤐 ",
  );

  const heartColor =
    useNote((state) => state.note?.heart_content) || HEART_COLORS[0];

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

  const onSubmit = (data: FormData) => {
    const { month, day, year, content } = data;

    if (month && day && year) {
      const dateString = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      setDate(new Date(dateString));
    }

    setContent(content);
    setMode("view");
  };

  const handleButtonClick = () => {
    if (mode === "view") {
      setMode("edit");
    } else {
      handleSubmit(onSubmit)();
    }
  };

  const handleRemoveCard = () => {
    setDeleteTrigger((prev) => prev + 1);
  };

  return (
    <div className="text-xl pointer-events-none fixed inset-0 w-full h-full z-50 flex items-center justify-center bg-text/30">
      <article
        ref={cardRef}
        className="pointer-events-auto group perspective-distant box-content p-16 rounded-xs w-postcard-width h-postcard-height "
      >
        <div className="group-hover:opacity-100 opacity-0 justify-self-start w-full flex flex-row items-center justify-between transition-opacity group-hover:pointer-events-auto pointer-events-none p-4 z-60">
          <button
            type="button"
            onClick={handleButtonClick}
            className="bg-black rounded-full p-2 hover:bg-background transition-colors flex items-center justify-center"
          >
            {mode === "view" ? (
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
          <div className="front bg-[url('/assets/frame.svg')] bg-no-repeat bg-center absolute inset-0 w-full h-full backface-hidden border-4 border-black outline-4 outline-postcard-background ">
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
