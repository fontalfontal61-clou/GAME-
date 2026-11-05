import { useEffect, useState } from "react";
import ProgressDots from "../components/ProgressDots";
import ResultScreen from "../components/ResultScreen";
import { useTimers } from "../hooks/useTimers";
import { sfx, shuffle, speak } from "../lib/audio";
import { cn } from "../utils/cn";
import type { GameProps } from "./types";

interface Word {
  e: string;
  w: string; // mot en majuscules
  say: string; // avec l'article, pour la voix
}

const WORDS: Word[] = [
  { e: "🍎", w: "POMME", say: "la pomme" },
  { e: "🐱", w: "CHAT", say: "le chat" },
  { e: "🐶", w: "CHIEN", say: "le chien" },
  { e: "☀️", w: "SOLEIL", say: "le soleil" },
  { e: "🐘", w: "ÉLÉPHANT", say: "l’éléphant" },
  { e: "🚗", w: "VOITURE", say: "la voiture" },
  { e: "🌙", w: "LUNE", say: "la lune" },
  { e: "🐟", w: "POISSON", say: "le poisson" },
  { e: "🍌", w: "BANANE", say: "la banane" },
  { e: "🦁", w: "LION", say: "le lion" },
  { e: "🏠", w: "MAISON", say: "la maison" },
  { e: "🌸", w: "FLEUR", say: "la fleur" },
  { e: "🐸", w: "GRENOUILLE", say: "la grenouille" },
  { e: "🥕", w: "CAROTTE", say: "la carotte" },
  { e: "🍓", w: "FRAISE", say: "la fraise" },
  { e: "🐻", w: "OURS", say: "l’ours" },
  { e: "🦆", w: "CANARD", say: "le canard" },
  { e: "🐢", w: "TORTUE", say: "la tortue" },
  { e: "🎈", w: "BALLON", say: "le ballon" },
  { e: "🚲", w: "VÉLO", say: "le vélo" },
  { e: "🐰", w: "LAPIN", say: "le lapin" },
  { e: "🐴", w: "CHEVAL", say: "le cheval" },
  { e: "🍇", w: "RAISIN", say: "le raisin" },
  { e: "🦋", w: "PAPILLON", say: "le papillon" },
  { e: "🐝", w: "ABEILLE", say: "l’abeille" },
  { e: "🍪", w: "BISCUIT", say: "le biscuit" },
  { e: "🐧", w: "PINGOUIN", say: "le pingouin" },
  { e: "🐮", w: "VACHE", say: "la vache" },
];

const ALPHABET = "ABCDEFGHIJLMNOPQRSTUVZ".split("");
const ROUNDS = 8;

const CHOICE_COLORS = [
  "bg-rose-500 [--shade:#be123c]",
  "bg-emerald-500 [--shade:#047857]",
  "bg-indigo-500 [--shade:#4338ca]",
];

interface Round {
  word: Word;
  letter: string;
  choices: string[];
}

function baseLetter(w: string) {
  return w
    .charAt(0)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function makeRounds(): Round[] {
  return shuffle(WORDS)
    .slice(0, ROUNDS)
    .map((word) => {
      const letter = baseLetter(word.w);
      const others = shuffle(ALPHABET.filter((l) => l !== letter)).slice(0, 2);
      return { word, letter, choices: shuffle([letter, ...others]) };
    });
}

export default function Letters({ onEarn, onReplay, onMenu }: GameProps) {
  const later = useTimers();
  const [rounds] = useState<Round[]>(makeRounds);
  const [idx, setIdx] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [shakeKey, setShakeKey] = useState(0);
  const [solved, setSolved] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [stars, setStars] = useState<1 | 2 | 3 | null>(null);

  const round = rounds[Math.min(idx, ROUNDS - 1)];
  const question = `Par quelle lettre commence ${round.word.say} ?`;

  useEffect(() => {
    if (stars) return;
    const t = window.setTimeout(() => speak(question), 250);
    return () => window.clearTimeout(t);
  }, [idx, question, stars]);

  const choose = (letter: string) => {
    if (solved || wrong.includes(letter)) return;
    if (letter === round.letter) {
      const nextResults = [...results, wrong.length === 0];
      setResults(nextResults);
      setSolved(true);
      sfx.good();
      speak(`Bravo ! ${round.word.say} commence par la lettre ${letter}.`);
      later(() => {
        if (idx + 1 >= ROUNDS) {
          const score = nextResults.filter(Boolean).length;
          const earned: 1 | 2 | 3 = score >= 7 ? 3 : score >= 5 ? 2 : 1;
          onEarn(earned);
          setStars(earned);
        } else {
          setIdx(idx + 1);
          setWrong([]);
          setSolved(false);
        }
      }, 2600);
    } else {
      setWrong((w) => [...w, letter]);
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

  const [first, ...rest] = Array.from(round.word.w);

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
        <h2 className="text-2xl font-bold leading-tight text-slate-700 sm:text-3xl">
          Par quelle lettre commence ce mot ?
        </h2>
      </div>

      <div
        key={idx}
        className="animate-slide-up flex flex-col items-center rounded-[2rem] border-4 border-white bg-white/80 px-4 py-6 shadow-lg"
      >
        <button
          onClick={() => speak(round.word.say)}
          aria-label={`Écouter : ${round.word.say}`}
          className={cn("text-[7rem] leading-none transition-transform active:scale-90 sm:text-[8rem]", solved && "animate-jump")}
        >
          {round.word.e}
        </button>

        <div className="mt-3 flex min-h-14 items-center text-4xl font-bold tracking-widest text-slate-700 sm:text-5xl">
          {solved ? (
            <>
              <span className="animate-pop-in text-green-500">{first}</span>
              <span>{rest.join("")}</span>
            </>
          ) : (
            <>
              <span className="mr-1 inline-grid h-14 w-12 place-items-center rounded-xl border-4 border-dashed border-sky-400 bg-sky-50 text-sky-400">
                ?
              </span>
              <span className="text-slate-300">{"•".repeat(Math.min(rest.length, 9))}</span>
            </>
          )}
        </div>
      </div>

      <div
        key={shakeKey}
        className={cn("mt-5 grid grid-cols-3 gap-3", shakeKey > 0 && !solved && "animate-shake")}
      >
        {round.choices.map((l, i) => {
          const isWrong = wrong.includes(l);
          const isRight = solved && l === round.letter;
          return (
            <button
              key={l}
              onClick={() => choose(l)}
              disabled={isWrong || (solved && !isRight)}
              className={cn(
                "chunky rounded-3xl py-4 text-6xl font-bold text-white sm:py-5 sm:text-7xl",
                isRight ? "animate-jump bg-green-500 [--shade:#15803d]" : CHOICE_COLORS[i % CHOICE_COLORS.length],
                (isWrong || (solved && !isRight)) && "opacity-30",
              )}
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}
