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
    domainName: "无量空域",
    hitLine: "碰到了。无极呢？",
    kit: ["无极被动", "苍主动", "赫", "虚式", "咒痕"],
    dashName: "瞬移",
    dashHint: "Q 踏步。左键苍。右键走。",
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
    kit: ["捌被动", "解主动", "开", "厨刀", "魔虚罗"],
    dashName: "瞬斩",
    dashHint: "Q 瞬斩。左键解。右键走。",
    unlockHint: "先活一场。",
  },
];

export const CHAR_MAP = Object.fromEntries(CHARS.map((c) => [c.id, c])) as Record<
  CharId,
  CharDef
>;
