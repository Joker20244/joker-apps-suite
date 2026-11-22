/* Joker Apps Suite - shared runtime. No build step, plain ES. */
window.JK = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const today = () => new Date().toISOString().slice(0, 10);
  const fmtDate = iso => { try { return new Date(iso).toLocaleDateString('ar-EG', {year:'numeric', month:'long', day:'numeric'}); } catch(e){ return iso; } };
  const fmtMoney = (n, cur) => (n == null || n === '' ? '' : Number(n).toLocaleString('ar-EG', {maximumFractionDigits: 2}) + (cur ? ' ' + cur : ''));

  function store(ns){
    const key = 'jk:' + ns;
    const read = () => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e){ return []; } };
    const write = v => { localStorage.setItem(key, JSON.stringify(v)); return v; };
    return {
      all: read,
      get: id => read().find(x => x.id === id),
      add(item){ const v = read(); item.id = item.id || uid(); item.created = item.created || new Date().toISOString(); v.unshift(item); write(v); return item; },
      update(id, patch){ const v = read(); const i = v.findIndex(x => x.id === id); if (i > -1){ v[i] = {...v[i], ...patch}; write(v); return v[i]; } },
      remove(id){ write(read().filter(x => x.id !== id)); },
      replaceAll: write
    };
  }

  let toastEl;
  function toast(msg){
    if (!toastEl){ toastEl = document.createElement('div'); toastEl.className = 'jk-toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  function download(filename, text, mime){
    const blob = new Blob([text], {type: (mime || 'text/plain') + ';charset=utf-8'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  const toCSV = rows => rows.map(r => r.map(c => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n');

  // Wrap Latin runs (words, numbers with latin digits, units) in span.en for the dedicated English font.
  const LATIN = /([A-Za-z][A-Za-z0-9.+#&/_-]*(?: +[A-Za-z0-9.+#&/_()-]+)*|\d+(?:[.,]\d+)?(?:\s?(?:GB|MB|TB|kg|g|ml|L|cm|mm|Hz|W|V|mAh|%))?)/g;
  function wrapLatin(root){
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n){ return (n.parentElement && !n.parentElement.closest('script,style,input,textarea,.en') && LATIN.test(n.nodeValue)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }
    });
    const nodes = []; let n; while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(node => {
      LATIN.lastIndex = 0;
      const frag = document.createDocumentFragment(); let last = 0, m;
      const text = node.nodeValue;
      while ((m = LATIN.exec(text))){
        if (m.index > last) frag.append(text.slice(last, m.index));
        const s = document.createElement('span'); s.className = 'en'; s.textContent = m[0]; frag.append(s);
        last = m.index + m[0].length;
      }
      frag.append(text.slice(last));
      node.replaceWith(frag);
    });
  }

  // Shared page chrome: header (crown + title + home) and footer (bio + suite link).
  function chrome({title, tagline}){
    const h = document.getElementById('jk-header');
    if (h) h.innerHTML =
      '<img class="crown" src="crown.svg" alt="تاج جوكر">' +
      '<div><h1>' + esc(title) + '</h1>' + (tagline ? '<div class="tag">' + esc(tagline) + '</div>' : '') + '</div>' +
      '<a class="jk-home" href="index.html" title="كل التطبيقات" aria-label="كل التطبيقات"><img src="crown.svg" alt="" style="width:22px;vertical-align:middle"></a>';
    const f = document.getElementById('jk-footer');
    if (f) f.innerHTML =
      '<img src="crown.svg" alt=""> ' +
      'من مجموعة تطبيقات <b>جوكر</b> · بياناتك متسجلة على جهازك فقط' +
      ' · <a style="color:inherit" href="index.html">كل التطبيقات</a>';
    wrapLatin(document.body);
  }

  const emptyState = (msg) => '<div class="jk-empty"><svg width="72" height="56" viewBox="0 0 64 48"><path fill="currentColor" opacity=".6" d="M6 40 L10 14 L22 26 L32 8 L42 26 L54 14 L58 40 Z"/></svg><div>' + esc(msg) + '</div></div>';

  function confirmDialog(msg){
    return new Promise(res => {
      const ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;background:#000a;display:grid;place-items:center;z-index:100;padding:1rem';
      ov.innerHTML = '<div class="jk-card" style="max-width:340px;background:var(--surface)"><p style="margin-bottom:1rem">' + esc(msg) + '</p>' +
        '<div class="jk-row" style="justify-content:flex-end"><button class="jk-btn ghost" data-x="0">إلغاء</button><button class="jk-btn" data-x="1">تأكيد</button></div></div>';
      ov.addEventListener('click', e => { const x = e.target.dataset && e.target.dataset.x; if (x !== undefined){ ov.remove(); res(x === '1'); } });
      document.body.appendChild(ov);
    });
  }

  return {esc, uid, today, fmtDate, fmtMoney, store, toast, download, toCSV, wrapLatin, chrome, emptyState, confirmDialog};
})();
