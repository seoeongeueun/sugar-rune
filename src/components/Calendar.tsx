import { Search, SearchX, X } from "lucide-react";
import { gsap } from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { twMerge } from "tailwind-merge";
import { useUserNotes } from "@/features";
import { CALENDAR_START_YEAR, formatDateForDb, parseNoteDate } from "@/lib";
import { HEART_LIST } from "@/shared";
import { useAuth, useCalendar, useNote } from "@/stores";

const START_YEAR = CALENDAR_START_YEAR;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarDay = {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
};

const getMonthIndex = (year: number, month: number) =>
  (year - START_YEAR) * 12 + month;

const getYearAndMonth = (monthIndex: number) => ({
  year: START_YEAR + Math.floor(monthIndex / 12),
  month: monthIndex % 12,
});

const buildCalendarDays = (year: number, month: number): CalendarDay[] => {
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    };
  });
};

export default function Calendar() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const user = useAuth((state) => state.user);
  const openNote = useNote((state) => state.openNote);
  const isOpen = useNote((state) => state.isOpen);
  const noteDate = useNote((state) => state.note?.date);
  const calendarTargetDate = useCalendar((state) => state.targetDate);
  const closeCalendar = useCalendar((state) => state.closeCalendar);
  const [today, setToday] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isMonthYearSelectorOpen, setIsMonthYearSelectorOpen] = useState(false);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const minMonthIndex = 0;
  const maxMonthIndex = getMonthIndex(currentYear, 11);
  const initialMonthIndex = Math.min(
    Math.max(getMonthIndex(currentYear, currentMonth), minMonthIndex),
    maxMonthIndex,
  );

  const [visibleMonthIndex, setVisibleMonthIndex] = useState(initialMonthIndex);
  const { year, month } = getYearAndMonth(visibleMonthIndex);
  const { data: notes = [] } = useUserNotes(user?.id, year);
  const days = useMemo(() => buildCalendarDays(year, month), [year, month]);
  const notesByDate = useMemo(
    () => new Map(notes.map((note) => [note.date, note])),
    [notes],
  );
  const yearOptions = useMemo(
    () =>
      Array.from(
        { length: Math.max(currentYear - START_YEAR + 1, 1) },
        (_, index) => START_YEAR + index,
      ),
    [currentYear],
  );

  const showPreviousMonth = useCallback(() => {
    setVisibleMonthIndex((value) => Math.max(value - 1, minMonthIndex));
  }, []);

  const showNextMonth = useCallback(() => {
    setVisibleMonthIndex((value) => Math.min(value + 1, maxMonthIndex));
  }, [maxMonthIndex]);

  const showDate = useCallback(
    (date: Date) => {
      const nextMonthIndex = getMonthIndex(date.getFullYear(), date.getMonth());

      setVisibleMonthIndex(
        Math.min(Math.max(nextMonthIndex, minMonthIndex), maxMonthIndex),
      );
      setSelectedDate(date);
    },
    [maxMonthIndex],
  );

  const handleDateClick = useCallback(
    (date: Date) => {
      const dateKey = formatDateForDb(date);
      const note = notesByDate.get(dateKey);

      showDate(date);

      openNote(
        note
          ? {
              id: note.id,
              content: note.content,
              date: note.date,
              heart_content: note.heart_color,
              stamps: note.stamps ?? [],
            }
          : {
              content: "",
              date: dateKey,
              heart_content: HEART_LIST[HEART_LIST.length - 1].color,
              stamps: [],
            },
      );
    },
    [notesByDate, openNote, showDate],
  );

  const showSelectedMonthYear = useCallback(
    (nextYear: number, nextMonth: number) => {
      const nextMonthIndex = getMonthIndex(nextYear, nextMonth);
      setVisibleMonthIndex(
        Math.min(Math.max(nextMonthIndex, minMonthIndex), maxMonthIndex),
      );
    },
    [maxMonthIndex],
  );

  const showToday = useCallback(() => {
    const nextToday = new Date();

    setToday(nextToday);
    showDate(nextToday);
  }, [showDate]);

  const handleMonthChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      showSelectedMonthYear(year, Number(event.target.value));
    },
    [showSelectedMonthYear, year],
  );

  const handleYearChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      showSelectedMonthYear(Number(event.target.value), month);
    },
    [month, showSelectedMonthYear],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPreviousMonth();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNextMonth();
    }
  };

  const canShowPreviousMonth = visibleMonthIndex > minMonthIndex;
  const canShowNextMonth = visibleMonthIndex < maxMonthIndex;

  useEffect(() => {
    if (!calendarTargetDate) return;

    showDate(parseNoteDate(calendarTargetDate));
  }, [calendarTargetDate, showDate]);

  useEffect(() => {
    if (!isOpen || !noteDate) return;

    showDate(parseNoteDate(noteDate));
  }, [isOpen, noteDate, showDate]);

  useEffect(() => {
    const refreshToday = () => {
      setToday(new Date());
    };

    window.addEventListener("focus", refreshToday);

    return () => {
      window.removeEventListener("focus", refreshToday);
    };
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    const calendar = calendarRef.current;

    if (!overlay || !calendar) return;

    const ctx = gsap.context(() => {
      gsap.set(overlay, { autoAlpha: 0 });
      gsap.set(calendar, {
        autoAlpha: 0,
        y: 16,
        scale: 0.98,
        transformOrigin: "50% 50%",
        willChange: "transform, opacity",
      });

      gsap
        .timeline()
        .to(overlay, {
          autoAlpha: 1,
          duration: 0.16,
          ease: "power1.out",
        })
        .to(
          calendar,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.32,
            ease: "power2.out",
            clearProps: "transform,willChange",
          },
          "-=0.06",
        );
    }, overlay);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      className={`${isOpen ? "!opacity-0" : "!opacity-100"} pointer-events-none duration-50 transition-opacity z-99 fixed w-full h-full inset-0 bg-black/30`}
    >
      <div
        ref={calendarRef}
        className="pointer-events-auto w-full max-w-1/3 place-center flex flex-col gap-4 items-end"
      >
        <div className="flex flex-row justify-between w-full gap-2">
          <div className="gap-4 flex flex-row shrink-0 items-center">
            <button
              type="button"
              aria-label="Search Date"
              className="white-button px-2"
              onClick={() => setIsMonthYearSelectorOpen((prev) => !prev)}
            >
              {isMonthYearSelectorOpen ? (
                <SearchX size={16} />
              ) : (
                <Search size={16} />
              )}
            </button>
            {isMonthYearSelectorOpen && (
              <div className="text-sm flex gap-2 rounded border border-white bg-white/30 h-full px-1 py-1">
                <select
                  value={month}
                  onChange={handleMonthChange}
                  aria-label="Select month"
                  className="rounded border border-white bg-white/90 px-2 py-1 text-night text-center"
                >
                  {Array.from({ length: 12 }, (_, monthIndex) => (
                    <option key={monthIndex} value={monthIndex}>
                      {monthIndex + 1}
                    </option>
                  ))}
                </select>
                <select
                  value={year}
                  onChange={handleYearChange}
                  aria-label="Select year"
                  className="rounded border border-white bg-white px-2 py-1 text-night"
                >
                  {yearOptions.map((yearOption) => (
                    <option key={yearOption} value={yearOption}>
                      {yearOption}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="border border-white bg-white text-night px-1 rounded-sm"
                  onClick={showToday}
                >
                  Today
                </button>
              </div>
            )}
          </div>
          <button
            aria-label="Close Calendar"
            type="button"
            onClick={closeCalendar}
            className="white-button px-2"
          >
            <X size={16} />
          </button>
        </div>
        <section
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-label="Calendar"
          className="w-full rounded border-2 border-white outline-2 outline-night bg-white/30 backdrop-blur-xl drop-shadow-2xl p-4 text-white focus:ring-2 focus:ring-white/50"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={showPreviousMonth}
              disabled={!canShowPreviousMonth}
              aria-label="Show previous month"
              className="black-button px-3 disabled:cursor-not-allowed disabled:opacity-30 font-bold"
            >
              &lt;
            </button>
            <div className="relative flex flex-row items-center justify-center gap-4">
              <span className="text-lg font-bold text-shadow">
                {MONTH_NAMES[month]} {year}
              </span>
            </div>
            <button
              type="button"
              onClick={showNextMonth}
              disabled={!canShowNextMonth}
              aria-label="Show next month"
              className="black-button px-3 disabled:cursor-not-allowed disabled:opacity-30 font-bold"
            >
              &gt;
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-md">
            {WEEK_DAYS.map((weekday) => (
              <div
                key={weekday}
                className={`border-b border-white text-shadow py-2 font-medium ${weekday === "Sun" || weekday === "Sat" ? "text-background" : ""}`}
              >
                {weekday}
              </div>
            ))}

            {days.map((date) => {
              const heartColor = notesByDate.get(
                formatDateForDb(date.date),
              )?.heart_color;

              return (
                <button
                  type="button"
                  key={date.date.toISOString()}
                  onClick={() => handleDateClick(date.date)}
                  className={twMerge(
                    "relative hover:bg-background/30 !items-start !justify-start border-b border-white text-sm aspect-square min-h-10 py-2 px-4 [:nth-last-child(-n+7)]:border-b-0",
                    date.isCurrentMonth ? "text-white" : "opacity-20",
                    date.date.toDateString() === today.toDateString()
                      ? "before:content-['今日'] before:absolute before:top-2 before:left-1/2 before:-translate-x-1/2 before:bg-background before:px-1 before:text-white before:font-medium border-background border-b-3"
                      : "",
                    date.date.toDateString() === selectedDate?.toDateString()
                      ? "border !border-night/70 outline-2 outline-background bg-background/20"
                      : "",
                  )}
                >
                  {date.day}
                  {heartColor && (
                    <img
                      src={`/hearts/heart_${heartColor}_icon.png`}
                      alt="Heart Icon"
                      className="place-center w-1/3 min-w-4 tablet:min-w-10"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
