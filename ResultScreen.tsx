import { useEffect } from "react";
import Confetti from "./Confetti";
import { sfx, speak } from "../lib/audio";
import { cn } from "../utils/cn";

interface Props {
  stars: 1 | 2 | 3;
  title?: string;
  detail: string;
  onReplay: () => void;
  onMenu: () => void;
}

const MESSAGES: Record<number, string> = {
  3: "Incroyable, tu es un champion !",
  2: "Super travail, bravo !",
  1: "Bien joué ! Continue comme ça !",
};

export default function ResultScreen({ stars, title = "Bravo !", detail, onReplay, onMenu }: Props) {
  useEffect(() => {
    sfx.win();
    const t = window.setTimeout(() => speak(`${title} ${MESSAGES[stars]}`), 900);
    return () => window.clearTimeout(t);
  }, [stars, title]);

  return (
    <div className="animate-slide-up mx-auto flex w-full max-w-md flex-col items-center px-4 py-6 text-center">
      <Confetti />
      <div className="relative w-full rounded-[2rem] border-4 border-white bg-white/90 p-6 shadow-xl backdrop-blur">
        <div className="animate-bob text-7xl" aria-hidden="true">
          🦊
        </div>
        <h2 className="mt-2 text-4xl font-bold text-orange-500">{title}</h2>
        <p className="mt-1 text-xl font-medium text-slate-600">{MESSAGES[stars]}</p>

        <div className="my-5 flex justify-center gap-2" role="img" aria-label={`${stars} étoile${stars > 1 ? "s" : ""} sur 3`}>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={cn(
                "animate-pop-in text-6xl drop-shadow-md",
                n > stars && "opacity-25 grayscale",
              )}
              style={{ animationDelay: `${0.25 + n * 0.25}s` }}
            >
              ⭐
            </span>
          ))}
        </div>

        <p className="rounded-2xl bg-sky-100 px-4 py-2 text-lg font-medium text-sky-800">{detail}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => {
              sfx.tap();
              onReplay();
            }}
            className="chunky flex-1 rounded-2xl bg-green-500 px-6 py-4 text-2xl font-bold text-white [--shade:#15803d]"
          >
            🔁 Rejouer
          </button>
          <button
            onClick={() => {
              sfx.tap();
              onMenu();
            }}
            className="chunky flex-1 rounded-2xl bg-orange-400 px-6 py-4 text-2xl font-bold text-white [--shade:#c2410c]"
          >
            🏠 Menu
          </button>
        </div>
      </div>
    </div>
  );
}
