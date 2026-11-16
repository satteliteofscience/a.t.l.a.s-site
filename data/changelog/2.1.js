'use strict';
// AI-assisted; verified 2.1 changes relative to 2.0, with hardware-validation limits.
window.AtlasRelease21 = {
  "version": "2.1",
  "id": "release-2-1",
  "channel": "UPDATE",
  "baseLabel": {
    "ru": "В версии 2.0",
    "uk": "У версії 2.0",
    "en": "In version 2.0"
  },
  "modLabel": {
    "ru": "В версии 2.1",
    "uk": "У версії 2.1",
    "en": "In version 2.1"
  },
  "hint": {
    "ru": "Обновление относительно 2.0: переходы AHRS, завершение полётного цикла TAS после посадки и DISARM, повторный запуск и звуковые уведомления. Новых параметров нет. Проверено в SITL на модели 7,2 кг; стендовая и лётная проверка этой версии на реальном самолёте ещё предстоит. Доступность HEX определяется каталогом сборок каждой платы.",
    "uk": "Оновлення відносно 2.0: переходи AHRS, завершення польотного циклу TAS після посадки та DISARM, повторний запуск і звукові сповіщення. Нових параметрів немає. Перевірено в SITL на моделі 7,2 кг; стендова й льотна перевірка цієї версії на реальному літаку ще попереду. Наявність HEX визначає каталог збірок кожної плати.",
    "en": "Changes from 2.0: AHRS transitions, ending the TAS flight cycle after landing and DISARM, relaunch and sound notifications. No new parameters. Tested in SITL on the 7.2 kg model; bench and flight validation of this version on real hardware is still pending. HEX availability is shown separately for each board in the build catalogue."
  },
  "changes": [
    {
      "ru": [
        "AHRS: потеря GPS без лишнего перехода на DCM",
        "Когда GPS пропадал или EKF3 отвергал его координаты, пока приёмник ещё держал фикс, AHRS мог на короткое время уйти на DCM. DCM брал координаты приёмника без проверки, и при скачке координат позиция на карте повторяла этот скачок.",
        "Во время автоматического перехода между источниками (EK3_NOAID_AUTO) исправный EKF3 остаётся основным AHRS, пока переход не завершится. Проверки пригодности действуют как прежде: если EKF3 теряет пригодную ориентацию или высоту, AHRS по-прежнему уходит на DCM. В SITL на модели 7,2 кг при скачке координат GPS на 100 м AHRS остался на EKF3, а ошибка позиции осталась в пределах нескольких метров и не повторила скачок."
      ],
      "uk": [
        "AHRS: втрата GPS без зайвого переходу на DCM",
        "Коли GPS зникав або EKF3 відхиляв його координати, поки приймач ще тримав фікс, AHRS міг на короткий час піти на DCM. DCM брав координати приймача без перевірки, і при стрибку координат позиція на карті повторювала цей стрибок.",
        "Під час автоматичного переходу між джерелами (EK3_NOAID_AUTO) справний EKF3 лишається основним AHRS, доки перехід не завершиться. Перевірки придатності діють як раніше: якщо EKF3 втрачає придатну орієнтацію або висоту, AHRS, як і раніше, переходить на DCM. У SITL на моделі 7,2 кг при стрибку координат GPS на 100 м AHRS залишився на EKF3, а похибка позиції лишилася в межах кількох метрів і не повторила стрибок."
      ],
      "en": [
        "AHRS: GPS loss without a needless fall back to DCM",
        "When the GPS disappeared or EKF3 rejected its coordinates while the receiver still held a fix, the AHRS could briefly switch to DCM. DCM took the receiver coordinates unchecked, so after a coordinate jump the map position repeated the jump.",
        "During the automatic source-set transition (EK3_NOAID_AUTO) a healthy EKF3 stays the active AHRS until the transition ends. The health checks apply as before: if EKF3 loses a valid attitude or height, the AHRS still falls back to DCM. In SITL on the 7.2 kg model, with a 100 m GPS coordinate jump, the AHRS stayed on EKF3 and the position error stayed within a few metres instead of repeating the jump."
      ]
    },
    {
      "ru": [
        "EKF3: позиция после посадки и DISARM",
        "После посадки и DISARM наземное удержание EKF3 опиралось на старую опорную точку. Позиция EKF3 могла скачком уйти в начало координат (в SITL на модели 7,2 кг ошибка позиции доходила до нескольких километров), и AHRS на мгновение переключался на DCM.",
        "При DISARM после посадки (NoAID, без GPS-помощи) наземное удержание опирается на текущую позицию. Позиция остаётся на месте, лишнего перехода на DCM нет. Привязка позиции к неподвижному состоянию не применяется, пока аппарат сообщает о полёте."
      ],
      "uk": [
        "EKF3: позиція після посадки та DISARM",
        "Після посадки та DISARM наземне утримання EKF3 спиралося на стару опорну точку. Позиція EKF3 могла стрибком піти на початок координат (у SITL на моделі 7,2 кг похибка позиції сягала кількох кілометрів), і AHRS на мить перемикався на DCM.",
        "Під час DISARM після посадки (NoAID, без GPS-допомоги) наземне утримання спирається на поточну позицію. Позиція лишається на місці, зайвого переходу на DCM немає. Прив’язка позиції до нерухомого стану не застосовується, поки апарат повідомляє про політ."
      ],
      "en": [
        "EKF3: position after landing and DISARM",
        "After landing and DISARM, the EKF3 ground hold relied on an old reference point. The EKF3 position could jump back to the origin (in SITL on the 7.2 kg model the position error reached several kilometres) and the AHRS briefly switched to DCM.",
        "On a DISARM after landing (NoAID, no GPS aiding) the ground hold relies on the current position. The position stays where it is and there is no needless fall back to DCM. Stationary position anchoring is not applied while the vehicle reports that it is flying."
      ]
    },
    {
      "ru": [
        "EKF3: наземная проверка после DISARM",
        "После DISARM на земле проверка пригодности EKF3 могла использовать устаревшие данные, оставшиеся с наземной фазы перед стартом, и на одно мгновение признать фильтр непригодным. AHRS при этом на один отсчёт уходил на DCM.",
        "При DISARM после посадки эти устаревшие данные сбрасываются, и следующее наземное наблюдение их обновляет. Мгновенного перехода AHRS на DCM при DISARM в проверенных SITL-полётах больше нет."
      ],
      "uk": [
        "EKF3: наземна перевірка після DISARM",
        "Після DISARM на землі перевірка придатності EKF3 могла використовувати застарілі дані, що лишилися з наземної фази перед стартом, і на одну мить визнати фільтр непридатним. AHRS при цьому на один відлік переходив на DCM.",
        "Під час DISARM після посадки ці застарілі дані скидаються, а наступне наземне спостереження їх оновлює. Миттєвого переходу AHRS на DCM при DISARM у перевірених SITL-польотах більше немає."
      ],
      "en": [
        "EKF3: ground check after DISARM",
        "After a DISARM on the ground the EKF3 health check could use stale data left from the pre-launch ground phase and for an instant declare the filter unhealthy. The AHRS then switched to DCM for one sample.",
        "On a DISARM after landing this stale data is cleared and the next ground observation renews it. In the checked SITL flights the instant switch of the AHRS to DCM at DISARM no longer occurs."
      ]
    },
    {
      "ru": [
        "Завершение TAS после ручной посадки в FBWA",
        "В NoAID полётная модель TAS могла продолжать работать после фактической остановки до DISARM. Ошибка скорости продолжала перемещать значок самолёта.",
        "Добавлено наземное завершение цикла TAS до DISARM при посадке в FBWA и в финальной фазе автоматической посадки. Для FBWA используется высота относительно HOME, для автоматической посадки — относительно её точки. Допуск по высоте составляет 3 м; газ должен быть убран, а аппарат — сообщать, что уже не летит."
      ],
      "uk": [
        "Завершення TAS після ручної посадки у FBWA",
        "У NoAID польотна модель TAS могла продовжувати працювати після фактичної зупинки до DISARM. Похибка швидкості продовжувала пересувати значок літака.",
        "Додано наземне завершення циклу TAS до DISARM під час посадки у FBWA та у фінальній фазі автоматичної посадки. Для FBWA використовується висота відносно HOME, для автоматичної посадки — відносно її точки. Допуск висоти становить 3 м; газ має бути прибраний, а апарат — повідомляти, що вже не летить."
      ],
      "en": [
        "Ending TAS after a manual FBWA landing",
        "In NoAID the TAS flight model could remain active after the aircraft had stopped, until DISARM. Velocity error kept moving the aircraft marker.",
        "The TAS cycle can now end on the ground before DISARM after an FBWA landing or in the final stage of an automatic landing. FBWA uses height relative to HOME; an automatic landing uses its landing point. The height tolerance is 3 m, throttle must be low, and the vehicle must report that it is no longer flying."
      ]
    },
    {
      "ru": [
        "Посадочный удар не считается неподвижностью",
        "Одного малого значения скорости или спокойного отсчёта IMU недостаточно: так можно принять за остановку низкий пролёт, касание или короткую паузу между ударами.",
        "Наземное удержание требует непрерывного спокойного участка IMU и барометрической высоты, малой вертикальной скорости и исправных используемых данных. Во время полёта и при незавершённом кандидате запуска закрытие запрещено. Пито не является отдельным обязательным условием этого закрытия."
      ],
      "uk": [
        "Посадковий удар не вважається нерухомістю",
        "Одного малого значення швидкості або спокійного відліку IMU недостатньо: так можна прийняти за зупинку низький проліт, дотик або коротку паузу між ударами.",
        "Наземне утримання потребує безперервної спокійної ділянки IMU та барометричної висоти, малої вертикальної швидкості й справних даних. Під час польоту та за незавершеного кандидата запуску закриття заборонено. Піто не є окремою обов’язковою умовою цього закриття."
      ],
      "en": [
        "A touchdown impact is not a stationary aircraft",
        "A single low speed or quiet IMU sample cannot distinguish a stop from a low pass, a touchdown or a short pause between impacts.",
        "Ground hold requires a continuous quiet interval of IMU and barometric height data, low vertical speed and healthy input data. Closure is blocked while the vehicle reports flight or a launch candidate is pending. Pitot speed is not a separate mandatory condition for this closure."
      ]
    },
    {
      "ru": [
        "Дополнительная защита низкого пролёта в FBWA",
        "В испытании ровный низкий пролёт мог одновременно дать спокойные IMU и ложное «не летит». Этих признаков для ручной посадки оказалось недостаточно.",
        "Для первого наземного закрытия в FBWA дополнительно требуется недавнее подтверждённое торможение в посадочной области. Новый разгон сбрасывает это подтверждение. Два низких захода с продолжением полёта и уходом на следующий круг включены в контрольный сценарий."
      ],
      "uk": [
        "Додатковий захист низького прольоту у FBWA",
        "У випробуванні рівний низький проліт міг одночасно дати спокійні IMU та хибне «не летить». Цих ознак для ручної посадки виявилося недостатньо.",
        "Для першого наземного закриття у FBWA додатково потрібне недавнє підтверджене гальмування в посадковій області. Нове прискорення скидає це підтвердження. Два низькі заходи з продовженням польоту й виходом на наступне коло включено до контрольного сценарію."
      ],
      "en": [
        "Additional protection for low FBWA passes",
        "In testing, a smooth low pass could produce both quiet IMUs and a false not-flying indication. These signs alone were insufficient for a manual landing.",
        "The first FBWA ground closure additionally requires recent confirmed deceleration in the landing region. Renewed acceleration clears that evidence. Two low approaches followed by continued flight and another circuit are included in the regression scenario."
      ]
    },
    {
      "ru": [
        "Удержание текущей позиции после остановки",
        "Накопленная ошибка горизонтальной скорости могла продолжать уводить позицию, хотя модель уже лежала на земле.",
        "При подтверждённом наземном удержании завершается TAS и закрепляется текущая оценённая горизонтальная позиция. Удержание прекращает дальнейший дрейф; ранее накопленную ошибку координат оно не исправляет. Ориентация, bias и вертикальные состояния этим сбросом не обнуляются; прежняя неопределённость позиции сохраняется."
      ],
      "uk": [
        "Утримання поточної позиції після зупинки",
        "Накопичена похибка горизонтальної швидкості могла продовжувати зсувати позицію, хоча модель уже лежала на землі.",
        "За підтвердженого наземного утримання завершується TAS і фіксується поточна оцінена горизонтальна позиція. Утримання припиняє подальший дрейф; попередню похибку координат воно не виправляє. Орієнтація, bias та вертикальні стани цим скиданням не обнуляються; попередня невизначеність позиції зберігається."
      ],
      "en": [
        "Holding the current position after stopping",
        "Accumulated horizontal velocity error could keep moving the position even while the model was already stationary on the ground.",
        "Confirmed ground hold ends TAS and anchors the current estimated horizontal position. It stops further drift; it does not correct accumulated coordinate error. This reset does not zero attitude, bias or vertical states, and retains the previous position uncertainty."
      ]
    },
    {
      "ru": [
        "Движение снимает удержание, но не подтверждает взлёт",
        "Освобождение наземного удержания можно было ошибочно принять за разрешение сразу использовать прежнюю полётную модель.",
        "Движение или потеря условий спокойствия снимают удержание позиции. Модель TAS остаётся закрытой до нового подтверждения запуска по IMU. Одна продувка Пито, смена режима или ARM не восстанавливают прошлый цикл; при подтверждённом повторном запуске начинается новый."
      ],
      "uk": [
        "Рух знімає утримання, але не підтверджує зліт",
        "Звільнення наземного утримання можна було помилково сприйняти як дозвіл одразу використовувати попередню польотну модель.",
        "Рух або втрата умов спокою знімають утримання позиції. Модель TAS залишається закритою до нового підтвердження запуску за IMU. Одна продувка Піто, зміна режиму або ARM не відновлюють минулий цикл; за підтвердженого повторного запуску починається новий."
      ],
      "en": [
        "Motion releases hold without confirming takeoff",
        "Releasing ground hold could be mistaken for permission to immediately reuse the previous flight model.",
        "Motion or loss of quiet conditions suspends position hold. TAS remains closed until a fresh launch is confirmed by IMU motion. Pitot blowing alone, a mode change or ARM does not restore the old cycle; a confirmed relaunch begins a new one."
      ]
    },
    {
      "ru": [
        "DISARM обязательно завершает цикл TAS",
        "Если условия наземного удержания не выполнялись, например из-за несовпадения барометрической высоты с точкой посадки, полагаться только на посадочный детектор было недостаточно.",
        "Каждый DISARM сбрасывает цикл TAS, незавершённый кандидат запуска и историю подтверждения ускорения. После нового ARM требуется новое окно подтверждения запуска. Закрытие TAS не означает разрешения фиксировать неподвижную позицию, пока аппарат сообщает о полёте."
      ],
      "uk": [
        "DISARM обов’язково завершує цикл TAS",
        "Якщо умови наземного утримання не виконувалися, наприклад через невідповідність барометричної висоти точці посадки, покладатися лише на посадковий детектор було недостатньо.",
        "Кожен DISARM скидає цикл TAS, незавершеного кандидата запуску та історію підтвердження прискорення. Після нового ARM потрібне нове вікно підтвердження запуску. Закриття TAS не дозволяє фіксувати нерухому позицію, поки апарат повідомляє про політ."
      ],
      "en": [
        "DISARM always ends the TAS cycle",
        "If ground-hold conditions were not met, for example because barometric height differed from the landing reference, relying on the landing detector alone was insufficient.",
        "Every DISARM clears the TAS cycle, any pending launch candidate and acceleration-confirmation history. A new ARM requires a fresh launch-confirmation window. Closing TAS does not permit stationary position anchoring while the vehicle still reports flight."
      ]
    },
    {
      "ru": [
        "Диагностика наземного цикла по MAVLink и в логе",
        "Без отдельных признаков было трудно отличить остановку модели TAS от освобождения удержания и от нового подтверждённого запуска.",
        "Добавлены сообщения о наземном удержании, его снятии, сбросе TAS при DISARM и начале нового полётного цикла. Посадочный признак передаётся в слой данных EKF и записывается для воспроизведения. Сообщения относятся к состоянию алгоритма, а не к независимому измерению движения самолёта."
      ],
      "uk": [
        "Діагностика наземного циклу через MAVLink і лог",
        "Без окремих ознак було складно відрізнити зупинку моделі TAS від зняття утримання та від нового підтвердженого запуску.",
        "Додано повідомлення про наземне утримання, його зняття, скидання TAS під час DISARM і початок нового польотного циклу. Посадкова ознака передається до шару даних EKF та записується для відтворення. Повідомлення стосуються стану алгоритму, а не незалежного вимірювання руху літака."
      ],
      "en": [
        "Ground-cycle diagnostics in MAVLink and logs",
        "Without separate indications it was difficult to distinguish closing TAS from releasing position hold and from a newly confirmed launch.",
        "Messages now identify ground hold, release, the DISARM TAS reset and a new flight cycle. The landing indication is passed through the EKF data layer and recorded for replay. These messages describe algorithm state rather than an independent measurement of aircraft motion."
      ]
    },
    {
      "ru": [
        "Исправлен пропадавший звук изменения параметров",
        "Мелодия подтверждения изменения параметра содержала темп, который выходил за диапазон используемого обработчика. Уведомление могло вообще не воспроизводиться.",
        "Для короткого подтверждения выбран поддерживаемый темп и слышимый тон. Исправляется программная причина отсутствия этого звука; неисправность проводов, питания или самого зумера такое изменение не устраняет."
      ],
      "uk": [
        "Виправлено зниклий звук зміни параметрів",
        "Мелодія підтвердження зміни параметра містила темп поза діапазоном використаного обробника. Сповіщення могло взагалі не відтворюватися.",
        "Для короткого підтвердження обрано підтримуваний темп і чутний тон. Усунуто програмну причину відсутності цього звуку; несправність проводів, живлення або самого зумера ця зміна не усуває."
      ],
      "en": [
        "Restored the missing parameter-change sound",
        "The parameter-change confirmation used a tempo outside the range supported by the tone parser. The notification could fail to play entirely.",
        "The short confirmation now uses a supported tempo and an audible tone. This addresses the software cause of the missing sound; it does not repair faulty wiring, power or buzzer hardware."
      ]
    },
    {
      "ru": [
        "Более слышимые короткие сервисные сигналы",
        "Часть коротких сигналов, в том числе шага калибровки акселерометра, использовала слишком высокий тон и могла быть плохо слышна на внешнем зумере.",
        "Снижены частоты коротких сигналов изменения и сохранения настроек, загрузки миссии и шагов калибровки. Стартовая мелодия и мелодии успешной калибровки сохранены. Электрический режим и полярность выхода зумера этой правкой не меняются."
      ],
      "uk": [
        "Краще чутні короткі сервісні сигнали",
        "Частина коротких сигналів, зокрема кроку калібрування акселерометра, мала надто високий тон і могла бути погано чутною на зовнішньому зумері.",
        "Знижено частоти коротких сигналів зміни та збереження налаштувань, завантаження місії й кроків калібрування. Стартову мелодію та мелодії успішного калібрування збережено. Електричний режим і полярність виходу зумера ця правка не змінює."
      ],
      "en": [
        "More audible short service tones",
        "Some short signals, including accelerometer calibration steps, used a very high pitch and could be difficult to hear on an external buzzer.",
        "Short feedback for changing and saving settings, uploading a mission and calibration steps now uses lower pitches. Startup and successful-calibration melodies are preserved. This change does not alter buzzer output polarity or its electrical mode."
      ]
    },
    {
      "ru": [
        "Проверки 2.1 и границы подтверждённого результата",
        "Успешное завершение короткого сценария не проверяло повторный старт, уходы на другой круг и длительную неподвижность до DISARM.",
        "Контрольный SITL включает часовой полёт, тяжёлые манёвры, два низких захода без посадки, остановку до DISARM и повторный запуск. Отдельно проверен DISARM при невыполнении высотного допуска. Это проверка алгоритма на модели, а не подтверждение реальной аэродинамики или точности GSPD на экстремальной скорости: высокоскоростной канал воздушной скорости SITL требует отдельной проверки."
      ],
      "uk": [
        "Перевірки 2.1 і межі підтвердженого результату",
        "Успішне завершення короткого сценарію не перевіряло повторний старт, виходи на наступне коло та тривалу нерухомість до DISARM.",
        "Контрольний SITL містить годинний політ, важкі маневри, два низькі заходи без посадки, зупинку до DISARM і повторний запуск. Окремо перевірено DISARM за невиконання допуску висоти. Це перевірка алгоритму на моделі, а не підтвердження реальної аеродинаміки або точності GSPD на екстремальній швидкості: високошвидкісний канал повітряної швидкості SITL потребує окремої перевірки."
      ],
      "en": [
        "2.1 validation and its limits",
        "Completing a short scenario did not test relaunch, aborted approaches or a long stationary interval before DISARM.",
        "The control SITL run includes an hour-long flight, heavy manoeuvres, two low approaches without landing, a stop before DISARM and relaunch. DISARM outside the landing-height tolerance was checked separately. This validates model behaviour, not real aerodynamics or extreme-speed GSPD accuracy: the high-speed SITL airspeed channel needs a separate check."
      ]
    }
  ],
  "sources": [
    "ArduPlane/Plane.cpp",
    "ArduPlane/Plane.h",
    "libraries/AP_AHRS/AP_AHRS.cpp",
    "libraries/AP_AHRS/AP_AHRS.h",
    "libraries/AP_DAL/AP_DAL.cpp",
    "libraries/AP_DAL/AP_DAL.h",
    "libraries/AP_DAL/LogStructure.h",
    "libraries/AP_NavEKF3/AP_NavEKF3_Control.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3_PosVelFusion.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3_VehicleStatus.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3_core.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3_core.h",
    "libraries/AP_Notify/ToneAlarm.cpp"
  ],
  "sourceLabel": {
    "ru": "Файлы подтверждённых изменений",
    "uk": "Файли підтверджених змін",
    "en": "Files containing verified changes"
  }
};
