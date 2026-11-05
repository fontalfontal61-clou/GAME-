export interface GameProps {
  /** Ajoute des étoiles au total de l'enfant. */
  onEarn: (stars: number) => void;
  onReplay: () => void;
  onMenu: () => void;
}
