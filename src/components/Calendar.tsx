import { Search, SearchX } from "lucide-react";
import { gsap } from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { twMerge } from "tailwind-merge";

const START_YEAR = 2026;
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
  const calendarRef = useRef<HTMLElement>(null);
  const today = useMemo(() => new Date(), []);
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
  const days = useMemo(() => buildCalendarDays(year, month), [year, month]);
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

  const handleDateClick = useCallback(
    (date: Date) => {
      const dateMonthIndex = getMonthIndex(date.getFullYear(), date.getMonth());
      setVisibleMonthIndex(
        Math.min(Math.max(dateMonthIndex, minMonthIndex), maxMonthIndex),
      );
      setSelectedDate(date);
    },
    [maxMonthIndex],
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

  const handleMonthChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      showSelectedMonthYear(year, Number(event.target.value));
      setIsMonthYearSelectorOpen(false);
    },
    [showSelectedMonthYear, year],
  );

  const handleYearChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      showSelectedMonthYear(Number(event.target.value), month);
      setIsMonthYearSelectorOpen(false);
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
      className="z-99 fixed w-full h-full inset-0 bg-black/30"
    >
      <div className="pointer-events-auto w-full max-w-1/3 place-center">
        <section
          ref={calendarRef}
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
              className="hover:bg-background transition-colors duration-100 rounded border border-white bg-white/30 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-30 outline outline-night text-night font-bold"
            >
              &lt;
            </button>
            <div className="relative flex flex-row items-center justify-center gap-4">
              {isMonthYearSelectorOpen ? (
                <div className="text-sm flex gap-2 rounded border border-white bg-white/30 p-2 ">
                  <select
                    value={month}
                    onChange={handleMonthChange}
                    aria-label="Select month"
                    className="rounded border border-white bg-white px-2 py-1 text-night"
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
                    onClick={() => handleDateClick(new Date())}
                  >
                    Today
                  </button>
                </div>
              ) : (
                <span className="text-lg font-bold text-shadow">
                  {MONTH_NAMES[month]} {year}
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsMonthYearSelectorOpen((prev) => !prev)}
              >
                {isMonthYearSelectorOpen ? (
                  <SearchX className="hover:bg-background transition-colors duration-100 outline-night hover:outline h-full w-auto p-3 aspect-square rounded-sm text-white bg-white/30 px-1 border border-white" />
                ) : (
                  <Search className="hover:bg-background transition-colors duration-100 outline-night hover:outline h-full w-auto p-3 aspect-square rounded-sm text-white bg-white/30 px-1 border border-white" />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={showNextMonth}
              disabled={!canShowNextMonth}
              aria-label="Show next month"
              className="hover:bg-background transition-colors duration-100 rounded border border-white bg-white/30 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-30 outline outline-night text-night font-bold"
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

            {days.map((date) => (
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
                <img
                  src="/hearts/heart_white_icon.png"
                  alt="Heart Icon"
                  className="place-center w-1/3 min-w-4 tablet:min-w-10"
                />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
