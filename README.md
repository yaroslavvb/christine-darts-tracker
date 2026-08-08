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
than pointing at it: 1–20 in a grid, `25 / 50 / 0` under it, and `×2 / ×3` at the bottom.

The multipliers are a **suffix**, not a mode. Press the number — that scores the single straight
away — and then press `×2` or `×3` to upgrade the dart you just entered. Nothing to arm first and
nothing to remember to switch off. The buttons show what they would turn the dart into
(`20 → 60`), and they grey out when there is nothing to multiply — after the bull, after a miss,
and before the first dart of a turn, since a bull has no double or treble.

Upgrading rewinds the dart and re-enters it, so it behaves correctly even when the dart in
question already ended the turn: a mistyped third dart can still be corrected, if the bigger value
overshoots the target the turn becomes a bust, and a mis-entered *winning* dart can be taken back
too — the win is undone along with it. Once play has moved on, the buttons name whose dart they
would rewrite (`Галя 7 → 21`). One press of `Undo` removes the whole dart, not just the
multiplier, and undoing a dart re-arms the multipliers for the one before it.

The rewind only fires when the undo snapshot on top of the stack still belongs to that dart, so
anything else that happens in between — adding a player, a new game, changing the target, or a
page reload — greys the multipliers out rather than rewinding into the wrong state.

## Presses

Every button fires on **pointerdown**, not on click. A click only counts if the press and the
release land on the same element without much movement, so stabbing at a tablet — which drags a
few pixels every time — silently cancels presses. Firing on press means the moment your finger
lands the score is in, and it stays in however far the finger slides afterwards. The button flashes
solid amber and punches in for about 170ms so a registered press is obvious even out of the corner
of your eye. Gaps between keypad buttons are kept to 5px, since every pixel of gap is a pixel that
swallows a press.

The board is the deliberate exception: there a drag *is* the aiming gesture, so the dart lands
where you release, not where you first touched down.

## Scrolling

The scoreboard follows the turn being thrown: down as the rows pile up, and sideways to the active
player's column when there are more players than fit across. It holds its position when the table
is rebuilt, so nothing jumps between darts.

The choice of board or keypad is remembered.

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
