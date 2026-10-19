// Woche-Screen 1:1 aus dem Prototyp (Lifehub.dc.html). Platzhalter werden in renderTemplate gefüllt.
export const WOCHE = `<div data-screen-label="Woche" style="display:flex;flex-direction:column;gap:18px;padding-top:6px">
<div><p style="margin:0;font-size:14px;color:#8d7459">{{ rangeText }}</p><h1 style="margin:2px 0 0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:30px">Deine Woche</h1></div>
<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">
<sc-for list="{{ days }}" as="d" hint-placeholder-count="7">
<button data-act="{{ d.go }}" style="display:flex;flex-direction:column;align-items:center;gap:6px;border:none;background:transparent;padding:0;cursor:pointer">
<span style="font-size:12px;color:#8d7459;font-weight:{{ d.weight }}">{{ d.label }}</span>
<span style="width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:15px;background:{{ d.bg }}">{{ d.date }}</span>
<span style="width:5px;height:5px;border-radius:50%;background:{{ d.dot }}"></span>
</button>
</sc-for>
</div>
<div style="background:#fffaf0;border-radius:24px;padding:16px 16px 6px;box-shadow:0 6px 18px rgba(94,60,25,.08)">
<h2 style="margin:0 0 6px;font-family:'Fredoka',sans-serif;font-weight:600;font-size:18px">{{ selDayName }}</h2>
<sc-for list="{{ events }}" as="e" hint-placeholder-count="3">
<div style="display:flex;gap:12px;align-items:stretch;padding:10px 0;border-top:1px dashed #ecdcc0">
<span style="width:46px;flex:none;font-weight:700;font-size:14px;color:#6b5340;font-variant-numeric:tabular-nums;padding-top:2px">{{ e.time }}</span>
<div style="flex:1;border-radius:14px;padding:10px 12px;background:{{ e.bg }}"><div style="font-weight:700;font-size:15px;color:{{ e.ink }}">{{ e.title }}</div><div style="font-size:13px;color:{{ e.ink }}">{{ e.sub }}</div></div>
</div>
</sc-for>
</div>
<div style="display:flex;flex-direction:column;gap:10px">
<h2 style="margin:0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:20px">Wochenplan</h2>
<div style="background:#fffaf0;border-radius:24px;padding:6px 14px;box-shadow:0 6px 18px rgba(94,60,25,.08)">
<sc-for list="{{ plan }}" as="p" hint-placeholder-count="7">
<div style="display:grid;grid-template-columns:30px minmax(0,1fr) minmax(0,1fr);gap:8px;align-items:center;padding:9px 0;border-bottom:1px dashed #ecdcc0">
<span style="font-weight:800;font-size:13px;color:{{ p.dayInk }}">{{ p.day }}</span>
<span style="font-size:13px;font-weight:600;padding:5px 10px;border-radius:12px;background:#f7e2b5;color:#7a561a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ p.meal }}</span>
<span style="font-size:13px;font-weight:600;padding:5px 10px;border-radius:12px;background:{{ p.trBg }};color:{{ p.trInk }};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ p.training }}</span>
</div>
</sc-for>
</div>
</div>
</div>`
