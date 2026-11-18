'use strict';
// AI-assisted; verified 2.2 changes relative to 2.1, with hardware-validation limits.
window.AtlasRelease22 = {
  "version": "2.2",
  "id": "release-2-2",
  "channel": "UPDATE",
  "baseLabel": {
    "ru": "В версии 2.1",
    "uk": "У версії 2.1",
    "en": "In version 2.1"
  },
  "modLabel": {
    "ru": "В версии 2.2",
    "uk": "У версії 2.2",
    "en": "In version 2.2"
  },
  "hint": {
    "ru": "Обновление относительно 2.1: корректировка EKF3 со станции вместе с настоящим GPS, перетаскивание самолёта на карте в схеме NoAID, привязка высоты к HOME на земле, HOME после перезапуска платы. Два новых параметра: EK3_MAV_POS и EK3_MAV_HGT. Проверено в SITL на модели 7,2 кг, включая повтор реальных стендовых записей; стендовая и лётная проверка этой версии на реальном самолёте ещё предстоит. Доступность HEX определяется каталогом сборок каждой платы.",
    "uk": "Оновлення відносно 2.1: корекція EKF3 зі станції разом зі справжнім GPS, перетягування літака на карті в схемі NoAID, прив’язка висоти до HOME на землі, HOME після перезавантаження плати. Два нові параметри: EK3_MAV_POS і EK3_MAV_HGT. Перевірено в SITL на моделі 7,2 кг, зокрема повтором реальних стендових записів; стендова й льотна перевірка цієї версії на реальному літаку ще попереду. Наявність HEX визначає каталог збірок кожної плати.",
    "en": "Changes from 2.1: the EKF3 correction from the station together with a real GPS, dragging the aircraft on the map in the NoAID scheme, height tied to HOME on the ground, HOME after a board restart. Two new parameters: EK3_MAV_POS and EK3_MAV_HGT. Tested in SITL on the 7.2 kg model, including a replay of real bench recordings; bench and flight validation of this version on a real aircraft is still pending. HEX availability is shown separately for each board in the build catalogue."
  },
  "changes": [
    {
      "ru": [
        "Корректировка EKF3 со станции и настоящий GPS на одном входе",
        "Кнопка «Корректировка EKF3» передаёт координаты точки HOME станции пакетом GPS, и прошивка принимала его за обычный GPS. Позиция EKF3 при этом не возвращалась к точке HOME, а настоящий GPS на том же входе нельзя было совместить с рабочей кнопкой.",
        "Параметр EK3_MAV_POS = 1 включает корректировку: пакет кнопки принимается как команда оператора и один раз за нажатие ставит позицию EKF3 в точку HOME станции, GPS-измерением он не становится. Любой другой пакет на том же входе по-прежнему настоящий GPS. Корректировка выполняется на земле до взлёта; в полёте кнопка отклоняется сообщением. Перетаскивание самолёта на карте станции при EK3_NOAID_POS = 1 принимается и на земле, и в полёте: позиция EKF3 встаёт в указанную точку (в 2.1 эта команда в схеме NoAID отклонялась)."
      ],
      "uk": [
        "Корекція EKF3 зі станції та справжній GPS на одному вході",
        "Кнопка «Корекція EKF3» передає координати точки HOME станції пакетом GPS, і прошивка сприймала його як звичайний GPS. Позиція EKF3 при цьому не поверталася до точки HOME, а справжній GPS на тому самому вході не можна було поєднати з робочою кнопкою.",
        "Параметр EK3_MAV_POS = 1 вмикає корекцію: пакет кнопки приймається як команда оператора й один раз за натискання ставить позицію EKF3 у точку HOME станції, вимірюванням GPS він не стає. Будь-який інший пакет на тому самому вході, як і раніше, справжній GPS. Корекція виконується на землі до зльоту; у польоті кнопку відхиляє повідомленням. Перетягування літака на карті станції за EK3_NOAID_POS = 1 приймається і на землі, і в польоті: позиція EKF3 стає в указану точку (у 2.1 ця команда в схемі NoAID відхилялася)."
      ],
      "en": [
        "EKF3 correction from the station and a real GPS on the same input",
        "The “EKF3 correction” button sends the station’s HOME coordinates as a GPS packet, and the firmware took it for an ordinary GPS. The EKF3 position did not return to HOME, and a real GPS on the same input could not be combined with a working button.",
        "EK3_MAV_POS = 1 enables the correction: the button packet is accepted as an operator command and puts the EKF3 position at the station’s HOME once per press; it never becomes a GPS measurement. Any other packet on the same input is still a real GPS. The correction works on the ground before launch; in flight the button is refused with a message. With EK3_NOAID_POS = 1 dragging the aircraft on the station map is accepted on the ground and in flight: the EKF3 position goes to the chosen point (in 2.1 this command was refused in the NoAID scheme)."
      ]
    },
    {
      "ru": [
        "Высота самолёта привязывается к HOME на земле",
        "После корректировки или смены HOME на станции высота самолёта и высота HOME могли оказаться привязаны к разным опорам: на земле относительная высота показывала десятки метров.",
        "Параметр EK3_MAV_HGT = 1 привязывает высоту самолёта к высоте HOME, когда HOME поставлен в точке самолёта или корректировка сделана у HOME, пока самолёт неподвижен, не взведён и не летит. Относительная высота на земле около нуля. При ARM и в полёте такая привязка не выполняется."
      ],
      "uk": [
        "Висота літака прив’язується до HOME на землі",
        "Після корекції або зміни HOME на станції висота літака й висота HOME могли виявитися прив’язаними до різних опор: на землі відносна висота показувала десятки метрів.",
        "Параметр EK3_MAV_HGT = 1 прив’язує висоту літака до висоти HOME, коли HOME поставлено в точці літака або корекцію зроблено біля HOME, поки літак нерухомий, не взведений і не летить. Відносна висота на землі близько нуля. Під час ARM і в польоті така прив’язка не виконується."
      ],
      "en": [
        "Aircraft height is tied to HOME on the ground",
        "After a correction or a HOME change on the station, the aircraft height and the HOME height could end up on different references: on the ground the relative height showed tens of metres.",
        "EK3_MAV_HGT = 1 ties the aircraft height to the HOME height when HOME is set at the aircraft, or the correction is made at HOME, while the aircraft is stationary, disarmed and not flying. The relative height on the ground is about zero. The tie is not made at ARM or in flight."
      ]
    },
    {
      "ru": [
        "Высота не теряется, когда на земле появляется GPS",
        "Когда на земле включался GPS станции, высота самолёта привязывалась к высоте этого GPS, а она отличалась от высоты HOME с карты на десятки метров. Относительная высота уходила на десятки метров, а если GPS пропадал до ARM, после ARM она могла оказаться неверной ещё сильнее.",
        "В схеме NoAID с EK3_MAV_HGT = 1 привязка высоты к HOME сохраняется при любых действиях GPS на земле: включении, пропадании, смене высоты. Относительная высота остаётся около нуля и после ARM. В SITL при повторе двух реальных стендовых записей (HOME, перетаскивания, кнопка и окна GPS в том же порядке и в те же моменты) все проверки проходят, а посадка после такой подготовки даёт согласованную высоту касания."
      ],
      "uk": [
        "Висота не губиться, коли на землі з’являється GPS",
        "Коли на землі вмикався GPS станції, висота літака прив’язувалася до висоти цього GPS, а вона відрізнялася від висоти HOME з карти на десятки метрів. Відносна висота йшла на десятки метрів, а якщо GPS зникав до ARM, після ARM вона могла виявитися хибною ще сильніше.",
        "У схемі NoAID з EK3_MAV_HGT = 1 прив’язка висоти до HOME зберігається за будь-яких дій GPS на землі: вмикання, зникнення, зміна висоти. Відносна висота лишається близько нуля й після ARM. У SITL при повторі двох реальних стендових записів (HOME, перетягування, кнопка та вікна GPS в тому самому порядку й у ті самі моменти) усі перевірки проходять, а посадка після такої підготовки дає узгоджену висоту дотику."
      ],
      "en": [
        "Height is not lost when a GPS appears on the ground",
        "When the station’s GPS was switched on while the aircraft stood on the ground, the aircraft height was tied to that GPS height, which differed from the map height of HOME by tens of metres. The relative height moved by tens of metres, and if the GPS disappeared before ARM, the height after ARM could be wrong by even more.",
        "In the NoAID scheme with EK3_MAV_HGT = 1 the tie to the HOME height is kept whatever the GPS does on the ground: switching on, disappearing, changing height. The relative height stays about zero after ARM as well. In SITL, replaying two real bench recordings (HOME, drags, button and GPS windows in the same order and at the same moments), all checks pass, and a landing after such preparation gives a consistent touchdown height."
      ]
    },
    {
      "ru": [
        "HOME и Origin после перезапуска платы",
        "После перезапуска плата не знала ни HOME, ни Origin, хотя станция продолжала показывать HOME; корректировка кнопкой не определяла ни того, ни другого.",
        "Если плата не знает HOME, первая корректировка со станции задаёт и Origin, и HOME в точке HOME станции и фиксирует его. HOME, который станция пришлёт позже, заменяет его, и высота привязывается, как описано выше."
      ],
      "uk": [
        "HOME і Origin після перезавантаження плати",
        "Після перезавантаження плата не знала ні HOME, ні Origin, хоча станція й далі показувала HOME; корекція кнопкою не визначала ні того, ні іншого.",
        "Якщо плата не знає HOME, перша корекція зі станції задає і Origin, і HOME у точці HOME станції та фіксує його. HOME, який станція надішле пізніше, замінює його, і висота прив’язується, як описано вище."
      ],
      "en": [
        "HOME and Origin after a board restart",
        "After a restart the board knew neither HOME nor Origin while the station kept showing HOME; the button correction defined neither of them.",
        "If the board does not know HOME, the first correction from the station sets both Origin and HOME at the station’s HOME and locks it. A HOME that the station sends later replaces it, and the height is tied as described above."
      ]
    },
    {
      "ru": [
        "HOME не сдвигается сам",
        "Незафиксированный HOME мог сдвинуться при появлении настоящего GPS на земле: в HOME переносилась высота этого GPS, а первый захват GPS уже после ARM ставил HOME в точку самолёта и сдвигал все высоты относительно HOME.",
        "Зафиксированный HOME остаётся на месте при перетаскиваниях и при появлении GPS. В схеме NoAID первый захват GPS после ARM HOME не ставит. Без NoAID поведение штатное: самолёт, взведённый до первого захвата GPS, получает HOME при захвате."
      ],
      "uk": [
        "HOME не зсувається сам",
        "Незафіксований HOME міг зсунутися за появи справжнього GPS на землі: у HOME переносилася висота цього GPS, а перше захоплення GPS уже після ARM ставило HOME у точку літака й зсувало всі висоти відносно HOME.",
        "Зафіксований HOME лишається на місці під час перетягувань і за появи GPS. У схемі NoAID перше захоплення GPS після ARM HOME не ставить. Без NoAID поведінка штатна: літак, взведений до першого захоплення GPS, отримує HOME під час захоплення."
      ],
      "en": [
        "HOME does not move by itself",
        "An unlocked HOME could move when a real GPS appeared on the ground: the height of that GPS was carried into HOME, and the first GPS fix after ARM put HOME at the aircraft and shifted every height relative to HOME.",
        "A locked HOME stays where it is during drags and when a GPS appears. In the NoAID scheme the first GPS fix after ARM does not set HOME. Without NoAID the behaviour is the standard one: an aircraft armed before its first GPS fix gets HOME at that fix."
      ]
    },
    {
      "ru": [
        "Позиция и высота на карте — одно решение EKF3",
        "При EK3_NOAID_POS = 1 горизонтальная позиция бралась из EKF3, а абсолютная высота — из GPS или DCM, когда те выдавали позицию. При появлении и пропадании GPS высота на карте и в логе менялась скачком, а смена источника позиции могла сопровождаться серией сообщений.",
        "Позиция и абсолютная высота публикуются одним решением EKF3, без скачков высоты при появлении и пропадании GPS или DCM. Сообщения о смене источника позиции не повторяются серией."
      ],
      "uk": [
        "Позиція та висота на карті — одне рішення EKF3",
        "За EK3_NOAID_POS = 1 горизонтальна позиція бралася з EKF3, а абсолютна висота — з GPS або DCM, коли ті видавали позицію. Під час появи й зникнення GPS висота на карті та в логу змінювалася стрибком, а зміна джерела позиції могла супроводжуватися серією повідомлень.",
        "Позиція й абсолютна висота публікуються одним рішенням EKF3, без стрибків висоти під час появи й зникнення GPS або DCM. Повідомлення про зміну джерела позиції не повторюються серією."
      ],
      "en": [
        "Map position and height come from one EKF3 solution",
        "With EK3_NOAID_POS = 1 the horizontal position came from EKF3, while the absolute height came from the GPS or the DCM whenever they reported a position. When a GPS appeared or disappeared, the height on the map and in the log jumped, and a change of the position source could produce a burst of messages.",
        "The position and the absolute height are published from one EKF3 solution, without height jumps when a GPS or the DCM appears or disappears. Messages about a change of the position source are not repeated in a burst."
      ]
    },
    {
      "ru": [
        "Профиль G.L.O.B.A.L. в конфигураторе: корректировка со станции",
        "Профиль активации записывал параметры NoAID и наборы источников EKF3; параметров корректировки со станции в нём не было.",
        "На платах с прошивкой 2.2 профиль записывает и EK3_MAV_POS, и EK3_MAV_HGT, значение 1. На платах с прошивкой 2.0 и 2.1 этих параметров нет, профиль их пропускает и работает как раньше."
      ],
      "uk": [
        "Профіль G.L.O.B.A.L. у конфігураторі: корекція зі станції",
        "Профіль активації записував параметри NoAID і набори джерел EKF3; параметрів корекції зі станції в ньому не було.",
        "На платах із прошивкою 2.2 профіль записує і EK3_MAV_POS, і EK3_MAV_HGT, значення 1. На платах із прошивкою 2.0 і 2.1 цих параметрів немає, профіль їх пропускає й працює як раніше."
      ],
      "en": [
        "G.L.O.B.A.L. profile in the configurator: correction from the station",
        "The activation profile wrote the NoAID parameters and the EKF3 source sets; it had no station-correction parameters.",
        "On boards with firmware 2.2 the profile also writes EK3_MAV_POS and EK3_MAV_HGT, value 1. Boards with firmware 2.0 and 2.1 do not have these parameters; the profile skips them and works as before."
      ]
    },
    {
      "ru": [
        "Проверки 2.2 и границы подтверждённого результата",
        "Подготовка на стенде проверялась отдельными командами, а не полной последовательностью действий оператора: HOME, перетаскивания, кнопка и окна GPS в разные моменты.",
        "В SITL на модели 7,2 кг воспроизведены две реальные записи стендовой подготовки: команды станции и окна GPS в том же порядке и в те же моменты. Четырнадцать контрольных сценариев, включая четыре двухчасовых полёта, совпали с результатами 2.1 в пределах разброса между прогонами; сборки для Matek H743-WING V3, Cube Orange Plus и Uni-IC743 Mini компилируются без предупреждений. Это проверка алгоритма на модели; стендовая и лётная проверка на реальном самолёте ещё предстоит."
      ],
      "uk": [
        "Перевірки 2.2 і межі підтвердженого результату",
        "Підготовка на стенді перевірялася окремими командами, а не повною послідовністю дій оператора: HOME, перетягування, кнопка та вікна GPS у різні моменти.",
        "У SITL на моделі 7,2 кг відтворено два реальні записи стендової підготовки: команди станції та вікна GPS у тому самому порядку й у ті самі моменти. Чотирнадцять контрольних сценаріїв, зокрема чотири двогодинні польоти, збіглися з результатами 2.1 у межах розкиду між прогонами; збірки для Matek H743-WING V3, Cube Orange Plus і Uni-IC743 Mini компілюються без попереджень. Це перевірка алгоритму на моделі; стендова й льотна перевірка на реальному літаку ще попереду."
      ],
      "en": [
        "2.2 validation and its limits",
        "Bench preparation was checked with separate commands, not with the full sequence of operator actions: HOME, drags, the button and GPS windows at different moments.",
        "In SITL on the 7.2 kg model, two real bench-preparation recordings were replayed: the station commands and the GPS windows in the same order and at the same moments. Fourteen control scenarios, including four two-hour flights, matched the 2.1 results within the run-to-run scatter; the builds for Matek H743-WING V3, Cube Orange Plus and Uni-IC743 Mini compile without warnings. This validates the algorithm on a model; bench and flight validation on a real aircraft is still pending."
      ]
    }
  ],
  "sources": [
    "ArduPlane/Plane.cpp",
    "libraries/AP_AHRS/AP_AHRS.cpp",
    "libraries/AP_AHRS/AP_AHRS.h",
    "libraries/GCS_MAVLink/GCS_Common.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3.h",
    "libraries/AP_NavEKF3/AP_NavEKF3_Outputs.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3_PosVelFusion.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3_core.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3_core.h"
  ],
  "sourceLabel": {
    "ru": "Файлы подтверждённых изменений",
    "uk": "Файли підтверджених змін",
    "en": "Files containing verified changes"
  }
};
