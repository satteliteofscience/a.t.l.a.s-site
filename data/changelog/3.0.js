'use strict';
// AI-assisted; verified 3.0 changes relative to 2.2, with hardware-validation limits. Public wording: what changes for the user, never how.
window.AtlasRelease30 = {
  "version": "3.0",
  "id": "release-3-0",
  "channel": "UPDATE",
  "baseLabel": {
    "ru": "В версии 2.2",
    "uk": "У версії 2.2",
    "en": "In version 2.2"
  },
  "modLabel": {
    "ru": "В версии 3.0",
    "uk": "У версії 3.0",
    "en": "In version 3.0"
  },
  "hint": {
    "ru": "Обновление относительно 2.2: счисление без GPS учитывает ветер (его вводит оператор или прошивка учит по меткам оператора), учит ошибки шкалы Pitot и курса, применяет метку оператора плавно, удерживает позицию на площадке и сообщает об отказе Pitot; в конфигураторе появилась вкладка DroneCAN. Новые параметры собраны в группе NOAID_ (WIND, HOLD, SLEW, WAGE, PWATCH) и по умолчанию равны 0: поведение как в 2.2. База прошивки та же, ArduPlane 4.7.3. Проверено в SITL на модели 7,2 кг; стендовая и лётная проверка этой версии на реальном самолёте ещё предстоит. Доступность HEX определяется каталогом сборок каждой платы.",
    "uk": "Оновлення відносно 2.2: лічба без GPS враховує вітер (його вводить оператор або прошивка вчить за мітками оператора), вчить похибки шкали Піто та курсу, застосовує мітку оператора плавно, утримує позицію на майданчику й повідомляє про відмову Піто; у конфігураторі з’явилася вкладка DroneCAN. Нові параметри зібрано в групі NOAID_ (WIND, HOLD, SLEW, WAGE, PWATCH), і за замовчуванням вони дорівнюють 0: поведінка як у 2.2. База прошивки та сама, ArduPlane 4.7.3. Перевірено в SITL на моделі 7,2 кг; стендова й льотна перевірка цієї версії на реальному літаку ще попереду. Наявність HEX визначає каталог збірок кожної плати.",
    "en": "Changes from 2.2: dead reckoning without GPS takes the wind into account (entered by the operator or learned by the firmware from the operator’s fixes), learns the Pitot scale error and the heading error, applies an operator fix gradually, holds the position on the pad and reports a Pitot failure; the configurator gets a DroneCAN tab. The new parameters live in the NOAID_ group (WIND, HOLD, SLEW, WAGE, PWATCH) and default to 0: the behaviour is that of 2.2. The firmware base is the same, ArduPlane 4.7.3. Tested in SITL on the 7.2 kg model; bench and flight validation of this version on a real aircraft is still pending. HEX availability is shown separately for each board in the build catalogue."
  },
  "changes": [
    {
      "ru": [
        "Ветер в счислении без GPS: оператор вводит или прошивка учит по меткам",
        "Счисление позиции без GPS считает воздух неподвижным, и позиция уходит вместе с ветром. Исправить её можно только меткой оператора, которая каждый раз переставляет позицию скачком.",
        "Параметр NOAID_WIND включает учёт ветра: его можно задать командой со станции (бит 0) или дать прошивке выучить его по меткам оператора (бит 1). Выученный ветер продолжает действовать, когда оператор перестал ставить метки, а ветер, введённый с обратным направлением, прошивка исправляет сама по следующим меткам. В 45-минутном тесте SITL с постоянным ветром ошибка позиции после ухода оператора при включённой функции в версии 3.0 примерно в двадцать раз меньше, чем в 2.2. Это лучший случай: при резко меняющемся ветре выигрыш заметно меньше, в штиль обучение даёт небольшую лишнюю ошибку, а если метки прекратились и ветер изменился, устаревший ветер может ухудшить результат (см. NOAID_WAGE). Функция экспериментальная: ошибки наклона и датчиков могут быть приняты за ветер, она не заменяет GPS и может не соответствовать ожиданиям (подробнее в разделе 3.1). В штиль обучение не нужно: оставьте NOAID_WIND равным 1 или 0, и ветер будет нулевым; уже выученный ветер обнуляется командой «ветер 0» со станции."
      ],
      "uk": [
        "Вітер у лічбі без GPS: оператор вводить або прошивка вчить за мітками",
        "Лічба позиції без GPS вважає повітря нерухомим, і позиція йде разом із вітром. Виправити її можна лише міткою оператора, яка щоразу переставляє позицію стрибком.",
        "Параметр NOAID_WIND вмикає врахування вітру: його можна задати командою зі станції (біт 0) або дати прошивці вивчити його за мітками оператора (біт 1). Вивчений вітер далі діє, коли оператор перестав ставити мітки, а вітер, уведений зі зворотним напрямком, прошивка виправляє сама за наступними мітками. У 45-хвилинному тесті SITL зі сталим вітром похибка позиції після відходу оператора в 3.0 з увімкненою функцією приблизно в двадцять разів менша, ніж у 2.2. Це найкращий випадок: за різко змінного вітру виграш помітно менший, у штиль навчання дає невелику зайву похибку, а якщо мітки припинилися й вітер змінився, застарілий вітер може погіршити результат (див. NOAID_WAGE). Функція експериментальна: похибки нахилу й датчиків можуть бути сприйняті за вітер, вона не замінює GPS і може не відповідати очікуванням (докладніше в розділі 3.1). У штиль навчання не потрібне: лишайте NOAID_WIND рівним 1 або 0, і вітер буде нульовим; уже вивчений вітер обнуляється командою «вітер 0» зі станції."
      ],
      "en": [
        "Wind in dead reckoning without GPS: entered by the operator or learned from fixes",
        "Dead reckoning without GPS treats the air as still, and the position drifts with the wind. The only remedy is an operator fix, which moves the position with a jump every time.",
        "NOAID_WIND switches wind handling on: the wind can be given by a command from the station (bit 0) or learned by the firmware from the operator’s fixes (bit 1). The learned wind keeps working after the operator stops placing fixes, and a wind entered with the wrong direction is corrected by the firmware itself from the next fixes. In the 45-minute SITL test with a constant wind the position error after the operator leaves is about twenty times smaller for 3.0 with the function on than for 2.2. This is the best case: with a sharply changing wind the gain is much smaller, in calm air the learning adds a small extra error, and if the fixes stop while the wind changes, a stale wind can make the result worse (see NOAID_WAGE). The function is experimental: tilt and sensor errors can be taken for wind, it does not replace GPS and may not meet expectations (see section 3.1). In calm air the learning is not needed: leave NOAID_WIND at 1 or 0 and the wind stays zero; a wind that has already been learned is zeroed with the operator command wind 0 from the station."
      ]
    },
    {
      "ru": [
        "Ошибки шкалы Pitot и курса учатся вместе с ветром (R3)",
        "Ошибка шкалы воздушной скорости или смещение курса выглядят как ветер, который поворачивается вместе с самолётом, и позиция расходится.",
        "Бит 2 параметра NOAID_WIND включает R3: те же метки оператора учат поправку шкалы Pitot и поправку курса, а не только ветер. Поправки ограничены и сбрасываются при дизарме. В тесте SITL с ошибкой шкалы и курса прошивка выучила поправки, близкие к истинным; при идеальных датчиках они остаются около нуля."
      ],
      "uk": [
        "Похибки шкали Піто та курсу вчаться разом із вітром (R3)",
        "Похибка шкали повітряної швидкості або зміщення курсу виглядають як вітер, що повертається разом із літаком, і позиція розходиться.",
        "Біт 2 параметра NOAID_WIND вмикає R3: ті самі мітки оператора вчать поправку шкали Піто та поправку курсу, а не лише вітер. Поправки обмежені й скидаються під час дизарму. У тесті SITL з похибкою шкали та курсу прошивка вивчила поправки, близькі до істинних; за ідеальних датчиків вони лишаються біля нуля."
      ],
      "en": [
        "Pitot scale and heading errors are learned with the wind (R3)",
        "An airspeed scale error or a heading offset looks like a wind that turns with the aircraft, and the position diverges.",
        "Bit 2 of NOAID_WIND switches R3 on: the same operator fixes teach a Pitot scale correction and a heading correction, not only the wind. The corrections are limited and are reset at disarm. In the SITL test with a scale error and a heading error the firmware learned corrections close to the true ones; with ideal sensors they stay near zero."
      ]
    },
    {
      "ru": [
        "Метка оператора применяется плавно (NOAID_SLEW)",
        "Метка оператора переставляет позицию EKF3 сразу: навигация видит скачок и резко меняет заданный крен.",
        "NOAID_SLEW — число секунд, за которое поправка метки в полёте применяется плавно (рекомендовано 20). Заданный крен при этом меняется заметно медленнее: в SITL скорость его изменения падает в несколько раз. На земле и в окне GPS метка применяется сразу, как раньше; 0 — как в 2.2."
      ],
      "uk": [
        "Мітка оператора застосовується плавно (NOAID_SLEW)",
        "Мітка оператора переставляє позицію EKF3 одразу: навігація бачить стрибок і різко змінює заданий крен.",
        "NOAID_SLEW — кількість секунд, за які поправка мітки в польоті застосовується плавно (рекомендовано 20). Заданий крен при цьому змінюється помітно повільніше: у SITL швидкість його зміни падає в кілька разів. На землі й у вікні GPS мітка застосовується одразу, як раніше; 0 — як у 2.2."
      ],
      "en": [
        "The operator’s fix is applied gradually (NOAID_SLEW)",
        "An operator fix moves the EKF3 position at once: navigation sees a jump and changes the bank demand sharply.",
        "NOAID_SLEW is the number of seconds over which a fix is applied gradually in flight (20 recommended). The bank demand then changes much more slowly: in SITL its rate of change falls several times. On the ground and in a GPS window the fix is applied at once, as before; 0 is the behaviour of 2.2."
      ]
    },
    {
      "ru": [
        "Позиция на площадке удерживается (NOAID_HOLD)",
        "На катапульте без GPS после дизарма позиция EKF3 медленно уходит от ветра и вибрации.",
        "NOAID_HOLD — слабое удержание позиции на земле (значение в метрах, рекомендовано 2). В SITL уход на площадке перед пуском практически исчезает; если самолёт толкнули или перенесли, позиция следует за ним. 0 — как в 2.2."
      ],
      "uk": [
        "Позиція на майданчику утримується (NOAID_HOLD)",
        "На катапульті без GPS після дизарму позиція EKF3 повільно йде від вітру й вібрації.",
        "NOAID_HOLD — слабке утримання позиції на землі (значення в метрах, рекомендовано 2). У SITL відхід на майданчику перед пуском практично зникає; якщо літак штовхнули або перенесли, позиція йде за ним. 0 — як у 2.2."
      ],
      "en": [
        "The pad position is held (NOAID_HOLD)",
        "On the catapult without GPS, after a disarm, the EKF3 position slowly wanders with the wind and vibration.",
        "NOAID_HOLD is a weak position hold on the ground (a value in metres, 2 recommended). In SITL the wander on the pad before launch practically disappears; if the aircraft is pushed or carried, the position follows it. 0 is the behaviour of 2.2."
      ]
    },
    {
      "ru": [
        "Выученный ветер можно забывать (NOAID_WAGE)",
        "Выученный ветер действует до следующей метки, сколько бы ни прошло времени.",
        "NOAID_WAGE — время в секундах без метки, после которого выученный ветер плавно забывается; 0 — не забывать (по умолчанию). Это нужно, если метки могут прекратиться, а ветер измениться: без метки ничто не проверяет ветер, и устаревшая оценка уводит позицию. Если же ветер держится, а метки прекратились, забывание вредит; выбор за оператором."
      ],
      "uk": [
        "Вивчений вітер можна забувати (NOAID_WAGE)",
        "Вивчений вітер діє до наступної мітки, скільки б часу не минуло.",
        "NOAID_WAGE — час у секундах без мітки, після якого вивчений вітер плавно забувається; 0 — не забувати (за замовчуванням). Це потрібно, якщо мітки можуть припинитися, а вітер змінитися: без мітки ніщо не перевіряє вітер, і застаріла оцінка веде позицію. Якщо ж вітер тримається, а мітки припинилися, забування шкодить; вибір за оператором."
      ],
      "en": [
        "A learned wind can be forgotten (NOAID_WAGE)",
        "A learned wind stays in force until the next fix, however much time passes.",
        "NOAID_WAGE is the time in seconds without a fix after which the learned wind is faded out; 0 means never (the default). It matters if the fixes may stop while the wind changes: without a fix nothing checks the wind, and a stale estimate moves the position. If the wind persists while the fixes stop, forgetting hurts; the choice is the operator’s."
      ]
    },
    {
      "ru": [
        "Сторож Pitot: отказ датчика больше не молчит (NOAID_PWATCH)",
        "В полёте без GPS позиция строится по скорости Pitot, но отказ датчика в воздухе ничем не объявлялся: штатная проверка ArduPilot сравнивает воздушную скорость с GPS и без GPS бездействует.",
        "NOAID_PWATCH — битовая маска правил, 0 выключает: датчик стал недоступен (бит 0), показывает скорость около нуля при газе (бит 1), показание не меняется (бит 2), два датчика расходятся (бит 3). Сторож только предупреждает сообщением и записью в лог, управление не меняет. В SITL отказ объявляется через считанные секунды, в том числе если датчик вышел из строя, пока самолёт летел по GPS."
      ],
      "uk": [
        "Сторож Піто: відмова датчика більше не мовчить (NOAID_PWATCH)",
        "У польоті без GPS позиція будується за швидкістю Піто, але відмова датчика в повітрі нічим не оголошувалася: штатна перевірка ArduPilot порівнює повітряну швидкість із GPS і без GPS бездіє.",
        "NOAID_PWATCH — бітова маска правил, 0 вимикає: датчик став недоступний (біт 0), показує швидкість біля нуля за газу (біт 1), показання не змінюється (біт 2), два датчики розходяться (біт 3). Сторож лише попереджає повідомленням і записом у лог, керування не змінює. У SITL відмова оголошується за лічені секунди, зокрема якщо датчик вийшов з ладу, поки літак летів за GPS."
      ],
      "en": [
        "Pitot watch: a sensor failure is no longer silent (NOAID_PWATCH)",
        "In flight without GPS the position is built from the Pitot speed, yet a sensor failure in the air was announced by nothing: the stock ArduPilot check compares airspeed with GPS and is idle without a GPS.",
        "NOAID_PWATCH is a bitmask of rules, 0 switches it off: the sensor became unusable (bit 0), reads a speed near zero with the throttle up (bit 1), the reading does not change (bit 2), two sensors disagree (bit 3). The watch only warns with a message and a log record; it does not change the control. In SITL a failure is announced within a few seconds, including a sensor that failed while the aircraft was flying on GPS."
      ]
    },
    {
      "ru": [
        "Параметры NOAID_ и поведение «как в 2.2» по умолчанию",
        "Параметры NoAID носили общий префикс EK3_ и перемешивались с остальными параметрами фильтра.",
        "Новые параметры собраны в группе NOAID_ (WIND, HOLD, SLEW, WAGE, PWATCH), как ORDER_ и BUZ_; выпущенные ранее EK3_NOAID_* и EK3_MAV_* сохраняют имена. По умолчанию все новые параметры равны 0, и тогда поведение как в 2.2: в SITL «функции выкл» отличаются от повтора 2.2 в пределах разброса между прогонами. Параметры, сохранённые прошивкой 2.2, переносятся на 3.0 без потерь, а возврат на 2.2 теряет только пять новых."
      ],
      "uk": [
        "Параметри NOAID_ і поведінка «як у 2.2» за замовчуванням",
        "Параметри NoAID мали спільний префікс EK3_ і змішувалися з рештою параметрів фільтра.",
        "Нові параметри зібрано в групі NOAID_ (WIND, HOLD, SLEW, WAGE, PWATCH), як ORDER_ і BUZ_; випущені раніше EK3_NOAID_* та EK3_MAV_* зберігають імена. За замовчуванням усі нові параметри дорівнюють 0, і тоді поведінка як у 2.2: у SITL «функції вимк.» відрізняються від повтору 2.2 в межах розкиду між прогонами. Параметри, збережені прошивкою 2.2, переносяться на 3.0 без втрат, а повернення на 2.2 втрачає лише п’ять нових."
      ],
      "en": [
        "The NOAID_ parameters and “as in 2.2” by default",
        "The NoAID parameters shared the EK3_ prefix and were mixed with the other filter parameters.",
        "The new parameters live in the NOAID_ group (WIND, HOLD, SLEW, WAGE, PWATCH), like ORDER_ and BUZ_; the EK3_NOAID_* and EK3_MAV_* parameters released earlier keep their names. By default all new parameters are 0 and the behaviour is that of 2.2: in SITL “functions off” differs from a repeat of 2.2 only within the run-to-run scatter. Parameters stored by 2.2 carry over to 3.0 without loss, and going back to 2.2 loses only the five new ones."
      ]
    },
    {
      "ru": [
        "Конфигуратор: вкладка DroneCAN и профиль ветра",
        "Конфигуратор не видел устройства на шине CAN: параметры датчиков и регуляторов на CAN приходилось менять сторонними программами. Ветер нельзя было включить и выключить одним профилем и ввести командой оператора.",
        "Вкладка «DroneCAN» пробрасывает шину CAN контроллера по MAVLink: список устройств с именем, состоянием, режимом, версиями ПО и железа и уникальным ID, чтение и запись параметров узла (записанное значение читается обратно), сохранение параметров в память узла, перезапуск узла и живые данные (воздушная скорость, GPS, батарея). Запись, сохранение и перезапуск разрешены только при DISARMED. Вкладка проверена на имитации контроллера и узла; на реальных узлах она ещё не проверялась. Обновление прошивки узлов в неё не входит. На главном экране появился профиль «Ветер»: ветер выкл, только команда или обучение, с записью параметра и проверкой по ответу контроллера, и ввод ветра командой оператора, в том числе «ветер 0» при резком штиле; команда работает и в полёте."
      ],
      "uk": [
        "Конфігуратор: вкладка DroneCAN і профіль вітру",
        "Конфігуратор не бачив пристроїв на шині CAN: параметри датчиків і регуляторів на CAN доводилося змінювати сторонніми програмами. Вітер не можна було ввімкнути й вимкнути одним профілем і ввести командою оператора.",
        "Вкладка «DroneCAN» прокидає шину CAN контролера по MAVLink: список пристроїв з ім’ям, станом, режимом, версіями ПЗ і заліза та унікальним ID, читання й запис параметрів вузла (записане значення читається назад), збереження параметрів у пам’ять вузла, перезапуск вузла та живі дані (повітряна швидкість, GPS, батарея). Запис, збереження й перезапуск дозволені лише за DISARMED. Вкладку перевірено на імітації контролера й вузла; на реальних вузлах її ще не перевіряли. Оновлення прошивки вузлів у неї не входить. На головному екрані з’явився профіль «Вітер»: вітер вимк, лише команда або навчання, із записом параметра й перевіркою за відповіддю контролера, та введення вітру командою оператора, зокрема «вітер 0» за різкого штилю; команда працює і в польоті."
      ],
      "en": [
        "Configurator: a DroneCAN tab and a wind profile",
        "The configurator did not see the devices on the CAN bus: the parameters of CAN sensors and regulators had to be changed with other programs. The wind could not be switched on and off with one profile or entered with an operator command.",
        "The “DroneCAN” tab forwards the CAN bus of the controller over MAVLink: a list of devices with name, health, mode, software and hardware versions and unique ID, reading and writing node parameters (the written value is read back), saving the parameters to the node memory, restarting a node, and live data (airspeed, GPS, battery). Writing, saving and restarting are allowed only while DISARMED. The tab was checked against a simulated controller and node; it has not been tried on real nodes yet. Updating node firmware is not part of it. The main screen has a Wind profile: wind off, command only or learning, with the parameter written and checked against the controller’s answer, and an input for the wind as an operator command, including wind 0 in a sudden calm; the command also works in flight."
      ]
    },
    {
      "ru": [
        "База прошивки: ArduPlane 4.7.3",
        "Версия 2.2 основана на ArduPlane 4.7.3.",
        "Версия 3.0 основана на том же ArduPlane 4.7.3. Все доработки A.T.L.A.S из версии 2.2 перенесены без изменений, в сообщениях станции о версии прошивки по-прежнему значится V4.7.3."
      ],
      "uk": [
        "База прошивки: ArduPlane 4.7.3",
        "Версія 2.2 заснована на ArduPlane 4.7.3.",
        "Версія 3.0 заснована на тому самому ArduPlane 4.7.3. Усі доопрацювання A.T.L.A.S з версії 2.2 перенесено без змін, у повідомленнях станції про версію прошивки досі значиться V4.7.3."
      ],
      "en": [
        "Firmware base: ArduPlane 4.7.3",
        "Version 2.2 is based on ArduPlane 4.7.3.",
        "Version 3.0 is based on the same ArduPlane 4.7.3. All A.T.L.A.S changes of version 2.2 were carried over unchanged, and the station messages that report the firmware version still say V4.7.3."
      ]
    },
    {
      "ru": [
        "Проверки 3.0 и границы подтверждённого результата",
        "Релиз 2.2 проверялся в SITL: четырнадцать контрольных сценариев и показательный часовой прогон на базе 4.7.3.",
        "Релиз-кандидат 3.0 прогнан в SITL на устойчивость и безопасность с новыми функциями и без них, в сравнении с 2.2: 165 полётов (134 ч), в том числе часовые полёты на двенадцати вариантах ветра, отказы Pitot, окна GPS, старты катапультой, верёвкой и броском, площадка, команды и параметры в полёте, фаззинг команд, полёты по несколько часов и сборка под UBSan. Найдены и исправлены две ошибки сторожа Pitot (ложная тревога в гладком планировании и молчание сторожа, если датчик вышел из строя под GPS), обе касались только предупреждений. Сборки для Matek H743-WING V3, Uni-IC743 Mini и Cube Orange Plus компилируются без предупреждений. Это проверка алгоритма на модели; стендовая и лётная проверка на реальном самолёте ещё предстоит."
      ],
      "uk": [
        "Перевірки 3.0 і межі підтвердженого результату",
        "Реліз 2.2 перевірявся в SITL: чотирнадцять контрольних сценаріїв і показовий годинний політ на базі 4.7.3.",
        "Релізний кандидат 3.0 прогнано в SITL на стійкість і безпеку з новими функціями та без них, порівняно з 2.2: 165 польотів (134 год), зокрема годинні польоти на дванадцяти варіантах вітру, відмови Піто, вікна GPS, старти катапультою, мотузкою й кидком, майданчик, команди й параметри в польоті, фаззинг команд, польоти по кілька годин і збірка під UBSan. Знайдено й виправлено дві помилки сторожа Піто (хибна тривога в гладкому планеруванні та мовчання сторожа, якщо датчик вийшов з ладу під GPS), обидві стосувалися лише попереджень. Збірки для Matek H743-WING V3, Uni-IC743 Mini і Cube Orange Plus компілюються без попереджень. Це перевірка алгоритму на моделі; стендова й льотна перевірка на реальному літаку ще попереду."
      ],
      "en": [
        "3.0 validation and its limits",
        "Release 2.2 was validated in SITL: fourteen control scenarios and a one-hour showcase flight on the 4.7.3 base.",
        "The 3.0 release candidate was run through SITL for stability and safety with the new functions on and off, against 2.2: 165 flights (134 h), including one-hour flights on twelve wind variants, Pitot failures, GPS windows, catapult, bungee and hand-throw launches, the pad, commands and parameters in flight, command fuzzing, flights of several hours and a UBSan build. Two bugs of the Pitot watch were found and fixed (a false alarm in a smooth glide and a silent watch when the sensor failed under GPS); both concerned warnings only. The builds for Matek H743-WING V3, Uni-IC743 Mini and Cube Orange Plus compile without warnings. This validates the algorithm on a model; bench and flight validation on a real aircraft is still pending."
      ]
    }
  ],
  "sources": [
    "ArduPlane/Plane.cpp",
    "ArduPlane/Plane.h",
    "ArduPlane/Parameters.cpp",
    "ArduPlane/Parameters.h",
    "ArduPlane/atlas_pitot_watch.cpp",
    "libraries/AP_AHRS/AP_AHRS.h",
    "libraries/AP_NavEKF3/AP_NavEKF3.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3.h",
    "libraries/AP_NavEKF3/AP_NavEKF3_Control.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3_NoAIDParams.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3_NoAIDParams.h",
    "libraries/AP_NavEKF3/AP_NavEKF3_PosVelFusion.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3_core.h",
    "libraries/GCS_MAVLink/GCS_Common.cpp"
  ],
  "sourceLabel": {
    "ru": "Файлы подтверждённых изменений",
    "uk": "Файли підтверджених змін",
    "en": "Files containing verified changes"
  }
};
