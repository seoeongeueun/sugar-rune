import { HEART_LIST } from "@/lib";
import { HeartButton } from "@/ui";

export default function HeartsList() {
  return (
    <section className="pointer-events-none fixed inset-0 flex flex-col text-md gap-10 p-4 justify-center items-start w-fit h-full">
      {HEART_LIST.map((heart) => (
        <div
          className="group flex flex-row gap-6 items-center"
          key={heart.color}
        >
          <HeartButton
            key={heart.color}
            heartColor={heart.color}
            label={0} //TODO: replace with actual heart count
          />
          <span className="text-white group-hover:opacity-100 opacity-0 transition-opacity duration-200 bg-white/20 rounded-sm px-4 py-1">
            {heart.label}
          </span>
        </div>
      ))}
    </section>
  );
}
