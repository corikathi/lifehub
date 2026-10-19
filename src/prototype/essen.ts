// Essen-Screen 1:1 aus dem Prototyp (Lifehub.dc.html). Platzhalter werden in renderTemplate gefüllt.
export const ESSEN = `<div data-screen-label="Essen" style="display:flex;flex-direction:column;gap:18px;padding-top:6px">
<div><p style="margin:0;font-size:14px;color:#8d7459">{{ rotationText }}</p><h1 style="margin:2px 0 0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:30px">Essen</h1></div>

<div style="background:#fffaf0;border-radius:26px;padding:18px;box-shadow:0 6px 18px rgba(94,60,25,.08);display:flex;flex-direction:column;gap:16px">
<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:10px">
<div><p style="margin:0;font-size:13px;font-weight:700;color:#8d7459">Noch übrig heute</p><p style="margin:2px 0 0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:40px;line-height:1.05">{{ kcalLeft }} <span style="font-size:18px;color:#8d7459">kcal</span></p></div>
<div style="text-align:right;font-size:13px;color:#6b5340;line-height:1.4"><div><b>{{ kcalEaten }}</b> gegessen</div><div>Ziel {{ kcalTarget }}</div></div>
</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
<sc-for list="{{ macros }}" as="mc" hint-placeholder-count="3">
<div style="display:flex;flex-direction:column;align-items:center;gap:6px">
<div style="width:100%;height:120px;border-radius:99px;background:#f2e8d6;display:flex;align-items:flex-end;overflow:hidden"><div style="width:100%;height:{{ mc.h }};min-height:34px;border-radius:99px;background:{{ mc.bg }};display:flex;align-items:flex-end;justify-content:center;padding-bottom:10px;color:{{ mc.ink }};font-size:12px;font-weight:800;transition:height .5s ease">{{ mc.pct }}</div></div>
<span style="font-size:13px;font-weight:800">{{ mc.name }}</span>
<span style="font-size:12px;color:#6b5340;font-variant-numeric:tabular-nums;white-space:nowrap">{{ mc.val }}</span>
</div>
</sc-for>
</div>
<p style="margin:0;font-size:13px;color:#6b5340;background:#f7efe0;border-radius:14px;padding:10px 12px;text-wrap:pretty">{{ macroHint }}</p>
</div>
<div style="display:flex;flex-direction:column;gap:10px">
<div style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="margin:0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:20px">Mahlzeiten heute</h2><span style="font-size:13px;color:#8d7459;font-weight:600">{{ mealsDone }}</span></div>
<sc-for list="{{ meals }}" as="ml" hint-placeholder-count="5">
<button data-act="{{ ml.toggle }}" style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:none;background:{{ ml.bg }};border-radius:20px;padding:12px 14px;cursor:pointer;box-shadow:0 3px 10px rgba(94,60,25,.06)">
<span style="width:28px;height:28px;flex:none;border-radius:50%;border:2.5px solid #e8b04a;background:{{ ml.checkBg }};display:grid;place-items:center;color:#fffaf0;font-weight:800;font-size:14px">{{ ml.mark }}</span>
<span style="flex:1;min-width:0;display:flex;flex-direction:column"><span style="font-size:12px;font-weight:800;color:#8d7459;letter-spacing:.3px">{{ ml.slot }}</span><span style="font-weight:700;font-size:15px;color:#4a3828">{{ ml.name }}</span></span>
<span style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex:none"><span style="font-size:13px;font-weight:800;padding:3px 9px;border-radius:10px;background:#e3e8c8;color:#4f5e2a;white-space:nowrap">{{ ml.p }} g P</span><span style="font-size:12px;color:#8d7459;white-space:nowrap">{{ ml.kcal }} kcal</span></span>
</button>
</sc-for>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
<sc-for list="{{ progress }}" as="pg" hint-placeholder-count="2">
<div style="background:{{ pg.bg }};border-radius:24px;padding:16px;display:flex;flex-direction:column;gap:4px">
<span style="font-weight:800;font-size:14px;color:{{ pg.ink }}">{{ pg.name }}</span>
<span style="font-family:'Fredoka',sans-serif;font-weight:600;font-size:26px;line-height:1.1;color:{{ pg.ink }};white-space:nowrap">{{ pg.val }}</span>
<span style="font-size:12px;font-weight:700;color:{{ pg.ink }}">{{ pg.delta }}</span>
<svg viewBox="0 0 100 30" style="width:100%;height:30px;margin-top:4px"><polyline points="{{ pg.points }}" fill="none" stroke="{{ pg.ink }}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline></svg>
</div>
</sc-for>
</div>
<div style="background:#fffaf0;border-radius:24px;padding:16px;box-shadow:0 6px 18px rgba(94,60,25,.08);display:flex;flex-direction:column;gap:12px">
<div style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="margin:0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:18px">Proteinziel diese Woche</h2><span style="font-size:13px;color:#8d7459;font-weight:700">{{ protHit }}</span></div>
<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">
<sc-for list="{{ protWeek }}" as="pw" hint-placeholder-count="7">
<div style="display:flex;flex-direction:column;align-items:center;gap:6px">
<div style="width:100%;height:70px;border-radius:99px;background:#f2e8d6;display:flex;align-items:flex-end;overflow:hidden"><div style="width:100%;height:{{ pw.h }};border-radius:99px;background:{{ pw.bg }}"></div></div>
<span style="font-size:12px;font-weight:700;color:#8d7459">{{ pw.d }}</span>
</div>
</sc-for>
</div>
</div>
<div style="background:#f3c25e;border-radius:26px;overflow:hidden">
<svg viewBox="0 0 360 130" style="width:100%;height:auto;display:block">
<rect width="360" height="130" fill="#f3c25e"></rect>
<circle cx="300" cy="34" r="16" fill="#fbe3a2"></circle>
<path d="M0 104 C80 90 160 106 240 96 C300 90 340 98 360 94 V130 H0Z" fill="#e3a94a"></path>
<rect x="0" y="112" width="360" height="18" fill="#c9764a"></rect>
<ellipse cx="180" cy="112" rx="70" ry="6" fill="#a25f3a" opacity=".35"></ellipse>
<rect x="124" y="62" width="112" height="50" rx="16" fill="#8aa3b3"></rect>
<rect x="116" y="56" width="128" height="12" rx="6" fill="#7590a0"></rect>
<rect x="104" y="72" width="22" height="8" rx="4" fill="#7590a0"></rect><rect x="234" y="72" width="22" height="8" rx="4" fill="#7590a0"></rect>
<path d="M160 46 C154 38 166 32 160 22" stroke="#fffaf0" stroke-width="4" stroke-linecap="round" fill="none" opacity=".8"></path>
<path d="M184 44 C178 36 190 30 184 18" stroke="#fffaf0" stroke-width="4" stroke-linecap="round" fill="none" opacity=".6"></path>
<path d="M206 46 C200 38 212 32 206 24" stroke="#fffaf0" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"></path>
</svg>
<div style="padding:4px 18px 18px;display:flex;flex-direction:column;gap:12px">
<div><p style="margin:0;font-size:13px;font-weight:700;color:#5e3f12">{{ recipeTag }}</p><h2 style="margin:2px 0 0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:22px;color:#3d2a12">{{ recipeTitle }}</h2><p style="margin:4px 0 0;font-size:13px;font-weight:700;color:#5e3f12">{{ recipeInfo }}</p></div>
<div style="display:flex;align-items:center;justify-content:space-between;background:#fbe3a2;border-radius:16px;padding:6px 6px 6px 14px">
<span style="font-weight:700;font-size:14px;color:#3d2a12">Portionen</span>
<div style="display:flex;align-items:center;gap:6px">
<button data-act="{{ lessP }}" style="width:36px;height:36px;border:none;border-radius:12px;background:#fffaf0;font-weight:800;font-size:18px;cursor:pointer">–</button>
<span style="min-width:24px;text-align:center;font-weight:800;font-size:16px;color:#3d2a12">{{ persons }}</span>
<button data-act="{{ moreP }}" style="width:36px;height:36px;border:none;border-radius:12px;background:#fffaf0;font-weight:800;font-size:18px;cursor:pointer">+</button>
</div>
</div>
<div style="background:#fffaf0;border-radius:18px;padding:4px 14px">
<sc-for list="{{ ingredients }}" as="z" hint-placeholder-count="6">
<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px dashed #ecdcc0;font-size:14px"><span style="font-weight:600">{{ z.name }}</span><span style="color:#6b5340;font-variant-numeric:tabular-nums">{{ z.amount }}</span></div>
</sc-for>
</div>
</div>
</div>

<div style="display:flex;flex-direction:column;gap:10px">
<div style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="margin:0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:20px">Einkaufsliste</h2><span style="font-size:13px;color:#8d7459;font-weight:600">{{ shopOpen }} offen</span></div>
<sc-for list="{{ shop }}" as="cat" hint-placeholder-count="3">
<div style="background:#fffaf0;border-radius:22px;padding:12px 14px;box-shadow:0 3px 10px rgba(94,60,25,.06)">
<p style="margin:0 0 4px;font-size:12px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#8d7459">{{ cat.name }}</p>
<sc-for list="{{ cat.items }}" as="it" hint-placeholder-count="3">
<button data-act="{{ it.toggle }}" style="display:flex;align-items:center;gap:12px;width:100%;border:none;background:transparent;padding:8px 0;cursor:pointer;text-align:left">
<span style="width:24px;height:24px;flex:none;border-radius:8px;border:2.5px solid #e8b04a;background:{{ it.box }};display:grid;place-items:center;color:#fffaf0;font-size:12px;font-weight:800">{{ it.mark }}</span>
<span style="flex:1;font-size:15px;font-weight:600;text-decoration:{{ it.deco }};color:{{ it.color }}">{{ it.name }}</span>
</button>
</sc-for>
</div>
</sc-for>
</div>
</div>`
