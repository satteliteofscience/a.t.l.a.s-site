/* A.T.L.A.S. page metadata, RU/UA/EN. Browser-tab text follows the selected interface language.
 * Social previews use the static HTML fallback: most crawlers do not execute JavaScript. */
(() => {
  'use strict';
  const pages = {
    'index.html': {
      ru: {title:'Конфигуратор A.T.L.A.S. — ArduPlane 4.7.2', description:'A.T.L.A.S. Release 1.0 для Matek H743-WING V3, Cube Orange Plus и Uni-IC743 Mini: PIN-загрузки прошивок, EKF3 NOAID без GPS и веб-конфигуратор, проверенный на реальном контроллере.'},
      uk: {title:'Конфігуратор A.T.L.A.S. — ArduPlane 4.7.2', description:'A.T.L.A.S. Release 1.0 для Matek H743-WING V3, Cube Orange Plus і Uni-IC743 Mini: прошивки з PIN-захистом, EKF3 NOAID без GPS і вебконфігуратор, перевірений на реальному контролері.'},
      en: {title:'Configurator A.T.L.A.S. — ArduPlane 4.7.2', description:'A.T.L.A.S. Release 1.0 builds for Matek H743-WING V3, Cube Orange Plus and Uni-IC743 Mini; PIN-protected HEX downloads, EKF3 NOAID GPS-denied modes, and a browser configurator bench-tested with a real flight controller.'}
    },
    'configurator.html': {
      ru: {title:'A.T.L.A.S. — Конфигуратор полётного контроллера', description:'A.T.L.A.S. — конфигуратор 1.2: USB/MAVLink, протокол П.Р.И.К.А.З, параметры, калибровки и OSD.'},
      uk: {title:'A.T.L.A.S. — Конфігуратор польотного контролера', description:'A.T.L.A.S. — конфігуратор 1.2: USB/MAVLink, протокол Н.А.К.А.З, параметри, калібрування та OSD.'},
      en: {title:'A.T.L.A.S. — Flight Controller Configurator', description:'A.T.L.A.S. Configurator 1.2: USB/MAVLink, O.R.D.E.R protocol, parameters, calibration and OSD.'}
    },
    'faq.html': {
      ru: {title:'A.T.L.A.S. — Вопросы и ответы', description:'Ответы на вопросы об EKF3 NOAID, необходимых датчиках и изменённых режимах полёта A.T.L.A.S.'},
      uk: {title:'A.T.L.A.S. — Питання та відповіді', description:'Відповіді про EKF3 NOAID, необхідні датчики та змінені режими польоту A.T.L.A.S.'},
      en: {title:'A.T.L.A.S. — Questions & Answers', description:'Answers about EKF3 NOAID, required sensors and A.T.L.A.S. modified flight modes.'}
    },
    'changelog.html': {
      ru: {title:'A.T.L.A.S. — Список изменений', description:'История релизов A.T.L.A.S. и сравнение модифицированной прошивки с ArduPlane 4.7.2.'},
      uk: {title:'A.T.L.A.S. — Список змін', description:'Історія випусків A.T.L.A.S. та порівняння зміненої прошивки з ArduPlane 4.7.2.'},
      en: {title:'A.T.L.A.S. — Changelog', description:'A.T.L.A.S. release history and modifications compared with ArduPlane 4.7.2.'}
    },
    'privacy.html': {
      ru: {title:'A.T.L.A.S. — Конфиденциальность и подписки', description:'Как A.T.L.A.S. использует email и данные о полётном контроллере для добровольных рассылок прошивок и новостей.'},
      uk: {title:'A.T.L.A.S. — Конфіденційність і підписки', description:'Як A.T.L.A.S. використовує електронні адреси та дані про польотний контролер для добровільних розсилок.'},
      en: {title:'A.T.L.A.S. — Privacy & Subscriptions', description:'How A.T.L.A.S. uses subscriber emails and flight-controller selections for optional firmware news and updates.'}
    }
  };
  const pageName = document.head.querySelector('meta[name="atlas-page"]')?.content || location.pathname.split('/').pop() || 'index.html';
  const current = pages[pageName] || pages['index.html'];
  const getMeta = (selector, tag, attrs) => {
    let el = document.head.querySelector(selector);
    if (!el) { el = document.createElement(tag); for (const [k,v] of Object.entries(attrs)) el.setAttribute(k,v); document.head.append(el); }
    return el;
  };
  function update() {
    const lang = ['ru','uk','en'].includes(document.documentElement.lang) ? document.documentElement.lang : 'ru';
    const selected = current[lang];
    document.title = selected.title;
    getMeta('meta[name="description"]','meta',{name:'description'}).content=selected.description;
    getMeta('meta[property="og:title"]','meta',{property:'og:title'}).content=selected.title;
    getMeta('meta[property="og:description"]','meta',{property:'og:description'}).content=selected.description;
    // Browser-only localization: link preview crawlers read the static HTML above.
    getMeta('meta[name="twitter:title"]','meta',{name:'twitter:title'}).content=selected.title;
    getMeta('meta[name="twitter:description"]','meta',{name:'twitter:description'}).content=selected.description;
    getMeta('meta[property="og:locale"]','meta',{property:'og:locale'}).content=({ru:'ru_RU',uk:'uk_UA',en:'en_US'})[lang];
  }
  new MutationObserver(mutations=>{if(mutations.some(m=>m.attributeName==='lang')) update();})
    .observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('atlas:languagechange',update);
  window.addEventListener('atlas:language',update);
  // This also handles language set before scripts run and pages without a language selector.
  update();
  window.AtlasPageMeta={update};
})();
