export type MappingType = "direct" | "fully-associative" | "set-associative";

export interface CacheLevelConfig {
  id: string;
  phase: "cache";
  title: string;
  mapping: MappingType;
  numLines: number;
  ways?: number;                  // for set-associative
  requests: number[];             // block addresses arriving in order
  tutorial: { title: string; body: string };
}

export interface PipelineLevelConfig {
  id: string;
  phase: "pipeline";
  title: string;
  stages: string[];
  program: { op: string; dest?: string; src?: string[] }[];
  tutorial: { title: string; body: string };
}

export type LevelConfig = CacheLevelConfig | PipelineLevelConfig;
