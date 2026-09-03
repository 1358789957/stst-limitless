import { publicUrl } from "./asset-url.ts";

export type CharId = "gojo" | "sukuna";

export type CharDef = {
  id: CharId;
  name: string;
  title: string;
  kana: string;
  blurb: string;
  portrait: string;
  sprite: "hero" | "sukuna";
  accent: "ice" | "blood";
  start: string;
  line: string;
  domainName: string;
  hitLine: string;
  kit: string[];
  dashName: string;
  dashHint: string;
  unlockHint?: string;
};

export const CHARS: CharDef[] = [
  {
    id: "gojo",
    name: "5t5",
    title: "最强",
    kana: "LIMITLESS",
    blurb: "无下限先稠后挡。苍蝇摸不到，灾核照样穿。",
    portrait: publicUrl("art/hero.png"),
    sprite: "hero",
    accent: "ice",
    start: "limitless",
    line: "吾乃最强。",
    domainName: "无量空处",
    hitLine: "碰到了。无极呢？",
    kit: ["无下限", "拳脚", "六赫", "苍", "虚式", "咒痕", "无量空处"],
    dashName: "瞬移",
    dashHint: "Q 踏步。左键拳脚。右键走。",
  },
  {
    id: "sukuna",
    name: "宿傩",
    title: "灾祸",
    kana: "DISMANTLE",
    blurb: "捌被动按硬度拆。左键解飞出去。",
    portrait: publicUrl("art/sukuna.jpg"),
    sprite: "sukuna",
    accent: "blood",
    start: "slash",
    line: "精彩。再跪一次。",
    domainName: "伏魔御厨子",
    hitLine: "被摸到了。开。",
    kit: ["捌", "解", "二连", "开", "厨刀", "魔虚罗", "伏魔御厨子"],
    dashName: "瞬斩",
    dashHint: "Q 瞬斩。左键解。右键走。升级只加血。",
    unlockHint: "先活一场。",
  },
];

export const CHAR_MAP = Object.fromEntries(CHARS.map((c) => [c.id, c])) as Record<
  CharId,
  CharDef
>;
