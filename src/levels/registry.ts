import { LevelConfig } from "./types";
import { directMapping } from "./cache/direct";

// To add a level: create a file in levels/ and add it to this array.
export const LEVELS: LevelConfig[] = [directMapping];

export const getLevel = (id: string) => LEVELS.find((l) => l.id === id);
