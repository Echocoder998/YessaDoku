import { createFileRoute } from "@tanstack/react-router";
import { StatsScreen } from "@/components/StatsScreen";

export const Route = createFileRoute("/stats")({
  component: StatsScreen,
});
