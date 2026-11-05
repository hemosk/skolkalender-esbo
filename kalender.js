// Skolkalender: data + .ics-generator. Fungerar i både Node och webbläsare.
// Alla datum ur offentliga källor; varje händelse bär sin källa.
(function (root) {
  const SRC = {
    svr: { name: "Nämnden Svenska rum 30.10.2025 § 104", url: "https://espoo-sv.oncloudos.com/kokous/20251516-6.PDF" },
    esbo: { name: "Esbo stad: Arbets- och lovtider", url: "https://www.espoo.fi/sv/fostran-och-utbildning/arbets-och-lovtider" },
    oph: { name: "Utbildningsstyrelsen: Skolornas arbetstider och lov 2026–2027", url: "https://www.oph.fi/sv/nyheter/2026/skolornas-arbetstider-och-lov-lasaret-2026-2027" },
    finno: { name: "Finno skola, espoo.fi", url: "https://www.espoo.fi/sv/fostran-och-utbildning/grundlaggande-utbildning/grundskolor/finno-skola" },
    matt: { name: "Mattlidens skola, espoo.fi", url: "https://www.espoo.fi/sv/fostran-och-utbildning/grundlaggande-utbildning/grundskolor/mattlidens-skola" },
    bof: { name: "Finlands Bank: Bankfria dagar i Finland", url: "https://www.suomenpankki.fi/sv/pengar-och-betalningar/bankfria-dagar-i-finland/" },
  };

  // type: termin | lov | ledig | skoldag | helgdag
  // Gemensamt för Esbos svenskspråkiga grundskolor.
  const COMMON = [
    // 2026–2027
    { id: "2627-start", year: "2026–2027", type: "termin", title: "Skolstart, höstterminen börjar", start: "2026-08-13", src: ["svr", "esbo"] },
    { id: "2627-hostlov", year: "2026–2027", type: "lov", title: "Höstlov (v. 42)", start: "2026-10-12", end: "2026-10-16", src: ["svr", "esbo"] },
    { id: "2627-htslut", year: "2026–2027", type: "termin", title: "Höstterminens sista skoldag", start: "2026-12-22", src: ["svr", "esbo"] },
    { id: "2627-jullov", year: "2026–2027", type: "lov", title: "Jullov", start: "2026-12-23", end: "2027-01-06", src: ["svr", "esbo"] },
    { id: "2627-vtstart", year: "2026–2027", type: "termin", title: "Vårterminen börjar", start: "2027-01-07", src: ["svr", "esbo"] },
    { id: "2627-sportlov", year: "2026–2027", type: "lov", title: "Sportlov (v. 8)", start: "2027-02-22", end: "2027-02-26", src: ["svr", "esbo"] },
    { id: "2627-slut", year: "2026–2027", type: "termin", title: "Läsårets sista skoldag (lördag)", start: "2027-06-05", src: ["svr", "esbo"] },
    { id: "2627-sommarlov", year: "2026–2027", type: "lov", title: "Sommarlov", start: "2027-06-06", end: "2027-08-10", src: ["svr"], note: "Härlett: dagen efter läsårets slut till dagen före skolstart 11.8.2027." },
    // 2027–2028
    { id: "2728-start", year: "2027–2028", type: "termin", title: "Skolstart, höstterminen börjar", start: "2027-08-11", src: ["svr", "esbo"] },
    { id: "2728-hostlov", year: "2027–2028", type: "lov", title: "Höstlov (v. 42)", start: "2027-10-18", end: "2027-10-22", src: ["svr", "esbo"] },
    { id: "2728-htslut", year: "2027–2028", type: "termin", title: "Höstterminens sista skoldag", start: "2027-12-22", src: ["svr", "esbo"] },
    { id: "2728-jullov", year: "2027–2028", type: "lov", title: "Jullov", start: "2027-12-23", end: "2028-01-07", src: ["svr", "esbo"] },
    { id: "2728-vtstart", year: "2027–2028", type: "termin", title: "Vårterminen börjar", start: "2028-01-10", src: ["svr", "esbo"] },
    { id: "2728-sportlov", year: "2027–2028", type: "lov", title: "Sportlov (v. 8)", start: "2028-02-21", end: "2028-02-25", src: ["svr", "esbo"] },
    { id: "2728-slut", year: "2027–2028", type: "termin", title: "Läsårets sista skoldag (lördag)", start: "2028-06-03", src: ["svr", "esbo"] },
  ];

  // Finlands Banks bankfria dagar (nationella helgdagar då bankerna håller stängt), 2026–2028.
  const BANK = [
    ["Nyårsdagen", "2026-01-01", "2027-01-01", "2028-01-01"],
    ["Trettondagen", "2026-01-06", "2027-01-06", "2028-01-06"],
    ["Långfredagen", "2026-04-03", "2027-03-26", "2028-04-14"],
    ["Annandag påsk", "2026-04-06", "2027-03-29", "2028-04-17"],
    ["Första maj", "2026-05-01", "2027-05-01", "2028-05-01"],
    ["Kristi himmelsfärdsdag", "2026-05-14", "2027-05-06", "2028-05-25"],
    ["Midsommarafton", "2026-06-19", "2027-06-25", "2028-06-23"],
    ["Självständighetsdagen", "2026-12-06", "2027-12-06", "2028-12-06"],
    ["Julafton", "2026-12-24", "2027-12-24", "2028-12-24"],
    ["Juldagen", "2026-12-25", "2027-12-25", "2028-12-25"],
    ["Annandag jul", "2026-12-26", "2027-12-26", "2028-12-26"],
  ];
  const schoolYear = (iso) => { const y = +iso.slice(0, 4), m = +iso.slice(5, 7); const a = m >= 8 ? y : y - 1; return a + "–" + (a + 1); };
  const HOLIDAYS = [];
  BANK.forEach(([name, ...dates]) => dates.forEach((d) => HOLIDAYS.push({
    id: "helg-" + d, year: schoolYear(d), type: "helgdag", title: name, start: d, src: ["bof"],
  })));
  HOLIDAYS.sort((a, b) => a.start.localeCompare(b.start));
  // Helgdagarna ingår i skolkalendrarna för de läsår som täcks.
  COMMON.push(...HOLIDAYS);

  const SCHOOLS = [
    {
      key: "finno", name: "Finno skola", short: "Finno", grades: "åk 1–6", lang: "svenskspråkig",
      extra: [
        { id: "2627-arbetslordag", year: "2026–2027", type: "skoldag", title: "Arbetslördag", start: "2026-09-26", src: ["finno"], note: "Ersätter den lediga dagen 7.5.2027." },
        { id: "2627-ledig0507", year: "2026–2027", type: "ledig", title: "Ledig dag", start: "2027-05-07", src: ["finno"], note: "Arbetas in lördag 26.9.2026." },
      ],
      notes: { "2627-start": "Skolstart kl. 8.30, samling på skolgården, till kl. 12.30." },
      pending: "2027–2028: skolans egna avvikelser (arbetslördag/ledig dag) är inte publicerade ännu.",
    },
    {
      key: "mattliden", name: "Mattlidens skola", short: "Mattliden", grades: "åk 1–9", lang: "svenskspråkig",
      extra: [
        { id: "2627-ledig0507", year: "2026–2027", type: "ledig", title: "Ledig dag", start: "2027-05-07", src: ["matt"], verify: true, note: "Finns i sökmotorns version av skolans sida men inte i den version som hämtades 5.11.2026. Bekräfta i Wilma." },
        { id: "2627-stafett", year: "2026–2027", type: "skoldag", title: "Skoldag lördag (Stafettkarneval)", start: "2027-05-29", src: ["matt"], verify: true, note: "Finns i sökmotorns version av skolans sida men inte i den version som hämtades 5.11.2026. Bekräfta i Wilma." },
      ],
      notes: {},
      pending: "2027–2028: skolans egna avvikelser (arbetslördag/ledig dag) är inte publicerade ännu.",
    },
  ];

  const TYPE_LABEL = { termin: "Termin", lov: "Lov", ledig: "Ledig dag", skoldag: "Extra skoldag", helgdag: "Helgdag" };

  function eventsFor(schoolKey, years, opts) {
    opts = opts || {};
    const s = SCHOOLS.find((x) => x.key === schoolKey);
    return COMMON.concat(s.extra)
      .filter((e) => years.includes(e.year))
      .filter((e) => opts.helgdagar !== false || e.type !== "helgdag")
      .map((e) => Object.assign({}, e, { note: [e.note, s.notes[e.id]].filter(Boolean).join(" ") || undefined }))
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  // ---- iCalendar (RFC 5545) ----
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (iso) => iso.replace(/-/g, "");
  function addDays(iso, n) {
    const d = new Date(iso + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  const esc = (t) => String(t).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  function fold(line) {
    // Vik rader längre än 75 oktetter (UTF-8), utan att dela tecken.
    const out = [];
    let cur = "", bytes = 0;
    for (const ch of line) {
      const b = new TextEncoder().encode(ch).length;
      const limit = out.length ? 74 : 75;
      if (bytes + b > limit) { out.push(cur); cur = ""; bytes = 0; }
      cur += ch; bytes += b;
    }
    out.push(cur);
    return out.join("\r\n ");
  }
  function stamp(now) {
    const d = now || new Date();
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";
  }

  function toICS(schoolKey, years, opts) {
    opts = opts || {};
    const s = SCHOOLS.find((x) => x.key === schoolKey);
    const ts = stamp(opts.now);
    const L = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Skolkalender Esbo//SV", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "X-WR-CALNAME:" + esc(s.name + " – lov och arbetstider"),
      "X-WR-TIMEZONE:Europe/Helsinki",
    ];
    for (const e of eventsFor(schoolKey, years, opts)) {
      const srcText = e.src.map((k) => SRC[k].name + (SRC[k].url ? " " + SRC[k].url : "")).join("\n");
      const desc = [e.note, e.verify ? "OBS: bekräfta i Wilma." : "", "Källa:\n" + srcText].filter(Boolean).join("\n\n");
      L.push(
        "BEGIN:VEVENT",
        "UID:" + s.key + "-" + e.id + "@skolkalender-esbo",
        "DTSTAMP:" + ts,
        "DTSTART;VALUE=DATE:" + ymd(e.start),
        "DTEND;VALUE=DATE:" + ymd(addDays(e.end || e.start, 1)),
        "SUMMARY:" + esc(s.short + ": " + e.title + (e.verify ? " (bekräfta)" : "")),
        "DESCRIPTION:" + esc(desc),
        "CATEGORIES:" + esc(TYPE_LABEL[e.type]),
        "TRANSP:TRANSPARENT",
        "X-MICROSOFT-CDO-BUSYSTATUS:FREE",
        "X-MICROSOFT-CDO-ALLDAYEVENT:TRUE",
        "END:VEVENT"
      );
    }
    L.push("END:VCALENDAR");
    return L.map(fold).join("\r\n") + "\r\n";
  }

  // Gemensam kalender för alla skolor: gemensamma händelser en gång,
  // skolvisa avvikelser märkta med skolans namn (sammanslagna om samma dag och typ).
  function combinedEvents(years, opts) {
    opts = opts || {};
    const out = COMMON.filter((e) => years.includes(e.year))
      .filter((e) => opts.helgdagar !== false || e.type !== "helgdag")
      .map((e) => {
        const notes = SCHOOLS.filter((s) => s.notes[e.id]).map((s) => s.short + ": " + s.notes[e.id]);
        return Object.assign({}, e, { note: [e.note].concat(notes).filter(Boolean).join("\n") || undefined, schools: null });
      });
    const groups = {};
    for (const s of SCHOOLS) for (const e of s.extra) {
      if (!years.includes(e.year)) continue;
      const k = e.start + "|" + e.type + "|" + e.title;
      (groups[k] = groups[k] || []).push({ s, e });
    }
    for (const k of Object.keys(groups)) {
      const g = groups[k], e0 = g[0].e;
      const who = g.map(({ s, e }) => s.short + (e.verify ? " (bekräfta)" : "")).join(", ");
      out.push({
        id: "x-" + e0.id + "-" + g.map((x) => x.s.key).join("-"),
        year: e0.year, type: e0.type, start: e0.start, end: e0.end,
        title: e0.title + " – " + who,
        verify: g.some((x) => x.e.verify),
        src: [...new Set(g.flatMap((x) => x.e.src))],
        note: g.map(({ s, e }) => s.short + ": " + (e.note || e.title)).join("\n"),
      });
    }
    return out.sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
  }

  function icsFromEvents(calName, uidPrefix, evs, opts) {
    opts = opts || {};
    const ts = stamp(opts.now);
    const L = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Skolkalender Esbo//SV", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "X-WR-CALNAME:" + esc(calName), "X-WR-TIMEZONE:Europe/Helsinki",
      "REFRESH-INTERVAL;VALUE=DURATION:P1D", "X-PUBLISHED-TTL:P1D",
    ];
    for (const e of evs) {
      const srcText = e.src.map((k) => SRC[k].name + (SRC[k].url ? " " + SRC[k].url : "")).join("\n");
      const desc = [e.note, e.verify ? "OBS: bekräfta i Wilma." : "", "Källa:\n" + srcText].filter(Boolean).join("\n\n");
      L.push("BEGIN:VEVENT", "UID:" + uidPrefix + e.id + "@skolkalender-esbo", "DTSTAMP:" + ts,
        "DTSTART;VALUE=DATE:" + ymd(e.start), "DTEND;VALUE=DATE:" + ymd(addDays(e.end || e.start, 1)),
        "SUMMARY:" + esc(e.title), "DESCRIPTION:" + esc(desc), "CATEGORIES:" + esc(TYPE_LABEL[e.type]),
        "TRANSP:TRANSPARENT", "X-MICROSOFT-CDO-BUSYSTATUS:FREE", "X-MICROSOFT-CDO-ALLDAYEVENT:TRUE", "END:VEVENT");
    }
    L.push("END:VCALENDAR");
    return L.map(fold).join("\r\n") + "\r\n";
  }

  function toICSCombined(years, opts) {
    return icsFromEvents("Skollov Finno & Mattliden", "kombi-", combinedEvents(years, opts), opts);
  }

  function toICSHolidays() {
    return icsFromEvents("Helgdagar Finland (bankfria dagar)", "", HOLIDAYS, {});
  }

  const api = { SRC, BANK, HOLIDAYS, toICSHolidays, COMMON, SCHOOLS, TYPE_LABEL, eventsFor, combinedEvents, toICS, toICSCombined, addDays, YEARS: ["2026–2027", "2027–2028"] };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Skolkalender = api;
})(this);
