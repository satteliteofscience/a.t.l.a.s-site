'use strict';

(() => {
  const content = window.AtlasNoaidParameters;
  const local = {
    ru: {
      index: 2, title: 'A.T.L.A.S EKF3 NoAID параметры',
      intro: 'Справочник параметров A.T.L.A.S. для счисления без GPS, подтверждения взлёта и посадки, П.Р.И.К.А.З. и периферии. Проверяйте наличие параметра на контроллере: набор зависит от установленной сборки. Мягкий взлёт и посадка по умолчанию выключены.',
      home: 'Главная', changes: 'Список изменений', config: 'Конфигуратор', nav: 'Навигация', language: 'Язык',
      groupsLabel: 'Группы параметров', search: 'Найти параметр', example: 'Например, NOAID_SOFT_LAND',
      empty: 'Ничего не найдено.', count: n => `Найдено записей: ${n}`, defaults: 'по умолчанию', bitmask: 'маска',
      limitsTitle: 'Ограничения без внешнего позиционирования',
      revisionNotice: 'Мягкий взлёт и мягкая посадка описаны для подготовленной редакции 3.1. Проверяйте наличие параметров в установленной сборке.',
      limits: [
        'NoAID счисляет позицию по Пито, курсу и оценке ветра. Без внешних координат фактическое положение и путевая скорость остаются оценками. Ошибка координат растёт со временем и влияет на наведение в AUTO, GUIDED и RTL.',
        'Обучение ветру требует достоверных меток. Ошибка курса, масштаба Пито или самой метки может попасть в оценку ветра. При смене ветра без новой метки фильтр пользуется прежней оценкой до её обновления или истечения срока.',
        'NOAID_HOLD ослабляет дрейф до взлёта. Обнаруженное движение или подтверждённый запуск прекращают слабое удержание. Мягкий запуск использует отдельную проверку IMU и набора по барометру. Если набор не подтверждается, он может сработать позже или остаться неподтверждённым.',
        'Посадочное окно использует барометрическую высоту от HOME либо точки LAND, а рельеф и контакт на реальном самолёте остаются неизвестны. Порыв, движение или смещение давления могут отложить удержание до DISARM. При отказе Пито оценка скорости и счисление могут ухудшиться даже при активном предупреждении.'
      ],
      groups: { landing: 'Взлёт, посадка и контроль Пито', navigation: 'Позиция, GPS и метки', wind: 'Ветер и счисление', order: 'Протокол П.Р.И.К.А.З.', peripherals: 'Взлётный автомат и периферия' }
    },
    uk: {
      index: 3, title: 'A.T.L.A.S EKF3 NoAID параметри',
      intro: 'Довідник параметрів A.T.L.A.S. для лічби без GPS, підтвердження зльоту й посадки, Н.А.К.А.З. і периферії. Перевіряйте наявність параметра на контролері: набір залежить від установленої збірки. М’які зліт і посадка за замовчуванням вимкнені.',
      home: 'Головна', changes: 'Список змін', config: 'Конфігуратор', nav: 'Навігація', language: 'Мова',
      groupsLabel: 'Групи параметрів', search: 'Знайти параметр', example: 'Наприклад, NOAID_SOFT_LAND',
      empty: 'Нічого не знайдено.', count: n => `Знайдено записів: ${n}`, defaults: 'за замовчуванням', bitmask: 'маска',
      limitsTitle: 'Обмеження без зовнішнього позиціонування',
      revisionNotice: 'М’які зліт і посадку описано для підготовленої редакції 3.1. Перевіряйте наявність параметрів у встановленій збірці.',
      limits: [
        'NoAID веде лічбу позиції за Піто, курсом і оцінкою вітру. Без зовнішніх координат фактичне положення та шляхова швидкість залишаються оцінками. Похибка координат із часом зростає й впливає на наведення в AUTO, GUIDED і RTL.',
        'Для навчання вітру потрібні достовірні мітки. Похибка курсу, масштабу Піто або самої мітки може потрапити в оцінку вітру. Якщо вітер змінюється без нової мітки, фільтр використовує попередню оцінку до її оновлення або спливу строку.',
        'NOAID_HOLD зменшує дрейф до зльоту. Виявлений рух або підтверджений запуск припиняють слабке утримання. М’який запуск має окрему перевірку IMU й набору за барометром. Якщо набір не підтверджується, запуск може бути підтверджений пізніше або залишитися непідтвердженим.',
        'Посадкове вікно використовує барометричну висоту від HOME або точки LAND, а рельєф і контакт на реальному літаку залишаються невідомими. Порив, рух або зміщення тиску можуть відкласти утримання до DISARM. У разі відмови Піто оцінка швидкості та лічба можуть погіршитися навіть за активного попередження.'
      ],
      groups: { landing: 'Зліт, посадка й контроль Піто', navigation: 'Позиція, GPS і мітки', wind: 'Вітер і лічба', order: 'Протокол Н.А.К.А.З.', peripherals: 'Автомат зльоту й периферія' }
    },
    en: {
      index: 4, title: 'A.T.L.A.S EKF3 NoAID parameters',
      intro: 'A.T.L.A.S. settings for GPS-denied dead reckoning, launch and landing confirmation, O.R.D.E.R. and peripherals. Check the parameters on your controller, since availability depends on the installed build. Soft launch and soft landing are off by default.',
      home: 'Home', changes: 'Changelog', config: 'Configurator', nav: 'Navigation', language: 'Language',
      groupsLabel: 'Parameter groups', search: 'Find a parameter', example: 'For example, NOAID_SOFT_LAND',
      empty: 'No matching parameters.', count: n => `${n} matching entries`, defaults: 'default', bitmask: 'bitmask',
      limitsTitle: 'Limits without external positioning',
      revisionNotice: 'Soft launch and soft landing are documented for the prepared 3.1 revision. Check the installed build for these parameters.',
      limits: [
        'NoAID dead reckons position from Pitot airspeed, heading and estimated wind. Without external coordinates, horizontal position and groundspeed remain estimates. Position error accumulates and affects guidance in AUTO, GUIDED and RTL.',
        'Wind learning needs reliable position fixes. Heading errors, Pitot scale errors and bad fixes can be interpreted as wind. Without a new fix after a wind change, the filter uses the previous estimate until it is refreshed or expires.',
        'NOAID_HOLD reduces position drift before launch. Detected motion or a confirmed launch stops the weak hold. Soft launch has a separate check of IMU motion and barometric climb. If the climb cannot be confirmed, launch detection can be late or remain unconfirmed.',
        'The landing window uses barometric height relative to HOME or the LAND point. The actual terrain height and contact are unknown on a real aircraft. A gust, motion or a pressure shift can delay ground hold until DISARM. A Pitot fault can degrade speed and dead reckoning even when a warning is displayed.'
      ],
      groups: { landing: 'Launch, landing and Pitot monitoring', navigation: 'Position, GPS and operator fixes', wind: 'Wind and dead reckoning', order: 'O.R.D.E.R. protocol', peripherals: 'Takeoff controller and peripherals' }
    }
  };
  const $ = id => document.getElementById(id);
  const input = $('parameterSearch');
  const rows = $('parameterEntries');
  const groupLinks = $('parameterGroups');
  const languageButtons = [...document.querySelectorAll('[data-language]')];
  let language = 'ru';
  function savedLanguage() {
    try { return localStorage.getItem('atlas-language'); } catch { return null; }
  }
  const saved = savedLanguage();
  if (Object.hasOwn(local, saved)) language = saved;

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function renderEntries() {
    const t = local[language];
    const query = input.value.trim().toLowerCase();
    const open = new Set([...rows.querySelectorAll('details[open]')].map(row => row.id));
    const sections = document.createDocumentFragment();
    const links = document.createDocumentFragment();
    let count = 0;
    for (const [group, entries] of Object.entries(content)) {
      const section = element('section', null, 'noaid-section');
      section.id = group;
      section.append(element('h2', t.groups[group]));
      for (const entry of entries) {
        const [names, range] = entry;
        const description = entry[t.index];
        const searchText = `${names} ${t.groups[group]} ${description}`.toLowerCase();
        const melodySlot = /^buz_cstm_song(?:[2-9]|[1-3][0-9]|4[0-8])$/.test(query) && names.startsWith('BUZ_CSTM_SONG');
        if (query && !searchText.includes(query) && !melodySlot) continue;
        const details = element('details', null, 'noaid-row');
        details.id = names.split(' / ')[0].toLowerCase();
        details.open = open.has(details.id) || location.hash === `#${details.id}` || Boolean(query);
        const summary = element('summary');
        summary.append(element('code', names));
        if (range) summary.append(element('small', range.replace(/\bdefaults?\b/, t.defaults).replace('bitmask', t.bitmask)));
        details.append(summary, element('p', description));
        section.append(details);
        count += 1;
      }
      if (section.children.length === 1) continue;
      const link = element('a', t.groups[group]);
      link.href = `#${group}`;
      links.append(link);
      sections.append(section);
    }
    rows.replaceChildren(sections);
    groupLinks.replaceChildren(links);
    $('noaidResults').textContent = query ? (count ? t.count(count) : t.empty) : '';
  }

  function apply(next) {
    language = next;
    const t = local[language];
    document.documentElement.lang = language;
    document.title = t.title;
    document.querySelector('meta[name="description"]').content = t.intro;
    for (const [id, text] of [
      ['referenceTitle', t.title], ['referenceIntro', t.intro], ['homeLink', t.home],
      ['changeLink', t.changes], ['configLink', t.config], ['searchLabel', t.search],
      ['limitationsTitle', t.limitsTitle], ['revisionNotice', t.revisionNotice]
    ]) $(id).textContent = text;
    $('limitationItems').replaceChildren(...t.limits.map(item => element('li', item)));
    $('primaryNavigation').setAttribute('aria-label', t.nav);
    $('parameterGroups').setAttribute('aria-label', t.groupsLabel);
    $('languagePicker').setAttribute('aria-label', t.language);
    input.placeholder = t.example;
    for (const button of languageButtons) {
      const active = button.dataset.language === language;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('active', active);
    }
    try { localStorage.setItem('atlas-language', language); } catch { /* storage can be disabled */ }
    renderEntries();
  }

  function revealFragment() {
    const target = $(location.hash.slice(1));
    if (!target || !rows.contains(target)) return;
    if (target.tagName === 'DETAILS') target.open = true;
    target.scrollIntoView({ block: 'start' });
  }

  for (const button of languageButtons) button.addEventListener('click', () => apply(button.dataset.language));
  input.addEventListener('input', renderEntries);
  window.addEventListener('hashchange', revealFragment);
  apply(language);
  revealFragment();
})();
