import type { EpisodeSpec } from "../engine/types";
import { validateEpisode } from "../engine/schema";
import amazonBotBookRaw from "./amazon-bot-book/episode.json";
import boeing248DaysRaw from "./boeing-248-days/episode.json";

// Runtime-validated: invalid episode data fails the build/tests, not a paid render.
export const EPISODES: EpisodeSpec[] = [
  validateEpisode(amazonBotBookRaw, "amazon-bot-book/episode.json"),
  validateEpisode(boeing248DaysRaw, "boeing-248-days/episode.json"),
];
