// Heute-Screen 1:1 aus dem Prototyp (Lifehub.dc.html). Platzhalter werden in renderTemplate gefüllt.
export const HEUTE = `<div data-screen-label="Heute" style="display:flex;flex-direction:column;gap:18px">
<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:6px">
<div style="flex:1;min-width:0"><p style="margin:0;font-size:14px;color:#8d7459">{{ dateText }}</p><h1 style="margin:2px 0 0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:30px">{{ greeting }}</h1></div>
<button data-act="{{ openCalm }}" aria-label="Ruhe-Ecke" title="Ruhe-Ecke" style="width:44px;height:44px;flex:none;border:none;border-radius:50%;background:transparent;color:#a8957c;cursor:pointer;display:grid;place-items:center"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21 C6 17 4 12 7 7 C9 10 11 11 12 13 C13 11 15 10 17 7 C20 12 18 17 12 21Z"></path><path d="M12 13 V21"></path></svg></button>

</div>


<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">
<sc-for list="{{ days }}" as="d" hint-placeholder-count="7">
<button data-act="{{ d.go }}" style="display:flex;flex-direction:column;align-items:center;gap:6px;border:none;background:transparent;padding:0;cursor:pointer">
<span style="font-size:12px;color:#8d7459;font-weight:{{ d.weight }}">{{ d.label }}</span>
<span style="width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:15px;background:{{ d.bg }}">{{ d.date }}</span>
</button>
</sc-for>
</div>

<button data-act="{{ nextMsg }}" style="display:flex;align-items:flex-end;gap:10px;width:100%;border:none;background:transparent;padding:4px 0 0;cursor:pointer;text-align:left">
<svg viewBox="-42 -34 84 64" style="width:92px;height:auto;flex:none;display:block"><ellipse cx="0" cy="27" rx="28" ry="3.5" fill="#4a3828" opacity=".12"></ellipse><path d="M12 19 C32 22 36 2 28 -8" stroke="#5a4632" stroke-width="7.5" stroke-linecap="round" fill="none"></path><path d="M12 19 C32 22 36 2 28 -8" stroke="#f7efe2" stroke-width="4.5" stroke-linecap="round" fill="none"></path><ellipse cx="0" cy="12" rx="19" ry="15" fill="#f7efe2" stroke="#5a4632" stroke-width="1.3"></ellipse><path d="M-13 -9 C-18 -14 -17 -22 -10 -22 C-6 -22 -4 -16 -6 -10Z" fill="#f7efe2" stroke="#5a4632" stroke-width="1.2"></path><path d="M-11 -12 C-13 -15 -12 -19 -10 -19 C-8 -19 -7 -16 -8 -13Z" fill="#f2b8ae"></path><path d="M13 -9 C18 -14 17 -22 10 -22 C6 -22 4 -16 6 -10Z" fill="#f7efe2" stroke="#5a4632" stroke-width="1.2"></path><path d="M11 -12 C13 -15 12 -19 10 -19 C8 -19 7 -16 8 -13Z" fill="#f2b8ae"></path><circle cx="0" cy="-6" r="15.5" fill="#f7efe2" stroke="#5a4632" stroke-width="1.3"></circle><path d="M-9.5 -5.5 Q-6 -9.5 -2.5 -5.5" stroke="#5a4632" stroke-width="1.8" fill="none" stroke-linecap="round"></path><path d="M2.5 -5.5 Q6 -9.5 9.5 -5.5" stroke="#5a4632" stroke-width="1.8" fill="none" stroke-linecap="round"></path><circle cx="-10" cy="-1" r="2.6" fill="#f2b8ae" opacity=".8"></circle><circle cx="10" cy="-1" r="2.6" fill="#f2b8ae" opacity=".8"></circle><path d="M-1.6 -1.6 L1.6 -1.6 L0 0Z" fill="#5a4632"></path><path d="M-2.5 1.5 Q0 3.5 2.5 1.5" stroke="#5a4632" stroke-width="1.2" fill="none" stroke-linecap="round"></path><path d="M-8 22 Q-6 26 -3 22 M3 22 Q6 26 8 22" stroke="#5a4632" stroke-width="1.2" fill="none"></path></svg>
<div style="position:relative;flex:1;min-width:0;background:#fffaf0;border-radius:22px 22px 22px 6px;padding:14px 16px;box-shadow:0 6px 18px rgba(94,60,25,.08);margin-bottom:22px">
<p style="margin:0;font-size:12px;font-weight:800;color:#c9764a;letter-spacing:.3px">MOCHI</p>
<p style="margin:3px 0 0;font-size:15px;font-weight:600;line-height:1.4;color:#4a3828;text-wrap:pretty">{{ mascotMsg }}</p>
</div>
</button>

<div style="display:flex;flex-direction:column;gap:10px">
<div style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="margin:0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:20px">Heute erledigen</h2><span style="font-size:13px;color:#8d7459;font-weight:600">{{ taskCount }}</span></div>
<sc-for list="{{ tasks }}" as="t" hint-placeholder-count="5">
<button data-act="{{ t.toggle }}" style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:none;background:#fffaf0;border-radius:20px;padding:12px 14px;cursor:pointer;box-shadow:0 3px 10px rgba(94,60,25,.06)">
<span style="width:28px;height:28px;flex:none;border-radius:50%;border:2.5px solid #8fa35a;background:{{ t.checkBg }};display:grid;place-items:center;color:#fffaf0;font-weight:800;font-size:14px">{{ t.mark }}</span>
<span style="flex:1;min-width:0;display:flex;flex-direction:column"><span style="font-weight:700;font-size:15px;text-decoration:{{ t.deco }};color:{{ t.color }}">{{ t.title }}</span><span style="font-size:13px;color:#8d7459">{{ t.meta }}</span></span>
<span style="font-size:12px;font-weight:700;padding:4px 10px;border-radius:99px;background:{{ t.tagBg }};color:{{ t.tagInk }}">{{ t.tag }}</span>
</button>
</sc-for>
</div>


<div style="display:flex;flex-direction:column;gap:10px">
<h2 style="margin:0;font-family:'Fredoka',sans-serif;font-weight:600;font-size:20px">Gewohnheiten</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
<sc-for list="{{ habits }}" as="h" hint-placeholder-count="4">
<button data-act="{{ h.toggle }}" style="display:flex;flex-direction:column;align-items:flex-start;gap:8px;border:none;border-radius:20px;padding:12px 14px;cursor:pointer;text-align:left;background:{{ h.bg }};box-shadow:0 3px 10px rgba(94,60,25,.06)">
<span style="display:flex;justify-content:space-between;width:100%;align-items:center;gap:8px"><span style="font-weight:800;font-size:14px;color:{{ h.ink }}">{{ h.name }}</span><span style="width:24px;height:24px;flex:none;border-radius:50%;background:{{ h.check }};display:grid;place-items:center;color:#fffaf0;font-size:12px;font-weight:800">{{ h.mark }}</span></span>
<span style="font-size:13px;font-weight:600;color:{{ h.ink }}">{{ h.streak }}</span>
</button>
</sc-for>
</div>
</div>

<div style="display:grid;grid-template-columns:1fr;gap:12px">
<div style="background:#dce8ea;border-radius:24px;padding:16px;display:flex;flex-direction:column;gap:10px">
<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-weight:800;font-size:14px;color:#3f5a66">Wasser</span><span style="font-size:12px;color:#3f5a66;font-weight:700">{{ waterText }}</span></div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
<sc-for list="{{ glasses }}" as="g" hint-placeholder-count="8">
<button data-act="{{ g.tap }}" style="height:34px;border:none;border-radius:8px 8px 12px 12px;background:{{ g.bg }};cursor:pointer;padding:0"></button>
</sc-for>
</div>
<span style="font-size:12px;color:#3f5a66">Tippen zum Auffüllen</span>
</div>

</div>
</div>`
