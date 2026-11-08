(() => {
  'use strict';
  const el = (id) => document.getElementById(id);
  const tr = (key) => window.AtlasI18n?.t(key) ?? key;
  function localText(key) {
    const data = {
      ru: {history:'Архив и откат к предыдущим версиям',source:'Исходный код'},
      uk: {history:'Архів і повернення до попередніх версій',source:'Вихідний код'},
      en: {history:'Release history and rollback',source:'Source code'}
    };
    return (data[window.AtlasI18n?.lang] || data.ru)[key];
  }
  const state = { data: null, catalogSignature: '', query: '', filter: 'all' };
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 1v3m6-3v3M9 20v3m6-3v3M1 9h3m-3 6h3m16-6h3m-3 6h3M9 9h6v6H9z"/></svg>';
  const $ = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = String(content);
    return node;
  };
  const safeUrl = (value) => {
    try { const u = new URL(value, document.baseURI); return u.protocol === 'https:' || (u.protocol === 'http:' && ['localhost','127.0.0.1'].includes(u.hostname)) ? u.href : null; }
    catch { return null; }
  };
  // Fail closed: no public direct download fallback for release archives.
  // Local-file flashing remains a separate user-supplied operation.
  const downloadItems = (board) => Array.isArray(board.downloads)
    ? board.downloads.filter(item => window.AtlasFirmwareAccess?.isProtected(item)
      && typeof item.filename === 'string' && item.filename.trim()
      && item.channel === 'release' && /^[a-f0-9]{64}$/i.test(item.sha256||''))
    : [];

  function renderCard(board) {
    const card = $('article', 'board-card');
    const top = $('div', 'top');
    const chip = $('div', 'board-icon'); chip.innerHTML = icon;
    const downloadable = downloadItems(board);
    const available = downloadable.length > 0 && board.status === 'available';
    const status = $('span', `board-status ${available ? 'available' : board.status === 'planned' ? 'planned' : 'unverified'}`,
      tr(available ? '● ОПУБЛИКОВАНО' : board.status === 'planned' ? '◷ ПОДГОТОВКА' : 'НЕ ПРОВЕРЕНО'));
    top.append(chip, status);
    card.append(top);
    card.append($('div', 'family', board[`family_${window.AtlasI18n?.lang}`] || board.family || tr('Flight controller')));
    card.append($('h3', '', board[`name_${window.AtlasI18n?.lang}`] || board.name || tr('Неизвестная плата')));
    card.append($('p', 'desc', board[`description_${window.AtlasI18n?.lang}`] || tr(board.description || 'Описание отсутствует.')));
    const meta = $('div', 'board-meta');
    const version = $('span'); version.append(tr('База '), $('b', '', board.version || '—'));
    const target = $('span'); target.append('Target: ', $('b', '', board[`target_${window.AtlasI18n?.lang}`] || tr(board.target || '—')));
    meta.append(version, target); card.append(meta);
    const actions = $('div', 'board-actions');
    if (available) {
      const buildEntry = (item, historical = false) => {
        const wrap = $('div', historical ? 'version-history-row' : 'version-current');
        const link = $('button', 'download-btn');
        link.type='button';
        link.addEventListener('click',async()=>{
          try{link.disabled=true;await window.AtlasFirmwareAccess.download(item);}
          catch(error){if(error.message!=='Access cancelled')window.alert(error.message||'Firmware access failed');}
          finally{link.disabled=false;}
        });
        const name = $('span', '', item.label || item.version || item.filename);
        const hint = $('small', '', historical ? 'PIN · '+tr('СКАЧАТЬ ↗') : `LATEST · PIN · ${tr('СКАЧАТЬ ↗')}`);
        link.append(name, hint); wrap.append(link);
        const details = $('div', 'version-meta');
        if (item.timestamp) {
          const date = new Date(Number(item.timestamp) * 1000);
          if (Number.isFinite(date.getTime())) details.append($('span', '', date.toLocaleDateString(window.AtlasI18n?.lang || 'ru')));
        }
        if (/^[0-9a-f]{64}$/i.test(item.sha256 || '')) {
          const short = $('code', '', `SHA-256: ${item.sha256.slice(0, 16)}…`);
          const copy = $('button', 'checksum-btn', tr('Копировать SHA-256'));
          copy.type = 'button'; copy.addEventListener('click', async () => {
            try { await navigator.clipboard.writeText(item.sha256); copy.textContent = tr('Скопировано ✓'); }
            catch { copy.textContent = tr('Невозможно скопировать'); }
          });
          details.append(short, copy);
        }
        if (item.source_url && safeUrl(item.source_url)) {
          const source = $('a', 'version-source-link', localText('source'));
          source.href = safeUrl(item.source_url); source.rel = 'noopener noreferrer'; source.target = '_blank';
          details.append(source);
        }
        wrap.append(details);
        return wrap;
      };
      actions.append(buildEntry(downloadable[0]));
      if (downloadable.length > 1) {
        const history = $('details', 'version-history');
        const summary = $('summary', '', `${localText('history')} (${downloadable.length - 1})`);
        history.append(summary);
        downloadable.slice(1).forEach(item => history.append(buildEntry(item, true)));
        actions.append(history);
      }
    } else {
      actions.append($('div', 'download-placeholder', board.status === 'unverified'
        ? tr('Нет подтверждённых сборок для этой платформы')
        : tr('Сборка пока не опубликована')));
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
      empty.append($('strong', '', tr('Ничего не найдено')), $('span', '', tr('Измените поисковый запрос или фильтр.')));
    }
    const active = boards.filter(b => b.status === 'available' && downloadItems(b).length > 0).length;
    el('downloadStatus').textContent = `${tr('Показано')} ${filtered.length} ${tr('из')} ${boards.length} ${tr('платформ')} · ${tr('Опубликованных сборок')}: ${active}`;
  }

  function bindPublicCatalog(data) {
    const available = (data.boards || []).filter(b => b.status === 'available' && downloadItems(b).length > 0);
    if (available.length > 0) el('releaseIndicator').textContent = 'RELEASES AVAILABLE';
  }

  async function loadData() {
    try {
      const embedded = el('atlasEmbeddedData');
      if (embedded) {
        const data = JSON.parse(embedded.textContent);
        state.data = data; bindPublicCatalog(data); renderBoards(); return;
      }
      const response = await fetch('data/releases.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!data || !Array.isArray(data.boards)) throw new Error('Неверный формат JSON');
      const signature=JSON.stringify(data.boards);
      if(signature===state.catalogSignature)return; // preserve open archive panels on routine polling
      state.catalogSignature=signature;
      state.data = data; bindPublicCatalog(data); renderBoards();
    } catch (error) {
      el('downloadStatus').textContent = tr('Не удалось прочитать каталог сборок.');
      const grid = el('boardGrid'); grid.replaceChildren();
      const placeholder = $('div', 'empty-state');
      placeholder.append($('strong', '', tr('Каталог пока недоступен')), $('span', '', tr('Запустите сайт через HTTP-сервер или проверьте файл data/releases.json.')));
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
    menu.setAttribute('aria-label', tr(isOpen ? 'Открыть меню' : 'Закрыть меню'));
    el('mobileNav').hidden = isOpen;
  });
  document.querySelectorAll('#mobileNav a').forEach(link => link.addEventListener('click', () => {
    el('mobileNav').hidden = true; menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', tr('Открыть меню'));
  }));
  window.addEventListener('atlas:languagechange', () => {
    renderBoards();
    if (state.data) bindPublicCatalog(state.data);
  });
  el('copyrightYear').textContent = new Date().getFullYear();
  loadData();
  // Pick up newly published releases without requiring a hard reload.
  setInterval(()=>{if(document.visibilityState==='visible')loadData();},60000);
})();
