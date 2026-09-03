# 「5t5：无限」设计稿

3 min survivors-like + light MOBA. Late fodder evaporates. Only rule-breakers kill. Minute 0 is NOT Shinjuku Gojo.

This file is the single source of truth for the current PR. Older conflicting notes (LMB=苍, level-gives-damage, skill-rank 3-picks, Infinity only holds 4–6 fodder) are void.

## Don't

- No Noita wands/mana/spell slots
- No LoL Arena gold shop / items / prismatic. Steal Stat Anvil + Augment feel only
- No 「give which skill +damage」 cards
- No A-key attack-move

## Controls

PC: RMB click-to-move (hold to steer). LMB is 平A: click or hold, fire toward cursor, repeat on cooldown. QWER named skills (dash / 赫-or-character active / 虚式-or-开 / domain).

Mobile: left stick move, right stick aim+平A. Infinity / 捌 / six 赫 auto. Edge controls, center clear, back button every layer.

## Gojo start

- Passive 无下限: blocks ALL fodder even when surrounded. Field damage LOW (~20% of punch DPS). Elites/sure-hit/mass shove in. Later density/rule-breakers leak. Load/capacity meter. Start radius ≈ body + small ring. HUD shows load.
- 平A: melee punches/kicks, short range, LMB toward cursor. 3–4 hits to kill a wave-1 flyhead.
- Level 2 auto-unlocks six small 赫 orbs that AUTO-FIRE. Not a 3-pick. Each bolt weaker than a punch; all 6 > one punch. No 20s timer grant.
- 苍 is NOT starting 平A. Auto-unlock at level 3. LMB stays punches.

## Sukuna start

- Passive 捌: always-on melee, percent max-HP. Wave 1 fine. Wave 2 without frequency forge falls behind Gojo tank.
- 平A: 解 aimed flying slash, LMB / right-stick, hold to repeat.
- 开 / domain / Mahoraga later.

## Growth — three clocks, no mixed shop

On each level-up:

1. HP up. Level does not add damage or frequency.
2. AUTO-UNLOCK the next skill on that character's ladder. No 3-pick. A short toast is enough.
3. ALWAYS open one 锻造器: 3-pick among stat shards only (伤害 / 频率; Gojo also 无下限容量·半径; Sukuna 捌数). ONE roll. NO chain.

Every 3 levels (3, 6, 9, …): AFTER the forge, open one 海克斯卡 3-pick from the six mutations only: 分裂 / 合成一大 / 连锁 / 增多 / 变大 / 延长. Auto-attach. This is the only qualitative pick.

Level 6 skill unlock IS the domain. Gojo: 无量空处. Sukuna: 伏魔御厨子. They still get that level's forge, and because 6 is a multiple of 3 they also get a hex. Domain is not a pick.

### Auto skill ladders (start already has 被动+平A)

Gojo: 无下限 + 拳脚 → 2 六赫 → 3 苍 → 4 虚式 → 5 咒痕 → 6 无量空处

Sukuna: 捌 + 解 → 2 二连 (second 解 + 捌 range/multi) → 3 开 → 4 厨刀 → 5 魔虚罗 → 6 伏魔御厨子

XP: about 182 to hit level 6 (22 / 28 / 36 / 44 / 52). A normal run lands around 1:45–2:15. Level 9 is snowball-only.

## Damage formula (damage from anvil stacks, NOT level)

```
finalDamage = base * (1 + 0.15 * damageForgeStacks) * cardMul
```

cardMul:

- 增多: full extra hits
- 分裂: 0.70 / fork
- 连锁: 0.75 / hop
- 变大: hitbox * (1 + 0.20 * stacks)
- 延长: more ticks / range, not doubled per-hit
- 合成一大: ~2.2x one fat shot

捌:

```
tick = targetMaxHp * (0.03 + 0.004 * damageForgeStacks) * size/merge mul
```

then × simultaneous count at frequency in range. Frequency only from anvil.

## Black Flash / Mahoraga

Black Flash = timing STATE (after dash, Infinity rim, first frame slash after gap), screen punch, short next-hit buff. NOT bounce. 咒痕/血雾 stay spread.

Mahoraga = Sukuna level-5 ladder unlock: adapt by damage kind (contact / projectile / laser / explosion).

## Delete

Remove old “upgrade 苍/赫/解 rank” and raw +damage skill picks.

## Acceptance

Can move and 平A immediately. Gojo surround-safe at start; punches are 平A; six 赫 arrive at level 2. Sukuna 捌 ticks, 解 is LMB. Level thickens HP and unlocks the next ladder skill; damage only after anvil 伤害. Every level is one forge. Hex only at 3/6/9. No mixed 专属/质变 bag, no anvil chain, no “upgrade 苍” cards.
