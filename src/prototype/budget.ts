// Budget-Screen 1:1 aus dem Prototyp (Lifehub.dc.html). Platzhalter werden in renderTemplate gefüllt.
export const BUDGET = `<sc-if value="{{ isGeld }}" hint-placeholder-val="{{ false }}">
<div data-screen-label="Budget" style="display:flex;flex-direction:column;gap:18px;padding-top:6px">
<div><p style="margin:0;font-size:14px;color:#8d7459">Oktober 2026 · noch 14 Tage</p><h1 style="margin:2px 0 0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:30px">Budget</h1></div>
<div style="background:#fffaf0;border-radius:26px;padding:18px;box-shadow:0 6px 18px rgba(94,60,25,.08);display:flex;flex-direction:column;gap:14px">
<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:10px">
<div><p style="margin:0;font-size:13px;font-weight:700;color:#8d7459">Übrig für Lebensmittel &amp; Co.</p><p style="margin:2px 0 0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:40px;line-height:1.05">{{ moneyLeft }}</p></div>
<div style="text-align:right;font-size:13px;color:#6b5340;line-height:1.4;white-space:nowrap"><div><b>{{ perDay }}</b> pro Tag</div><div>bis 31.10.</div></div>
</div>
<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:#f7efe0;border-radius:14px;padding:10px 12px">
<span style="font-size:13px;font-weight:700;color:#6b5340">Insgesamt verfügbar</span>
<span style="display:flex;align-items:center;gap:6px"><input value="{{ availStr }}" data-change="{{ setAvail }}" inputMode="decimal" style="width:110px;height:40px;border:1.5px solid #ecdcc0;border-radius:12px;background:#fffaf0;padding:0 10px;font-size:15px;font-weight:700;text-align:right;outline:none"><span style="font-size:14px;font-weight:700;color:#6b5340">€</span></span>
</div>
</div>

<div style="display:flex;flex-direction:column;gap:10px">
<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h2 style="margin:0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:20px">Budget nach Kategorie</h2><button data-act="{{ toggleEdit }}" style="height:34px;padding:0 14px;border:none;border-radius:99px;background:#efe2c9;color:#4a3828;font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap">{{ editLabel }}</button></div>
<sc-if value="{{ editCats }}" hint-placeholder-val="{{ false }}">
<div style="background:#fffaf0;border-radius:24px;padding:12px 14px;box-shadow:0 6px 18px rgba(94,60,25,.08);display:flex;flex-direction:column;gap:8px">
<sc-for list="{{ catRows }}" as="cr" hint-placeholder-count="6">
<div style="display:flex;align-items:center;gap:8px">
<input value="{{ cr.name }}" data-change="{{ cr.setName }}" style="flex:1;min-width:0;height:40px;border:1.5px solid #ecdcc0;border-radius:12px;background:#f9f1e2;padding:0 10px;font-size:14px;font-weight:700;outline:none">
<input value="{{ cr.budget }}" data-change="{{ cr.setBudget }}" inputMode="decimal" style="width:80px;height:40px;border:1.5px solid #ecdcc0;border-radius:12px;background:#f9f1e2;padding:0 10px;font-size:14px;font-weight:700;text-align:right;outline:none">
<button data-act="{{ cr.del }}" aria-label="Kategorie löschen" style="width:36px;height:36px;flex:none;border:none;border-radius:12px;background:#f3d6c6;color:#8a4526;font-weight:800;font-size:16px;cursor:pointer">×</button>
</div>
</sc-for>
<button data-act="{{ addCat }}" style="height:42px;border:none;border-radius:12px;background:#e8b04a;color:#3d2a12;font-weight:800;font-size:14px;cursor:pointer">+ Kategorie hinzufügen</button>
</div>
</sc-if>
<h2 style="margin:0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:20px;display:none">Budget nach Kategorie</h2>
<div style="background:#fffaf0;border-radius:24px;padding:8px 16px;box-shadow:0 6px 18px rgba(94,60,25,.08)">
<sc-for list="{{ cats }}" as="c" hint-placeholder-count="6">
<div style="display:flex;flex-direction:column;gap:6px;padding:10px 0;border-bottom:1px dashed #ecdcc0">
<div style="display:flex;justify-content:space-between;gap:10px;font-size:14px"><span style="font-weight:700">{{ c.name }}</span><span style="font-variant-numeric:tabular-nums;color:{{ c.valInk }};font-weight:700;white-space:nowrap">{{ c.val }}</span></div>
<div style="height:8px;border-radius:99px;background:#f2e8d6;overflow:hidden"><div style="height:100%;width:{{ c.w }};background:{{ c.bg }};border-radius:99px;transition:width .5s ease"></div></div>
</div>
</sc-for>
</div>
</div>

<div style="display:flex;flex-direction:column;gap:10px">
<div style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="margin:0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:20px">Letzte Ausgaben</h2><button data-act="{{ addExpense }}" style="border:none;background:#f7e2b5;color:#7a561a;border-radius:99px;padding:6px 12px;font-weight:800;font-size:13px;cursor:pointer">+ Ausgabe</button></div>
<div style="background:#fffaf0;border-radius:24px;padding:4px 16px;box-shadow:0 6px 18px rgba(94,60,25,.08)">
<sc-for list="{{ recent }}" as="ex" hint-placeholder-count="5">
<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px dashed #ecdcc0">
<span style="width:10px;height:10px;flex:none;border-radius:50%;background:{{ ex.bg }}"></span>
<span style="flex:1;min-width:0;display:flex;flex-direction:column"><span style="font-weight:700;font-size:14px">{{ ex.name }}</span><span style="font-size:12px;color:#8d7459">{{ ex.cat }} · {{ ex.when }}</span></span>
<span style="font-weight:700;font-size:14px;font-variant-numeric:tabular-nums;white-space:nowrap">{{ ex.amount }}</span>
</div>
</sc-for>
</div>
</div>

<div style="background:#dfe8bf;border-radius:24px;padding:16px;display:flex;flex-direction:column;gap:10px">
<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><span style="font-weight:800;font-size:15px;color:#2f3a17">Sparziel Notgroschen</span><span style="font-size:13px;font-weight:800;color:#2f3a17;white-space:nowrap">{{ savePct }}</span></div>
<div style="height:12px;border-radius:99px;background:#fffaf0;overflow:hidden"><div style="height:100%;width:{{ savePct }};background:#6f8a3a;border-radius:99px"></div></div>
<span style="font-size:13px;color:#2f3a17">{{ saveText }}</span>
</div>
</div>
</sc-if>`
