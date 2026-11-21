import type { EpisodeSpec } from "../engine/types";
import amazonBotBook from "./amazon-bot-book/episode.json";

export const EPISODES: EpisodeSpec[] = [
  amazonBotBook as unknown as EpisodeSpec,
];
