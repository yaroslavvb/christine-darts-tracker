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

// ---- independent reference ----------------------------------------------
// Standard clockwise order starting at 20 (verified against the photo of the board).
const REF_ORDER = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
function refScore(x, y){
  const r = Math.sqrt(x*x + y*y);
  if (r <= 6.35) return 50;
  if (r <= 15.9) return 25;
  if (r > 170) return 0;
  // bearing clockwise from north, in degrees
  let deg = (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360;
  const idx = Math.round(deg / 18) % 20;          // nearest sector centre
  const s = REF_ORDER[idx];
  if (r >= 99 && r <= 107) return 3*s;
  if (r >= 162) return 2*s;
  return s;
}

let checked = 0, bad = [];
function check(x, y, note){
  const got = scoreAt(x, y).value;
  const want = refScore(x, y);
  checked++;
  if (got !== want) bad.push(`${note||''} (${x.toFixed(2)},${y.toFixed(2)}) got ${got} want ${want}`);
}

// 1. dense polar sweep: every 0.5deg x many radii, skipping ring boundaries
//    (a point exactly on a wire is ambiguous by definition)
const BOUNDARIES = [6.35, 15.9, 99, 107, 162, 170];
for (let deg = 0; deg < 360; deg += 0.5){
  for (let r = 1; r <= 200; r += 1){
    const nearWire = BOUNDARIES.some(b => Math.abs(r-b) < 1.5) ||
                     Math.abs(((deg % 18) + 18) % 18 - 9) < 0.6;   // sector boundary
    if (nearWire) continue;
    const a = deg * Math.PI/180;
    check(r*Math.sin(a), -r*Math.cos(a), `sweep d=${deg}`);
  }
}

// 2. named spot-checks straight from the rules in the transcript
const named = [
  [0, 0, 50, 'bullseye = 50'],
  [0, -10, 25, 'green ring = 25'],
  [0, -103, 60, 'treble 20 = 60 (the max)'],
  [0, -166, 40, 'double 20'],
  [0, -135, 20, 'single 20 outer'],
  [0, -60, 20, 'single 20 inner'],
  [0, -180, 0, 'outside the wire = 0'],
  [0, 60, 3, '3 is at the bottom'],
  [60, 0, 6, '6 is on the right'],
  [-60, 0, 11, '11 is on the left'],
  [0, 166, 6, 'double 3'],
  [0, 103, 9, 'treble 3'],
];
for (const [x,y,want,note] of named){
  const got = scoreAt(x,y).value;
  checked++;
  if (got !== want) bad.push(`${note}: got ${got} want ${want}`);
}

// 3. labels
const labels = [
  [0,-103,'T20'], [0,-166,'D20'], [0,-135,'20'], [0,0,'BULL'], [0,-10,'25'], [0,-190,'–'],
];
for (const [x,y,want] of labels){
  const got = scoreAt(x,y).short;
  checked++;
  if (got !== want) bad.push(`label (${x},${y}): got ${got} want ${want}`);
}

// 4. every sector reachable, all 82 distinct scores present
const values = new Set();
for (let i=0;i<20;i++){
  for (const r of [60,103,135,166]){
    const a = i*18*Math.PI/180;
    values.add(scoreAt(r*Math.sin(a), -r*Math.cos(a)).value);
  }
}
values.add(scoreAt(0,0).value); values.add(scoreAt(0,-10).value); values.add(scoreAt(0,-200).value);
const expectedSet = new Set([0,25,50]);
for (const s of REF_ORDER){ expectedSet.add(s); expectedSet.add(2*s); expectedSet.add(3*s); }
const missing = [...expectedSet].filter(v=>!values.has(v));
const extra   = [...values].filter(v=>!expectedSet.has(v));

console.log(`checked ${checked} points`);
console.log(`mismatches: ${bad.length}`);
if (bad.length) console.log(bad.slice(0,25).join('\n'));
console.log(`distinct scores reachable: ${values.size}; missing: [${missing}]; unexpected: [${extra}]`);
process.exit(bad.length || missing.length || extra.length ? 1 : 0);
