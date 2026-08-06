# 2970 Christine darts

A tap-the-board darts scorer, built to replace the spiral notebook on the deck at 2970 Christine.

**Play:** https://yaroslavvb.github.io/christine-darts-tracker/

## How it works

Throw a dart, then press the spot on the board where it landed. Three darts and it moves to the
next player automatically.

The board gets the whole left side of the screen with nothing else in it — no caption, no frame,
no controls — and scales to fill whatever space is there. Everything else (whose turn, what they
need, the darts in hand, Miss / End turn, and the scoreboard) lives in the sidebar. The sidebar is
sized so that **three players are always fully visible without scrolling**; a fourth or fifth
column scrolls sideways.

**Full screen** in the header hides the browser bars. On a tablet you can also add the page to the
home screen — there is a web manifest, so it launches with no browser chrome at all, which is the
only way to get full screen on iPad.

## Keypad mode

**⌨ Keypad** in the header swaps the board for a number pad, for when typing the score is faster
than pointing at it: `single / double / treble` across the top, 1–20 in a grid, and `25 / 50 / 0`
along the bottom. Arm double or treble and every number shows what it would score (`20` → `= 60`),
then it drops back to single after the dart lands. The choice of board or keypad is remembered.

**The board is deliberately not to scale.** A regulation treble ring is 8mm wide, which on a
tablet works out thinner than a fingertip — unhittable. Every band here is about four times
thicker than the real thing and the bull is enormous: on a tablet the bull is ~110px across and
the treble and double rings are ~50px wide, so they can be hit with a thumb. The rings are still
in the right order at roughly the right fractions of the radius, so it reads as a dartboard.

If your finger covers the spot anyway, hold instead of tapping: a loupe lifts above your fingertip
with a live readout (`T20 = 60`) so you can slide to the right ring before letting go.

## The rules it implements

Taken from how the game is actually played there:

- Everyone counts **up** from 0 and has to land on **300 exactly**.
- Three darts per turn, then the next player throws.
- Outer ring doubles, inner ring triples, green bull 25, red bull 50, outside the wire 0.
- Go past the target and the **whole turn is voided** — you drop back to the score you started
  the turn with.
- Finishing doesn't end the game; the rest keep throwing and get placed 2nd, 3rd, and so on.

## Other bits

- Starts with three players — Володя, Галя, Ярослав. `+ Player` adds a column (a fourth or fifth
  is named "Player N"), the `×` on a column removes one. Tap a name to rename it.
- `Undo` steps back one dart at a time, including un-doing a bust or a win.
- `Miss (0)` for a dart that bounced out or missed the board entirely; `End turn` to pass with
  fewer than three darts.
- Targets of 301, 501 and 1000 are in the dropdown if you want a longer game.
- The scoreboard mirrors the notebook layout: turn score on the left, running total on the right,
  the darts themselves underneath.
- Everything lives in the browser's local storage — the game survives a reload. Nothing is
  uploaded anywhere.

## Development

One self-contained `index.html`, no build step and no dependencies. Open it directly, or:

```bash
python3 -m http.server 8765
```

`test-score.js` pulls the scoring function straight out of `index.html` and checks it against an
independent implementation over a dense polar sweep of the board (~130k points). It also fails if
any band is drawn too thin to tap:

```bash
node test-score.js
```
