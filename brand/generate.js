// Generates SCALP brand SVGs (logo + X banner) using the game's own price engine.
const fs = require('fs');
const path = require('path');

/* ---- SCALP palette (matches the game) ---- */
const C = {
  bg:'#05070d', panel:'#0a0f1c', grid:'#121b30',
  green:'#21e88a', greenDim:'#0f7a4a',
  red:'#ff3b5c', cyan:'#46e8ff', amber:'#ffd54a',
  ink:'#cdd9ff', muted:'#5d6b91'
};

/* ---- deterministic price engine (same shape as the game) ---- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function genTape(seed, n, {drift=0.04, vol=1.0, bias=0}={}){
  const r=mulberry32(seed); let price=100, d=0; const out=[];
  for(let i=0;i<n;i++){
    d += (r()-0.5)*0.06 + drift*0.02; d*=0.93;
    price += (r()-0.5)*vol + d - (price-100)*0.0008 + bias;
    if(price<8) price=8;
    out.push(price);
  }
  return out;
}

/* map a series to screen coords within a box, return {pts, X, Y, lo, hi} */
function mapSeries(series, x0, x1, y0, y1, padFrac=0.12){
  let lo=Math.min(...series), hi=Math.max(...series);
  const pad=(hi-lo)*padFrac+1; lo-=pad; hi+=pad;
  const X=i=>x0+(i/(series.length-1))*(x1-x0);
  const Y=v=>y1-((v-lo)/(hi-lo))*(y1-y0);
  const pts=series.map((v,i)=>[X(i),Y(v)]);
  return {pts, X, Y, lo, hi};
}
const poly = pts => pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');

/* shared defs: neon glow filters + gradients */
function defs(){
  return `<defs>
    <filter id="glowG" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="glowSoft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.green}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${C.green}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="vig" cx="50%" cy="42%" r="75%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
    <linearGradient id="wm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="${C.cyan}"/>
    </linearGradient>
  </defs>`;
}

/* a faint grid */
function grid(w,h,step){
  let s='';
  for(let x=0;x<=w;x+=step) s+=`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${C.grid}" stroke-width="1"/>`;
  for(let y=0;y<=h;y+=step) s+=`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${C.grid}" stroke-width="1"/>`;
  return `<g opacity="0.55">${s}</g>`;
}

/* scanlines */
function scan(w,h){
  return `<g opacity="0.10">${Array.from({length:Math.ceil(h/3)},(_,i)=>`<line x1="0" y1="${i*3}" x2="${w}" y2="${i*3}" stroke="#000" stroke-width="1"/>`).join('')}</g>`;
}

/* candlesticks behind the line for texture */
function candles(series, X, Y, count, w){
  let s=''; const step=Math.floor(series.length/count);
  for(let k=1;k<count;k++){
    const i=k*step; if(i<2||i>=series.length) continue;
    const o=series[i-step+2]||series[i], c=series[i];
    const up=c>=o; const col=up?C.green:C.red;
    const x=X(i), yO=Y(o), yC=Y(c);
    const top=Math.min(yO,yC), bh=Math.max(4,Math.abs(yO-yC));
    const wick=Math.min(bh*1.6, 26);
    s+=`<line x1="${x.toFixed(1)}" y1="${(top-wick).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(top+bh+wick).toFixed(1)}" stroke="${col}" stroke-width="1.5" opacity="0.30"/>`;
    s+=`<rect x="${(x-4).toFixed(1)}" y="${top.toFixed(1)}" width="8" height="${bh.toFixed(1)}" fill="${col}" opacity="0.28"/>`;
  }
  return `<g>${s}</g>`;
}

/* ============ BANNER 1500x500 ============ */
function banner(){
  const W=1500,H=500;
  const series=genTape(20260626, 150, {drift:0.5, vol:1.1, bias:0.012}); // bullish daily tape
  const {pts,X,Y}=mapSeries(series, 0, W, 70, 430, 0.10);
  const head=pts[pts.length-1];
  const area=`${poly(pts)} ${W},${H} 0,${H}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${defs()}
<rect width="${W}" height="${H}" fill="${C.bg}"/>
${grid(W,H,50)}
${candles(series,X,Y,26,W)}
<polygon points="${area}" fill="url(#areaG)"/>
<polyline points="${poly(pts)}" fill="none" stroke="${C.green}" stroke-width="3" filter="url(#glowG)" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="${head[0].toFixed(1)}" cy="${head[1].toFixed(1)}" r="7" fill="${C.green}" filter="url(#glowSoft)"/>
${scan(W,H)}
<rect width="${W}" height="${H}" fill="url(#vig)"/>

<!-- badge -->
<g transform="translate(60,64)">
  <rect x="0" y="0" width="320" height="34" rx="17" fill="${C.panel}" stroke="${C.grid}"/>
  <circle cx="20" cy="17" r="5" fill="${C.amber}"/>
  <text x="38" y="22" font-family="Menlo,'Courier New',monospace" font-size="14" letter-spacing="3" fill="${C.muted}">ORYNTH GAME CUP · SEASON 1</text>
</g>

<!-- wordmark -->
<text x="58" y="270" font-family="Menlo,'Courier New',monospace" font-weight="900" font-size="150" letter-spacing="6" fill="url(#wm)" filter="url(#glowSoft)">SCALP</text>
<rect x="620" y="276" width="78" height="16" fill="${C.amber}" filter="url(#glowG)"/>

<!-- tagline -->
<text x="62" y="330" font-family="Menlo,'Courier New',monospace" font-size="26" letter-spacing="7" fill="${C.ink}" opacity="0.92">READ THE TAPE<tspan fill="${C.muted}">  ·  </tspan>DON'T GET LIQUIDATED</text>

<!-- right ticker -->
<g transform="translate(1140,392)" opacity="0.95" font-family="Menlo,'Courier New',monospace">
  <text x="0" y="0" font-size="16" letter-spacing="2" fill="${C.muted}">60-SECOND TRADING FLOOR</text>
  <text x="0" y="34" font-size="34" font-weight="900" fill="${C.green}" filter="url(#glowG)">$1,000 ▸ $9,420</text>
</g>
</svg>`;
}

/* ============ LOGO 1000x1000 (profile / app icon) ============ */
function logo(){
  const S=1000;
  const series=genTape(77, 90, {drift:0.9, vol:1.0, bias:0.03}); // sharp bullish breakout
  const m=120; // chart inset
  const {pts,X,Y}=mapSeries(series, m, S-m, 250, 540, 0.10);
  const head=pts[pts.length-1];
  const area=`${poly(pts)} ${S-m},620 ${m},620`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
${defs()}
<rect width="${S}" height="${S}" fill="${C.bg}"/>
<!-- tile -->
<rect x="40" y="40" width="${S-80}" height="${S-80}" rx="120" fill="${C.panel}" stroke="${C.cyan}" stroke-width="4" filter="url(#glowG)"/>
<clipPath id="tile"><rect x="40" y="40" width="${S-80}" height="${S-80}" rx="120"/></clipPath>
<g clip-path="url(#tile)">
  ${grid(S,S,62)}
  ${candles(series,X,Y,12,S)}
  <polygon points="${area}" fill="url(#areaG)"/>
  <polyline points="${poly(pts)}" fill="none" stroke="${C.green}" stroke-width="7" filter="url(#glowG)" stroke-linejoin="round" stroke-linecap="round"/>
  <circle cx="${head[0].toFixed(1)}" cy="${head[1].toFixed(1)}" r="14" fill="${C.green}" filter="url(#glowSoft)"/>
  <!-- scalp cut: a bright diagonal slash -->
  <line x1="170" y1="690" x2="830" y2="470" stroke="#ffffff" stroke-width="3" opacity="0.18"/>
  ${scan(S,S)}
  <rect width="${S}" height="${S}" fill="url(#vig)"/>
</g>
<!-- wordmark -->
<text x="${S/2}" y="780" text-anchor="middle" font-family="Menlo,'Courier New',monospace" font-weight="900" font-size="170" letter-spacing="8" fill="url(#wm)" filter="url(#glowSoft)">SCALP</text>
<rect x="772" y="788" width="60" height="16" fill="${C.amber}" filter="url(#glowG)"/>
<text x="${S/2}" y="846" text-anchor="middle" font-family="Menlo,'Courier New',monospace" font-size="26" letter-spacing="11" fill="${C.muted}">READ · LONG · SHORT · SURVIVE</text>
</svg>`;
}

fs.writeFileSync(path.join(__dirname,'banner.svg'), banner());
fs.writeFileSync(path.join(__dirname,'logo.svg'), logo());
console.log('wrote banner.svg and logo.svg');
