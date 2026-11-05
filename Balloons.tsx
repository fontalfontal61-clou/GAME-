import { useEffect, useRef, useState } from "react";
import ProgressDots from "../components/ProgressDots";
import ResultScreen from "../components/ResultScreen";
import { useTimers } from "../hooks/useTimers";
import { sfx, shuffle, speak } from "../lib/audio";
import { cn } from "../utils/cn";
import type { GameProps } from "./types";

const COLORS = [
  { name: "rouge", plural: "rouges", hex: "#ef4444", dark: "#b91c1c" },
  { name: "bleu", plural: "bleus", hex: "#3b82f6", dark: "#1d4ed8" },
  { name: "vert", plural: "verts", hex: "#22c55e", dark: "#15803d" },
  { name: "jaune", plural: "jaunes", hex: "#facc15", dark: "#ca8a04" },
  { name: "rose", plural: "roses", hex: "#ec4899", dark: "#be185d" },
  { name: "orange", plural: "oranges", hex: "#fb923c", dark: "#c2410c" },
  { name: "violet", plural: "violets", hex: "#a855f7", dark: "#7e22ce" },
];

const GOAL = 5; // ballons à éclater par couleur
const ROUNDS = 3; // nombre de couleurs
const ON_SCREEN = 7;

interface B {
  id: number;
  color: number;
  frac: number;
  size: number;
  dur: number;
  delay: number;
  rise: number;
  sway: number;
  popped: boolean;
  wobble: number;
}

function BalloonSvg({ color, dark }: { color: string; dark: string }) {
  return (
    <svg viewBox="0 0 100 150" width="100%" height="100%" aria-hidden="true" className="overflow-visible">
      <path d="M50 108 C 44 122, 56 134, 50 148" stroke="#475569" strokeWidth="2" fill="none" />
      <path
        d="M50 2 C 18 2, 4 28, 4 52 C 4 78, 28 98, 50 98 C 72 98, 96 78, 96 52 C 96 28, 82 2, 50 2 Z"
        fill={color}
        stroke={dark}
        strokeWidth="3"
      />
      <polygon points="50,96 41,109 59,109" fill={dark} />
      <ellipse cx="30" cy="32" rx="8" ry="15" fill="#fff" opacity="0.45" transform="rotate(25 30 32)" />
    </svg>
  );
}

export default function Balloons({ onEarn, onReplay, onMenu }: GameProps) {
  const later = useTimers();
  const areaRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const [targets] = useState<number[]>(() => shuffle(COLORS.map((_, i) => i)).slice(0, ROUNDS));
  const targetRef = useRef(targets[0]);
  const gotRef = useRef(0);
  const mistakesRef = useRef(0);
  const lockRef = useRef(false);

  const [round, setRound] = useState(0);
  const [got, setGot] = useState(0);
  const [balloons, setBalloons] = useState<B[]>([]);
  const [celebrate, setCelebrate] = useState(false);
  const [msg, setMsg] = useState("");
  const [stars, setStars] = useState<1 | 2 | 3 | null>(null);

  const target = COLORS[targets[round]];

  const make = (delay: number): B => {
    const h = areaRef.current?.clientHeight ?? 520;
    const size = 66 + Math.random() * 30;
    const color =
      Math.random() < 0.42 ? targetRef.current : Math.floor(Math.random() * COLORS.length);
    return {
      id: ++idRef.current,
      color,
      frac: Math.random(),
      size,
      dur: 7 + Math.random() * 4,
      delay,
      rise: h + size * 1.6 + 20,
      sway: 2.4 + Math.random() * 1.6,
      popped: false,
      wobble: 0,
    };
  };

  // Premiers ballons (une fois la zone de jeu mesurée)
  useEffect(() => {
    setBalloons(Array.from({ length: ON_SCREEN }, (_, i) => make(i * 0.9 + Math.random() * 0.6)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Consigne vocale à chaque couleur
  useEffect(() => {
    if (stars) return;
    const t = window.setTimeout(() => speak(`Éclate les ballons ${COLORS[targets[round]].plural} !`), 350);
    return () => window.clearTimeout(t);
  }, [round, targets, stars]);

  const replace = (id: number, delay = Math.random() * 1.2) => {
    const nb = make(delay);
    setBalloons((prev) => [...prev.filter((x) => x.id !== id), nb]);
  };

  const flash = (text: string) => {
    setMsg(text);
    later(() => setMsg((m) => (m === text ? "" : m)), 1800);
  };

  const pop = (b: B) => {
    if (b.popped || lockRef.current) return;

    if (b.color !== targetRef.current) {
      sfx.wrong();
      mistakesRef.current += 1;
      setBalloons((prev) => prev.map((x) => (x.id === b.id ? { ...x, wobble: x.wobble + 1 } : x)));
      flash(`Oups ! Ce ballon est ${COLORS[b.color].name}.`);
      return;
    }

    sfx.pop();
    setBalloons((prev) => prev.map((x) => (x.id === b.id ? { ...x, popped: true } : x)));
    later(() => replace(b.id), 450);

    const next = gotRef.current + 1;
    gotRef.current = next;
    setGot(next);
    if (next < GOAL) return;

    lockRef.current = true;
    if (round + 1 >= ROUNDS) {
      const m = mistakesRef.current;
      const earned: 1 | 2 | 3 = m <= 2 ? 3 : m <= 6 ? 2 : 1;
      onEarn(earned);
      later(() => sfx.good(), 250);
      later(() => setStars(earned), 1100);
    } else {
      setCelebrate(true);
      later(() => sfx.good(), 250);
      later(() => speak("Bravo ! Une nouvelle couleur !"), 400);
      later(() => {
        const nr = round + 1;
        targetRef.current = targets[nr];
        gotRef.current = 0;
        setGot(0);
        setRound(nr);
        setCelebrate(false);
        lockRef.current = false;
      }, 2200);
    }
  };

  if (stars) {
    const m = mistakesRef.current;
    return (
      <ResultScreen
        stars={stars}
        detail={`Tu as éclaté ${GOAL * ROUNDS} ballons avec ${m === 0 ? "aucune erreur" : `${m} erreur${m > 1 ? "s" : ""}`} !`}
        onReplay={onReplay}
        onMenu={onMenu}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-6">
      <div className="mb-3 flex items-center gap-3 rounded-3xl bg-white/90 p-3 shadow-lg">
        <span
          key={round}
          className="animate-pop-in h-12 w-12 shrink-0 rounded-full border-4 border-white shadow-md"
          style={{ background: target.hex }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold leading-tight text-slate-700 sm:text-2xl">
            Éclate les ballons{" "}
            <span className="rounded-lg px-1.5 text-white" style={{ background: target.hex, textShadow: "0 1px 2px rgba(0,0,0,.35)" }}>
              {target.plural}
            </span>{" "}
            !
          </h2>
          <div className="mt-1.5 flex items-center gap-3">
            <ProgressDots total={GOAL} current={got} />
            <span className="text-sm font-semibold text-slate-500">
              Manche {round + 1}/{ROUNDS}
            </span>
          </div>
        </div>
        <button
          onClick={() => speak(`Éclate les ballons ${target.plural} !`)}
          aria-label="Écouter la consigne"
          className="chunky grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sky-500 text-2xl [--shade:#0369a1]"
        >
          🔊
        </button>
      </div>

      <div
        ref={areaRef}
        className="relative overflow-hidden rounded-[2rem] border-4 border-white/80 bg-white/25 shadow-inner"
        style={{ height: "calc(100dvh - 270px)", minHeight: 340, maxHeight: 640 }}
      >
        {balloons.map((b) => {
          const c = COLORS[b.color];
          return (
            <div
              key={b.id}
              className="balloon-float"
              style={
                {
                  left: `calc((100% - ${b.size}px) * ${b.frac})`,
                  "--dur": `${b.dur}s`,
                  "--delay": `${b.delay}s`,
                  "--rise": `${b.rise}px`,
                  animationPlayState: b.popped ? "paused" : "running",
                } as React.CSSProperties
              }
              onAnimationEnd={(e) => {
                if (e.target === e.currentTarget && !b.popped) replace(b.id, 0);
              }}
            >
              <button
                onClick={() => pop(b)}
                aria-label={`Ballon ${c.name}`}
                className="relative block"
                style={{ width: b.size, height: b.size * 1.5 }}
              >
                <div
                  className={cn("balloon-sway h-full w-full", b.popped && "balloon-burst")}
                  style={{ "--sway": `${b.sway}s` } as React.CSSProperties}
                >
                  <div key={b.wobble} className={cn("h-full w-full", b.wobble > 0 && "animate-wobble")}>
                    <BalloonSvg color={c.hex} dark={c.dark} />
                  </div>
                </div>
                {b.popped &&
                  Array.from({ length: 8 }, (_, i) => {
                    const a = (i / 8) * Math.PI * 2;
                    return (
                      <span
                        key={i}
                        className="particle"
                        style={
                          {
                            background: i % 2 ? c.hex : "#fff",
                            "--dx": `${Math.cos(a) * b.size * 0.7}px`,
                            "--dy": `${Math.sin(a) * b.size * 0.7}px`,
                          } as React.CSSProperties
                        }
                      />
                    );
                  })}
              </button>
            </div>
          );
        })}

        {msg && (
          <div className="animate-pop-in pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3">
            <span className="rounded-full bg-orange-100 px-5 py-2 text-lg font-semibold text-orange-700 shadow-lg">
              {msg}
            </span>
          </div>
        )}

        {celebrate && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-white/50 backdrop-blur-[2px]">
            <div className="animate-pop-in rounded-3xl bg-white px-8 py-6 text-center shadow-2xl">
              <div className="text-6xl">🎉</div>
              <p className="mt-1 text-3xl font-bold text-green-600">Bravo !</p>
              <p className="text-lg font-medium text-slate-600">Une nouvelle couleur arrive…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
