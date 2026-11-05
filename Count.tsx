import { useEffect, useState } from "react";
import ProgressDots from "../components/ProgressDots";
import ResultScreen from "../components/ResultScreen";
import { useTimers } from "../hooks/useTimers";
import { NUMBER_WORDS, sfx, shuffle, speak } from "../lib/audio";
import { cn } from "../utils/cn";
import type { GameProps } from "./types";

interface Thing {
  e: string;
  one: string;
  many: string;
}

const THINGS: Thing[] = [
  { e: "🍎", one: "pomme", many: "pommes" },
  { e: "🐟", one: "poisson", many: "poissons" },
  { e: "⭐", one: "étoile", many: "étoiles" },
  { e: "🎈", one: "ballon", many: "ballons" },
  { e: "🐥", one: "poussin", many: "poussins" },
  { e: "🌸", one: "fleur", many: "fleurs" },
  { e: "🍓", one: "fraise", many: "fraises" },
  { e: "🚗", one: "voiture", many: "voitures" },
  { e: "🦋", one: "papillon", many: "papillons" },
  { e: "🍪", one: "biscuit", many: "biscuits" },
  { e: "🐞", one: "coccinelle", many: "coccinelles" },
  { e: "🍭", one: "sucette", many: "sucettes" },
];

const ROUNDS = 8;

const CHOICE_COLORS = [
  "bg-sky-500 [--shade:#0369a1]",
  "bg-pink-500 [--shade:#be185d]",
  "bg-amber-400 [--shade:#b45309]",
  "bg-violet-500 [--shade:#6d28d9]",
];

interface Round {
  thing: Thing;
  n: number;
  choices: number[];
  tilts: number[];
}

function makeRound(i: number, thing: Thing): Round {
  const max = Math.min(10, 3 + i);
  const n = 1 + Math.floor(Math.random() * max);
  const howMany = i < 3 ? 3 : 4;
  const pool = shuffle(Array.from({ length: Math.min(10, max + 2) }, (_, k) => k + 1).filter((k) => k !== n));
  const choices = shuffle([n, ...pool.slice(0, howMany - 1)]);
  const tilts = Array.from({ length: n }, () => Math.round((Math.random() - 0.5) * 24));
  return { thing, n, choices, tilts };
}

export default function Count({ onEarn, onReplay, onMenu }: GameProps) {
  const later = useTimers();
  const [rounds] = useState<Round[]>(() => {
    const things = shuffle(THINGS);
    return Array.from({ length: ROUNDS }, (_, i) => makeRound(i, things[i]));
  });
  const [idx, setIdx] = useState(0);
  const [counted, setCounted] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number[]>([]);
  const [shakeKey, setShakeKey] = useState(0);
  const [solved, setSolved] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [stars, setStars] = useState<1 | 2 | 3 | null>(null);

  const round = rounds[Math.min(idx, ROUNDS - 1)];
  const question = `Combien y a-t-il de ${round.thing.many} ?`;

  useEffect(() => {
    if (stars) return;
    const t = window.setTimeout(() => speak(question), 250);
    return () => window.clearTimeout(t);
  }, [idx, question, stars]);

  const tapItem = (i: number) => {
    if (solved || counted.includes(i)) return;
    const next = [...counted, i];
    setCounted(next);
    sfx.tap();
    speak(NUMBER_WORDS[next.length]);
  };

  const choose = (c: number) => {
    if (solved || wrong.includes(c)) return;
    if (c === round.n) {
      const ok = wrong.length === 0;
      const nextResults = [...results, ok];
      setResults(nextResults);
      setSolved(true);
      setCounted(Array.from({ length: round.n }, (_, k) => k));
      sfx.good();
      speak(`Bravo ! ${round.n} ${round.n > 1 ? round.thing.many : round.thing.one} !`);

      later(() => {
        if (idx + 1 >= ROUNDS) {
          const score = nextResults.filter(Boolean).length;
          const earned: 1 | 2 | 3 = score >= 7 ? 3 : score >= 5 ? 2 : 1;
          onEarn(earned);
          setStars(earned);
        } else {
          setIdx(idx + 1);
          setCounted([]);
          setWrong([]);
          setSolved(false);
        }
      }, 2300);
    } else {
      setWrong((w) => [...w, c]);
      setShakeKey((k) => k + 1);
      sfx.wrong();
      speak("Oups ! Essaie encore.");
    }
  };

  if (stars) {
    const score = results.filter(Boolean).length;
    return (
      <ResultScreen
        stars={stars}
        detail={`${score} bonne${score > 1 ? "s" : ""} réponse${score > 1 ? "s" : ""} du premier coup sur ${ROUNDS} !`}
        onReplay={onReplay}
        onMenu={onMenu}
      />
    );
  }

  const small = round.n > 6;

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-10">
      <div className="mb-4">
        <ProgressDots total={ROUNDS} current={idx + (solved ? 1 : 0)} results={results} />
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-3xl bg-white/90 p-4 shadow-lg">
        <button
          onClick={() => speak(question)}
          aria-label="Écouter la question"
          className="chunky grid h-14 w-14 shrink-0 place-items-center rounded-full bg-sky-500 text-3xl [--shade:#0369a1]"
        >
          🔊
        </button>
        <h2 className="text-2xl font-bold leading-tight text-slate-700 sm:text-3xl">{question}</h2>
      </div>

      <div
        key={idx}
        className="animate-slide-up rounded-[2rem] border-4 border-white bg-white/80 p-4 shadow-lg"
      >
        <div className="flex min-h-40 flex-wrap items-center justify-center gap-2 sm:gap-3">
          {round.tilts.map((tilt, i) => {
            const order = counted.indexOf(i);
            const isCounted = order >= 0;
            return (
              <button
                key={i}
                onClick={() => tapItem(i)}
                aria-label={`${round.thing.one} ${i + 1}`}
                className={cn(
                  "relative grid place-items-center rounded-2xl transition-transform active:scale-90",
                  small ? "h-16 w-16 text-5xl sm:h-20 sm:w-20 sm:text-6xl" : "h-20 w-20 text-6xl sm:h-24 sm:w-24 sm:text-7xl",
                  isCounted ? "bg-yellow-100" : "hover:bg-sky-50",
                  solved && "animate-jump",
                )}
                style={{
                  transform: isCounted ? undefined : `rotate(${tilt}deg)`,
                  animationDelay: solved ? `${i * 70}ms` : undefined,
                }}
              >
                <span className="leading-none">{round.thing.e}</span>
                {isCounted && (
                  <span className="animate-pop-in absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-orange-500 text-base font-bold text-white shadow sm:h-8 sm:w-8 sm:text-lg">
                    {order + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-center text-base font-medium text-slate-500">
          {solved ? "🎉 Bravo !" : "👆 Touche chaque dessin pour les compter !"}
        </p>
      </div>

      <div
        key={shakeKey}
        className={cn("mt-5 grid gap-3", shakeKey > 0 && !solved && "animate-shake")}
        style={{ gridTemplateColumns: `repeat(${round.choices.length}, minmax(0, 1fr))` }}
      >
        {round.choices.map((c, i) => {
          const isWrong = wrong.includes(c);
          const isRight = solved && c === round.n;
          return (
            <button
              key={c}
              onClick={() => choose(c)}
              disabled={isWrong || (solved && !isRight)}
              className={cn(
                "chunky rounded-3xl py-5 text-5xl font-bold text-white sm:py-6 sm:text-6xl",
                isRight ? "animate-jump bg-green-500 [--shade:#15803d]" : CHOICE_COLORS[i % CHOICE_COLORS.length],
                (isWrong || (solved && !isRight)) && "opacity-30",
              )}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}
