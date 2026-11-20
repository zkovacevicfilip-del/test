'use strict';
// Zmenšení videa v prohlížeči. Video se přehraje do plátna v menším rozlišení a znovu se zakóduje
// (MediaRecorder: MP4/H.264, kde to prohlížeč umí, jinak WebM). Nic se neodesílá.
// Kódování běží v reálném čase: minutové video trvá asi minutu.
(() => {
  const $ = id => document.getElementById(id);
  // výška kratší strany, datový tok obrazu a zvuku (bity za sekundu)
  const KVALITA = { tiny: { h: 360, vb: 350e3, ab: 32e3 }, small: { h: 480, vb: 700e3, ab: 48e3 }, good: { h: 720, vb: 1500e3, ab: 96e3 } };
  let soubor = null, delka = 0, url = '', vystupUrl = '', zipUrl = '', vyrobeny = null;

  const mb = b => (b / 1048576).toLocaleString('cs-CZ', { maximumFractionDigits: b < 10485760 ? 1 : 0 }) + ' MB';
  const cas = s => isFinite(s) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '?';
  const sude = x => Math.max(2, Math.round(x / 2) * 2);
  const stav = t => { $('stav').textContent = t || ''; };

  function typ(zvuk) {
    const moznosti = zvuk
      ? ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4;codecs=avc1,opus', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      : ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    return window.MediaRecorder ? moznosti.find(t => MediaRecorder.isTypeSupported(t)) || '' : '';
  }

  function odhad() {
    if (!soubor) return;
    const k = KVALITA[$('kvalita').value], zvuk = !$('bezZvuku').checked;
    if (!isFinite(delka) || !delka) { $('odhad').textContent = ''; return; }
    const odh = delka * (k.vb + (zvuk ? k.ab : 0)) / 8 * 1.05;
    $('odhad').textContent = 'Odhad po zmenšení: asi ' + mb(Math.min(odh, soubor.size)) + ' (teď ' + mb(soubor.size) + ').';
  }

  $('soubor').addEventListener('change', () => {
    const f = $('soubor').files[0]; $('vysledek').classList.add('hidden'); stav('');
    if (!f) return;
    soubor = f; if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(f);
    const v = $('nahled'); v.src = url; v.controls = true; v.classList.add('on'); $('spustit').disabled = true;
    v.onloadedmetadata = () => {
      delka = v.duration;
      $('info').textContent = f.name + ' · ' + mb(f.size) + ' · ' + cas(delka) + ' · ' + v.videoWidth + ' × ' + v.videoHeight;
      $('spustit').disabled = false; odhad();
    };
    v.onerror = () => stav('Tohle video prohlížeč neumí otevřít. Zkus jiné, nebo ho nahraj v Chrome.');
  });
  $('kvalita').addEventListener('change', odhad);
  $('bezZvuku').addEventListener('change', odhad);

  async function zmensit() {
    const k = KVALITA[$('kvalita').value], zvuk = !$('bezZvuku').checked, mime = typ(zvuk);
    if (!mime) throw new Error('Tenhle prohlížeč neumí video kódovat. Použij Chrome.');
    // AudioContext vzniká hned po klepnutí, jinak by ho prohlížeč nemusel pustit
    const ac = zvuk ? new AudioContext() : null;
    // zpracování běží v novém přehrávači (zvuk z přehrávače jde připojit jen jednou), náhled se mezitím schová
    const n = $('nahled'); n.pause();
    const v = document.createElement('video'); v.className = 'on'; v.playsInline = true; v.muted = !zvuk; v.src = url;
    n.classList.remove('on'); n.after(v); vyrobeny = v;
    await new Promise((ok, chyba) => { v.onloadedmetadata = ok; v.onerror = () => chyba(new Error('Video se nepodařilo otevřít.')); });
    const sw = v.videoWidth, sh = v.videoHeight, m = Math.min(1, k.h / Math.min(sw, sh)), w = sude(sw * m), h = sude(sh * m);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
    const proud = cv.captureStream(30);
    if (ac) {
      // zvuk jde jen do nahrávky, ne do reproduktoru
      const zdroj = ac.createMediaElementSource(v), cil = ac.createMediaStreamDestination();
      zdroj.connect(cil); cil.stream.getAudioTracks().forEach(t => proud.addTrack(t)); await ac.resume();
    }
    const rec = new MediaRecorder(proud, { mimeType: mime, videoBitsPerSecond: k.vb, audioBitsPerSecond: k.ab });
    const kusy = []; rec.ondataavailable = e => { if (e.data.size) kusy.push(e.data); };
    const hotovo = new Promise(ok => { rec.onstop = ok; });

    let konec = false; const snimek = () => g.drawImage(v, 0, 0, w, h);
    const smycka = () => { if (konec) return; snimek(); if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(smycka); else requestAnimationFrame(smycka); };
    let zamek = null; try { zamek = await navigator.wakeLock.request('screen'); } catch (e) { /* bez zámku obrazovky */ }
    const t0 = performance.now();
    const ukazatel = setInterval(() => {
      const t = v.currentTime, d = isFinite(v.duration) ? v.duration : 0;
      $('barVypln').style.width = d ? Math.min(100, 100 * t / d) + '%' : '0';
      $('prubehText').textContent = (d ? cas(t) + ' / ' + cas(d) : cas(t)) + ' · ' + w + ' × ' + h;
    }, 250);
    try {
      snimek(); rec.start(1000);
      await v.play(); smycka();
      await new Promise((ok, chyba) => { v.onended = ok; v.onerror = () => chyba(new Error('Při přehrávání videa nastala chyba.')); });
    } finally {
      konec = true; clearInterval(ukazatel);
      if (rec.state !== 'inactive') rec.stop();
      if (zamek) zamek.release().catch(() => {});
    }
    await hotovo; if (ac) ac.close();
    return { blob: new Blob(kusy, { type: mime.split(';')[0] }), w, h, sekundy: (performance.now() - t0) / 1000 };
  }

  // ZIP bez komprese (metoda „store“): video už zkomprimované je, deflate by ušetřil méně než 1 %
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let i = 0; i < 8; i++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u) { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  async function zip(blob, jmeno) {
    const data = new Uint8Array(await blob.arrayBuffer()), nm = new TextEncoder().encode(jmeno), crc = crc32(data), d = new Date();
    const cas = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), den = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    const lok = new DataView(new ArrayBuffer(30)), cen = new DataView(new ArrayBuffer(46)), kon = new DataView(new ArrayBuffer(22));
    [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [10, cas, 2], [12, den, 2], [14, crc, 4], [18, data.length, 4], [22, data.length, 4], [26, nm.length, 2]]
      .forEach(([o, x, n]) => n === 4 ? lok.setUint32(o, x, true) : lok.setUint16(o, x, true));
    [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [12, cas, 2], [14, den, 2], [16, crc, 4], [20, data.length, 4], [24, data.length, 4], [28, nm.length, 2]]
      .forEach(([o, x, n]) => n === 4 ? cen.setUint32(o, x, true) : cen.setUint16(o, x, true));
    [[0, 0x06054b50, 4], [8, 1, 2], [10, 1, 2], [12, 46 + nm.length, 4], [16, 30 + nm.length + data.length, 4]]
      .forEach(([o, x, n]) => n === 4 ? kon.setUint32(o, x, true) : kon.setUint16(o, x, true));
    return new Blob([lok, nm, data, cen, nm, kon], { type: 'application/zip' });
  }

  $('spustit').addEventListener('click', async () => {
    if (!soubor) return;
    $('spustit').disabled = true; $('soubor').disabled = true; stav('');
    $('vysledek').classList.add('hidden'); $('prubeh').classList.remove('hidden');
    try {
      const r = await zmensit(), pripona = r.blob.type === 'video/mp4' ? 'mp4' : 'webm';
      const jmeno = soubor.name.replace(/\.[^.]+$/, '') + '-maly.' + pripona;
      [vystupUrl, zipUrl].forEach(u => u && URL.revokeObjectURL(u));
      vystupUrl = URL.createObjectURL(r.blob); zipUrl = URL.createObjectURL(await zip(r.blob, jmeno));
      $('stahnoutVideo').href = vystupUrl; $('stahnoutVideo').download = jmeno;
      $('stahnoutZip').href = zipUrl; $('stahnoutZip').download = jmeno.replace(/\.[^.]+$/, '') + '.zip';
      const uspora = Math.round(100 * (1 - r.blob.size / soubor.size));
      $('vysledekText').innerHTML = '';
      const b = document.createElement('span'); b.className = 'big'; b.textContent = mb(soubor.size) + ' → ' + mb(r.blob.size);
      const s = document.createElement('span'); s.className = uspora > 0 ? 'pu' : 'muted'; s.textContent = uspora > 0 ? '  o ' + uspora + ' % menší' : '  (video bylo už malé)';
      $('vysledekText').append(b, s);
      $('formatText').textContent = 'Formát ' + pripona.toUpperCase() + ', ' + r.w + ' × ' + r.h + (($('bezZvuku').checked) ? ', bez zvuku.' : ', se zvukem.') + ' ZIP je stejně velký jako video, hodí se jen tam, kde nejde poslat MP4.';
      $('vysledek').classList.remove('hidden');
      window.VYSLEDEK = { velikost: r.blob.size, puvodni: soubor.size, typ: r.blob.type, w: r.w, h: r.h };
    } catch (e) {
      stav(e.message || 'Zmenšení se nepovedlo.'); window.VYSLEDEK = { chyba: String(e && e.message) };
    } finally {
      $('prubeh').classList.add('hidden'); $('spustit').disabled = false; $('soubor').disabled = false;
      if (vyrobeny) { vyrobeny.pause(); vyrobeny.remove(); vyrobeny = null; }
      $('nahled').classList.add('on'); $('nahled').controls = true;
    }
  });
})();
