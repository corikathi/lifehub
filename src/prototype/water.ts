// Wasser-Karte wie auf der Startseite (aus Lifehub.dc.html).
export const WATER = `<div style="background:#dce8ea;border-radius:24px;padding:16px;display:flex;flex-direction:column;gap:10px">
<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-weight:800;font-size:14px;color:#3f5a66">Getränke</span><span style="font-size:12px;color:#3f5a66;font-weight:700">{{ waterText }}</span></div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
<sc-for list="{{ glasses }}" as="g" hint-placeholder-count="8">
<button data-act="water:add" style="height:34px;border:none;border-radius:8px 8px 12px 12px;background:{{ g.bg }};cursor:pointer;padding:0"></button>
</sc-for>
</div>
<span style="font-size:12px;color:#3f5a66">Tippen zum Auffüllen</span><div style="display:flex;gap:6px;flex-wrap:wrap"><button data-act="water:250" style="height:30px;padding:0 10px;border:none;border-radius:99px;background:#fffaf0;color:#3f5a66;font-weight:800;font-size:12px;cursor:pointer">+250 ml</button><button data-act="water:500" style="height:30px;padding:0 10px;border:none;border-radius:99px;background:#fffaf0;color:#3f5a66;font-weight:800;font-size:12px;cursor:pointer">+500 ml</button><button data-act="water:undo" style="height:30px;padding:0 10px;border:none;border-radius:99px;background:#fffaf0;color:#3f5a66;font-weight:800;font-size:12px;cursor:pointer">↶</button></div>
</div>`
