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
- ~20s OR first level: guaranteed six small 赫 orbs that AUTO-FIRE. Not a 3-pick. Each bolt weaker than a punch; all 6 > one punch.
- 苍 is NOT starting 平A. Unlock later via anvil/augment.

## Sukuna start

- Passive 捌: always-on melee, percent max-HP. Wave 1 fine. Wave 2 without frequency forge falls behind Gojo tank.
- 平A: 解 aimed flying slash, LMB / right-stick, hold to repeat.
- 开 / domain / Mahoraga later.

## Growth — three channels, do not mix

A) Character level = HP ONLY. No damage, no frequency from XP.

B) 专属 = Stat Anvil. After HP, show a lucky 3-mix of anvil stats and 质变 cards (not forced 1-of-each).

- Anvil stats: 伤害, 频率; Gojo also 无下限 capacity/radius; Sukuna anvil prefers 伤害+频率 (simultaneous count belongs to 质变 增多).
- Pick anvil → apply, then CHANCE to chain another 3-pick (max 3 extra chains). Miss → level-up ends.

C) 质变 = augments. Six required: 分裂, 合成一大, 连锁, 增多, 变大, 延长. Auto-attach to current kit (projectiles vs field). Pick 质变 → level-up ENDS. Cards tagged 专属 vs 质变.

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

Mahoraga = Sukuna later augment/anvil: adapt by damage kind (contact / projectile / laser / explosion).

## Delete

Remove old “upgrade 苍/赫/解 rank” and raw +damage skill picks.

## Acceptance

Can move and 平A immediately. Gojo surround-safe at start; punches are 平A; six 赫 appear soon. Sukuna 捌 ticks, 解 is LMB. Level thickens HP; damage only after anvil 伤害. Anvil can chain; 质变 closes the shop. No “upgrade 苍” cards.
