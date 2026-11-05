// Bygger .ics-filerna och index.html från kalender.js. Kör: node build.js
const fs = require("fs");
const K = require("./kalender.js");
const BASE = "https://hemosk.github.io/skolkalender-esbo/";

fs.writeFileSync("skolkalender.ics", K.toICSCombined(K.YEARS));
for (const s of K.SCHOOLS) fs.writeFileSync(s.key + ".ics", K.toICS(s.key, K.YEARS));

const feeds = [["Båda skolorna", "skolkalender.ics"]].concat(K.SCHOOLS.map((s) => [s.name, s.key + ".ics"]));
const exportHtml = `<section class="export" aria-labelledby="exp-h">
    <h2 id="exp-h">Prenumerera i Outlook</h2>
    <p>Outlook på webben: Kalender → Lägg till kalender → Prenumerera från webben, klistra in adressen. Outlook uppdaterar prenumerationen själv, men det kan ta upp till ett dygn.</p>
    ${feeds.map(([n, f], i) => `<div class="actions">
      <strong>${n}</strong>
      <input id="feed${i}" class="feed" readonly value="${BASE + f}" aria-label="Adress för ${n}">
      <button class="btn${i ? " ghost" : ""}" type="button" data-copy="feed${i}">Kopiera adress</button>
    </div>`).join("\n    ")}
    <span class="status" id="status" role="status"></span>
  </section>
  <style>.feed{flex:1 1 18rem;min-width:0;font-family:var(--f-mono);font-size:.82rem;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg)}.export .actions strong{flex:0 0 9rem}</style>
  <script>document.addEventListener("click",function(ev){var b=ev.target.closest("[data-copy]");if(!b)return;var i=document.getElementById(b.dataset.copy),st=document.getElementById("status");var ok=function(){st.textContent="Adressen är kopierad."};var fb=function(){i.focus();i.select();st.textContent="Markerad, kopiera med Ctrl+C."};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(i.value).then(ok,fb)}else fb()});</script>`;

const t = fs.readFileSync("page.template.html", "utf8");
const page = t.replace(/<!--EXPORT-->[\s\S]*<!--\/EXPORT-->/, () => exportHtml)
  .replace("/*__KALENDER__*/", () => fs.readFileSync("kalender.js", "utf8"));
fs.writeFileSync("index.html", `<!doctype html>
<html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
</head><body>
${page}
</body></html>
`);
console.log("Byggt:", ["skolkalender.ics"].concat(K.SCHOOLS.map((s) => s.key + ".ics"), "index.html").join(", "));
