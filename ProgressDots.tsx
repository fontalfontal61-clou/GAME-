import { cn } from "../utils/cn";

interface Props {
  total: number;
  current: number; // nombre d'étapes terminées
  results?: boolean[]; // vrai = réussi du premier coup
}

export default function ProgressDots({ total, current, results }: Props) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-1.5"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
    >
      {Array.from({ length: total }, (_, i) => {
        const done = i < current;
        const ok = results?.[i];
        return (
          <span
            key={i}
            className={cn(
              "h-4 w-4 rounded-full border-2 border-white shadow transition-all duration-300 sm:h-5 sm:w-5",
              done ? (ok === false ? "bg-orange-300" : "bg-green-500") : "bg-white/60",
              i === current && "scale-125 border-yellow-300 bg-yellow-300",
            )}
          />
        );
      })}
    </div>
  );
}
