// js/news.js — список новостей + стрелки прокрутки

const NEWS_JSON_URL = '../js/data/news.json';

// --- data loader (fetch -> fallback to window.NEWS_DATA for file://) ---
async function loadNewsList() {
  try {
    const r = await fetch(NEWS_JSON_URL, { cache: 'no-store' });
    if (r.ok) {
      const j = await r.json();
      if (Array.isArray(j)) return j;
    }
  } catch (e) { }
  return Array.isArray(window.NEWS_DATA) ? window.NEWS_DATA : [];
}

// --- карточка ---
function cardHTML(n) {
  const fallback = "../assets/images/crypto.jpg";
  return `
  <article class="news-card">
    <div class="news-media">
      ${n.cover ? `
        <img src="${n.cover}" alt="${n.coverAlt || ''}"
             onerror="this.onerror=null;this.src='${fallback}';">
      ` : ''}
      ${n.category ? `<span class="news-badge">${n.category}</span>` : ''}
    </div>
    <h2>${n.title}</h2>
    <p class="news-text">${n.excerpt || n.subtitle || ''}</p>
    <div class="news-actions">
      <a class="btn-get-started glow-sm" href="../news/article.html?id=${encodeURIComponent(n.id)}">Подробнее</a>
    </div>
  </article>`;
}


// --- инициализация стрелок в рамках одного rail ---
function bindRailArrows(rail) {
  if (!rail || rail.dataset.bound === '1') return; // уже привязано
  const scroller = rail.querySelector('.news-scroller');
  const prevBtn = rail.querySelector('[data-dir="prev"]');
  const nextBtn = rail.querySelector('[data-dir="next"]');
  if (!scroller) return;

  const step = () => Math.max(240, Math.round(scroller.clientWidth * 0.9));

  prevBtn && prevBtn.addEventListener('click', () => {
    scroller.scrollBy({ left: -step(), behavior: 'smooth' });
  });

  nextBtn && nextBtn.addEventListener('click', () => {
    scroller.scrollBy({ left: step(), behavior: 'smooth' });
  });

  rail.dataset.bound = '1';
}

// --- инициализация для всех rails на странице ---
function initAllRails(root = document) {
  root.querySelectorAll('.news-rail').forEach(bindRailArrows);
}

// --- основная инициализация ---
document.addEventListener('DOMContentLoaded', async () => {
  const data = await loadNewsList();
  const ordered = [...data].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const track = document.getElementById('newsTrack') || document.querySelector('.news-track');
  if (track) {
    track.innerHTML = ordered.map(cardHTML).join('');
  }

  // навешиваем стрелки (и если rails несколько — на все)
  initAllRails(document);
});
