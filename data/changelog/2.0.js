'use strict';
// AI-assisted; the 2.0 delta is the EKF3 / AHRS work on top of 1.2 (options EK3_NOAID_POS, EK3_NOAID_GPS, EK3_NOAID_AUTO, gyro gate, DCM-fallback debounce).
window.AtlasRelease20 = {
  "version": "2.0",
  "id": "release-2-0",
  "channel": "UPDATE",
  "baseLabel": {
    "ru": "В версии 1.2",
    "uk": "У версії 1.2",
    "en": "In version 1.2"
  },
  "modLabel": {
    "ru": "В версии 2.0",
    "uk": "У версії 2.0",
    "en": "In version 2.0"
  },
  "hint": {
    "ru": "EKF3 NoAID G.L.O.B.A.L.: позиция, спутники и автоматический переход. Изменения относительно версии 1.2. Все новые опции по умолчанию выключены (0): при нуле поведение прежнее. Запись не означает публикацию всех бинарных сборок.",
    "uk": "EKF3 NoAID G.L.O.B.A.L.: позиція, супутники й автоматичний перехід. Зміни відносно версії 1.2. Усі нові опції типово вимкнені (0): при нулі поведінка попередня. Запис не означає публікацію всіх бінарних збірок.",
    "en": "EKF3 NoAID G.L.O.B.A.L.: position, satellites and automatic transition. Changes relative to 1.2. Every new option is off by default (0): at zero the behaviour is unchanged. This entry does not imply availability of every binary build."
  },
  "changes": [
    {
      "ru": [
        "EKF3 NoAID G.L.O.B.A.L.: позиция EKF3 на карте",
        "Без GPS позицию на карте, в миссии и в навигации L1 давал dead reckoning DCM, а при наличии фикса GPS брался сырой GPS, хотя EKF3 оставался в режиме NoAID.",
        "EK3_NOAID_POS=1: пока EKF3 основной AHRS и AHRS_GPS_USE не 0, горизонтальная позиция (карта, GLOBAL_POSITION_INT, запись POS, L1, миссия, расстояние до дома) это dead reckoning EKF3. При откате на DCM или AHRS_EKF_TYPE=0 берётся позиция DCM, при возврате EKF3 снова его позиция. Высота не меняется."
      ],
      "uk": [
        "EKF3 NoAID G.L.O.B.A.L.: позиція EKF3 на карті",
        "Без GPS позицію на карті, в місії та в навігації L1 давав dead reckoning DCM, а за наявності фіксу GPS брався сирий GPS, хоча EKF3 залишався в режимі NoAID.",
        "EK3_NOAID_POS=1: поки EKF3 основний AHRS і AHRS_GPS_USE не 0, горизонтальна позиція (карта, GLOBAL_POSITION_INT, запис POS, L1, місія, відстань до дому) це dead reckoning EKF3. У разі відкату на DCM або AHRS_EKF_TYPE=0 береться позиція DCM, після повернення EKF3 знову його позиція. Висота не змінюється."
      ],
      "en": [
        "EKF3 NoAID G.L.O.B.A.L.: EKF3 position on the map",
        "Without GPS the map, mission and L1 navigation used DCM dead reckoning, and with a GPS fix the raw GPS position, although EKF3 stayed in NoAID.",
        "EK3_NOAID_POS=1: while EKF3 is the active AHRS and AHRS_GPS_USE is not 0, the horizontal position (map, GLOBAL_POSITION_INT, POS log, L1, mission, distance to home) is the EKF3 dead-reckoning position. During a DCM fallback or with AHRS_EKF_TYPE=0 the DCM position is used, and EKF3 takes over again on return. Altitude is unchanged."
      ]
    },
    {
      "ru": [
        "Метка спутников без их использования",
        "Вторичная позиция (AHRS2, «таблетка» на карте) показывала решение вторичного AHRS.",
        "EK3_NOAID_GPS=1: AHRS2 показывает позицию GPS1, а если у него нет 3D fix, основного GPS. Это только отображение, в навигации оно не участвует. Работает при EKF3 и при DCM, в том числе при AHRS_EKF_TYPE=0, когда вторичного AHRS нет."
      ],
      "uk": [
        "Мітка супутників без їх використання",
        "Вторинна позиція (AHRS2, «пігулка» на карті) показувала рішення вторинного AHRS.",
        "EK3_NOAID_GPS=1: AHRS2 показує позицію GPS1, а якщо в нього немає 3D fix, основного GPS. Це лише відображення, у навігації воно не бере участі. Працює з EKF3 і з DCM, зокрема за AHRS_EKF_TYPE=0, коли вторинного AHRS немає."
      ],
      "en": [
        "Satellite marker without using it",
        "The secondary position (AHRS2, the pill on the map) showed the secondary AHRS solution.",
        "EK3_NOAID_GPS=1: AHRS2 shows the GPS1 position, or the primary GPS when GPS1 has no 3D fix. It is display only and never used for navigation. It works with EKF3 and with DCM, including AHRS_EKF_TYPE=0 when no secondary AHRS exists."
      ]
    },
    {
      "ru": [
        "Автоматическое следование за GPS",
        "Переход из NoAID на спутники требовал ручного переключения набора источников (MAV_CMD_SET_EKF_SOURCE_SET или RCx_OPTION 90), а обратно в ветку NoAID фильтр не возвращался: он оставался в обычном режиме с замороженной оценкой ветра.",
        "EK3_NOAID_AUTO=1 при AHRS_GPS_USE не 0 и взведённом самолёте: когда у основного GPS 3D fix, достаточно спутников и признак качества EKF3 держится 5 с, автомат выбирает набор EK3_SRC2_* (позиция и скорость GPS, высота по барометру, курс по компасу: 3, 1, 3, 3, 1). Позиция сразу совпадает со спутниками. Если GPS потерян на 3 с или EKF3 перестал его использовать, возвращается EK3_SRC1_*. AHRS остаётся на EKF3, на DCM не уходит."
      ],
      "uk": [
        "Автоматичне слідування за GPS",
        "Перехід із NoAID на супутники потребував ручного перемикання набору джерел (MAV_CMD_SET_EKF_SOURCE_SET або RCx_OPTION 90), а назад у гілку NoAID фільтр не повертався: він лишався у звичайному режимі із замороженою оцінкою вітру.",
        "EK3_NOAID_AUTO=1 за AHRS_GPS_USE не 0 і взведеного літака: коли в основного GPS 3D fix, достатньо супутників і ознака якості EKF3 тримається 5 с, автомат обирає набір EK3_SRC2_* (позиція й швидкість GPS, висота за барометром, курс за компасом: 3, 1, 3, 3, 1). Позиція одразу збігається із супутниками. Якщо GPS втрачено на 3 с або EKF3 перестав його використовувати, повертається EK3_SRC1_*. AHRS лишається на EKF3, на DCM не переходить."
      ],
      "en": [
        "Automatic satellite following",
        "Moving from NoAID to the satellites needed a manual source-set switch (MAV_CMD_SET_EKF_SOURCE_SET or RCx_OPTION 90), and the filter never returned to the NoAID branch: it stayed in the normal mode with a frozen wind estimate.",
        "EK3_NOAID_AUTO=1 with AHRS_GPS_USE not 0 and the aircraft armed: when the primary GPS has a 3D fix, enough satellites and the EKF3 quality flag for 5 s, the source set EK3_SRC2_* is selected (GPS position and velocity, barometer height, compass yaw: 3, 1, 3, 3, 1). The position matches the satellites at once. If the GPS is lost for 3 s or EKF3 stops using it, EK3_SRC1_* returns. The AHRS stays on EKF3 and does not fall back to DCM."
      ]
    },
    {
      "ru": [
        "Возврат в NoAID без потери скорости",
        "Возврат на набор NoAID не восстанавливал NoAID-модель скорости по Пито.",
        "При выбранном наборе NoAID и неиспользуемом GPS ядро EKF3 возвращается в ветку без внешней коррекции, сохраняет скорость решения с GPS вместо обнуления и расслабляет её дисперсию, чтобы NoAID-модель по TAS приняла управление без скачка."
      ],
      "uk": [
        "Повернення в NoAID без втрати швидкості",
        "Повернення на набір NoAID не відновлювало NoAID-модель швидкості за Піто.",
        "За обраного набору NoAID та невикористовуваного GPS ядро EKF3 повертається в гілку без зовнішньої корекції, зберігає швидкість рішення з GPS замість обнулення й послаблює її дисперсію, щоб NoAID-модель за TAS прийняла керування без стрибка."
      ],
      "en": [
        "Return to NoAID without losing the velocity",
        "Selecting the NoAID set again did not restore the NoAID Pitot velocity model.",
        "With the NoAID set selected and no GPS in use, the EKF3 core returns to the unaided branch, keeps the velocity of the GPS solution instead of zeroing it and relaxes its variance, so the TAS-based NoAID model takes over without a step."
      ]
    },
    {
      "ru": [
        "Условия включения: старт, посадка, disarm",
        "Автоматики выбора источников не было.",
        "GPS не захватывается, пока NoAID-старт не подтверждён (или самолёт не летит 5 с): так NoAID-логика запуска и возврат в NoAID после потери GPS остаются корректными. Disarm на земле возвращает NoAID сразу, следующий старт снова NoAID-старт. Disarm в полёте оставляет набор GPS, потому что NoAID считает disarmed самолёт стоящим на земле."
      ],
      "uk": [
        "Умови вмикання: старт, посадка, disarm",
        "Автоматики вибору джерел не було.",
        "GPS не захоплюється, поки NoAID-старт не підтверджено (або літак не летить 5 с): так NoAID-логіка запуску й повернення в NoAID після втрати GPS лишаються коректними. Disarm на землі одразу повертає NoAID, наступний старт знову NoAID-старт. Disarm у польоті лишає набір GPS, бо NoAID вважає disarmed літак таким, що стоїть на землі."
      ],
      "en": [
        "Engagement rules: launch, landing, disarm",
        "There was no automatic source selection.",
        "The GPS is not engaged until the NoAID launch is confirmed (or the aircraft has been flying for 5 s), so the NoAID launch logic and the return to NoAID after a GPS loss stay valid. A disarm on the ground returns to NoAID at once and the next launch is a NoAID launch. A disarm in flight keeps the GPS source set, because NoAID treats a disarmed aircraft as standing on the ground."
      ]
    },
    {
      "ru": [
        "Проверка набора EK3_SRC2_*",
        "Набор источников 2 мог быть пустым или с другим источником курса, и автоматика не знала об этом.",
        "Набор 2 выбирается, только если позиция по GPS, источник курса тот же, что в наборе 1 (не «нет»), и ядра не используют каждое свой набор. Иначе раз в 60 с идёт предупреждение «EK3_SRC2_* needs GPS position and the same yaw source as EK3_SRC1_*» и переключения не происходит."
      ],
      "uk": [
        "Перевірка набору EK3_SRC2_*",
        "Набір джерел 2 міг бути порожнім або з іншим джерелом курсу, і автоматика про це не знала.",
        "Набір 2 обирається, лише якщо позиція за GPS, джерело курсу те саме, що в наборі 1 (не «немає»), і ядра не використовують кожне свій набір. Інакше раз на 60 с йде попередження «EK3_SRC2_* needs GPS position and the same yaw source as EK3_SRC1_*» і перемикання не відбувається."
      ],
      "en": [
        "EK3_SRC2_* source-set check",
        "Source set 2 could be empty or use another yaw source, and the automation did not know.",
        "Set 2 is selected only if it uses GPS for the horizontal position, has the same yaw source as set 1 (not none) and the cores do not each use a set of their own. Otherwise a warning “EK3_SRC2_* needs GPS position and the same yaw source as EK3_SRC1_*” is sent every 60 s and nothing is switched."
      ]
    },
    {
      "ru": [
        "EKF3: бочки и вращения без ложных срабатываний",
        "В бочках и вращениях сила лифта даёт продольную составляющую больше 1,1 g, и исключение ограничителя ускорения для разгона срабатывало ложно, портя оценку скорости и наклона.",
        "Исключение для сильного продольного ускорения действует, только пока угловая скорость меньше 0,8 рад/с (около 46°/с). Разгон и катапульта не затронуты. Ошибка наклона EKF3 в бочках, вращениях и выходе из них в SITL снизилась с 10–11° до менее 2°."
      ],
      "uk": [
        "EKF3: бочки й обертання без хибних спрацювань",
        "У бочках і обертаннях сила підйому дає поздовжню складову понад 1,1 g, і виняток обмежувача прискорення для розгону спрацьовував хибно, псуючи оцінку швидкості й нахилу.",
        "Виняток для сильного поздовжнього прискорення діє, лише поки кутова швидкість менша за 0,8 рад/с (близько 46°/с). Розгін і катапульта не зачеплені. Похибка нахилу EKF3 у бочках, обертаннях і виході з них у SITL знизилась з 10–11° до менш ніж 2°."
      ],
      "en": [
        "EKF3: rolls and rotations without false triggers",
        "In rolls and rotations lift gives a forward component above 1.1 g, and the exception of the acceleration limiter meant for a real launch fired falsely, spoiling the velocity and tilt estimates.",
        "The strong-forward-acceleration exception applies only while the angular rate is below 0.8 rad/s (about 46 deg/s). Launches and boosts are unaffected. The EKF3 tilt error in rolls, rotations and recoveries dropped in SITL from 10 to 11 degrees to below 2 degrees."
      ]
    },
    {
      "ru": [
        "AHRS: меньше ложных переходов на DCM",
        "Короткая потеря вертикальных флагов EKF3 без GPS (выброс барометра, сброс высоты, около 0,1 с) при верной ориентации уводила самолёт на DCM.",
        "EKF3 остаётся основным AHRS до 1 с, пока потеряны только вертикальные флаги, а ориентация верна. Более долгая потеря уводит на DCM, как раньше. В SITL на шести стресс-полётах ложных переходов 61, стало 0, выбросы 45–80° исчезли. Правило действует и в режиме следования за GPS."
      ],
      "uk": [
        "AHRS: менше хибних переходів на DCM",
        "Коротка втрата вертикальних прапорців EKF3 без GPS (викид барометра, скидання висоти, близько 0,1 с) за вірної орієнтації переводила літак на DCM.",
        "EKF3 лишається основним AHRS до 1 с, поки втрачено лише вертикальні прапорці, а орієнтація вірна. Довша втрата переводить на DCM, як раніше. У SITL на шести стрес-польотах хибних переходів було 61, стало 0, викиди 45–80° зникли. Правило діє й у режимі слідування за GPS."
      ],
      "en": [
        "AHRS: fewer false fallbacks to DCM",
        "A brief loss of the EKF3 vertical flags without GPS (barometer glitch, height reset, about 0.1 s) with a valid attitude sent the aircraft to DCM.",
        "EKF3 stays the active AHRS for up to 1 s while only the vertical flags are missing and the attitude is valid. A longer loss falls back to DCM as before. In SITL over six stress flights false fallbacks went from 61 to 0 and the 45 to 80 degree spikes disappeared. The rule also holds in the satellite-following mode."
      ]
    },
    {
      "ru": [
        "Описание параметров",
        "VTX_RC_CH, VTX_RC_SOUND и AUTOLAND_OPTIONS отсутствовали в документации параметров, а описание AUTOLAND_OPTIONS противоречило коду.",
        "Все три параметра теперь в документации (в конфигураторе и Mission Planner). AUTOLAND_OPTIONS: 0 это курс по компасу при ARM без GPS, бит 0 это курс по GPS после взлёта."
      ],
      "uk": [
        "Опис параметрів",
        "VTX_RC_CH, VTX_RC_SOUND і AUTOLAND_OPTIONS були відсутні в документації параметрів, а опис AUTOLAND_OPTIONS суперечив коду.",
        "Усі три параметри тепер у документації (у конфігураторі й Mission Planner). AUTOLAND_OPTIONS: 0 це курс за компасом при ARM без GPS, біт 0 це курс за GPS після зльоту."
      ],
      "en": [
        "Parameter documentation",
        "VTX_RC_CH, VTX_RC_SOUND and AUTOLAND_OPTIONS were missing from the parameter documentation, and the AUTOLAND_OPTIONS text contradicted the code.",
        "All three parameters are now documented (configurator and Mission Planner). AUTOLAND_OPTIONS: 0 is the compass heading captured at arming without GPS, bit 0 is the GPS ground course after takeoff."
      ]
    },
    {
      "ru": [
        "Часовой полёт: EKF3 NoAID G.L.O.B.A.L. и DCM",
        "Сравнения позиции и ориентации двух оценок в одинаковых условиях не было.",
        "Добавлена запись часового SITL-полёта на модели 7,2 кг: одна и та же программа дважды, под EKF3 с новыми опциями и под обычным DCM. Старт без GPS, бочки и вращения без GPS, GPS появляется после манёвров, пропадает, шторм, длинный участок без GPS, возврат GPS, бочки со спутниками, посадка. Старт и точка дома: аэродром Днепр (UKDD). Спутниковая карта показывает истинный трек, позицию AHRS по счислению с координатами и метку GPS, а выравнивания после манёвров подписаны градусами и секундами."
      ],
      "uk": [
        "Годинний політ: EKF3 NoAID G.L.O.B.A.L. і DCM",
        "Порівняння позиції й орієнтації двох оцінок в однакових умовах не було.",
        "Додано запис годинного SITL-польоту на моделі 7,2 кг: та сама програма двічі, під EKF3 з новими опціями та під звичайним DCM. Старт без GPS, бочки й обертання без GPS, GPS з’являється після маневрів, зникає, шторм, довга ділянка без GPS, повернення GPS, бочки з супутниками, посадка. Старт і точка дому: аеродром Дніпро (UKDD). Супутникова карта показує істинний трек, позицію AHRS за лічбою з координатами та мітку GPS, а вирівнювання після маневрів підписані градусами й секундами."
      ],
      "en": [
        "One-hour flight: EKF3 NoAID G.L.O.B.A.L. and DCM",
        "There was no like-for-like comparison of the position and attitude of the two estimators.",
        "Adds a recording of a one-hour SITL flight of the 7.2 kg model: the same programme flown twice, once with EKF3 and the new options and once with the ordinary DCM. Launch without GPS, rolls and rotations without GPS, the GPS appears after the manoeuvres and disappears, a storm, a long leg without GPS, the GPS returns, rolls with satellites, landing. Home and launch point: Dnipro airport (UKDD). The satellite map shows the true track, the dead-reckoned AHRS position with coordinates and the GPS marker, and the levelling-outs after manoeuvres are labelled with degrees and seconds."
      ]
    },
    {
      "ru": [
        "Границы этих изменений",
        "NoAID без внешней коррекции остаётся оценкой без независимой скорости относительно земли.",
        "Без GPS ветер не оценивается, поэтому позиция dead reckoning уходит на величину ветра. Автоматика идёт за любым «хорошим» GPS и не проверяет его на подмену. Все три опции по умолчанию 0, набор EK3_SRC2_* пользователь задаёт сам. Результаты получены в SITL на приближённой модели, а не в лётных испытаниях."
      ],
      "uk": [
        "Межі цих змін",
        "NoAID без зовнішньої корекції лишається оцінкою без незалежної швидкості відносно землі.",
        "Без GPS вітер не оцінюється, тому позиція dead reckoning відходить на величину вітру. Автоматика йде за будь-яким «хорошим» GPS і не перевіряє його на підміну. Усі три опції типово 0, набір EK3_SRC2_* користувач задає сам. Результати отримано в SITL на наближеній моделі, а не в льотних випробуваннях."
      ],
      "en": [
        "Scope of these changes",
        "NoAID without external correction remains an estimate with no independent ground velocity.",
        "Without GPS the wind is not estimated, so the dead-reckoning position drifts by the wind. The automation follows any good GPS and does not check it for spoofing. All three options are 0 by default and the EK3_SRC2_* set is configured by the user. The results come from SITL on an approximate model, not from flight testing."
      ]
    }
  ],
  "sources": [
    "libraries/AP_AHRS/AP_AHRS.cpp",
    "libraries/AP_AHRS/AP_AHRS.h",
    "libraries/AP_NavEKF3/AP_NavEKF3.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3.h",
    "libraries/AP_NavEKF3/AP_NavEKF3_Control.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3_core.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3_core.h",
    "libraries/AP_NavEKF3/AP_NavEKF3_Outputs.cpp",
    "libraries/AP_NavEKF/AP_NavEKF_Source.cpp",
    "libraries/AP_NavEKF/AP_NavEKF_Source.h",
    "ArduPlane/mode_autoland.cpp",
    "libraries/AP_VideoTX/AP_VideoTX.cpp"
  ],
  "sourceLabel": {
    "ru": "Файлы подтверждённых изменений",
    "uk": "Файли підтверджених змін",
    "en": "Files containing verified changes"
  }
};
