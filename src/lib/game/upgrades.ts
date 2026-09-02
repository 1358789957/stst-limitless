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
  | "infRad";

export type OfferTag = "专属" | "质变" | "合成" | "术域" | "支援";

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

export const MAX_ANVIL_CHAIN = 3;
export const LEVEL_HP = 14;
export const DAMAGE_SHARD = 0.15;
export const RATE_SHARD = 0.12;

function steps(lines: string[]) {
  return (lv: number) => lines[Math.max(0, Math.min(lines.length, lv) - 1)] ?? lines[0]!;
}

export const STARTER_IDS: Record<CharId, UpgradeId[]> = {
  gojo: ["limitless", "fist"],
  sukuna: ["slash", "cleave"],
};

export const MUTATION_IDS: UpgradeId[] = ["split", "focus", "chain", "more", "size", "linger"];

export const ANVIL_IDS: UpgradeId[] = ["power", "rate", "infCap", "infRad"];

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
    id: "blue",
    name: "苍",
    kana: "顺转",
    max: 1,
    who: ["gojo"],
    role: "anvil",
    desc: steps(["获得苍。自动飞出追踪。左键还是拳脚。射速走频率砧。"]),
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
  return (ANVIL_IDS as string[]).includes(id) || id === "blue";
}

export function shopClosesOn(id: UpgradeId) {
  return !isAnvilId(id);
}

export function anvilChainChance(extraAlready: number) {
  if (extraAlready >= MAX_ANVIL_CHAIN) return 0;
  return [0.48, 0.3, 0.16][extraAlready] ?? 0;
}

export function shouldChainAnvil(extraAlready: number, rng: () => number = Math.random) {
  return rng() < anvilChainChance(extraAlready);
}

export function craftId(char: CharId, weps: Record<UpgradeId, number>): UpgradeId | null {
  if (char === "gojo" && weps.red >= 1 && fieldMuts(weps) >= 3 && weps.purple < 1) return "purple";
  if (char === "sukuna" && fieldMuts(weps) >= 3 && weps.flame < 1) return "flame";
  return null;
}

export function inferTag(id: UpgradeId, _from = 0, asCraft = false): OfferTag {
  if (asCraft) return "合成";
  if (id === "domain") return "术域";
  if (id === "flash" || id === "adapt") return "支援";
  if (isMutationId(id)) return "质变";
  return "专属";
}

export function makeOffer(id: UpgradeId, weps: Record<UpgradeId, number>, tag?: OfferTag): Offer {
  const def = UPGRADE_MAP[id];
  const from = weps[id] ?? 0;
  const to = Math.min(def.max, from + 1);
  const craft = tag === "合成";
  return {
    id,
    name: craft ? (id === "purple" ? "虚式·合成" : "开·合成") : def.name,
    kana: craft ? "极致" : def.kana,
    tag: tag ?? inferTag(id, from),
    from,
    to,
    desc: craft
      ? id === "purple"
        ? "突变叠够了。E 开虚式。"
        : "突变叠够了。E 开火矢。"
      : def.desc(to),
  };
}

export function anvilPool(char: CharId, weps: Record<UpgradeId, number>, time: number, level: number): UpgradeId[] {
  const ids: UpgradeId[] = ["power", "rate"];
  if (char === "gojo") {
    ids.push("infCap", "infRad");
    if ((weps.blue ?? 0) < 1 && (level >= 4 || time >= 55)) ids.push("blue");
  }
  return ids.filter((id) => (weps[id] ?? 0) < UPGRADE_MAP[id].max);
}

export function extraPool(
  char: CharId,
  weps: Record<UpgradeId, number>,
  time: number,
  level: number,
): UpgradeId[] {
  const out: UpgradeId[] = [];
  const craft = craftId(char, weps);
  if (craft) out.push(craft);
  if ((weps.flash ?? 0) < UPGRADE_MAP.flash.max && (time >= 28 || level >= 3)) out.push("flash");
  if (char === "sukuna" && (weps.adapt ?? 0) < UPGRADE_MAP.adapt.max && (time >= 36 || level >= 3)) {
    out.push("adapt");
  }
  if ((weps.domain ?? 0) < UPGRADE_MAP.domain.max && (level >= 7 || time >= 95)) out.push("domain");
  return out.filter((id) => {
    const def = UPGRADE_MAP[id];
    if (def.who !== "all" && !def.who.includes(char)) return false;
    return (weps[id] ?? 0) < def.max;
  });
}

function pickFrom(ids: UpgradeId[], rng: () => number, taken: Set<UpgradeId>): UpgradeId | null {
  const avail = ids.filter((id) => !taken.has(id));
  if (!avail.length) return null;
  const i = Math.min(avail.length - 1, Math.floor(rng() * avail.length));
  return avail[i] ?? null;
}

export function rollPicks(
  char: CharId,
  weps: Record<UpgradeId, number>,
  time: number,
  level: number,
  rng: () => number = Math.random,
  _lastPick: UpgradeId | null = null,
): Offer[] {
  const taken = new Set<UpgradeId>();
  const out: Offer[] = [];
  const anvils = anvilPool(char, weps, time, level);
  const muts = MUTATION_IDS.filter((id) => (weps[id] ?? 0) < UPGRADE_MAP[id].max);
  const extras = extraPool(char, weps, time, level);

  const add = (id: UpgradeId | null, tag?: OfferTag) => {
    if (!id || taken.has(id)) return false;
    taken.add(id);
    const craft = id === craftId(char, weps);
    out.push(makeOffer(id, weps, tag ?? inferTag(id, weps[id] ?? 0, craft)));
    return true;
  };

  for (let slot = 0; slot < 3; slot++) {
    const bags: { kind: "anvil" | "mut" | "extra"; ids: UpgradeId[]; w: number }[] = [];
    if (anvils.some((id) => !taken.has(id))) bags.push({ kind: "anvil", ids: anvils, w: 0.46 });
    if (muts.some((id) => !taken.has(id))) bags.push({ kind: "mut", ids: muts, w: 0.46 });
    if (extras.some((id) => !taken.has(id))) bags.push({ kind: "extra", ids: extras, w: 0.08 });
    if (!bags.length) break;
    const sum = bags.reduce((n, b) => n + b.w, 0);
    let r = rng() * sum;
    let bag = bags[bags.length - 1]!;
    for (const b of bags) {
      r -= b.w;
      if (r <= 0) {
        bag = b;
        break;
      }
    }
    const id = pickFrom(bag.ids, rng, taken);
    if (!id) {
      const fallback = bags.find((b) => b !== bag && b.ids.some((x) => !taken.has(x)));
      add(fallback ? pickFrom(fallback.ids, rng, taken) : null);
      continue;
    }
    const craft = id === craftId(char, weps);
    add(
      id,
      bag.kind === "mut" ? "质变" : bag.kind === "anvil" ? "专属" : inferTag(id, weps[id] ?? 0, craft),
    );
  }

  return out.slice(0, 3);
}
