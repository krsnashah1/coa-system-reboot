import { CacheLevelConfig } from "../types";

// 4 lines. Sequence shows: cold misses, a HIT (4 again),
// and a conflict miss (12 evicts 4 because both map to line 0).
export const directMapping: CacheLevelConfig = {
  id: "cache-1-direct",
  phase: "cache",
  title: "Level 1: Direct Mapping",
  mapping: "direct",
  numLines: 4,
  requests: [4, 9, 4, 12, 9, 5, 5, 13],
  tutorial: {
    title: "Direct Mapping",
    body:
      "In direct mapping every main-memory block has exactly ONE possible cache line:\n\n" +
      "   line = block address MOD number of lines\n\n" +
      "The cache has 4 lines, so Block 4 goes to line 4 mod 4 = 0. " +
      "Drag the incoming block onto its correct line. If the block is already sitting there, that's a HIT!",
  },
};
