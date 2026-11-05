import { useMemo, useState } from "react";
import ResultScreen from "../components/ResultScreen";
import { useTimers } from "../hooks/useTimers";
import { sfx, shuffle, speak } from "../lib/audio";
import { cn } from "../utils/cn";
import type { GameProps } from "./types";

interface Animal {
  e: string;
  n: string;
}

const ANIMALS: Animal[] = [
  { e: "🐶", n: "le chien" },
  { e: "🐱", n: "le chat" },
  { e: "🐰", n: "le lapin" },
  { e: "🦊", n: "le renard" },
  { e: "🐻", n: "l’ours" },
  { e: "🐼", n: "le panda" },
  { e: "🐸", n: "la grenouille" },
  { e: "🦁", n: "le lion" },
  { e: "🐵", n: "le singe" },
  { e: "🐧", n: "le pingouin" },
  { e: "🐮", n: "la vache" },
  { e: "🐷", n: "le cochon" },
  { e: "🐢", n: "la tortue" },
  { e: "🦄", n: "la licorne" },
  { e: "🐙", n: "la pieuvre" },
  { e: "🐝", n: "l’abeille" },
];

const LEVELS = [
  { id: "easy", label: "Facile", icon: "🌱", pairs: 3, cols: 3, color: "bg-green-500 [--shade:#15803d]" },
  { id: "medium", label: "Moyen", icon: "🌼", pairs: 6, cols: 4, color: "bg-amber-400 [--shade:#b45309]" },
  { id: "hard", label: "Difficile", icon: "🌳", pairs: 8, cols: 4, color: "bg-rose-500 [--shade:#be123c]" },
] as const;

type Level = (typeof LEVELS)[number];

interface Card {
  uid: number;
  animal: Animal;
}

function buildDeck(pairs: number): Card[] {
  const chosen = shuffle(ANIMALS).slice(0, pairs);
  const deck = shuffle([...chosen, ...chosen]);
  return deck.map((animal, uid) => ({ uid, animal }));
}

export default function Memory({ onEarn, onReplay, onMenu }: GameProps) {
  const [level, setLevel] = useState<Level | null>(null);

  if (!level) {
    return (
      <div className="animate-slide-up mx-auto w-full max-w-md px-4 pb-10 text-center">
        <h1 className="text-4xl font-bold text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.2)]">🃏 Mémoire</h1>
        <p className="mt-1 text-xl font-medium text-sky-900">Retrouve les paires d’animaux !</p>
        <div className="mt-6 flex flex-col gap-4">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                sfx.tap();
                speak(l.label);
                setLevel(l);
              }}
              className={cn(
                "chunky flex items-center justify-between rounded-3xl px-6 py-5 text-3xl font-bold text-white",
                l.color,
              )}
            >
              <span>
                {l.icon} {l.label}
              </span>
              <span className="rounded-full bg-white/30 px-3 py-1 text-lg">{l.pairs * 2} cartes</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return <Board level={level} onEarn={onEarn} onReplay={onReplay} onMenu={onMenu} />;
}

function Board({ level, onEarn, onReplay, onMenu }: GameProps & { level: Level }) {
  const later = useTimers();
  const cards = useMemo(() => buildDeck(level.pairs), [level]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [stars, setStars] = useState<1 | 2 | 3 | null>(null);
  const [locked, setLocked] = useState(false);
  const [hint, setHint] = useState("Touche une carte pour la retourner !");

  const flip = (card: Card) => {
    if (locked || stars) return;
    if (open.includes(card.uid) || matched.includes(card.animal.e)) return;

    sfx.flip();
    const nextOpen = [...open, card.uid];
    setOpen(nextOpen);
    if (nextOpen.length < 2) {
      setHint("Trouve la même carte !");
      return;
    }

    setLocked(true);
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    const [a, b] = nextOpen.map((uid) => cards.find((c) => c.uid === uid)!);

    if (a.animal.e === b.animal.e) {
      later(() => {
        const nextMatched = [...matched, a.animal.e];
        setMatched(nextMatched);
        setOpen([]);
        setLocked(false);
        sfx.good();
        setHint(`${a.animal.e} Bravo, ${a.animal.n} !`);
        speak(`Bravo ! ${a.animal.n}`);

        if (nextMatched.length === level.pairs) {
          const earned: 1 | 2 | 3 =
            nextMoves <= level.pairs * 1.6 ? 3 : nextMoves <= level.pairs * 2.5 ? 2 : 1;
          onEarn(earned);
          later(() => setStars(earned), 1500);
        }
      }, 650);
    } else {
      setHint("Presque ! Essaie encore.");
      later(() => {
        setOpen([]);
        setLocked(false);
      }, 1000);
    }
  };

  if (stars) {
    return (
      <ResultScreen
        stars={stars}
        title="Bravo !"
        detail={`Tu as trouvé ${level.pairs} paires en ${moves} coups.`}
        onReplay={onReplay}
        onMenu={onMenu}
      />
    );
  }

  const big = level.cols === 3;

  return (
    <div className="mx-auto w-full px-4 pb-10" style={{ maxWidth: level.cols * 132 + 40 }}>
      <div className="mb-3 flex items-center justify-between gap-2 text-lg font-semibold">
        <span className="rounded-full bg-white/80 px-4 py-1 text-sky-800 shadow">
          👣 {moves} coup{moves > 1 ? "s" : ""}
        </span>
        <span className="rounded-full bg-white/80 px-4 py-1 text-green-700 shadow">
          ✅ {matched.length}/{level.pairs}
        </span>
      </div>

      <div
        className="grid gap-2.5 sm:gap-3.5"
        style={{ gridTemplateColumns: `repeat(${level.cols}, minmax(0, 1fr))` }}
      >
        {cards.map((card) => {
          const isMatched = matched.includes(card.animal.e);
          const faceUp = isMatched || open.includes(card.uid);
          return (
            <button
              key={card.uid}
              onClick={() => flip(card)}
              aria-label={faceUp ? card.animal.n : "Carte cachée"}
              className="flip-card aspect-square w-full rounded-[1.25rem] focus-visible:outline-offset-2"
            >
              <div className={cn("flip-inner", faceUp && "is-flipped")}>
                <div
                  className="flip-face border-4 border-white shadow-lg"
                  style={{
                    backgroundColor: "#8b5cf6",
                    backgroundImage:
                      "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.35) 0 6px, transparent 7px), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.35) 0 6px, transparent 7px), linear-gradient(135deg,#a78bfa,#7c3aed)",
                  }}
                >
                  <span className="text-4xl font-bold text-white/90 drop-shadow sm:text-5xl">?</span>
                </div>
                <div
                  className={cn(
                    "flip-face flip-front border-4 bg-white shadow-lg",
                    isMatched ? "animate-pulse-ring border-green-400 bg-green-50" : "border-white",
                  )}
                >
                  <span
                    className="leading-none"
                    style={{ fontSize: big ? "clamp(2.8rem, 15vw, 5rem)" : "clamp(2.2rem, 10vw, 3.6rem)" }}
                  >
                    {card.animal.e}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-5 rounded-2xl bg-white/80 px-4 py-3 text-center text-xl font-medium text-slate-700 shadow">
        {hint}
      </p>
    </div>
  );
}
