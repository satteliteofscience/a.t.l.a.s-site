'use strict';
// AI-assisted; EKF3 delta reconstructed from the archived 1.1 patch and verified by Git blob hashes.
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
        "EKF3: подтверждение настоящего разгона",
        "При сильном продольном ускорении сохранялось ограничение горизонтального инерциального приращения до 5 м/с², которое могло задерживать рост оценки скорости.",
        "Ослабление ограничения теперь зависит от согласованного роста TAS и ускорения IMU. Цель — уменьшить отставание GSPD при реальном разгоне, сохранив ограничение при неподтверждённом импульсе. Это не прямое присваивание скорости из Пито."
      ],
      "uk": [
        "EKF3: підтвердження справжнього розгону",
        "При сильному поздовжньому прискоренні зберігалося обмеження горизонтального інерційного приросту до 5 м/с², що могло затримувати оцінку швидкості.",
        "Послаблення обмеження тепер залежить від узгодженого зростання TAS та прискорення IMU. Мета — зменшити відставання GSPD при реальному розгоні й зберегти обмеження для непідтвердженого імпульсу. Це не пряме присвоєння швидкості з Піто."
      ],
      "en": [
        "EKF3: corroborating real acceleration",
        "Strong forward acceleration could retain the 5 m/s² horizontal inertial-increment limit and delay estimated speed growth.",
        "Relaxation now depends on consistent TAS growth and IMU acceleration. The aim is less GSPD lag during real acceleration while retaining the limit for an uncorroborated impulse. This does not directly assign Pitot speed to the velocity state."
      ]
    },
    {
      "ru": [
        "EKF3: сравнение на одном временном окне",
        "У IMU и Пито разные частоты, задержки и интервалы измерения; один мгновенный отсчёт не описывает весь разгон.",
        "Добавлена история из 64 инерциальных отсчётов. Продольный импульс после компенсации гравитации интегрируется по перекрытию с физическим интервалом роста TAS. Требуется покрытие не менее 95% окна: сравниваются соответствующие интервалы, а не случайно соседние отсчёты."
      ],
      "uk": [
        "EKF3: порівняння в одному часовому вікні",
        "IMU та Піто мають різні частоти, затримки й інтервали; один миттєвий відлік не описує весь розгін.",
        "Додано історію з 64 інерційних відліків. Поздовжній імпульс після компенсації гравітації інтегрується за перекриттям із фізичним інтервалом зростання TAS. Потрібне покриття щонайменше 95% вікна."
      ],
      "en": [
        "EKF3: matching measurement windows",
        "IMU and Pitot samples have different rates, delays and integration periods; a single instant does not describe the acceleration interval.",
        "A 64-sample inertial history integrates gravity-corrected forward impulse over the actual TAS-growth interval. At least 95% window coverage is required, so matching intervals are compared rather than adjacent timestamps."
      ]
    },
    {
      "ru": [
        "EKF3: устойчивое подтверждение вместо одного пика",
        "Короткий всплеск ускорения и длительный разгон могли требовать различной реакции.",
        "Для оконного подтверждения нужны минимум два разных измерения TAS и согласованность во времени. Вес этой ветви плавно нарастает после 80 мс и достигает полного значения за следующие 40 мс; при нарушении условий подтверждение сбрасывается."
      ],
      "uk": [
        "EKF3: стале підтвердження замість одного піка",
        "Короткий сплеск прискорення та тривалий розгін потребують різної реакції.",
        "Для віконного підтвердження потрібні щонайменше два різні вимірювання TAS та узгодженість у часі. Вага цієї гілки плавно зростає після 80 мс до повної за наступні 40 мс; при порушенні умов підтвердження скидається."
      ],
      "en": [
        "EKF3: sustained confirmation instead of one spike",
        "A brief acceleration spike and sustained acceleration require different responses.",
        "Window-based confirmation requires at least two distinct TAS samples and temporal consistency. This branch ramps its weight after 80 ms to full weight over another 40 ms; inconsistent conditions reset confirmation."
      ]
    },
    {
      "ru": [
        "EKF3: согласованность нескольких акселерометров",
        "В инерциальном отсчёте не сохранялся отдельный признак разногласия продольного ускорения для этой проверки TAS.",
        "В NOAID после запуска сравниваются продольные ускорения активного и пригодных соседних датчиков. Расхождение свыше 3 м/с² или отсутствие пригодного сравнения блокирует подтверждение быстрого разгона этой ветвью. Общую одинаковую ошибку всех IMU такая проверка не обнаруживает."
      ],
      "uk": [
        "EKF3: узгодженість акселерометрів",
        "Інерційний відлік не зберігав окремої ознаки розбіжності поздовжнього прискорення для цієї перевірки TAS.",
        "У NOAID після запуску порівнюються активний і придатні сусідні датчики. Розбіжність понад 3 м/с² або відсутність придатного порівняння блокує підтвердження швидкого розгону цією гілкою. Спільну однакову помилку всіх IMU це не виявляє."
      ],
      "en": [
        "EKF3: accelerometer agreement",
        "The inertial sample did not carry a separate forward-acceleration disagreement flag for this TAS check.",
        "After launch in NOAID, the active accelerometer is compared with suitable peers. More than 3 m/s² disagreement or no suitable reference blocks this fast-acceleration corroboration path. A shared error across all IMUs remains undetectable by this check."
      ]
    },
    {
      "ru": [
        "EKF3: скорость изменения воздушной скорости",
        "В буфере TAS не было отдельных сырой и фильтрованной оценок роста для подтверждения разгона.",
        "Производная рассчитывается из разности EAS того же датчика с последующим масштабированием EAS2TAS. Так скачок оценки плотности не выдаётся за ускорение. Используются интервалы 10–250 мс, проверка правдоподобия до 35 м/с² и фильтр с постоянной 0,22 с."
      ],
      "uk": [
        "EKF3: темп зміни повітряної швидкості",
        "Буфер TAS не мав окремих сирої та фільтрованої оцінок зростання для підтвердження розгону.",
        "Похідна обчислюється з різниці EAS того самого датчика й масштабується EAS2TAS, щоб стрибок густини не трактувався як прискорення. Інтервали — 10–250 мс, перевірка правдоподібності — до 35 м/с², стала фільтра — 0,22 с."
      ],
      "en": [
        "EKF3: airspeed growth rate",
        "The TAS buffer had no separate raw and filtered growth estimates for acceleration corroboration.",
        "Rate is derived from EAS differences from the same sensor and then scaled by EAS2TAS, avoiding a density-estimate step being interpreted as acceleration. Uses 10–250 ms intervals, a 35 m/s² plausibility bound and a 0.22 s filter time constant."
      ]
    },
    {
      "ru": [
        "EKF3: условия применения быстрого подтверждения",
        "Одного высокого показания Пито недостаточно, чтобы доверять сильному инерциальному ускорению.",
        "Оконная ветвь требует свежих TAS и IMU, согласованных положительных ускорений более 3 м/с², достаточного покрытия окна и небольшой угловой скорости. При резком вращении, разногласии IMU, обвале давления или прерывании TAS она не подтверждает разгон."
      ],
      "uk": [
        "EKF3: умови швидкого підтвердження",
        "Одного високого показання Піто недостатньо для довіри до сильного інерційного прискорення.",
        "Віконна гілка потребує свіжих TAS та IMU, узгоджених додатних прискорень понад 3 м/с², покриття вікна й невеликої кутової швидкості. При різкому обертанні, розбіжності IMU, провалі тиску чи перериванні TAS вона не підтверджує розгін."
      ],
      "en": [
        "EKF3: fast-confirmation gates",
        "A high Pitot reading alone cannot corroborate strong inertial acceleration.",
        "The window path requires fresh TAS/IMU, consistent positive acceleration above 3 m/s², sufficient coverage and low angular rate. Rotation, IMU disagreement, pressure collapse or interrupted TAS prevent this path from confirming acceleration."
      ]
    },
    {
      "ru": [
        "EKF3: плавная высокоскоростная обработка TAS",
        "Направленная модель TAS уже существовала, но не имела этой дополнительной высокоскоростной обработки остатка.",
        "В диапазоне TAS 300–320 км/ч плавно вводится дополнительная дисперсия вдоль направления движения при большом продольном остатке. Цель — смягчить влияние ошибочного давления, сохранив боковую составляющую наблюдения. Это не жёсткий потолок скорости и не отключение всего TAS-слияния."
      ],
      "uk": [
        "EKF3: плавна обробка TAS на великій швидкості",
        "Напрямлена модель TAS уже існувала, але не мала цієї додаткової високошвидкісної обробки залишку.",
        "При TAS 300–320 км/год плавно вводиться додаткова дисперсія вздовж руху при великому поздовжньому залишку. Мета — пом’якшити вплив помилкового тиску зі збереженням бокової складової. Це не жорстка межа швидкості й не вимкнення всього TAS-злиття."
      ],
      "en": [
        "EKF3: smooth high-speed TAS treatment",
        "The directional TAS model existed, without this additional high-speed residual treatment.",
        "Between 300 and 320 km/h TAS, extra along-track variance is introduced smoothly for large forward residuals under the branch conditions. It aims to soften bad-pressure influence while retaining the lateral observation. It is neither a hard speed ceiling nor a complete TAS-fusion shutdown."
      ]
    },
    {
      "ru": [
        "EKF3: кратковременный обвал давления Пито",
        "Резкий спад давления мог попасть в NOAID-наблюдение скорости как физическое замедление.",
        "После высокого EAS свыше 65 м/с неправдоподобный быстрый спад отмечается отдельно. До 1,8 с исключается наблюдение, остающееся более чем на 8 м/с ниже предшествующего уровня. Это ограниченное окно проверки, а не постоянное игнорирование снижения скорости."
      ],
      "uk": [
        "EKF3: короткий провал тиску Піто",
        "Різкий спад тиску міг потрапити до NOAID-спостереження як фізичне гальмування.",
        "Після EAS понад 65 м/с неправдоподібний швидкий спад позначається окремо. До 1,8 с виключається спостереження більш ніж на 8 м/с нижче попереднього рівня. Це обмежене вікно перевірки, а не постійне ігнорування сповільнення."
      ],
      "en": [
        "EKF3: brief Pitot-pressure collapse",
        "An abrupt pressure drop could enter the NOAID velocity observation as real deceleration.",
        "Following EAS above 65 m/s, an implausibly fast drop is flagged separately. For up to 1.8 s, observations more than 8 m/s below the prior level are excluded. This is a bounded recheck window, not permanent rejection of deceleration."
      ]
    },
    {
      "ru": [
        "EKF3: возврат Пито после короткого разрыва",
        "Для пропуска измерений не было этой отдельной проверки правдоподобного возврата.",
        "Разрывы 250–2500 мс после высокого EAS проверяются относительно последнего уровня до пропуска. Возврат внутри физически ограниченного коридора проходит ускоренный переход весов; произвольный скачок использует обычную более долгую повторную проверку."
      ],
      "uk": [
        "EKF3: повернення Піто після короткого розриву",
        "Для пропуску вимірювань не було цієї окремої перевірки правдоподібного повернення.",
        "Розриви 250–2500 мс після високого EAS перевіряються відносно останнього рівня. Повернення в обмеженому коридорі проходить швидший перехід ваг; довільний стрибок — звичайну довшу повторну перевірку."
      ],
      "en": [
        "EKF3: Pitot return after a short gap",
        "Measurement gaps lacked this dedicated plausible-return check.",
        "Gaps of 250–2500 ms after high EAS are checked against the last pre-gap reading. Returns within a bounded corridor use a faster weighting transition; arbitrary steps use the normal longer recheck."
      ]
    },
    {
      "ru": [
        "EKF3: свежесть TAS на высокой скорости",
        "Общее окно пригодности TAS составляло до одной секунды.",
        "Для наблюдения скорости при TAS от 75 м/с дополнительно требуется поступление измерений не старше 350 мс. Для оконного подтверждения разгона используются ещё более строгие 250 мс: устаревшее высокое значение не должно подтверждать новый импульс."
      ],
      "uk": [
        "EKF3: свіжість TAS на великій швидкості",
        "Загальне вікно придатності TAS становило до секунди.",
        "Для спостереження швидкості при TAS від 75 м/с додатково потрібні вимірювання не старші 350 мс. Для віконного підтвердження розгону — суворіші 250 мс, щоб застаріле високе значення не підтверджувало новий імпульс."
      ],
      "en": [
        "EKF3: high-speed TAS freshness",
        "General TAS eligibility allowed an age of up to one second.",
        "At TAS of at least 75 m/s, the velocity observation additionally requires a sensor update within 350 ms. Window acceleration confirmation uses stricter 250 ms freshness so an old high reading cannot confirm a new impulse."
      ]
    },
    {
      "ru": [
        "EKF3: сброс истории при смене условий",
        "Новые истории темпа TAS и подтверждения ещё отсутствовали.",
        "При смене датчика, неподходящем интервале или отказе пригодности темп роста обнуляется. При выходе из нужного NOAID-контекста сбрасываются переходные состояния; инициализация явно очищает историю и счётчики, чтобы не перенести старое подтверждение на другой поток данных."
      ],
      "uk": [
        "EKF3: скидання історії при зміні умов",
        "Нових історій темпу TAS та підтвердження ще не було.",
        "При зміні датчика, непридатному інтервалі чи відмові придатності темп зростання обнуляється. Поза потрібним NOAID-контекстом скидаються перехідні стани; ініціалізація очищає історію та лічильники, щоб не перенести старе підтвердження на інший потік."
      ],
      "en": [
        "EKF3: resetting stale history",
        "The new TAS-rate and corroboration histories did not exist.",
        "Sensor changes, invalid timing or eligibility loss reset growth rate. Leaving the intended NOAID context resets transition state; initialization explicitly clears history and counters to avoid carrying old corroboration into a different stream."
      ]
    },
    {
      "ru": [
        "Границы этих изменений EKF3",
        "Якобиан направленного TAS-наблюдения, изменения ковариации и работа с bias уже описаны в 1.1.",
        "В 1.2 они не заявляются заново как новые исправления. Новая дельта относится к разгону, времени измерений и высокоскоростному Пито. Без внешней скорости остаются неопределённость ветра и ошибки GSPD; новые проверки не делают её независимым измерением относительно земли."
      ],
      "uk": [
        "Межі цих змін EKF3",
        "Якобіан напрямленого TAS, зміни коваріації та робота з bias вже описані у 1.1.",
        "У 1.2 вони не заявляються повторно як нові виправлення. Нова дельта стосується розгону, часу вимірювань і високошвидкісного Піто. Без зовнішньої швидкості залишаються невизначеність вітру та помилки GSPD; перевірки не роблять її незалежним наземним вимірюванням."
      ],
      "en": [
        "Scope of the EKF3 delta",
        "Directional TAS Jacobians, covariance changes and bias handling were already documented in 1.1.",
        "They are not reintroduced as new 1.2 fixes. The new delta concerns acceleration, measurement timing and high-speed Pitot handling. Without external velocity, wind ambiguity and GSPD errors remain; the checks do not provide an independent ground-velocity measurement."
      ]
    },
    {
      "ru": [
        "A.T.L.A.S с протоколом П.Р.И.К.А.З",
        "Отдельного общего переключателя ограничений не было.",
        "Добавлен O.R.D.E.R: единое разрешение ограничений крена, руля и тангажа в ARMED FBWA."
      ],
      "uk": [
        "A.T.L.A.S з протоколом Н.А.К.А.З",
        "Окремого спільного перемикача обмежень не було.",
        "Додано O.R.D.E.R: спільний дозвіл обмежень крену, керма та тангажу в ARMED FBWA."
      ],
      "en": [
        "A.T.L.A.S with the O.R.D.E.R protocol",
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
  ],
  "sources": [
    "libraries/AP_NavEKF3/AP_NavEKF3_Measurements.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3_PosVelFusion.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3_core.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3_core.h",
    "ArduPlane/Attitude.cpp",
    "ArduPlane/Parameters.cpp",
    "ArduPlane/Plane.h",
    "ArduPlane/mode_fbwa.cpp"
  ],
  "sourceLabel": {
    "ru": "Файлы подтверждённых изменений",
    "uk": "Файли підтверджених змін",
    "en": "Files containing verified changes"
  }
};
