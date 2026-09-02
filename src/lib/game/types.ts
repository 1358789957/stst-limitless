export type TabId = "arts" | "familiars" | "awaken" | "archive";

export type TechniqueKind = "prod" | "click" | "crit" | "eyes" | "domain";

export type SkillId = "blue" | "red" | "purple";

export type TechniqueDef = {
  id: string;
  name: string;
  kana: string;
  desc: string;
  kind: TechniqueKind;
  baseCost: number;
  costMult: number;
  prod: number;
  unlockAt: number;
};

export type FamiliarDef = {
  id: string;
  name: string;
  desc: string;
  baseCost: number;
  costMult: number;
  prod: number;
  unlockAt: number;
};

export type SpiritDef = {
  id: string;
  name: string;
  grade: string;
  flavor: string;
  art: string;
  baseHp: number;
  reward: number;
  minWave: number;
};

export type RankDef = {
  id: string;
  name: string;
  lifetime: number;
  mult: number;
};

export type AchievementDef = {
  id: string;
  name: string;
  desc: string;
};

export type NoteDef = {
  id: string;
  rankId: string;
  title: string;
  body: string;
};

export type GameSave = {
  version: number;
  started: boolean;
  energy: number;
  lifetime: number;
  ascended: number;
  prestige: number;
  wave: number;
  spiritHp: number;
  spiritMax: number;
  spiritId: string;
  tech: Record<string, number>;
  familiars: Record<string, number>;
  achievements: string[];
  clicks: number;
  kills: number;
  blackFlashes: number;
  bestCombo: number;
  domainUntil: number;
  domainCdUntil: number;
  skillCd: Record<string, number>;
  muted: boolean;
  lastTickAt: number;
};

export type FloatText = {
  id: number;
  x: number;
  y: number;
  text: string;
  crit: boolean;
  kind: "ce" | "flash" | "kill";
};
