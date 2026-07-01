const fs = require('fs');
const path = require('path');

const USERNAME = 'oktajianto';
const CELL = 11, GAP = 3, STEP = CELL + GAP;
const LEFT_PAD = 28, TOP_PAD = 20;
const COLORS = ['#21262d', '#4a0e2a', '#7a1240', '#c0195f', '#FF014F'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MIN_LABEL_GAP = 28;

async function main() {
  const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`);
  const raw = await res.json();
  const days = raw.contributions;

  const first = new Date(days[0].date + 'T00:00:00Z');
  const firstDow = first.getUTCDay();

  const weeks = [];
  let week = new Array(firstDow).fill(null);
  for (const d of days) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const numWeeks = weeks.length;
  const W = LEFT_PAD + numWeeks * STEP + GAP;
  const H = TOP_PAD + 7 * STEP;

  let monthLabels = '';
  let lastMonth = -1;
  let lastLabelX = -999;
  weeks.forEach((wk, wi) => {
    const firstValid = wk.find(d => d);
    if (!firstValid) return;
    const dt = new Date(firstValid.date + 'T00:00:00Z');
    const m = dt.getUTCMonth();
    const x = LEFT_PAD + wi * STEP;
    if (m !== lastMonth && x - lastLabelX >= MIN_LABEL_GAP) {
      monthLabels += `<text x="${x}" y="14" font-size="10" fill="#8b949e" font-family="Segoe UI, Helvetica, Arial, sans-serif">${MONTHS[m]}</text>`;
      lastMonth = m;
      lastLabelX = x;
    } else if (m !== lastMonth) {
      lastMonth = m;
    }
  });

  const dayLabels = [[1, 'Mon'], [3, 'Wed'], [5, 'Fri']]
    .map(([row, label]) => `<text x="0" y="${TOP_PAD + row * STEP + CELL - 2}" font-size="9" fill="#8b949e" font-family="Segoe UI, Helvetica, Arial, sans-serif">${label}</text>`)
    .join('\n');

  let cells = '';
  weeks.forEach((wk, wi) => {
    wk.forEach((d, di) => {
      if (!d) return;
      const x = LEFT_PAD + wi * STEP;
      const y = TOP_PAD + di * STEP;
      const color = COLORS[d.level] || COLORS[0];
      cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${color}"><title>${d.count} contributions on ${d.date}</title></rect>\n`;
    });
  });

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI, Helvetica, Arial, sans-serif">
${monthLabels}
${dayLabels}
${cells}
</svg>`;

  const outDir = path.join(__dirname, 'assets');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'contribution-calendar.svg'), svg, 'utf8');
  console.log('Contribution calendar SVG generated:', numWeeks, 'weeks');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
