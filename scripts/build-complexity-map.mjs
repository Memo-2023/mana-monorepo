#!/usr/bin/env node
// Generates docs/complexity-map.html — interactive D3 treemap.
// Area = LOC per file. Color = git change frequency (last 6 months).
// Groups: frontend modules, API modules, services.

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const SINCE = '6.months';
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.svelte', '.go', '.py']);
const IGNORE = new Set([
	'node_modules',
	'.turbo',
	'.svelte-kit',
	'dist',
	'build',
	'.next',
	'coverage',
	'__snapshots__',
]);

const TARGETS = [
	{ label: 'web', root: 'apps/mana/apps/web/src/lib/modules' },
	{ label: 'api', root: 'apps/api/src/modules' },
	{ label: 'services', root: 'services' },
];

function walk(dir) {
	const out = [];
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return out;
	}
	for (const e of entries) {
		if (IGNORE.has(e.name)) continue;
		const p = join(dir, e.name);
		if (e.isDirectory()) out.push(...walk(p));
		else if (e.isFile() && CODE_EXT.has(extname(e.name))) out.push(p);
	}
	return out;
}

function loc(path) {
	try {
		return readFileSync(path, 'utf8').split('\n').length;
	} catch {
		return 0;
	}
}

// Batch git log across many files: one call per module (fast enough).
function changeCountForFile(relPath) {
	try {
		const out = execSync(`git log --since=${SINCE} --pretty=format:%H -- "${relPath}" | wc -l`, {
			cwd: ROOT,
		})
			.toString()
			.trim();
		return Number(out) || 0;
	} catch {
		return 0;
	}
}

const tree = { name: 'mana', children: [] };

for (const t of TARGETS) {
	const group = { name: t.label, children: [] };
	const rootAbs = join(ROOT, t.root);
	let modules;
	try {
		modules = readdirSync(rootAbs, { withFileTypes: true });
	} catch {
		continue;
	}
	for (const m of modules) {
		if (!m.isDirectory() || IGNORE.has(m.name)) continue;
		const modAbs = join(rootAbs, m.name);
		const files = walk(modAbs);
		if (files.length === 0) continue;
		const modNode = { name: m.name, children: [] };
		for (const f of files) {
			const l = loc(f);
			if (l === 0) continue;
			const rel = relative(ROOT, f);
			modNode.children.push({
				name: f.split('/').slice(-2).join('/'),
				path: rel,
				value: l,
				changes: changeCountForFile(rel),
			});
		}
		if (modNode.children.length > 0) group.children.push(modNode);
	}
	tree.children.push(group);
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Mana — Complexity Map</title>
<style>
  :root { color-scheme: dark; }
  html, body { margin: 0; padding: 0; background: #0b0d10; color: #e8e8e8; font: 13px/1.4 system-ui, sans-serif; }
  header { padding: 12px 16px; border-bottom: 1px solid #1f2329; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
  header h1 { margin: 0; font-size: 14px; font-weight: 600; }
  header .meta { color: #888; font-size: 12px; }
  header label { color: #aaa; font-size: 12px; }
  header select { background: #1a1d22; color: #e8e8e8; border: 1px solid #2a2f36; padding: 4px 8px; border-radius: 4px; }
  #chart { position: fixed; inset: 48px 0 0 0; }
  .cell { stroke: #0b0d10; stroke-width: 1; cursor: pointer; }
  .cell:hover { stroke: #fff; stroke-width: 2; }
  .label { fill: #fff; font-size: 11px; pointer-events: none; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }
  .tip { position: fixed; background: #1a1d22; border: 1px solid #2a2f36; padding: 8px 10px; border-radius: 6px; font-size: 12px; pointer-events: none; display: none; max-width: 360px; z-index: 10; }
  .tip b { color: #fff; } .tip .k { color: #888; }
  .legend { display: flex; gap: 8px; align-items: center; }
  .legend .bar { width: 160px; height: 10px; border-radius: 3px; background: linear-gradient(to right, #1e3a5f, #2b6cb0, #d97706, #dc2626); }
</style>
</head>
<body>
<header>
  <h1>Mana Complexity Map</h1>
  <span class="meta">Area = LOC · Color = git changes (last ${SINCE})</span>
  <label>Group:
    <select id="group">
      <option value="all">all</option>
      <option value="web">web</option>
      <option value="api">api</option>
      <option value="services">services</option>
    </select>
  </label>
  <span class="legend"><span class="k" style="color:#888">cold</span><span class="bar"></span><span class="k" style="color:#888">hot</span></span>
  <span class="meta" id="stats"></span>
</header>
<div id="chart"></div>
<div class="tip" id="tip"></div>
<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
<script>
const DATA = ${JSON.stringify(tree)};

const tip = document.getElementById('tip');
const sel = document.getElementById('group');
const stats = document.getElementById('stats');

function filtered(group) {
  if (group === 'all') return DATA;
  return { name: 'mana', children: DATA.children.filter(c => c.name === group) };
}

function maxChanges(root) {
  let max = 0;
  root.each(d => { if (d.data.changes && d.data.changes > max) max = d.data.changes; });
  return max || 1;
}

function render() {
  const group = sel.value;
  const container = document.getElementById('chart');
  container.innerHTML = '';
  const w = container.clientWidth, h = container.clientHeight;
  const root = d3.hierarchy(filtered(group)).sum(d => d.value || 0).sort((a,b) => b.value - a.value);
  d3.treemap().size([w, h]).paddingInner(1).paddingTop(d => d.depth === 1 ? 18 : d.depth === 2 ? 14 : 1).round(true)(root);

  const max = maxChanges(root);
  const color = d3.scaleSequential([0, Math.log2(max + 1)], d3.interpolateInferno);

  const totalLOC = root.value;
  const fileCount = root.leaves().length;
  stats.textContent = \`\${fileCount} files · \${totalLOC.toLocaleString()} LOC\`;

  const svg = d3.select(container).append('svg').attr('width', w).attr('height', h);

  // group labels (depth 1 and 2)
  svg.selectAll('g.group').data(root.descendants().filter(d => d.depth > 0 && d.depth < 3))
    .join('g').attr('class', 'group')
    .each(function(d) {
      const g = d3.select(this);
      g.append('rect').attr('x', d.x0).attr('y', d.y0).attr('width', d.x1-d.x0).attr('height', d.depth === 1 ? 18 : 14)
        .attr('fill', d.depth === 1 ? '#141820' : '#1a1f27');
      g.append('text').attr('x', d.x0 + 6).attr('y', d.y0 + (d.depth === 1 ? 13 : 10))
        .attr('class', 'label').attr('font-weight', d.depth === 1 ? 700 : 500)
        .text(\`\${d.data.name} (\${d.value.toLocaleString()})\`);
    });

  svg.selectAll('rect.cell').data(root.leaves()).join('rect')
    .attr('class', 'cell')
    .attr('x', d => d.x0).attr('y', d => d.y0)
    .attr('width', d => Math.max(0, d.x1-d.x0)).attr('height', d => Math.max(0, d.y1-d.y0))
    .attr('fill', d => color(Math.log2((d.data.changes || 0) + 1)))
    .on('mousemove', (e, d) => {
      tip.style.display = 'block';
      tip.style.left = Math.min(e.clientX + 12, window.innerWidth - 370) + 'px';
      tip.style.top = (e.clientY + 12) + 'px';
      tip.innerHTML = \`<b>\${d.data.path}</b><br>
        <span class="k">LOC:</span> \${d.data.value.toLocaleString()}<br>
        <span class="k">Changes (\${'${SINCE}'}):</span> \${d.data.changes || 0}\`;
    })
    .on('mouseleave', () => { tip.style.display = 'none'; });

  svg.selectAll('text.leaf').data(root.leaves().filter(d => (d.x1-d.x0) > 60 && (d.y1-d.y0) > 18))
    .join('text').attr('class', 'label leaf')
    .attr('x', d => d.x0 + 4).attr('y', d => d.y0 + 14)
    .text(d => d.data.name.split('/').pop());
}

sel.addEventListener('change', render);
window.addEventListener('resize', render);
render();
</script>
</body>
</html>`;

const outputs = [
	join(ROOT, 'docs', 'complexity-map.html'),
	join(ROOT, 'apps/mana/apps/web/static/admin/complexity-map.html'),
];
for (const p of outputs) {
	mkdirSync(join(p, '..'), { recursive: true });
	writeFileSync(p, html);
	console.log(`Wrote ${relative(ROOT, p)}`);
}
