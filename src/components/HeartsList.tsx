import { HEART_LIST } from "@/lib";
import { HeartButton } from "@/ui";
import { useAuth, useNote } from "@/stores";
import { useUserAllNotes } from "@/features";
import { useMemo } from "react";

export default function HeartsList() {
  const updateHeartColor = useNote((state) => state.updateHeartColor);
  const user = useAuth((state) => state.user);
  const { data: notes = [] } = useUserAllNotes(user?.id);
  const heartCounts = useMemo(
    () =>
      notes.reduce<Record<string, number>>((counts, note) => {
        counts[note.heart_color] = (counts[note.heart_color] ?? 0) + 1;
        return counts;
      }, {}),
    [notes],
  );

  return (
    <section className="pointer-events-none w-fit text-md fixed flex flex-row items-center justify-start bottom-0 p-4 gap-4">
      {HEART_LIST.map((heart) => (
        <div
          className="relative group flex flex-col items-center w-min"
          key={heart.color}
        >
          <span className="absolute bottom-18 whitespace-nowrap text-white group-hover:opacity-100 opacity-0 transition-opacity duration-200 bg-white/20 rounded-sm px-4 py-1">
            {heart.label}
          </span>
          <HeartButton
            key={heart.color}
            heartColor={heart.color}
            size="small"
            onClick={() => updateHeartColor(heart.color)}
            label={heartCounts[heart.color] ?? 0}
          />
        </div>
      ))}
    </section>
  );
}
