// js/terms.js — Готовая версия
// Работает и по file:// (через window.TERMS_DATA), и на сервере (terms.json)

const TERMS_JSON_URL = '../js/data/terms.json';

let ALL_TERMS = [];
let CURRENT_TERMS = [];

/* ========== Загрузка данных ========== */
async function loadTerms() {
    // file:// → данные из js/data/terms.data.js
    if (Array.isArray(window.TERMS_DATA) && window.TERMS_DATA.length) {
        return window.TERMS_DATA;
    }
    // http/https → terms.json
    try {
        const res = await fetch(TERMS_JSON_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch {
        console.warn('Не удалось загрузить terms.json — используем пустой список.');
        return [];
    }
}

/* ========== Утилиты ========== */
const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const escReg = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const highlight = (txt, q) => q ? String(txt || '').replace(new RegExp(`(${escReg(q)})`, 'ig'), '<mark>$1</mark>') : String(txt || '');

/* ========== Рендер карточек ========== */
function renderTerms(list, q) {
    const track = document.getElementById('termsTrack');
    const counter = document.getElementById('termsCounter');
    CURRENT_TERMS = list;

    if (!track) return;

    if (!list.length) {
        track.innerHTML = `
      <article class="term-card">
        <h2>Ничего не найдено</h2>
        <p class="term-brief">Попробуйте изменить запрос.</p>
      </article>`;
        if (counter) counter.textContent = '';
        return;
    }

    if (counter) counter.textContent = `Найдено: ${list.length}`;

    track.innerHTML = list.map((t, i) => {
        const def = t.definition || '';
        const brief = def.length > 160 ? def.slice(0, 157) + '…' : def;
        const src = (t.sources || []).slice(0, 3).map(s =>
            `<span class="src-badge" title="${(s.title || s.doc || '').replace(/"/g, '&quot;')}">${s.doc || s.title || 'Источник'}</span>`
        ).join(' ');

        return `
      <article class="term-card" data-id="${i}" tabindex="0" role="button" aria-label="Открыть термин ${t.term}">
        <h2>${highlight(t.term || '—', q)}</h2>
        <p class="term-brief">${highlight(brief, q)}</p>
        <div class="term-sources">${src}</div>
      </article>`;
    }).join('');
}

/* ========== Модалка ========== */
function openModal(term) {
    const m = document.getElementById('termModal'); if (!m) return;

    m.querySelector('#termModalTitle').textContent = term.term || 'Термин';
    m.querySelector('#termModalDef').textContent = term.definition || '';

    const usage = term.usage || term.domains || [];
    m.querySelector('#termModalUsage').innerHTML = (Array.isArray(usage) && usage.length)
        ? usage.map(u => `<span class="term-usage-chip">${u}</span>`).join(' ')
        : '';

    const src = term.sources || [];
    m.querySelector('#termModalSources').innerHTML = src.length
        ? src.map(s => `<span class="src-badge">${s.doc || s.title || 'Источник'}</span>`).join(' ')
        : '<span class="src-badge">Источник не указан</span>';

    m.classList.remove('hidden');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const m = document.getElementById('termModal'); if (!m) return;
    m.classList.add('hidden');
    m.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

/* ========== Стрелки (снизу под карточками) ========== */
// шаг — 90% видимой ширины области; стабильный вариант для любых экранов
function pageStep(scroller) { return Math.max(240, Math.floor(scroller.clientWidth * 0.9)); }

function scrollTerms(direction) {
    const scroller = document.getElementById('termsScroller');
    if (!scroller) return;
    if (scroller.scrollWidth <= scroller.clientWidth) return; // некуда крутить

    const dx = (direction === 'next' ? 1 : -1) * pageStep(scroller);
    scroller.scrollBy({ left: dx, behavior: 'smooth' });
}

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded', async () => {
    // Загружаем и сортируем
    ALL_TERMS = await loadTerms();
    const byAlpha = [...ALL_TERMS].sort((a, b) => (a.term || '').localeCompare(b.term || '', 'ru'));

    // Первый рендер
    renderTerms(byAlpha, '');

    // Открытие модалки по карточке
    const track = document.getElementById('termsTrack');
    track?.addEventListener('click', (e) => {
        const card = e.target.closest('.term-card'); if (!card) return;
        const idx = Number(card.dataset.id);
        const item = CURRENT_TERMS[idx];
        if (item) openModal(item);
    });
    track?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const card = e.target.closest('.term-card'); if (!card) return;
            const idx = Number(card.dataset.id);
            const item = CURRENT_TERMS[idx];
            if (item) { e.preventDefault(); openModal(item); }
        }
    });

    // Поиск
    const form = document.getElementById('termsSearchForm');
    const input = document.getElementById('termQuery');

    const doSearch = () => {
        const qRaw = input?.value || '';
        const q = qRaw.trim().toLowerCase();

        const res = q
            ? byAlpha.filter(t =>
                (t.term || '').toLowerCase().includes(q) ||
                (t.definition || '').toLowerCase().includes(q) ||
                (t.sources || []).some(s =>
                    (s.title || '').toLowerCase().includes(q) ||
                    (s.doc || '').toLowerCase().includes(q)
                )
            )
            : byAlpha;

        renderTerms(res, qRaw);
    };

    form?.addEventListener('submit', (e) => { e.preventDefault(); doSearch(); });
    input?.addEventListener('input', debounce(doSearch, 150));

    // Закрытие модалки
    const modal = document.getElementById('termModal');
    modal?.addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // Стрелки снизу
    document.querySelector('[data-dir="prev"]')?.addEventListener('click', () => scrollTerms('prev'));
    document.querySelector('[data-dir="next"]')?.addEventListener('click', () => scrollTerms('next'));
});
