import type { CharId } from "./characters.ts";

export type UpgradeId =
  | "limitless"
  | "fist"
  | "blue"
  | "red"
  | "purple"
  | "eyes"
  | "flash"
  | "rct"
  | "clone"
  | "domain"
  | "speed"
  | "slash"
  | "cleave"
  | "flame"
  | "blades"
  | "sense"
  | "ripple"
  | "ray"
  | "plague"
  | "beam"
  | "adapt"
  | "split"
  | "focus"
  | "chain"
  | "more"
  | "size"
  | "linger"
  | "power"
  | "rate"
  | "infCap"
  | "infRad"
  | "cleaveN"
  | "wave";

export type OfferTag = "锻造" | "海克斯";
export type ShopKind = "forge" | "hex";

export type UpgradeDef = {
  id: UpgradeId;
  name: string;
  kana: string;
  desc: (lv: number) => string;
  max: number;
  who: CharId[] | "all";
  role: "anvil" | "mutation" | "support" | "climax" | "kit";
};

export type Offer = {
  id: UpgradeId;
  name: string;
  kana: string;
  tag: OfferTag;
  from: number;
  to: number;
  desc: string;
};

export const LEVEL_HP = 14;
export const DAMAGE_SHARD = 0.15;
export const RATE_SHARD = 0.12;
export const HEX_EVERY = 3;

function steps(lines: string[]) {
  return (lv: number) => lines[Math.max(0, Math.min(lines.length, lv) - 1)] ?? lines[0]!;
}

export const STARTER_IDS: Record<CharId, UpgradeId[]> = {
  gojo: ["limitless", "fist"],
  sukuna: ["slash", "cleave"],
};

export const MUTATION_IDS: UpgradeId[] = ["split", "focus", "chain", "more", "size", "linger"];

export const ANVIL_IDS: UpgradeId[] = ["power", "rate", "infCap", "infRad", "cleaveN"];

export const SKILL_LADDER: Record<CharId, UpgradeId[]> = {
  gojo: ["red", "blue", "purple", "ripple", "domain"],
  sukuna: ["wave", "flame", "blades", "adapt", "domain"],
};

export const UPGRADES: UpgradeDef[] = [
  {
    id: "power",
    name: "伤害",
    kana: "锻伤",
    max: 12,
    who: "all",
    role: "anvil",
    desc: steps([
      "砧。所有术式伤 ×1.15。捌的百分比也吃这一层。",
      "再锻一层伤。",
      "伤叠上去。等级不加伤。",
      "继续叠。",
      "伤再涨。",
      "砧还热。",
      "更深一锤。",
      "伤已经很沉。",
      "再叠。",
      "快满砧。",
      "几乎顶格。",
      "伤害拉满。",
    ]),
  },
  {
    id: "rate",
    name: "频率",
    kana: "锻速",
    max: 12,
    who: "all",
    role: "anvil",
    desc: steps([
      "砧。拳脚、六赫、苍、解、捌都更快。",
      "再快一截。",
      "连打更密。",
      "冷却再削。",
      "手感发飘。",
      "还能量。",
      "更快。",
      "几乎连响。",
      "再削。",
      "贴脸也跟得上。",
      "顶格前一锤。",
      "频率拉满。",
    ]),
  },
  {
    id: "infCap",
    name: "无下限容量",
    kana: "载",
    max: 6,
    who: ["gojo"],
    role: "anvil",
    desc: steps(["砧。无下限更能扛堆。不加伤。", "容量再涨。", "更难漏。", "后期苍蝇挤不穿。", "几乎满载。", "容量拉满。"]),
  },
  {
    id: "infRad",
    name: "无下限半径",
    kana: "圈",
    max: 6,
    who: ["gojo"],
    role: "anvil",
    desc: steps(["砧。无下限圈外扩。不加伤。", "圈再大。", "外沿更远。", "苍蝇更难贴。", "罩住半步。", "半径拉满。"]),
  },
  {
    id: "limitless",
    name: "无下限",
    kana: "无穷",
    max: 1,
    who: ["gojo"],
    role: "kit",
    desc: steps(["被动。波一苍蝇围满也挡。场伤很低。精英照样穿。"]),
  },
  {
    id: "fist",
    name: "拳脚",
    kana: "近打",
    max: 1,
    who: ["gojo"],
    role: "kit",
    desc: steps(["左键短打。伤和速度走锻造器。"]),
  },
  {
    id: "cleaveN",
    name: "捌数",
    kana: "多锁",
    max: 6,
    who: ["sukuna"],
    role: "anvil",
    desc: steps(["砧。捌同时多锁一个。", "再多锁。", "圈里更挤。", "再加一把。", "几乎满手。", "捌数拉满。"]),
  },
  {
    id: "wave",
    name: "二连",
    kana: "双斩",
    max: 1,
    who: ["sukuna"],
    role: "kit",
    desc: steps(["解再甩一道。捌圈更大，多锁一个。"]),
  },
  {
    id: "blue",
    name: "苍",
    kana: "顺转",
    max: 1,
    who: ["gojo"],
    role: "kit",
    desc: steps(["自动飞出追踪。左键还是拳脚。射速走频率砧。"]),
  },
  {
    id: "red",
    name: "六赫",
    kana: "反转",
    max: 1,
    who: ["gojo"],
    role: "kit",
    desc: steps(["六颗小赫自己打。射速走频率砧。"]),
  },
  {
    id: "purple",
    name: "虚式",
    kana: "虚构",
    max: 3,
    who: ["gojo"],
    role: "climax",
    desc: steps(["E。粗激光贯穿。冷却 5.6 秒。", "柱更宽，拖一道残影。", "两根并排。收束用。"]),
  },
  {
    id: "slash",
    name: "解",
    kana: "斩",
    max: 1,
    who: ["sukuna"],
    role: "kit",
    desc: steps(["左键。一道斩，朝你点的方向切开。"]),
  },
  {
    id: "cleave",
    name: "捌",
    kana: "拆",
    max: 1,
    who: ["sukuna"],
    role: "kit",
    desc: steps(["被动。贴身按硬度拆。百分比只吃伤害砧，不吃等级。"]),
  },
  {
    id: "flame",
    name: "开",
    kana: "火",
    max: 3,
    who: ["sukuna"],
    role: "climax",
    desc: steps(["E。一矢炸开。", "爆炸圈加大，加一条短火柱。", "两矢巨爆。"]),
  },
  {
    id: "flash",
    name: "黑闪",
    kana: "时空",
    max: 3,
    who: "all",
    role: "support",
    desc: steps(["对上了。Q 后、无极外沿、或斩的第一刀。黑一下。", "窗口更宽更长。", "还能再黑一次。对间距。"]),
  },
  {
    id: "adapt",
    name: "魔虚罗",
    kana: "轮转",
    max: 3,
    who: ["sukuna"],
    role: "support",
    desc: steps([
      "同一种伤叠轮。转一格，那种伤变轻，你反过来吃它。",
      "转得更快。抗得更死。",
      "留下上一格。换招的还会疼。",
    ]),
  },
  {
    id: "domain",
    name: "术域",
    kana: "必中",
    max: 3,
    who: "all",
    role: "climax",
    desc: steps(["R。全屏必中。冷却 22 秒。", "冻更久，打更狠。冷却 18 秒。", "冷却 15 秒。还是大技。"]),
  },
  {
    id: "split",
    name: "分裂",
    kana: "叉",
    max: 4,
    who: "all",
    role: "mutation",
    desc: steps(["弹道一分为二，每叉 70% 伤。", "再叉一股。", "三叉。场也会分。", "满叉。"]),
  },
  {
    id: "focus",
    name: "合成一大",
    kana: "合",
    max: 4,
    who: "all",
    role: "mutation",
    desc: steps(["散的合成一记。倍率约 2.2，判定更大。", "再合。", "场也收成一下重拆。", "极致收束。"]),
  },
  {
    id: "chain",
    name: "连锁",
    kana: "跳",
    max: 4,
    who: "all",
    role: "mutation",
    desc: steps(["命中后再跳一个，每跳 75%。", "跳两个。", "跳更远。", "三跳。自己找人。"]),
  },
  {
    id: "more",
    name: "增多",
    kana: "叠",
    max: 4,
    who: "all",
    role: "mutation",
    desc: steps(["多一发，或捌多锁一个。每发满伤。", "再多。", "六赫变八。捌圈里多挨一下。", "火力铺开。"]),
  },
  {
    id: "size",
    name: "变大",
    kana: "胀",
    max: 4,
    who: "all",
    role: "mutation",
    desc: steps(["弹和拳变大。伤乘 1.20。", "再胀。", "特效铺开。", "整块屏幕都是刃。"]),
  },
  {
    id: "linger",
    name: "延长",
    kana: "延",
    max: 4,
    who: "all",
    role: "mutation",
    desc: steps(["打得更远，留得更久。", "拳脚够得着更前。捌圈加大。", "弹留得更久。", "距离拉满。"]),
  },
  {
    id: "eyes",
    name: "六瞳",
    kana: "天与",
    max: 3,
    who: ["gojo"],
    role: "kit",
    desc: steps(["拾取圈拉开。", "圈再大。", "满图拾取。"]),
  },
  {
    id: "rct",
    name: "逆转",
    kana: "再生",
    max: 3,
    who: "all",
    role: "kit",
    desc: steps(["生命 +18，开始回血。", "生命 +36。", "生命 +54。"]),
  },
  {
    id: "speed",
    name: "步法",
    kana: "踏",
    max: 3,
    who: "all",
    role: "kit",
    desc: steps(["移速 +20%。", "移速 +40%。", "移速 +60%。"]),
  },
  {
    id: "clone",
    name: "残影",
    kana: "分身",
    max: 4,
    who: ["gojo"],
    role: "kit",
    desc: steps(["绕身球。", "三颗。", "轨道外扩。", "四颗。"]),
  },
  {
    id: "blades",
    name: "厨刀",
    kana: "绕",
    max: 4,
    who: ["sukuna"],
    role: "kit",
    desc: steps(["绕身刃。", "三把。", "轨道外扩。", "四把。"]),
  },
  {
    id: "sense",
    name: "嗅血",
    kana: "猎",
    max: 3,
    who: ["sukuna"],
    role: "kit",
    desc: steps(["拾取圈拉开。", "圈再大。", "满图嗅血。"]),
  },
  {
    id: "ripple",
    name: "咒痕",
    kana: "涟",
    max: 4,
    who: ["gojo"],
    role: "kit",
    desc: steps(["跳一圈。", "连跳 2。", "留场。", "击杀传染。"]),
  },
  {
    id: "ray",
    name: "扫射",
    kana: "六瞳",
    max: 4,
    who: ["gojo"],
    role: "kit",
    desc: steps(["扫一束。", "更粗。", "更久。", "两束。"]),
  },
  {
    id: "plague",
    name: "血雾",
    kana: "厨痕",
    max: 4,
    who: ["sukuna"],
    role: "kit",
    desc: steps(["雾跳一个。", "跳 2。", "圈更大。", "解也会传染。"]),
  },
  {
    id: "beam",
    name: "光刃",
    kana: "解线",
    max: 4,
    who: ["sukuna"],
    role: "kit",
    desc: steps(["横扫光刃。", "更宽。", "更远。", "交叉。"]),
  },
];

export const UPGRADE_MAP = Object.fromEntries(UPGRADES.map((u) => [u.id, u])) as Record<
  UpgradeId,
  UpgradeDef
>;

export function emptyWeps(): Record<UpgradeId, number> {
  const o = {} as Record<UpgradeId, number>;
  for (const u of UPGRADES) o[u.id] = 0;
  return o;
}

export function fieldMuts(weps: Record<UpgradeId, number>) {
  return MUTATION_IDS.reduce((n, id) => n + (weps[id] ?? 0), 0);
}

export function levelHp(level: number) {
  return 100 + LEVEL_HP * (Math.max(1, level) - 1);
}

export function forgeDamageMul(power: number) {
  return 1 + DAMAGE_SHARD * Math.max(0, power);
}

export function forgeRateMul(rate: number) {
  return 1 + RATE_SHARD * Math.max(0, rate);
}

export function shapeMul(weps: Record<UpgradeId, number>) {
  const size = weps.size ?? 0;
  const focus = weps.focus ?? 0;
  let m = 1 + 0.2 * size;
  if (focus > 0) m *= 2.2 * (1 + 0.12 * (focus - 1));
  return m;
}

export function isMutationId(id: UpgradeId) {
  return (MUTATION_IDS as string[]).includes(id);
}

export function isAnvilId(id: UpgradeId) {
  return (ANVIL_IDS as string[]).includes(id);
}

export function isHexLevel(level: number) {
  return level >= HEX_EVERY && level % HEX_EVERY === 0;
}

export function ladderSkillAt(char: CharId, level: number): UpgradeId | null {
  if (level < 2) return null;
  return SKILL_LADDER[char][level - 2] ?? null;
}

export function nextLadderSkill(char: CharId, weps: Record<UpgradeId, number>): UpgradeId | null {
  for (const id of SKILL_LADDER[char]) {
    if ((weps[id] ?? 0) < 1) return id;
  }
  return null;
}

export function xpNeed(level: number) {
  const early = [22, 28, 36, 44, 52, 68, 88, 112];
  if (level < early.length) return early[level]!;
  return Math.floor(112 * Math.pow(1.28, level - 7));
}

export function xpToReach(level: number) {
  let n = 0;
  for (let i = 0; i < level - 1; i++) n += xpNeed(i);
  return n;
}

export function inferTag(id: UpgradeId): OfferTag {
  return isMutationId(id) ? "海克斯" : "锻造";
}

export function makeOffer(id: UpgradeId, weps: Record<UpgradeId, number>, tag?: OfferTag): Offer {
  const def = UPGRADE_MAP[id];
  const from = weps[id] ?? 0;
  const to = Math.min(def.max, from + 1);
  return {
    id,
    name: def.name,
    kana: def.kana,
    tag: tag ?? inferTag(id),
    from,
    to,
    desc: def.desc(to),
  };
}

export function anvilPool(char: CharId, weps: Record<UpgradeId, number>): UpgradeId[] {
  const ids: UpgradeId[] = ["power", "rate"];
  if (char === "gojo") ids.push("infCap", "infRad");
  if (char === "sukuna") ids.push("cleaveN");
  return ids.filter((id) => (weps[id] ?? 0) < UPGRADE_MAP[id].max);
}

export function hexPool(weps: Record<UpgradeId, number>): UpgradeId[] {
  return MUTATION_IDS.filter((id) => (weps[id] ?? 0) < UPGRADE_MAP[id].max);
}

function pickN(ids: UpgradeId[], n: number, rng: () => number): UpgradeId[] {
  const pool = ids.slice();
  const out: UpgradeId[] = [];
  while (out.length < n && pool.length) {
    const i = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
    const id = pool.splice(i, 1)[0];
    if (id) out.push(id);
  }
  return out;
}

export function rollForge(
  char: CharId,
  weps: Record<UpgradeId, number>,
  rng: () => number = Math.random,
): Offer[] {
  return pickN(anvilPool(char, weps), 3, rng).map((id) => makeOffer(id, weps, "锻造"));
}

export function rollHex(weps: Record<UpgradeId, number>, rng: () => number = Math.random): Offer[] {
  return pickN(hexPool(weps), 3, rng).map((id) => makeOffer(id, weps, "海克斯"));
}
