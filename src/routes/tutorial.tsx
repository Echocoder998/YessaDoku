import { createFileRoute } from "@tanstack/react-router";
import { GuidedPlay } from "@/components/GuidedPlay";

export const Route = createFileRoute("/tutorial")({
  component: GuidedPlay,
});
