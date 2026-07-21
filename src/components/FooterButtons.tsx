import { useAuth, useCalendar, useNote } from "@/stores";
import { useUserNotes } from "@/features";
import { formatDateForDb } from "@/lib";

export default function FooterButtons() {
  const today = new Date();
  const user = useAuth((state) => state.user);
  const openNote = useNote((state) => state.openNote);
  const toggleCalendar = useCalendar((state) => state.toggleCalendar);
  const { data: notes = [] } = useUserNotes(user?.id, today.getFullYear());
  const todayKey = formatDateForDb(today);
  const todayNote = notes.find((note) => note.date === todayKey);

  // If a note for today exists, open it. Otherwise, create a new note
  const handleTodayClick = () => {
    openNote(
      todayNote
        ? {
            id: todayNote.id,
            content: todayNote.content,
            date: todayNote.date,
            heart_content: todayNote.heart_color,
            stamps: todayNote.stamps ?? [],
          }
        : {
            content: "",
            date: todayKey,
            heart_content: "white",
            stamps: [],
          },
    );
  };

  return (
    <div className="pointer-events-none fixed bottom-30 desktop:bottom-10 justify-self-center text-white text-lg flex flex-row gap-40 z-40">
      <button
        type="button"
        onClick={handleTodayClick}
        className="text-shadow !pointer-events-auto bg-[url('/hearts/heart_purple_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
      >
        <span className="z-10">Today</span>
      </button>
      <button
        onClick={toggleCalendar}
        type="button"
        className="text-shadow !pointer-events-auto bg-[url('/hearts/heart_white_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
      >
        <span className="z-10">List</span>
      </button>
    </div>
  );
}
