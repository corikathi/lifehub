// Sheet „Neu hinzufügen“ aus dem Prototyp.
export const SHEET = `<sc-if value="{{ sheetOpen }}" hint-placeholder-val="{{ false }}">
<div data-act="{{ closeSheet }}" style="position:absolute;inset:0;background:rgba(58,42,28,.35)"></div>
<div style="position:absolute;left:0;right:0;bottom:0;background:#fffaf0;border-radius:28px 28px 0 0;padding:12px 20px 30px;display:flex;flex-direction:column;gap:14px">
<div style="width:40px;height:5px;border-radius:99px;background:#e2d2b5;margin:0 auto"></div>
<h2 style="margin:0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:22px">Neu hinzufügen</h2>
<div style="display:flex;gap:8px;flex-wrap:wrap">
<sc-for list="{{ kinds }}" as="k" hint-placeholder-count="4">
<button data-act="{{ k.pick }}" style="border:none;border-radius:99px;padding:9px 14px;font-weight:700;font-size:14px;cursor:pointer;background:{{ k.bg }};color:{{ k.ink }}">{{ k.name }}</button>
</sc-for>
</div>
<input value="{{ draft }}" data-change="{{ setDraft }}" placeholder="{{ draftPh }}" style="height:50px;border:1.5px solid #ecdcc0;border-radius:16px;background:#f9f1e2;padding:0 14px;font-size:16px;outline:none">
<sc-if value="{{ isAusgabe }}" hint-placeholder-val="{{ false }}">
<input value="{{ draftAmount }}" data-change="{{ setAmount }}" inputMode="decimal" placeholder="Betrag in €" style="height:50px;border:1.5px solid #ecdcc0;border-radius:16px;background:#f9f1e2;padding:0 14px;font-size:16px;outline:none">
<div style="display:flex;gap:6px;flex-wrap:wrap">
<sc-for list="{{ catChips }}" as="cc" hint-placeholder-count="6"><button data-act="{{ cc.pick }}" style="border:none;border-radius:99px;padding:7px 12px;font-weight:700;font-size:13px;cursor:pointer;background:{{ cc.bg }};color:{{ cc.ink }}">{{ cc.name }}</button></sc-for>
</div>
</sc-if>
<sc-if value="{{ hasDate }}" hint-placeholder-val="{{ false }}">
<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="font-weight:700;font-size:14px;color:#6b5340">Am</span><input type="date" value="{{ draftDate }}" data-change="{{ setDate }}" style="height:46px;border:1.5px solid #ecdcc0;border-radius:14px;background:#f9f1e2;padding:0 12px;font-size:16px;outline:none"><span style="font-weight:700;font-size:14px;color:#6b5340">um</span><input type="time" value="{{ draftTime }}" data-change="{{ setTime }}" style="height:46px;border:1.5px solid #ecdcc0;border-radius:14px;background:#f9f1e2;padding:0 12px;font-size:16px;outline:none"></div>
</sc-if>
<button data-act="{{ addItem }}" style="height:52px;border:none;border-radius:99px;background:#e8b04a;font-weight:800;font-size:16px;cursor:pointer">Hinzufügen</button>
</div>
</sc-if>`
