import { useState } from "react";
import Calendar from "./Calendar";
import { useNote } from "@/stores";

export default function FooterButtons() {
  const [isOpenCalendar, setIsOpenCalendar] = useState(false);
  const openNote = useNote((state) => state.openNote);

  console.log("isOpenCalendar", isOpenCalendar);

  return (
    <div className="pointer-events-none fixed bottom-10 justify-self-center text-white text-lg flex flex-row gap-40">
      <button
        type="button"
        onClick={() => openNote()}
        className="text-shadow !pointer-events-auto bg-[url('/hearts/heart_white_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
      >
        <span className="z-10">Add</span>
      </button>
      <button
        onClick={() => setIsOpenCalendar((prev) => !prev)}
        type="button"
        className="text-shadow !pointer-events-auto bg-[url('/hearts/heart_purple_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
      >
        <span className="z-10">List</span>
      </button>
      {isOpenCalendar && (
        <Calendar handleClose={() => setIsOpenCalendar(false)} />
      )}
    </div>
  );
}
