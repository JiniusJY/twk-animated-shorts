import type { EpisodeSpec } from "../engine/types";
import amazonBotBook from "./amazon-bot-book/episode.json";
import boeing248Days from "./boeing-248-days/episode.json";

export const EPISODES: EpisodeSpec[] = [
  amazonBotBook as unknown as EpisodeSpec,
  boeing248Days as unknown as EpisodeSpec,
];
