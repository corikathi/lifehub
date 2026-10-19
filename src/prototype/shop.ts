// Einkaufsliste aus dem Prototyp (Essen-Screen).
export const SHOP = `<div style="display:flex;flex-direction:column;gap:10px">
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
</div>`
