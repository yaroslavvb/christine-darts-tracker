// Extracts the real scoring code out of index.html and checks it against an
// independent reference implementation of a standard dartboard.
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, 'index.html'), 'utf8');

function grab(re, what){
  const m = src.match(re);
  if (!m) throw new Error('could not extract ' + what);
  return m[0];
}
const code = [
  grab(/const SECTORS = \[[^\]]*\];/, 'SECTORS'),
  grab(/const R = \{[^}]*\};/, 'R'),
  grab(/function scoreAt\(x, y\)\{[\s\S]*?\n\}/, 'scoreAt'),
].join('\n');

const scoreAt = new Function(code + '\nreturn scoreAt;')();
const R = new Function(grab(/const R = \{[^}]*\};/, 'R') + '\nreturn R;')();

// The ring radii are a deliberate design choice (fat rings, big bull) so the test takes
// them from the source. What it checks independently is the part that must be right:
// the sector order, the bearing -> sector mapping, and which ring means which multiplier.
const REF_ORDER = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
function refScore(x, y){
  const r = Math.sqrt(x*x + y*y);
  if (r <= R.bull) return 50;
  if (r <= R.outerBull) return 25;
  if (r > R.doubleOut) return 0;
  // bearing clockwise from north, in degrees
  let deg = (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360;
  const idx = Math.round(deg / 18) % 20;          // nearest sector centre
  const s = REF_ORDER[idx];
  if (r >= R.trebleIn && r <= R.trebleOut) return 3*s;
  if (r >= R.doubleIn) return 2*s;
  return s;
}

// Rings must stay in order and be thick enough to hit with a finger. At the smallest
// board we ship (320px wide inside a 456-unit viewBox) 1 unit is ~0.72px, so a 24-unit
// ring is ~17px there and ~44px on a 820px board.
const MIN_BAND = 24;
const bands = [
  ['bull',        0,            R.bull],
  ['25 ring',     R.bull,       R.outerBull],
  ['inner single',R.outerBull,  R.trebleIn],
  ['treble',      R.trebleIn,   R.trebleOut],
  ['outer single',R.trebleOut,  R.doubleIn],
  ['double',      R.doubleIn,   R.doubleOut],
];
const thin = bands.filter(([,a,b]) => b - a < MIN_BAND)
                  .map(([n,a,b]) => `${n} is only ${(b-a).toFixed(1)} units`);

let checked = 0, bad = [];
function check(x, y, note){
  const got = scoreAt(x, y).value;
  const want = refScore(x, y);
  checked++;
  if (got !== want) bad.push(`${note||''} (${x.toFixed(2)},${y.toFixed(2)}) got ${got} want ${want}`);
}

// 1. dense polar sweep: every 0.5deg x many radii, skipping ring boundaries
//    (a point exactly on a wire is ambiguous by definition)
const BOUNDARIES = [R.bull, R.outerBull, R.trebleIn, R.trebleOut, R.doubleIn, R.doubleOut];
for (let deg = 0; deg < 360; deg += 0.5){
  for (let r = 1; r <= R.surround; r += 1){
    const nearWire = BOUNDARIES.some(b => Math.abs(r-b) < 1.5) ||
                     Math.abs(((deg % 18) + 18) % 18 - 9) < 0.6;   // sector boundary
    if (nearWire) continue;
    const a = deg * Math.PI/180;
    check(r*Math.sin(a), -r*Math.cos(a), `sweep d=${deg}`);
  }
}

// middle of each band — the spot a finger actually aims for
const mid = (a,b) => (a+b)/2;
const IN  = mid(R.outerBull, R.trebleIn);
const TRE = mid(R.trebleIn,  R.trebleOut);
const OUT = mid(R.trebleOut, R.doubleIn);
const DBL = mid(R.doubleIn,  R.doubleOut);
const OFF = mid(R.doubleOut, R.surround);

// 2. named spot-checks straight from the rules in the transcript
const named = [
  [0, 0, 50, 'bullseye = 50'],
  [0, -mid(R.bull,R.outerBull), 25, 'green ring = 25'],
  [0, -TRE, 60, 'treble 20 = 60 (the max)'],
  [0, -DBL, 40, 'double 20'],
  [0, -OUT, 20, 'single 20 outer'],
  [0, -IN,  20, 'single 20 inner'],
  [0, -OFF,  0, 'outside the wire = 0'],
  [0,  IN,   3, '3 is at the bottom'],
  [ IN, 0,   6, '6 is on the right'],
  [-IN, 0,  11, '11 is on the left'],
  [0,  DBL,  6, 'double 3'],
  [0,  TRE,  9, 'treble 3'],
];
for (const [x,y,want,note] of named){
  const got = scoreAt(x,y).value;
  checked++;
  if (got !== want) bad.push(`${note}: got ${got} want ${want}`);
}

// 3. labels
const labels = [
  [0,-TRE,'T20'], [0,-DBL,'D20'], [0,-OUT,'20'], [0,0,'BULL'],
  [0,-mid(R.bull,R.outerBull),'25'], [0,-OFF,'–'],
];
for (const [x,y,want] of labels){
  const got = scoreAt(x,y).short;
  checked++;
  if (got !== want) bad.push(`label (${x},${y}): got ${got} want ${want}`);
}

// 4. every sector reachable, all 82 distinct scores present
const values = new Set();
for (let i=0;i<20;i++){
  for (const r of [IN,TRE,OUT,DBL]){
    const a = i*18*Math.PI/180;
    values.add(scoreAt(r*Math.sin(a), -r*Math.cos(a)).value);
  }
}
values.add(scoreAt(0,0).value);
values.add(scoreAt(0,-mid(R.bull,R.outerBull)).value);
values.add(scoreAt(0,-OFF).value);
const expectedSet = new Set([0,25,50]);
for (const s of REF_ORDER){ expectedSet.add(s); expectedSet.add(2*s); expectedSet.add(3*s); }
const missing = [...expectedSet].filter(v=>!values.has(v));
const extra   = [...values].filter(v=>!expectedSet.has(v));

console.log(`checked ${checked} points`);
console.log(`mismatches: ${bad.length}`);
if (bad.length) console.log(bad.slice(0,25).join('\n'));
console.log(`distinct scores reachable: ${values.size}; missing: [${missing}]; unexpected: [${extra}]`);
console.log('band widths (viewBox units): ' +
  bands.map(([n,a,b]) => `${n} ${(b-a).toFixed(0)}`).join(', '));
console.log(`too thin to tap: ${thin.length ? thin.join('; ') : 'none'}`);
process.exit(bad.length || missing.length || extra.length || thin.length ? 1 : 0);
