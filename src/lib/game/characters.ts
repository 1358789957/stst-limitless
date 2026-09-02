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
    blurb: "无极把靠近的东西摊平。走位，让术式自己割。",
    portrait: "/art/hero.png",
    sprite: "hero",
    accent: "ice",
    start: "limitless",
    line: "吾乃最强。",
    domainName: "无量空域",
    hitLine: "碰到了。无极呢？",
    kit: ["无极", "苍", "赫", "虚式"],
    dashName: "瞬移",
    dashHint: "Q。无下限踏步，穿过秽物。",
  },
  {
    id: "sukuna",
    name: "宿傩",
    title: "灾祸",
    kana: "DISMANTLE",
    blurb: "解把空气切开，捌把靠近的东西拆掉。别站在刀口上。",
    portrait: "/art/sukuna.jpg",
    sprite: "sukuna",
    accent: "blood",
    start: "slash",
    line: "精彩。再跪一次。",
    domainName: "伏魔御厨子",
    hitLine: "被摸到了。开。",
    kit: ["解", "捌", "开", "厨子"],
    dashName: "瞬斩",
    dashHint: "Q。踏过去，沿路切开。",
    unlockHint: "先活一场。",
  },
];

export const CHAR_MAP = Object.fromEntries(CHARS.map((c) => [c.id, c])) as Record<
  CharId,
  CharDef
>;
