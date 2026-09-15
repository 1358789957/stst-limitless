export type NoteDef = {
  id: string;
  title: string;
  body: string;
};

export const NOTES: NoteDef[] = [
  {
    id: "n-first",
    title: "狱门之后",
    body: "咒力被抽空的感觉很无聊。从四级重新数，也好。至少这次没人在旁边吵。",
  },
  {
    id: "n-boss",
    title: "灾核",
    body: "城市下面那口心脏还在跳。那就把它按回去。",
  },
  {
    id: "n-domain",
    title: "展开",
    body: "域内的信息量把对方钉死。贵的不是眼睛，是看完还愿意动手。",
  },
  {
    id: "n-sukuna",
    title: "灾祸",
    body: "解把空气切开，捌把靠近的东西拆掉。别站在刀口上。",
  },
  {
    id: "n-clear",
    title: "最强",
    body: "又一次。吾乃最强。这次不进门。",
  },
];

export const NOTE_MAP = Object.fromEntries(NOTES.map((n) => [n.id, n])) as Record<
  string,
  NoteDef
>;
