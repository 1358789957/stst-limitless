import type { CharId } from "./characters.ts";

export type UpgradeId =
  | "limitless"
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
  | "adapt";

export type OfferTag = "新术" | "进化" | "支援" | "合成" | "术域";

export type UpgradeDef = {
  id: UpgradeId;
  name: string;
  kana: string;
  desc: (lv: number) => string;
  max: number;
  who: CharId[] | "all";
  role: "verb" | "support" | "climax";
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

function steps(lines: string[]) {
  return (lv: number) => lines[Math.max(0, Math.min(lines.length, lv) - 1)] ?? lines[0]!;
}

export const STARTER_IDS: Record<CharId, UpgradeId[]> = {
  gojo: ["limitless", "blue"],
  sukuna: ["slash", "cleave"],
};

export const VERBS: Record<CharId, UpgradeId[]> = {
  gojo: ["limitless", "blue", "red", "clone", "ripple", "ray", "purple"],
  sukuna: ["slash", "cleave", "blades", "plague", "beam", "flame"],
};

export const SUPPORTS: Record<CharId, UpgradeId[]> = {
  gojo: ["eyes", "flash", "rct", "speed"],
  sukuna: ["sense", "flash", "rct", "speed", "adapt"],
};

export const UPGRADES: UpgradeDef[] = [
  {
    id: "limitless",
    name: "无下限",
    kana: "无穷",
    max: 4,
    who: ["gojo"],
    role: "verb",
    desc: steps([
      "被动。小圈挡苍蝇。四五只扛得住，八只叠上来就漏。",
      "圈和容量变大。苍蝇更难摸到。过载会漏。",
      "苍蝇死在外沿。精英、血涂、灾核照样穿。",
      "容量再涨。只有规则破坏者能杀你。",
    ]),
  },
  {
    id: "blue",
    name: "苍",
    kana: "顺转",
    max: 4,
    who: ["gojo"],
    role: "verb",
    desc: steps([
      "左键。一颗追踪球，朝你点的地方飞。",
      "两颗同时飞。",
      "两颗会穿孔。球更大。",
      "三颗死咬。这是苍的路。",
    ]),
  },
  {
    id: "red",
    name: "赫",
    kana: "反转",
    max: 4,
    who: ["gojo"],
    role: "verb",
    desc: steps([
      "三发散弹。W 也能立刻轰。",
      "五发，扇面更开。",
      "五发加粗。打飞。",
      "七发再补一波。赫把路清开。",
    ]),
  },
  {
    id: "purple",
    name: "虚式",
    kana: "虚构",
    max: 4,
    who: ["gojo"],
    role: "verb",
    desc: steps([
      "E。粗激光贯穿。冷却 5.6 秒。别当普通技砸。",
      "柱更宽，拖一道残影。",
      "走完炸一圈。",
      "两根并排。收束用。",
    ]),
  },
  {
    id: "clone",
    name: "残影",
    kana: "分身",
    max: 4,
    who: ["gojo"],
    role: "verb",
    desc: steps([
      "两颗绕身球。走位就是刀。",
      "三颗。贴身带绞肉。",
      "轨道外扩。圈到更远。",
      "四颗飞转。无极近战的另一条路。",
    ]),
  },
  {
    id: "eyes",
    name: "六瞳",
    kana: "天与",
    max: 3,
    who: ["gojo"],
    role: "support",
    desc: steps([
      "拾取圈拉开。宝石自己飞。",
      "圈再大一截。远处也吸。",
      "满图拾取。别弯腰。",
    ]),
  },
  {
    id: "slash",
    name: "解",
    kana: "斩",
    max: 4,
    who: ["sukuna"],
    role: "verb",
    desc: steps([
      "左键。一道斩，朝你点的方向切开。",
      "两道并排。",
      "两道穿孔。斩更长。",
      "三道十字。空气也是刃。",
    ]),
  },
  {
    id: "cleave",
    name: "捌",
    kana: "拆",
    max: 4,
    who: ["sukuna"],
    role: "verb",
    desc: steps([
      "被动。贴身按硬度拆。苍蝇两下没，灾核只掉一块。",
      "圈更大。百分比更深。",
      "拆得更勤。精英也掉一块。",
      "整圈拆开。还是百分比。W 立刻再拆。",
    ]),
  },
  {
    id: "flame",
    name: "开",
    kana: "火",
    max: 4,
    who: ["sukuna"],
    role: "verb",
    desc: steps([
      "E。一矢炸开。冷却 3.1 秒。留着清堆。",
      "爆炸圈到 62。加一条短火柱。",
      "两矢 + 火柱。还是慢。",
      "两矢巨爆，火柱加宽。",
    ]),
  },
  {
    id: "blades",
    name: "厨刀",
    kana: "绕",
    max: 4,
    who: ["sukuna"],
    role: "verb",
    desc: steps([
      "两把绕身刃。走过去就是割。",
      "三把。",
      "轨道外扩。圈到更远。",
      "四把飞转。别让人靠近。",
    ]),
  },
  {
    id: "sense",
    name: "嗅血",
    kana: "猎",
    max: 3,
    who: ["sukuna"],
    role: "support",
    desc: steps([
      "拾取圈拉开。宝石会被拽过来。",
      "圈再大。猎得更远。",
      "满图嗅血。宝石自己跪。",
    ]),
  },
  {
    id: "flash",
    name: "黑闪",
    kana: "时空",
    max: 3,
    who: "all",
    role: "support",
    desc: steps([
      "对上了。Q 后、无极外沿、或斩的第一刀。黑一下，下一刀更重。",
      "窗口更宽更长。对上之后那几下更狠。",
      "还能再黑一次。别连按，对间距。",
    ]),
  },
  {
    id: "rct",
    name: "逆转",
    kana: "再生",
    max: 3,
    who: "all",
    role: "support",
    desc: steps([
      "生命 +18，开始回血。",
      "生命 +36，回血加快。",
      "生命 +54。站得住才能放术域。",
    ]),
  },
  {
    id: "speed",
    name: "步法",
    kana: "踏",
    max: 3,
    who: "all",
    role: "support",
    desc: steps([
      "移速 +20%。残影跟着你。",
      "移速 +40%。",
      "移速 +60%。右键点地也是斩。",
    ]),
  },
  {
    id: "domain",
    name: "术域",
    kana: "必中",
    max: 3,
    who: "all",
    role: "climax",
    desc: steps([
      "R。全屏必中。冷却 22 秒。留着清场。",
      "冻更久，打更狠。冷却 18 秒。",
      "冷却 15 秒。还是大技。别手痒。",
    ]),
  },
  {
    id: "ripple",
    name: "咒痕",
    kana: "涟",
    max: 4,
    who: ["gojo"],
    role: "verb",
    desc: steps([
      "苍命中后跳一圈。蒜味脉冲。",
      "连跳 2 个。圈更大。",
      "跳完留一片场。站进去也挨打。",
      "击杀也会传染。三跳。",
    ]),
  },
  {
    id: "ray",
    name: "扫射",
    kana: "六瞳",
    max: 4,
    who: ["gojo"],
    role: "verb",
    desc: steps([
      "自动扫一束激光。短、薄、会转。",
      "梁更粗。",
      "扫得更久。",
      "两束交叉。六瞳锁死。",
    ]),
  },
  {
    id: "plague",
    name: "血雾",
    kana: "厨痕",
    max: 4,
    who: ["sukuna"],
    role: "verb",
    desc: steps([
      "捌中的人身上开裂，雾跳到旁边一个。",
      "跳 2 个。",
      "雾圈更大。",
      "解命中也会传染。三跳。",
    ]),
  },
  {
    id: "beam",
    name: "光刃",
    kana: "解线",
    max: 4,
    who: ["sukuna"],
    role: "verb",
    desc: steps([
      "一道横扫光刃。薄激光切过屏幕。",
      "刃更宽。",
      "扫得更远。",
      "两道交叉。空气开膛。",
    ]),
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

export function poolFor(char: CharId) {
  return UPGRADES.filter((u) => u.who === "all" || u.who.includes(char));
}

export function craftId(char: CharId, weps: Record<UpgradeId, number>): UpgradeId | null {
  if (char === "gojo" && weps.blue >= 2 && weps.red >= 2 && weps.purple < 1) return "purple";
  if (char === "sukuna" && weps.slash >= 2 && weps.cleave >= 2 && weps.flame < 1) return "flame";
  return null;
}

export function inferTag(id: UpgradeId, from: number, asCraft = false): OfferTag {
  if (asCraft) return "合成";
  if (id === "domain") return "术域";
  if (UPGRADE_MAP[id].role === "support") return "支援";
  if (from <= 0) return "新术";
  return "进化";
}

export function makeOffer(
  id: UpgradeId,
  weps: Record<UpgradeId, number>,
  tag?: OfferTag,
): Offer {
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
        ? "苍和赫叠够了。E 开虚式，一根贯穿柱。"
        : "解和捌叠够了。E 开火矢。"
      : def.desc(to),
  };
}

/** Mid/late spotlight only. Early forks come from the 3-pick mixer, not a railroad. */
export function spotlightId(
  char: CharId,
  weps: Record<UpgradeId, number>,
  time: number,
  level: number,
): UpgradeId | null {
  const owned = (id: UpgradeId) => (weps[id] ?? 0) > 0;
  if (!owned("domain") && (level >= 7 || time >= 95)) return "domain";
  if (char === "gojo" && !owned("purple") && (level >= 5 || time >= 58)) return "purple";
  if (char === "sukuna" && !owned("flame") && (level >= 5 || time >= 62)) return "flame";
  return null;
}

function pickWeighted(
  ids: UpgradeId[],
  weight: (id: UpgradeId) => number,
  rng: () => number,
): UpgradeId | null {
  const avail = ids
    .filter((id) => weight(id) > 0)
    .sort((a, b) => weight(b) - weight(a) || a.localeCompare(b));
  if (!avail.length) return null;
  const weights = avail.map(weight);
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return null;
  let r = rng() * sum;
  for (let i = 0; i < avail.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return avail[i]!;
  }
  return avail[avail.length - 1]!;
}

export function rollPicks(
  char: CharId,
  weps: Record<UpgradeId, number>,
  time: number,
  level: number,
  rng: () => number = Math.random,
  lastPick: UpgradeId | null = null,
): Offer[] {
  const pool = poolFor(char).filter((u) => (weps[u.id] ?? 0) < u.max);
  if (pool.length === 0) return [];

  const allowed = new Set(pool.map((u) => u.id));
  const taken = new Set<UpgradeId>();
  const out: Offer[] = [];

  const add = (id: UpgradeId | null, tag?: OfferTag) => {
    if (!id || taken.has(id) || !allowed.has(id)) return false;
    taken.add(id);
    out.push(makeOffer(id, weps, tag));
    return true;
  };

  const craft = craftId(char, weps);
  if (craft) add(craft, "合成");

  const spot = spotlightId(char, weps, time, level);
  if (spot) add(spot, spot === craft ? "合成" : undefined);

  const verbs = VERBS[char];
  const supports = SUPPORTS[char];
  const starters = STARTER_IDS[char];
  const extraVerbs = verbs.filter((id) => !starters.includes(id) && (weps[id] ?? 0) > 0).length;
  const newVerbs = verbs.filter((id) => (weps[id] ?? 0) === 0 && allowed.has(id));
  const evolvable = pool.filter((u) => (weps[u.id] ?? 0) > 0).map((u) => u.id);

  const climaxEarly = (id: UpgradeId) => {
    if (id === "purple" || id === "flame") return time < 50 ? 0.12 : 1;
    return 1;
  };

  if (out.length < 3 && extraVerbs < 2 && newVerbs.length) {
    add(pickWeighted(newVerbs, climaxEarly, rng));
  }
  if (out.length < 3 && extraVerbs < 2 && (level <= 4 || time < 75) && newVerbs.some((id) => !taken.has(id))) {
    add(pickWeighted(newVerbs.filter((id) => !taken.has(id)), climaxEarly, rng));
  }

  if (out.length < 3 && evolvable.some((id) => !taken.has(id))) {
    add(
      pickWeighted(
        evolvable.filter((id) => !taken.has(id)),
        (id) => {
          const lv = weps[id] ?? 0;
          return 0.8 + lv * 1.35 + (id === lastPick ? 2.2 : 0) + (starters.includes(id) ? 0.35 : 0.7);
        },
        rng,
      ),
    );
  }

  if (out.length < 3 && (time > 28 || extraVerbs >= 1)) {
    add(
      pickWeighted(
        supports.filter((id) => allowed.has(id) && !taken.has(id)),
        (id) => ((weps[id] ?? 0) > 0 ? 0.55 : 1),
        rng,
      ),
    );
  }

  const rest = pool
    .map((u) => u.id)
    .filter((id) => {
      if (taken.has(id)) return false;
      if (id === "domain" && time < 90 && level < 7) return false;
      return true;
    });
  while (out.length < 3 && rest.length) {
    const id = pickWeighted(rest, (cand) => {
      const lv = weps[cand] ?? 0;
      if (cand === "domain") return 0.35;
      if (verbs.includes(cand) && lv > 0) return 2.2;
      if (verbs.includes(cand) && lv === 0) return extraVerbs >= 2 ? 0.35 : 1.1;
      return 0.7;
    }, rng);
    if (!id) break;
    add(id);
    const i = rest.indexOf(id);
    if (i >= 0) rest.splice(i, 1);
  }

  return out.slice(0, 3);
}
