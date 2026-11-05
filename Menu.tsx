import { useState } from "react";
import { pick, sfx, speak } from "../lib/audio";
import { cn } from "../utils/cn";

export type GameId = "memory" | "count" | "balloons" | "letters";

const GAMES: {
  id: GameId;
  title: string;
  sub: string;
  icon: string;
  gradient: string;
  shade: string;
}[] = [
  {
    id: "memory",
    title: "Mémoire",
    sub: "Retrouve les paires d’animaux",
    icon: "🃏",
    gradient: "from-violet-400 to-fuchsia-500",
    shade: "#7e22ce",
  },
  {
    id: "count",
    title: "Compte avec moi",
    sub: "Combien y en a-t-il ?",
    icon: "🍎",
    gradient: "from-orange-400 to-amber-400",
    shade: "#c2410c",
  },
  {
    id: "balloons",
    title: "Les ballons",
    sub: "Éclate la bonne couleur",
    icon: "🎈",
    gradient: "from-rose-400 to-red-500",
    shade: "#be123c",
  },
  {
    id: "letters",
    title: "Les lettres",
    sub: "Trouve la première lettre",
    icon: "🔤",
    gradient: "from-emerald-400 to-teal-500",
    shade: "#0f766e",
  },
];

const PHRASES = [
  "Salut ! Moi, c’est Foxi. Tu veux jouer avec moi ?",
  "Choisis un jeu en touchant une grande carte !",
  "Tu es super fort ! Allez, on joue !",
  "Gagne plein d’étoiles avec moi !",
];

interface Props {
  stars: number;
  onPlay: (id: GameId) => void;
}

export default function Menu({ stars, onPlay }: Props) {
  const [bubble, setBubble] = useState(PHRASES[0]);
  const [wiggle, setWiggle] = useState(0);

  const talk = () => {
    const phrase = pick(PHRASES.filter((p) => p !== bubble));
    setBubble(phrase);
    setWiggle((w) => w + 1);
    sfx.tap();
    speak(phrase);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10">
      <div className="flex items-center gap-3 sm:gap-5">
        <button
          onClick={talk}
          aria-label="Parler avec Foxi"
          className="relative shrink-0 rounded-full transition-transform active:scale-95"
        >
          <span
            key={wiggle}
            className={cn(
              "grid h-24 w-24 place-items-center rounded-full border-4 border-white bg-orange-200 text-6xl shadow-lg sm:h-32 sm:w-32 sm:text-8xl",
              wiggle > 0 ? "animate-wiggle" : "animate-bob",
            )}
          >
            🦊
          </span>
        </button>

        <div className="animate-pop-in relative flex-1 rounded-3xl border-4 border-white bg-white/95 px-4 py-3 text-lg font-medium text-slate-700 shadow-lg sm:text-2xl">
          <span
            className="absolute -left-3 top-1/2 h-5 w-5 -translate-y-1/2 rotate-45 border-b-4 border-l-4 border-white bg-white/95"
            aria-hidden="true"
          />
          {bubble}
        </div>
      </div>

      <h1 className="mt-6 text-center text-4xl font-bold text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.18)] sm:text-5xl">
        Foxi et les Petits Jeux
      </h1>
      <p className="mt-1 text-center text-lg font-medium text-sky-900">
        {stars > 0 ? `Tu as déjà ${stars} étoile${stars > 1 ? "s" : ""} ⭐` : "Gagne des étoiles en jouant ⭐"}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        {GAMES.map((g, i) => (
          <button
            key={g.id}
            onClick={() => {
              sfx.tap();
              onPlay(g.id);
            }}
            style={{ "--shade": g.shade, animationDelay: `${i * 90}ms` } as React.CSSProperties}
            className={cn(
              "chunky animate-slide-up flex items-center gap-4 rounded-[2rem] border-4 border-white/70 bg-gradient-to-br p-4 text-left text-white sm:flex-col sm:gap-2 sm:py-6 sm:text-center",
              g.gradient,
            )}
          >
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white/30 text-6xl sm:h-24 sm:w-24 sm:text-7xl">
              {g.icon}
            </span>
            <span>
              <span className="block text-3xl font-bold drop-shadow-sm">{g.title}</span>
              <span className="block text-lg font-medium text-white/90">{g.sub}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
