import { useEffect, useState } from "react";
import Background from "./components/Background";
import Menu, { type GameId } from "./components/Menu";
import Balloons from "./games/Balloons";
import Count from "./games/Count";
import Letters from "./games/Letters";
import Memory from "./games/Memory";
import { setSoundEnabled, sfx } from "./lib/audio";
import { cn } from "./utils/cn";

const STORAGE_KEY = "foxi-stars";

function loadStars() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

const TITLES: Record<GameId, string> = {
  memory: "🃏 Mémoire",
  count: "🍎 Compte avec moi",
  balloons: "🎈 Les ballons",
  letters: "🔤 Les lettres",
};

export default function App() {
  const [screen, setScreen] = useState<"menu" | GameId>("menu");
  const [playId, setPlayId] = useState(0);
  const [stars, setStars] = useState(loadStars);
  const [sound, setSound] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(stars));
    } catch {
      /* stockage indisponible */
    }
  }, [stars]);

  useEffect(() => {
    setSoundEnabled(sound);
  }, [sound]);

  const earn = (n: number) => setStars((s) => s + n);
  const goMenu = () => {
    window.speechSynthesis?.cancel();
    setScreen("menu");
  };
  const replay = () => setPlayId((p) => p + 1);

  const gameProps = { onEarn: earn, onReplay: replay, onMenu: goMenu };

  return (
    <div className="relative min-h-screen font-display">
      <Background />

      <header className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-4 py-3">
        {screen === "menu" ? (
          <span className="rounded-full bg-white/80 px-4 py-2 text-xl font-bold text-orange-500 shadow">🦊 Foxi</span>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => {
                sfx.tap();
                goMenu();
              }}
              aria-label="Retour au menu"
              className="chunky rounded-full bg-orange-400 px-4 py-2 text-xl font-bold text-white [--shade:#c2410c]"
            >
              🏠 <span className="hidden sm:inline">Menu</span>
            </button>
            <span className="truncate rounded-full bg-white/80 px-4 py-2 text-lg font-bold text-slate-700 shadow sm:text-xl">
              {TITLES[screen]}
            </span>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2">
          <span
            key={stars}
            className={cn(
              "rounded-full bg-white/90 px-4 py-2 text-xl font-bold text-amber-600 shadow",
              stars > 0 && "animate-jump",
            )}
            aria-label={`${stars} étoiles`}
          >
            ⭐ {stars}
          </span>
          <button
            onClick={() => setSound((s) => !s)}
            aria-label={sound ? "Couper le son" : "Activer le son"}
            aria-pressed={!sound}
            className="chunky grid h-11 w-11 place-items-center rounded-full bg-white text-2xl [--shade:#94a3b8]"
          >
            {sound ? "🔊" : "🔇"}
          </button>
        </div>
      </header>

      <main className="relative z-10 pt-2">
        {screen === "menu" && <Menu stars={stars} onPlay={(id) => { setPlayId((p) => p + 1); setScreen(id); }} />}
        {screen === "memory" && <Memory key={playId} {...gameProps} />}
        {screen === "count" && <Count key={playId} {...gameProps} />}
        {screen === "balloons" && <Balloons key={playId} {...gameProps} />}
        {screen === "letters" && <Letters key={playId} {...gameProps} />}
      </main>
    </div>
  );
}
