import { createFileRoute } from "@tanstack/react-router";
import { PlayScreen } from "@/components/PlayScreen";
import type { Difficulty, GameMode } from "@/lib/game/types";

interface PlaySearch {
  mode: GameMode;
  difficulty: Difficulty;
  fresh: boolean;
}

export const Route = createFileRoute("/play")({
  validateSearch: (search: Record<string, unknown>): PlaySearch => {
    const mode: GameMode = search.mode === "daily" || search.mode === "study" ? search.mode : "free";
    const difficulty: Difficulty =
      search.difficulty === "easy" || search.difficulty === "hard" || search.difficulty === "medium"
        ? search.difficulty
        : "medium";
    return {
      mode,
      difficulty,
      fresh: search.fresh === true || search.fresh === "true" || search.fresh === 1 || search.fresh === "1",
    };
  },
  component: PlayRoute,
});

function PlayRoute() {
  const { mode, difficulty, fresh } = Route.useSearch();
  return <PlayScreen mode={mode} difficulty={difficulty} fresh={fresh} />;
}
