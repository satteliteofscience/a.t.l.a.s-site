(() => {
  'use strict';
  const el = (id) => document.getElementById(id);
  const state = { data: null, query: '', filter: 'all' };
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 1v3m6-3v3M9 20v3m6-3v3M1 9h3m-3 6h3m16-6h3m-3 6h3M9 9h6v6H9z"/></svg>';
  const $ = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = String(content);
    return node;
  };
  const safeUrl = (value) => {
    try { const u = new URL(value); return u.protocol === 'https:' ? u.href : null; }
    catch { return null; }
  };
  const downloadItems = (board) => Array.isArray(board.downloads)
    ? board.downloads.filter(item => safeUrl(item.url) && typeof item.filename === 'string' && item.filename.trim())
    : [];

  function renderCard(board) {
    const card = $('article', 'board-card');
    const top = $('div', 'top');
    const chip = $('div', 'board-icon'); chip.innerHTML = icon;
    const downloadable = downloadItems(board);
    const available = downloadable.length > 0 && board.status === 'available';
    const status = $('span', `board-status ${available ? 'available' : board.status === 'planned' ? 'planned' : 'unverified'}`,
      available ? '● ОПУБЛИКОВАНО' : board.status === 'planned' ? '◷ ПОДГОТОВКА' : 'НЕ ПРОВЕРЕНО');
    top.append(chip, status);
    card.append(top);
    card.append($('div', 'family', board.family || 'Flight controller'));
    card.append($('h3', '', board.name || 'Неизвестная плата'));
    card.append($('p', 'desc', board.description || 'Описание отсутствует.'));
    const meta = $('div', 'board-meta');
    const version = $('span'); version.append('База ', $('b', '', board.version || '—'));
    const target = $('span'); target.append('Target: ', $('b', '', board.target || '—'));
    meta.append(version, target); card.append(meta);
    const actions = $('div', 'board-actions');
    if (available) {
      downloadable.forEach((item) => {
        const a = $('a', 'download-btn'); a.href = safeUrl(item.url); a.target = '_blank'; a.rel = 'noopener noreferrer';
        const label = $('span', '', item.filename);
        const hint = $('small', '', 'СКАЧАТЬ ↗');
        a.append(label, hint); actions.append(a);
        if (/^[0-9a-f]{64}$/i.test(item.sha256 || '')) {
          const check = $('div', 'checksum-row'); check.append($('span', '', 'SHA-256: ' + item.sha256.slice(0, 12) + '…'));
          const copy = $('button', 'checksum-btn', 'Копировать SHA-256');
          copy.type = 'button'; copy.addEventListener('click', async () => {
            try { await navigator.clipboard.writeText(item.sha256); copy.textContent = 'Скопировано ✓'; }
            catch { copy.textContent = 'Невозможно скопировать'; }
          });
          check.append(copy); actions.append(check);
        }
      });
    } else {
      actions.append($('div', 'download-placeholder', board.status === 'unverified'
        ? 'Нет подтверждённых сборок для этой платформы'
        : 'Сборка пока не опубликована'));
    }
    card.append(actions);
    return card;
  }

  function renderBoards() {
    const grid = el('boardGrid');
    if (!state.data) return;
    const boards = Array.isArray(state.data.boards) ? state.data.boards : [];
    const filtered = boards.filter((b) => {
      const hasRelease = b.status === 'available' && downloadItems(b).length > 0;
      if (state.filter === 'available' && !hasRelease) return false;
      if (state.filter === 'planned' && hasRelease) return false;
      const haystack = `${b.name || ''} ${b.family || ''} ${b.target || ''}`.toLocaleLowerCase('ru');
      return haystack.includes(state.query);
    });
    grid.replaceChildren(...filtered.map(renderCard));
    if (!filtered.length) grid.append($('div', 'empty-state', ''));
    if (!filtered.length) {
      const empty = grid.firstChild;
      empty.append($('strong', '', 'Ничего не найдено'), $('span', '', 'Измените поисковый запрос или фильтр.'));
    }
    const active = boards.filter(b => b.status === 'available' && downloadItems(b).length > 0).length;
    el('downloadStatus').textContent = `Показано ${filtered.length} из ${boards.length} платформ · Опубликованных сборок: ${active}`;
  }

  function bindRepo(data) {
    const repo = safeUrl(data.project?.repository_url);
    const issues = safeUrl(data.project?.issues_url);
    if (repo) {
      const nav = el('githubNav'); nav.href = repo; nav.target = '_blank'; nav.rel = 'noopener noreferrer';
      nav.classList.remove('link-disabled'); nav.removeAttribute('aria-disabled'); nav.removeAttribute('title');
      const link = el('sourceLink'); link.href = repo; link.classList.remove('is-hidden');
      el('repoPending').classList.add('is-hidden');
    }
    if (issues) {
      const link = el('issuesLink'); link.href = issues; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.innerHTML = 'Запросить поддержку <span aria-hidden="true">↗</span>';
    }
    const available = (data.boards || []).filter(b => b.status === 'available' && downloadItems(b).length > 0);
    if (available.length > 0) el('releaseIndicator').textContent = 'RELEASES AVAILABLE';
  }

  async function loadData() {
    try {
      const embedded = el('atlasEmbeddedData');
      if (embedded) {
        const data = JSON.parse(embedded.textContent);
        state.data = data; bindRepo(data); renderBoards(); return;
      }
      const response = await fetch('data/releases.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!data || !Array.isArray(data.boards)) throw new Error('Неверный формат JSON');
      state.data = data; bindRepo(data); renderBoards();
    } catch (error) {
      el('downloadStatus').textContent = 'Не удалось прочитать каталог сборок.';
      const grid = el('boardGrid'); grid.replaceChildren();
      const placeholder = $('div', 'empty-state');
      placeholder.append($('strong', '', 'Каталог пока недоступен'), $('span', '', 'Запустите сайт через HTTP-сервер или проверьте файл data/releases.json.'));
      grid.append(placeholder);
      console.error('A.T.L.A.S. releases catalog:', error);
    }
  }

  el('boardSearch').addEventListener('input', (event) => {
    state.query = event.target.value.trim().toLocaleLowerCase('ru'); renderBoards();
  });
  document.querySelectorAll('.filter-chip').forEach(button => button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll('.filter-chip').forEach(chip => {
      const active = chip === button; chip.classList.toggle('is-active', active); chip.setAttribute('aria-pressed', String(active));
    });
    renderBoards();
  }));
  const menu = el('menuToggle');
  menu.addEventListener('click', () => {
    const isOpen = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!isOpen));
    menu.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
    el('mobileNav').hidden = isOpen;
  });
  document.querySelectorAll('#mobileNav a').forEach(link => link.addEventListener('click', () => {
    el('mobileNav').hidden = true; menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Открыть меню');
  }));
  el('copyrightYear').textContent = new Date().getFullYear();
  loadData();
})();
