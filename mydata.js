// Stránka Zásad ochrany osobních údajů: správa vlastních dat ve výzkumné databázi
// (přístup a přenositelnost = stažení JSON, výmaz, odvolání souhlasu).
(() => {
  const $ = id => document.getElementById(id);
  const S = window.aeroShare; if (!S || !$("md-state")) return;
  const msg = t => { $("md-msg").textContent = t; };
  const when = iso => { try { return new Date(iso).toLocaleString("cs-CZ"); } catch (e) { return iso; } };
  const today = () => new Date().toISOString().slice(0, 10);
  // po smazání v databázi označí uložené pozice jako neodeslané, aby šly případně poslat znovu
  const resetHistory = () => { try { const a = JSON.parse(localStorage.getItem("aero.pos.v1")); if (Array.isArray(a)) { a.forEach(r => { r.sentHash = null; }); localStorage.setItem("aero.pos.v1", JSON.stringify(a)); } } catch (e) { } };

  function render() {
    const id = S.deviceId(), c = S.consent();
    $("devid").textContent = id || "zatím nevzniklo";
    $("md-state").textContent = !id
      ? "Z tohoto zařízení jsi souhlas se sdílením neudělil(a), ve výzkumné databázi proto nejsou žádná tvoje data."
      : c
        ? "Souhlas se sdílením je udělený (od " + when(c.at) + "). Data se odesílají jen tehdy, když v aplikaci klepneš na Odeslat anonymně."
        : "Souhlas se sdílením není udělený nebo byl odvolán, nic dalšího se neodesílá. Dříve odeslaná data si můžeš stáhnout nebo smazat.";
    $("md-get").disabled = !id; $("md-del").disabled = !id; $("md-revoke").disabled = !c;
    if (id) $("mail").href = "mailto:aeroanalysisapp@gmail.com?subject=" + encodeURIComponent("Aero pozice – moje data") +
      "&body=" + encodeURIComponent("Dobrý den,\nprosím o (doplňte: zaslání / smazání / opravu) mých dat.\nMoje anonymní ID: " + id + "\n");
  }
  const fail = (e, what) => msg(e && e.missing
    ? "Tahle funkce v databázi zatím není zapnutá. Napiš prosím e-mail s anonymním ID a vyřídím to ručně."
    : (navigator.onLine === false ? "Jsi offline, zkus to později." : what + " se nepovedlo (" + (e && e.message) + ")."));

  $("md-get").onclick = async () => {
    msg("Stahuji…");
    try {
      const rows = await S.getMyData();
      if (!rows.length) { msg("Ve výzkumné databázi nejsou žádná data z tohoto zařízení."); return; }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify({ device_id: S.deviceId(), exported_at: new Date().toISOString(), records: rows }, null, 1)], { type: "application/json" }));
      a.download = "aero-pozice-moje-data-" + today() + ".json"; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      msg("Staženo záznamů: " + rows.length + ".");
    } catch (e) { fail(e, "Stažení"); }
  };
  $("md-del").onclick = async () => {
    if (!confirm("Opravdu smazat všechna data odeslaná z tohoto zařízení? Nejde to vrátit.")) return;
    msg("Mažu…");
    try { const n = await S.deleteMyData(); resetHistory(); msg("Hotovo. Smazaných záznamů: " + n + "."); }
    catch (e) { fail(e, "Smazání"); }
  };
  $("md-revoke").onclick = () => {
    S.revoke(); render();
    msg("Souhlas je odvolaný, nic dalšího se neodešle. Odvolání nemá vliv na data odeslaná dříve, ta můžeš smazat tlačítkem Smazat moje data.");
  };
  render();
})();
