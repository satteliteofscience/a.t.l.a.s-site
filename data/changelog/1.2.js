'use strict';
// AI-assisted: documented 1.1 baseline, subsequent site commits and preserved firmware patches.
window.AtlasRelease12 = {
  "version": "1.2",
  "id": "release-1-2",
  "channel": "UPDATE",
  "baseLabel": {
    "ru": "В версии 1.1",
    "uk": "У версії 1.1",
    "en": "In version 1.1"
  },
  "modLabel": {
    "ru": "В версии 1.2",
    "uk": "У версії 1.2",
    "en": "In version 1.2"
  },
  "hint": {
    "ru": "Изменения относительно описанной версии 1.1. Ограничения задают команду, а не гарантируют физический угол. Наличие записи не означает публикацию всех бинарных сборок.",
    "uk": "Зміни відносно описаної версії 1.1. Обмеження задають команду, а не гарантують фізичний кут. Запис не означає публікацію всіх бінарних збірок.",
    "en": "Changes relative to documented 1.1. Limits constrain demands, not guaranteed physical angles. This entry does not imply availability of every binary build."
  },
  "changes": [
    {
      "ru": [
        "Протокол П.Р.И.К.А.З",
        "Отдельного общего переключателя ограничений не было.",
        "Добавлен O.R.D.E.R: единое разрешение ограничений крена, руля и тангажа в ARMED FBWA."
      ],
      "uk": [
        "Протокол Н.А.К.А.З",
        "Окремого спільного перемикача обмежень не було.",
        "Додано O.R.D.E.R: спільний дозвіл обмежень крену, керма та тангажу в ARMED FBWA."
      ],
      "en": [
        "O.R.D.E.R protocol",
        "There was no shared activation switch for these limits.",
        "Adds a shared enable for bank, rudder and pitch limits in ARMED FBWA."
      ]
    },
    {
      "ru": [
        "Три режима активации",
        "Ограничение руля включалось собственным параметром.",
        "ORDER_MODE: 0 — обход протокола, 1 — RC-переключатель, 2 — включение настройкой без дополнительной команды."
      ],
      "uk": [
        "Три режими активації",
        "Обмеження керма вмикалося власним параметром.",
        "ORDER_MODE: 0 — обхід протоколу, 1 — RC-перемикач, 2 — увімкнення налаштуванням без додаткової команди."
      ],
      "en": [
        "Three activation modes",
        "The rudder limit used its own enable parameter.",
        "ORDER_MODE: 0 bypasses the protocol, 1 uses an RC switch, 2 enables by configuration without another command."
      ]
    },
    {
      "ru": [
        "RC без подбора диапазона",
        "Общего RC-включения протокола не было.",
        "ORDER_RC_CH выбирает вход 1–16: HIGH включает после 200 мс, LOW/центр выключают. Проверены 994/1995 и каналы 13–16 в SITL; основные каналы управления исключены."
      ],
      "uk": [
        "RC без добору діапазону",
        "Спільного RC-вмикання протоколу не було.",
        "ORDER_RC_CH обирає вхід 1–16: HIGH вмикає після 200 мс, LOW/центр вимикають. Перевірено 994/1995 та канали 13–16 у SITL; основні канали керування виключені."
      ],
      "en": [
        "Simple RC switching",
        "There was no shared RC activation path.",
        "ORDER_RC_CH selects input 1–16: HIGH enables after 200 ms; LOW/centre disable. SITL checks cover 994/1995 and channels 13–16; primary flight-control channels are excluded."
      ]
    },
    {
      "ru": [
        "Отдельный базовый предел крена",
        "FBWA использовал обычный ROLL_LIMIT_DEG.",
        "ORDER_RLL_LIM, 0–90°: ненулевое значение временно заменяет базовый предел. Пример: 10° базы + 20° RUD_LIMIT_DEG дают до 30° команды с учётом аэродинамических ограничений."
      ],
      "uk": [
        "Окрема базова межа крену",
        "FBWA використовував звичайний ROLL_LIMIT_DEG.",
        "ORDER_RLL_LIM, 0–90°: ненульове значення тимчасово замінює базову межу. Приклад: 10° бази + 20° RUD_LIMIT_DEG дають до 30° команди з урахуванням аеродинамічних обмежень."
      ],
      "en": [
        "Independent base bank limit",
        "FBWA used the normal ROLL_LIMIT_DEG.",
        "ORDER_RLL_LIM, 0–90°, temporarily replaces the base limit when nonzero. A 10° base plus 20° RUD_LIMIT_DEG allows up to a 30° demand, subject to aerodynamic limits."
      ]
    },
    {
      "ru": [
        "Независимые границы тангажа",
        "Отдельных границ протокола не было.",
        "ORDER_PIT_MIN/MAX ограничивают итоговую команду после trim и добавки газа. Нижняя и верхняя границы независимы; штатный flare сохраняет приоритет."
      ],
      "uk": [
        "Незалежні межі тангажу",
        "Окремих меж протоколу не було.",
        "ORDER_PIT_MIN/MAX обмежують підсумкову команду після trim та додатка газу. Нижня й верхня межі незалежні; штатний flare зберігає пріоритет."
      ],
      "en": [
        "Independent pitch boundaries",
        "There were no protocol-specific pitch boundaries.",
        "ORDER_PIT_MIN/MAX constrain final demand after trim and throttle additions. Each boundary is independent; normal flare retains priority."
      ]
    },
    {
      "ru": [
        "Полный обход нулевых ветвей",
        "При RUD_LIMIT_DEG=0 описывался возврат к старой ветке RUD_RLL_ADD.",
        "Теперь нулевая добавка полностью обходит экспериментальную обработку руля, включая старую ветку и торможение. Нулевые пределы крена/тангажа независимо обходятся; все нули исключают вмешательство протокола."
      ],
      "uk": [
        "Повний обхід нульових гілок",
        "При RUD_LIMIT_DEG=0 описувалося повернення до старої гілки RUD_RLL_ADD.",
        "Тепер нульовий додаток повністю обходить експериментальну обробку керма, включно зі старою гілкою та гальмуванням. Нульові межі крену/тангажу обходяться незалежно; усі нулі виключають втручання протоколу."
      ],
      "en": [
        "Complete zero-branch bypass",
        "RUD_LIMIT_DEG=0 was documented as falling back to legacy RUD_RLL_ADD.",
        "Zero now bypasses experimental rudder processing, including the legacy path and braking. Zero bank/pitch boundaries bypass independently; all-zero limits prevent protocol intervention."
      ]
    },
    {
      "ru": [
        "Дополнительное торможение крена",
        "Отдельного RUD_BRK_EN не было.",
        "RUD_BRK_EN включает дополнительную обратную связь по скорости крена только при активном протоколе и RUD_LIMIT_DEG>0. По умолчанию выключено; это не физический барьер угла."
      ],
      "uk": [
        "Додаткове гальмування крену",
        "Окремого RUD_BRK_EN не було.",
        "RUD_BRK_EN вмикає додатковий зворотний зв’язок за швидкістю крену лише при активному протоколі та RUD_LIMIT_DEG>0. Типово вимкнено; це не фізичний бар’єр кута."
      ],
      "en": [
        "Optional bank braking",
        "There was no separate RUD_BRK_EN.",
        "RUD_BRK_EN adds roll-rate feedback only with an active protocol and RUD_LIMIT_DEG>0. Disabled by default; it is not a physical bank-angle barrier."
      ]
    },
    {
      "ru": [
        "Сообщения и текущие углы",
        "Не было сообщений состояния общего протокола.",
        "ACTIVATED/DEACTIVATED отправляются однократно. Пока ограничения активны, INFO-сообщения с текущими креном и тангажом идут примерно раз в секунду; после отключения поток прекращается. Добавлены ORDER_ON/ORDER_PWM и запись ORDR в BIN."
      ],
      "uk": [
        "Повідомлення та поточні кути",
        "Повідомлень стану спільного протоколу не було.",
        "ACTIVATED/DEACTIVATED надсилаються одноразово. Поки обмеження активні, INFO з поточними креном і тангажем надходять приблизно щосекунди; після вимкнення потік припиняється. Додано ORDER_ON/ORDER_PWM та запис ORDR у BIN."
      ],
      "en": [
        "Status and live angles",
        "There were no shared-protocol status messages.",
        "ACTIVATED/DEACTIVATED are one-shot notifications. Active limits stream current roll/pitch as INFO approximately once per second; deactivation stops the stream. Adds ORDER_ON/ORDER_PWM and ORDR BIN logging."
      ]
    },
    {
      "ru": [
        "Имена и сохранённые настройки",
        "Протокола с текущими именами не было.",
        "Промежуточное C.A.P.R.I переименовано в O.R.D.E.R. Индексы хранения сохранены; миграция EEPROM проверена двумя запусками SITL. В старых текстовых .param нужен префикс ORDER_ вместо CAPRI_."
      ],
      "uk": [
        "Назви та збережені налаштування",
        "Протоколу з поточними назвами не було.",
        "Проміжне C.A.P.R.I перейменовано на O.R.D.E.R. Індекси зберігання збережені; міграцію EEPROM перевірено двома запусками SITL. У старих текстових .param потрібен ORDER_ замість CAPRI_."
      ],
      "en": [
        "Names and stored settings",
        "The current protocol names did not exist.",
        "The intermediate C.A.P.R.I name becomes O.R.D.E.R. Storage indices are preserved and EEPROM migration was tested across two SITL boots. Old text .param files need ORDER_ instead of CAPRI_."
      ]
    },
    {
      "ru": [
        "Конфигуратор и Mission Planner",
        "Не было отдельной панели общего протокола.",
        "Добавлены категория, подтверждённая запись включения, индикация фактического состояния и свежих углов AHRS. Названия: П.Р.И.К.А.З / Н.А.К.А.З / O.R.D.E.R. Категория Mission Planner содержит семь действующих настроек."
      ],
      "uk": [
        "Конфігуратор і Mission Planner",
        "Окремої панелі спільного протоколу не було.",
        "Додано категорію, підтверджений запис увімкнення, індикацію фактичного стану та свіжих кутів AHRS. Назви: П.Р.И.К.А.З / Н.А.К.А.З / O.R.D.E.R. Категорія Mission Planner містить сім чинних налаштувань."
      ],
      "en": [
        "Configurator and Mission Planner",
        "There was no shared-protocol dashboard.",
        "Adds a category, acknowledged activation writes, actual-state indication and fresh AHRS angles. Names are localized as П.Р.И.К.А.З / Н.А.К.А.З / O.R.D.E.R. The Mission Planner category contains seven active settings."
      ]
    },
    {
      "ru": [
        "Чтение параметров по USB",
        "После изменений обнаруживалось зависание загрузки параметров.",
        "Исправлены чтение и резервный MAVLink-путь при проблемах MAVFTP. Проверены прерывание чтения/записи и повторное сравнение параметров после возврата USB."
      ],
      "uk": [
        "Читання параметрів через USB",
        "Після змін виявлялося зависання завантаження параметрів.",
        "Виправлено читання та резервний MAVLink-шлях при проблемах MAVFTP. Перевірено переривання читання/запису й повторне порівняння після повернення USB."
      ],
      "en": [
        "USB parameter loading",
        "Parameter downloads could stall after earlier changes.",
        "Fixes loading and MAVLink fallback when MAVFTP fails. Checks cover interrupted reads/writes and parameter reconciliation after USB reconnect."
      ]
    },
    {
      "ru": [
        "Калибровка компаса с батареей",
        "Кнопка мастера могла зависеть от заблокированной вложенной кнопки.",
        "Общая проверка готовности, повтор после отказа, отключение USB только после подтверждения запуска и корректная обработка принятой/отклонённой отмены. Физическое питание USB сайт не отключает."
      ],
      "uk": [
        "Калібрування компаса з батареєю",
        "Кнопка майстра могла залежати від заблокованої вкладеної кнопки.",
        "Спільна перевірка готовності, повтор після відмови, від’єднання USB лише після підтвердження запуску та коректна обробка прийнятого/відхиленого скасування. Фізичне живлення USB сайт не вимикає."
      ],
      "en": [
        "Battery-powered compass calibration",
        "The wizard could depend on a disabled nested button.",
        "Shares readiness checks, permits retry after rejection, releases the USB connection only after confirmed start and handles accepted/rejected cancellation correctly. The site does not remove physical USB power."
      ]
    },
    {
      "ru": [
        "Локализация вкладок браузера",
        "Название вкладки могло оставаться английским после смены языка.",
        "Исправлено обновление локализованного названия страницы при переключении RU/UK/EN."
      ],
      "uk": [
        "Локалізація вкладок браузера",
        "Назва вкладки могла залишатися англійською після зміни мови.",
        "Виправлено оновлення локалізованої назви сторінки при перемиканні RU/UK/EN."
      ],
      "en": [
        "Browser-tab localization",
        "The tab title could remain English after switching languages.",
        "Updates the localized page title when switching RU/UK/EN."
      ]
    }
  ]
};
