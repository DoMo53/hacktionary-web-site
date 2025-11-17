// Запрет контекстного меню
document.addEventListener('contextmenu', e => e.preventDefault(), { capture: true });

// Запрет копирования/вырезания/вставки
['copy', 'cut', 'paste'].forEach(evt =>
    document.addEventListener(evt, e => {
        if (!allowEditing(e.target)) e.preventDefault();
    }, { capture: true })
);

// Запрет начала выделения и перетаскивания
document.addEventListener('selectstart', e => {
    if (!allowEditing(e.target)) e.preventDefault();
}, { capture: true });
document.addEventListener('dragstart', e => e.preventDefault(), { capture: true });

// Блок популярных хоткеев: Ctrl/Cmd+C, X, S, U, P; F12; Ctrl+Shift+I/J
document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    const blockedCombo = (ctrl && ['c', 'x', 's', 'u', 'p'].includes(k)) ||
        (ctrl && e.shiftKey && ['i', 'j', 'c'].includes(k)) ||
        (k === 'f12');
    if (blockedCombo && !allowEditing(e.target)) e.preventDefault();
}, { capture: true });

// Разрешаем редактируемым элементам
function allowEditing(el) {
    return el && (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.isContentEditable
    );
}
