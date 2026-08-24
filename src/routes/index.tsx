import { createFileRoute } from "@tanstack/react-router";
import { DailySpendingTracker } from "../components/daily-spending-tracker";

export const Route = createFileRoute("/")({
  component: DailySpendingTracker,
});
