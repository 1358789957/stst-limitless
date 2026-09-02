import type { CharId } from "./characters";

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
  | "sense";

export type UpgradeDef = {
  id: UpgradeId;
  name: string;
  kana: string;
  desc: (lv: number) => string;
  max: number;
  who: CharId[] | "all";
};

export const UPGRADES: UpgradeDef[] = [
  {
    id: "limitless",
    name: "无极",
    kana: "无穷",
    max: 8,
    who: ["gojo"],
    desc: (lv) => `脉冲圈明显变大（半径 ${70 + lv * 16}），摊平伤害提高。`,
  },
  {
    id: "blue",
    name: "苍",
    kana: "顺转",
    max: 8,
    who: ["gojo"],
    desc: (lv) =>
      `追踪咒力球变大，同时存在 ${1 + Math.floor(lv / 2)} 颗。`,
  },
  {
    id: "red",
    name: "赫",
    kana: "反转",
    max: 8,
    who: ["gojo"],
    desc: (lv) => `斥力弹变粗，一次轰出 ${4 + lv} 发。`,
  },
  {
    id: "purple",
    name: "虚式",
    kana: "虚构",
    max: 6,
    who: ["gojo"],
    desc: (lv) => `主动技。E 或右侧按钮放出贯穿光柱，柱体变宽。冷却缩短。`,
  },
  {
    id: "clone",
    name: "残影",
    kana: "分身",
    max: 6,
    who: ["gojo"],
    desc: (lv) => `绕身咒力球变大，数量 ${2 + lv}。`,
  },
  {
    id: "eyes",
    name: "六瞳",
    kana: "天与",
    max: 5,
    who: ["gojo"],
    desc: (lv) => `拾取圈肉眼可见地扩大，宝石从更远处飞来。`,
  },
  {
    id: "slash",
    name: "解",
    kana: "斩",
    max: 8,
    who: ["sukuna"],
    desc: (lv) => `斩击变长变粗，一次 ${1 + Math.floor(lv / 2)} 道。`,
  },
  {
    id: "cleave",
    name: "捌",
    kana: "拆",
    max: 7,
    who: ["sukuna"],
    desc: (lv) => `近身横扫半径变大，扇面更宽。`,
  },
  {
    id: "flame",
    name: "开",
    kana: "火",
    max: 6,
    who: ["sukuna"],
    desc: (lv) => `火矢爆炸圈变大，灼烧更狠。`,
  },
  {
    id: "blades",
    name: "厨刀",
    kana: "绕",
    max: 6,
    who: ["sukuna"],
    desc: (lv) => `绕身斩刃变大，数量 ${2 + lv}。`,
  },
  {
    id: "sense",
    name: "嗅血",
    kana: "猎",
    max: 5,
    who: ["sukuna"],
    desc: (lv) => `拾取圈扩大，咒力宝石会被拽过来。`,
  },
  {
    id: "flash",
    name: "黑闪",
    kana: "时空",
    max: 6,
    who: "all",
    desc: (lv) => `暴击变成黑闪连锁，弹跳 ${lv} 个目标。击杀喷血。`,
  },
  {
    id: "rct",
    name: "逆转",
    kana: "再生",
    max: 5,
    who: "all",
    desc: (lv) => `生命上限 +${18 * lv}，持续回血，头顶跳出回复。`,
  },
  {
    id: "speed",
    name: "步法",
    kana: "踏",
    max: 5,
    who: "all",
    desc: (lv) => `移速 +${lv * 20}%，身后残影更长。`,
  },
  {
    id: "domain",
    name: "术域",
    kana: "必中",
    max: 4,
    who: "all",
    desc: () => "主动技。展开后全屏必中。空格或右侧按钮。",
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
