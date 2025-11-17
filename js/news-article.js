// js/news-article.js — подстановка статьи по ?id=..., аккуратный low-logic

const JSON_URL = '../js/data/news.json';

function byId(id) { return document.getElementById(id); }
function getParam(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name);
}

async function loadArticles() {
  // пробуем JSON (для сервера), иначе — window.NEWS_DATA (для file://)
  try {
    const r = await fetch(JSON_URL, { cache: 'no-store' });
    if (r.ok) {
      const j = await r.json();
      if (Array.isArray(j)) return j;
    }
  } catch (e) { }
  return Array.isArray(window.NEWS_DATA) ? window.NEWS_DATA : [];
}

function fmtDate(d) {
  // ожидаем YYYY-MM-DD
  if (!d) return '';
  try {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, (m || 1) - 1, day || 1).toLocaleDateString('ru-RU');
  } catch (e) { return d; }
}

function setCover(src, alt) {
  const wrap = byId('coverWrap');
  const img = byId('cover');
  const cap = byId('coverAlt');
  if (!src) { wrap.hidden = true; return; }
  img.src = src;
  img.alt = alt || '';
  img.onerror = () => { img.onerror = null; img.src = '../assets/images/windowsdef.jpg'; };
  if (alt) { cap.textContent = alt; } else { cap.textContent = ''; }
  wrap.hidden = false;
}

function setTags(tags) {
  const box = byId('tags');
  box.innerHTML = '';
  if (!Array.isArray(tags)) return;
  for (const t of tags) {
    const span = document.createElement('span');
    span.className = 'article-chip';
    span.textContent = t;
    box.appendChild(span);
  }
}

function setCrumbs(title) {
  const el = byId('crumbCurrent');
  if (el) el.textContent = title || 'Статья';
}

function setShare(title) {
  const tg = byId('shareTg');
  const cp = byId('shareCopy');
  const url = location.href;

  if (tg) {
    const encUrl = encodeURIComponent(url);
    const encText = encodeURIComponent(title || document.title);
    tg.href = `https://t.me/share/url?url=${encUrl}&text=${encText}`;
  }
  if (cp) {
    cp.addEventListener('click', (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(url).catch(() => { });
    });
  }
}

function setNext(articles, curIdx) {
  const next = articles[curIdx + 1] || articles[0];
  const a = byId('nextLink');
  if (!a || !next) return;
  a.textContent = `Следующая: ${next.title} →`;
  a.href = `./article.html?id=${encodeURIComponent(next.id)}`;
}

function setReadTime() {
  const content = byId('content');
  const out = byId('readTime');
  if (!content || !out) return;
  const words = content.innerText.trim().split(/\s+/).length;
  const minutes = Math.max(2, Math.round(words / 180));
  out.textContent = `~ ${minutes} мин`;
}

(async function init() {
  const id = getParam('id');
  const data = await loadArticles();
  const idx = Math.max(0, data.findIndex(x => String(x.id) === String(id)));
  const a = data[idx] || data[0];

  // hero
  byId('title').textContent = a.title || 'Статья';
  byId('subtitle').textContent = a.subtitle || '';
  byId('author').textContent = a.author || 'HACKtionary';
  const dateEl = byId('date');
  dateEl.textContent = fmtDate(a.date || '');
  dateEl.dateTime = a.date || '';
  byId('tagCat').textContent = (a.category || 'СТАТЬЯ').toString();

  setTags(a.tags);
  setCrumbs(a.title);
  setCover(a.cover, a.coverAlt);

  // контент
  byId('content').innerHTML = a.contentHtml || '<p>Содержимое статьи скоро появится.</p>';

  // навигация и шары
  setNext(data, idx);
  setShare(a.title);

  // время чтения
  setReadTime();
})();
