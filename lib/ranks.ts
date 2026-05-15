export interface Rank {
  name:        string;
  minXp:       number;
  color:       string; // badge text
  bgColor:     string; // badge background
  borderColor: string;
  description: string;
}

export const RANKS: Rank[] = [
  {
    name:        "Wanderer",
    minXp:       0,
    color:       "#6b5c44",
    bgColor:     "#e8dcc8",
    borderColor: "#b0a090",
    description: "Every legend begins with a single step.",
  },
  {
    name:        "Apprentice",
    minXp:       501,
    color:       "#2d4a1e",
    bgColor:     "#d4e8cc",
    borderColor: "#2d4a1e",
    description: "The path grows clearer with each quest.",
  },
  {
    name:        "Adventurer",
    minXp:       2001,
    color:       "#7c4f2a",
    bgColor:     "#e8d4c0",
    borderColor: "#8b5e3c",
    description: "Seasoned by challenge, shaped by choice.",
  },
  {
    name:        "Ranger",
    minXp:       5001,
    color:       "#1a5c7c",
    bgColor:     "#c8dce8",
    borderColor: "#1a5c7c",
    description: "The wilds hold no secrets from you.",
  },
  {
    name:        "Champion",
    minXp:       12001,
    color:       "#a37820",
    bgColor:     "#f5e8c0",
    borderColor: "#c9952a",
    description: "Tales of your deeds have spread far.",
  },
  {
    name:        "Legend",
    minXp:       25001,
    color:       "#6d28d9",
    bgColor:     "#ede9fe",
    borderColor: "#7c3aed",
    description: "Your name is etched in the annals of the age.",
  },
];

export interface RankInfo {
  rank:     Rank;
  nextRank: Rank | null;
  /** 0–1 fraction of the way to the next rank */
  progress: number;
  /** XP still needed for next rank, or 0 at max rank */
  xpToNext: number;
}

export function getRankInfo(totalXp: number): RankInfo {
  let rankIndex = 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalXp >= RANKS[i].minXp) {
      rankIndex = i;
      break;
    }
  }

  const rank    = RANKS[rankIndex];
  const nextRank = RANKS[rankIndex + 1] ?? null;

  const progress = nextRank
    ? Math.min((totalXp - rank.minXp) / (nextRank.minXp - rank.minXp), 1)
    : 1;

  const xpToNext = nextRank ? Math.max(nextRank.minXp - totalXp, 0) : 0;

  return { rank, nextRank, progress, xpToNext };
}
