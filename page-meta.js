/* A.T.L.A.S. page metadata, RU/UA/EN. Browser-tab text follows the selected interface language.
 * Social previews use the static HTML fallback: most crawlers do not execute JavaScript. */
(() => {
  'use strict';
  const pages = {
    'index.html': {
      ru: {title:'A.T.L.A.S. — экспериментальная прошивка ArduPlane и конфигуратор', description:'A.T.L.A.S. — модификация ArduPlane 4.7.2 с EKF3 NOAID, настройкой полётных контроллеров, каталогом прошивок и документацией.'},
      uk: {title:'A.T.L.A.S. — експериментальна прошивка ArduPlane та конфігуратор', description:'A.T.L.A.S. — модифікація ArduPlane 4.7.2 з EKF3 NOAID, налаштуванням польотних контролерів, каталогом прошивок і документацією.'},
      en: {title:'A.T.L.A.S. — Experimental ArduPlane Firmware & Configurator', description:'A.T.L.A.S. is a modified ArduPlane 4.7.2 project featuring EKF3 NOAID, flight-controller configuration, a firmware catalog and documentation.'}
    },
    'configurator.html': {
      ru: {title:'A.T.L.A.S. — Конфигуратор полётного контроллера', description:'A.T.L.A.S. Control Center: MAVLink, параметры ArduPlane, калибровка датчиков, настройка сервоприводов, OSD и прошивки.'},
      uk: {title:'A.T.L.A.S. — Конфігуратор польотного контролера', description:'A.T.L.A.S. Control Center: MAVLink, параметри ArduPlane, калібрування датчиків, сервоприводи, OSD та прошивки.'},
      en: {title:'A.T.L.A.S. — Flight Controller Configurator', description:'A.T.L.A.S. Control Center for MAVLink, ArduPlane parameters, sensor calibration, servo outputs, OSD and firmware management.'}
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
  // This also handles language set before scripts run and pages without a language selector.
  update();
  window.AtlasPageMeta={update};
})();
