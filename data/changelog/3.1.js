'use strict';
// AI-assisted; verified 3.1 changes relative to 3.0, with hardware-validation limits. Public wording: what changes for the user, how it works and why, when it hurts; never thresholds, formulas or internals.
window.AtlasRelease31 = {
  "version": "3.1",
  "id": "release-3-1",
  "channel": "UPDATE",
  "baseLabel": {
    "ru": "В версии 3.0",
    "uk": "У версії 3.0",
    "en": "In version 3.0"
  },
  "modLabel": {
    "ru": "В версии 3.1",
    "uk": "У версії 3.1",
    "en": "In version 3.1"
  },
  "hint": {
    "ru": "Обновление относительно 3.0. ЭКСПЕРИМЕНТАЛЬНО: ветер, который счисление знает в полёте без GPS (введённый оператором или выученный по меткам), теперь учитывает и наведение. В AUTO (включая автопосадку), RTL, GUIDED и LOITER самолёт идёт по путевой линии с носом в ветер, а не целится носом в точку; в TAKEOFF и CRUISE меняется только усиление удержания курса; FBWA и ручные режимы не меняются. Функция работает только в полёте без GPS при включённом NOAID_WIND; нового параметра нет, при NOAID_WIND, равном 0, поведение как в 3.0. Это компромисс при отсутствии GPS: ошибки датчиков и меток могут быть приняты за ветер, функция не заменяет GPS и может не соответствовать ожиданиям. База прошивки та же, ArduPlane 4.7.3. Проверено в SITL; стендовая и лётная проверка на реальном самолёте ещё предстоит. Доступность HEX определяется каталогом сборок каждой платы.",
    "uk": "Оновлення відносно 3.0. ЕКСПЕРИМЕНТАЛЬНО: вітер, який лічба знає в польоті без GPS (уведений оператором або вивчений за мітками), тепер враховує й наведення. В AUTO (зокрема автопосадка), RTL, GUIDED і LOITER літак іде за шляховою лінією з носом у вітер, а не цілиться носом у точку; у TAKEOFF і CRUISE змінюється лише підсилення утримання курсу; FBWA і ручні режими не змінюються. Функція працює лише в польоті без GPS за ввімкненого NOAID_WIND; нового параметра немає, за NOAID_WIND, рівного 0, поведінка як у 3.0. Це компроміс за відсутності GPS: похибки датчиків і міток можуть бути сприйняті за вітер, функція не замінює GPS і може не відповідати очікуванням. База прошивки та сама, ArduPlane 4.7.3. Перевірено в SITL; стендова й льотна перевірка на реальному літаку ще попереду. Наявність HEX визначає каталог збірок кожної плати.",
    "en": "Changes from 3.0. EXPERIMENTAL: the wind that the dead reckoning knows in flight without GPS (entered by the operator or learned from fixes) is now used by the navigation as well. In AUTO (including the autoland), RTL, GUIDED and LOITER the aircraft flies along the ground track with the nose turned into the wind instead of aiming its nose at the point; in TAKEOFF and CRUISE only the gain of the heading hold changes; FBWA and the manual modes are unchanged. The function works only in flight without GPS with NOAID_WIND switched on; there is no new parameter, and with NOAID_WIND at 0 the behaviour is that of 3.0. It is a compromise for the absence of GPS: sensor and fix errors can be taken for wind, the function does not replace GPS and may not meet expectations. The firmware base is the same, ArduPlane 4.7.3. Tested in SITL; bench and flight validation on a real aircraft is still pending. HEX availability is shown separately for each board in the build catalogue."
  },
  "changes": [
    {
      "ru": [
        "Ветер в наведении без GPS: самолёт идёт по путевой линии (экспериментально)",
        "В версии 3.0 счисление знало ветер и считало позицию верно, но наведение по-прежнему видело самолёт летящим носом вперёд, как в штиль. На боковом ветре самолёт шёл к точке по кривой погони, в AUTO держался с постоянным смещением от линии, а круг вокруг точки получался вытянутым.",
        "Теперь наведение берёт ту же скорость, что и счисление: воздушную скорость вдоль носа плюс ветер, который знает прошивка (введён оператором, выучен по меткам или оба). Оно видит, куда самолёт сносит на самом деле, и само ставит нос в ветер на угол сноса, как при GPS: в GUIDED и RTL путь к точке прямой, в AUTO самолёт держит линию маршрута, круг получается ровным. Это не прогноз ветра: наведение верит той оценке, которую знает фильтр, и чем она точнее, тем лучше результат. Работает только в полёте без привязки позиции к GPS при включённом NOAID_WIND (команда оператора, обучение по меткам или оба); нового параметра нет, при NOAID_WIND, равном 0, поведение как в 3.0."
      ],
      "uk": [
        "Вітер у наведенні без GPS: літак іде за шляховою лінією (експериментально)",
        "У версії 3.0 лічба знала вітер і вважала позицію вірно, але наведення, як і раніше, бачило літак, що летить носом уперед, як у штиль. За бічного вітру літак ішов до точки за кривою погоні, в AUTO тримався зі сталим зміщенням від лінії, а коло навколо точки виходило витягнутим.",
        "Тепер наведення бере ту саму швидкість, що й лічба: повітряну швидкість уздовж носа плюс вітер, який знає прошивка (уведений оператором, вивчений за мітками або обидва). Воно бачить, куди літак зносить насправді, і само ставить ніс у вітер на кут зносу, як за GPS: у GUIDED і RTL шлях до точки прямий, в AUTO літак тримає лінію маршруту, коло виходить рівним. Це не прогноз вітру: наведення вірить тій оцінці, яку знає фільтр, і що вона точніша, то кращий результат. Працює лише в польоті без прив’язки позиції до GPS за ввімкненого NOAID_WIND (команда оператора, навчання за мітками або обидва); нового параметра немає, за NOAID_WIND, рівного 0, поведінка як у 3.0."
      ],
      "en": [
        "Wind in the navigation without GPS: the aircraft flies along the ground track (experimental)",
        "In version 3.0 the dead reckoning knew the wind and computed the position correctly, but the navigation still saw the aircraft flying nose-first as in still air. In a crosswind the aircraft reached a point along a pursuit curve, held a constant offset from the line in AUTO, and the circle round a point came out stretched.",
        "The navigation now takes the same velocity as the dead reckoning: the airspeed along the nose plus the wind that the firmware knows (entered by the operator, learned from fixes, or both). It sees where the aircraft is really being carried and turns the nose into the wind by the drift angle itself, as with GPS: in GUIDED and RTL the path to a point is straight, in AUTO the aircraft holds the route line, the circle comes out round. This is not a wind forecast: the navigation believes the estimate the filter already has, and the more accurate it is the better the result. It works only in flight without GPS aiding of the position and with NOAID_WIND switched on (operator command, learning from fixes, or both); there is no new parameter, and with NOAID_WIND at 0 the behaviour is that of 3.0."
      ]
    },
    {
      "ru": [
        "Какие режимы затронуты, а какие нет",
        "Было неясно, на какие режимы влияет учёт ветра.",
        "Направление ветра учитывают режимы, которые ведут самолёт к точке или по линии: AUTO, RTL, GUIDED и LOITER. Автопосадка в AUTO (заход по линии на точку посадки, в том числе после круга со снижением, и RTL с автопосадкой) ведётся тем же наведением: на боковом ветре самолёт идёт по линии захода, а не с постоянным смещением от неё; выравнивание, касание и автоматический дизарм остаются на штатной логике. В TAKEOFF, CRUISE и взлёте в AUTO курс по-прежнему держится по компасу, а не по путевому углу; меняется только усиление цепи удержания курса: оно следует скорости над землёй, как в обычном ArduPlane с GPS (при попутном ветре чуть резче, при встречном чуть мягче). FBWA, FBWB, STABILIZE, MANUAL, ACRO, AUTOTUNE и CIRCLE не затрагиваются: в них нет наведения по скорости над землёй, крен и тангаж задают ручки или готовый разворот, так что FBWA ведёт себя как в 3.0. При GPS (в том числе при автоматическом переходе на спутники), при недоступном датчике Pitot, при показании Pitot, невозможном в полёте (около нуля), и на земле ничего не меняется."
      ],
      "uk": [
        "Які режими зачеплено, а які ні",
        "Було незрозуміло, на які режими впливає врахування вітру.",
        "Напрям вітру враховують режими, що ведуть літак до точки або за лінією: AUTO, RTL, GUIDED і LOITER. Автопосадка в AUTO (захід за лінією на точку посадки, зокрема після кола зі зниженням, і RTL з автопосадкою) ведеться тим самим наведенням: за бічного вітру літак іде за лінією заходу, а не зі сталим зміщенням від неї; вирівнювання, дотик і автоматичне роззброєння лишаються на штатній логіці. У TAKEOFF, CRUISE і зльоті в AUTO курс, як і раніше, тримається за компасом, а не за шляховим кутом; змінюється лише підсилення ланцюга утримання курсу: воно йде за швидкістю над землею, як у звичайному ArduPlane з GPS (за попутного вітру трохи різкіше, за зустрічного трохи м’якше). FBWA, FBWB, STABILIZE, MANUAL, ACRO, AUTOTUNE і CIRCLE не зачіпаються: у них немає наведення за швидкістю над землею, крен і тангаж задають ручки або готовий розворот, тож FBWA поводиться як у 3.0. За GPS (зокрема за автоматичного переходу на супутники), за недоступного датчика Pitot, за показання Pitot, неможливого в польоті (близько нуля), і на землі нічого не змінюється."
      ],
      "en": [
        "Which modes are affected and which are not",
        "It was not clear which modes the wind handling touches.",
        "The direction of the wind is used by the modes that lead the aircraft to a point or along a line: AUTO, RTL, GUIDED and LOITER. The autoland in AUTO (an approach along the line to the landing point, including one after a circle down to the approach height, and RTL with autoland) uses the same navigation: in a crosswind the aircraft flies along the approach line instead of with a constant offset from it; the flare, the touchdown and the automatic disarm stay on the stock logic. TAKEOFF, CRUISE and the takeoff in AUTO still hold the heading by the compass rather than by the ground track; only the gain of the heading-hold loop changes: it follows the speed over the ground, as in ordinary ArduPlane with GPS (a little sharper with a tail wind, a little softer with a head wind). FBWA, FBWB, STABILIZE, MANUAL, ACRO, AUTOTUNE and CIRCLE are not touched: they have no navigation on the speed over the ground, the bank and pitch come from the sticks or a ready-made turn, so FBWA behaves as in 3.0. With GPS (including the automatic switch to the satellites), with an unavailable Pitot sensor, with a Pitot reading that is impossible in flight (about zero) and on the ground nothing changes."
      ]
    },
    {
      "ru": [
        "Рекомендации: как пользоваться",
        "Ветер без GPS можно было включить или выключить, но не было сказано, когда это помогает.",
        "Если ветер известен (метеосводка, ветромер на площадке, любой внешний источник), введите его в профиле «Ветер» конфигуратора или командой со станции до пуска и выберите «Только команду» (NOAID_WIND, равный 1): это самый предсказуемый вариант, ложный ветер не набирается. «Обучение» (7) имеет смысл при настоящем ветре и аккуратных метках оператора: прошивка находит ветер по разнице между счислением и меткой и продолжает пользоваться им, когда метки прекратились. Следите за сообщениями прошивки о ветре: если выученный ветер скачет или направлен явно не туда, введите верный ветер командой или «Ветер 0». В штиль обучение не нужно: оставьте NOAID_WIND равным 1 или 0; уже выученный ветер обнуляется командой «Ветер 0». Первые полёты с новой функцией проводите при слабом ветре и на безопасной высоте, а круг вокруг точки выбирайте с запасом по скорости сваливания: при сильном боковом ветре крен на подветренной стороне круга больше, как и при GPS. Перед автопосадкой без GPS введите ветер, ожидаемый у земли: он слабее, чем на высоте, и ветер, введённый для высоты, у земли завышен. Если сомневаетесь, поставьте 0: поведение будет таким же, как в 3.0."
      ],
      "uk": [
        "Рекомендації: як користуватися",
        "Вітер без GPS можна було ввімкнути або вимкнути, але не було сказано, коли це допомагає.",
        "Якщо вітер відомий (метеозведення, вітромір на майданчику, будь-яке зовнішнє джерело), уведіть його в профілі «Вітер» конфігуратора або командою зі станції до пуску й оберіть «Лише команда» (NOAID_WIND, рівний 1): це найпередбачуваніший варіант, хибний вітер не набирається. «Навчання» (7) має сенс за справжнього вітру й акуратних міток оператора: прошивка знаходить вітер за різницею між лічбою та міткою і далі користується ним, коли мітки припинилися. Стежте за повідомленнями прошивки про вітер: якщо вивчений вітер стрибає або спрямований явно не туди, уведіть вірний вітер командою або «Вітер 0». У штиль навчання не потрібне: лишайте NOAID_WIND рівним 1 або 0; уже вивчений вітер обнуляється командою «Вітер 0». Перші польоти з новою функцією проводьте за слабкого вітру й на безпечній висоті, а коло навколо точки обирайте із запасом за швидкістю звалювання: за сильного бічного вітру крен на підвітряному боці кола більший, як і за GPS. Перед автопосадкою без GPS уведіть вітер, очікуваний біля землі: він слабший, ніж на висоті, і вітер, уведений для висоти, біля землі завищений. Якщо сумніваєтеся, поставте 0: поведінка буде такою самою, як у 3.0."
      ],
      "en": [
        "Recommendations: how to use it",
        "The wind without GPS could be switched on or off, but nothing said when it helps.",
        "If the wind is known (a weather report, an anemometer at the field, any outside source), enter it in the Wind profile of the configurator or with a command from the station before the launch and pick “Command only” (NOAID_WIND at 1): it is the most predictable option and no false wind builds up. “Learning” (7) makes sense in a real wind with careful operator fixes: the firmware finds the wind from the difference between the dead reckoning and the fix and keeps using it when the fixes stop. Watch the firmware messages about the wind: if the learned wind jumps or clearly points the wrong way, enter the right wind with the command or send wind 0. In calm air the learning is not needed: leave NOAID_WIND at 1 or 0; a wind that has already been learned is zeroed with the wind 0 command. Make the first flights with the new function in a light wind and at a safe height, and choose the circle round a point with a margin over the stall speed: in a strong crosswind the bank on the downwind side of the circle is larger, as with GPS. Before an autoland without GPS enter the wind expected near the ground: it is weaker than aloft, and a wind entered for the height is too strong near the ground. If in doubt set 0: the behaviour will be the same as in 3.0."
      ]
    },
    {
      "ru": [
        "Когда это вредно и какие есть нюансы",
        "Оговорки о точности ветра без GPS нигде не были сказаны прямо.",
        "Функция экспериментальная и не заменяет GPS: изучение ветра — компромисс при отсутствии спутников, лучше, чем ничего, но не гарантия. Прошивка не может отличить ветер от других ошибок: ошибки наклона, шкалы Pitot и курса выглядят как ветер, и часть из них принимается за него (шкала и курс отделяются поправками R3, но не полностью). Ошибочная метка оператора учит ложный ветер, и самолёт идёт с неверным углом сноса, пока не придёт верная метка; неверно введённый ветер действует так же. Если ветер изменился, а меток нет, оценка устаревает, и наведение держит неверный угол сноса (NOAID_WAGE позволяет забывать оценку, но при неизменном ветре забывание вредит). В режиме обучения без регулярных меток выигрыша нет, возможна небольшая лишняя ошибка. При ветре, близком к скорости самолёта, и при упоре в предельный крен круг на подветренной стороне раздувается: аэродинамику функция не меняет. Отказ или залипание Pitot функция не лечит: сторож только предупреждает, а залипшее показание опасно и без неё. Автопосадка без GPS садится в точку, где самолёт находится по счислению, а реальное касание отличается на ошибку счисления; заход нужно рассчитывать так, чтобы самолёт приходил на точку захода не выше глиссады: если он приходит выше и не успевает снизиться, выравнивание начинается раньше времени и самолёт садится далеко за точкой (в 3.0 и 2.2 так же). Позиция по-прежнему считается по счислению и со временем расходится, метки оператора остаются нужны. Если оценка ветра неверна, путь самолёта над землёй выглядит иначе; ошибка позиции в SITL при этом растёт примерно так же, как без этой функции (при неточных метках в среднем немного быстрее): наведение лишь следует оценке, которую фильтр уже использует."
      ],
      "uk": [
        "Коли це шкідливо і які є нюанси",
        "Застереження щодо точності вітру без GPS ніде не були сказані прямо.",
        "Функція експериментальна й не замінює GPS: вивчення вітру — компроміс за відсутності супутників, краще, ніж нічого, але не гарантія. Прошивка не може відрізнити вітер від інших похибок: похибки нахилу, шкали Pitot і курсу виглядають як вітер, і частину з них сприймають за нього (шкала й курс відокремлюються поправками R3, але не повністю). Помилкова мітка оператора вчить хибний вітер, і літак іде з невірним кутом зносу, доки не прийде вірна мітка; невірно введений вітер діє так само. Якщо вітер змінився, а міток немає, оцінка застаріває, і наведення тримає невірний кут зносу (NOAID_WAGE дозволяє забувати оцінку, але за незмінного вітру забування шкодить). У режимі навчання без регулярних міток виграшу немає, можлива невелика зайва похибка. За вітру, близького до швидкості літака, і за упору в граничний крен коло на підвітряному боці роздувається: аеродинаміку функція не змінює. Відмову або залипання Pitot функція не лікує: сторож лише попереджає, а залипле показання небезпечне і без неї. Автопосадка без GPS сідає в точку, де літак перебуває за лічбою, а реальний дотик відрізняється на похибку лічби; захід треба розраховувати так, щоб літак приходив на точку заходу не вище за глісаду: якщо він приходить вище й не встигає знизитися, вирівнювання починається раніше часу й літак сідає далеко за точкою (у 3.0 і 2.2 так само). Позиція, як і раніше, рахується за лічбою й з часом розходиться, мітки оператора лишаються потрібні. Якщо оцінка вітру хибна, шлях літака над землею виглядає інакше; похибка позиції в SITL при цьому росте приблизно так само, як без цієї функції (за неточних міток у середньому трохи швидше): наведення лише йде за оцінкою, яку фільтр уже використовує."
      ],
      "en": [
        "When it hurts and the nuances",
        "The caveats about the accuracy of a wind without GPS were never stated plainly.",
        "The function is experimental and does not replace GPS: learning the wind is a compromise in the absence of satellites, better than nothing but not a guarantee. The firmware cannot tell the wind from other errors: tilt, Pitot scale and heading errors look like wind, and part of them is taken for it (the scale and the heading are separated by the R3 corrections, but not completely). A wrong operator fix teaches a false wind, and the aircraft flies with the wrong drift angle until a correct fix arrives; a wind entered wrongly acts the same way. If the wind changes while there are no fixes, the estimate goes stale and the navigation holds the wrong drift angle (NOAID_WAGE lets the estimate be forgotten, but with an unchanged wind forgetting hurts). In the learning mode without regular fixes there is no gain and a small extra error is possible. With a wind close to the airspeed, and when the bank hits its limit, the circle bulges on the downwind side: the function does not change the aerodynamics. A failed or frozen Pitot is not cured: the watch only warns, and a frozen reading is dangerous without the function as well. An autoland without GPS lands at the point where the aircraft is by the dead reckoning, and the real touchdown differs by its error; plan the approach so that the aircraft reaches the approach point no higher than the glide slope: if it arrives higher and cannot come down in time, the flare starts too early and the aircraft lands far beyond the point (the same in 3.0 and 2.2). The position is still dead-reckoned and drifts with time, so the operator’s fixes are still needed. If the wind estimate is wrong the path of the aircraft over the ground looks different; in SITL the position error then grows at about the same rate as without the function (a little faster on average with inaccurate fixes): the navigation only follows the estimate the filter already uses."
      ]
    },
    {
      "ru": [
        "Где виден выученный ветер: OSD, станция, лог",
        "Не было сказано, видит ли оператор выученный ветер.",
        "Выученный и введённый ветер объявляется сообщениями прошивки («NOAID wind …») в панели сообщений станции и OSD, если она включена, и записывается в лог (запись NWD). Указатель ветра на OSD и сообщение WIND станции его не показывают: они берут ветер из фильтра EKF3, а ветер счисления без GPS хранится отдельно, поэтому без GPS на них нуль. Скорость над землёй (GSPD) без GPS по-прежнему показывает воздушную скорость вдоль носа и ветра не учитывает."
      ],
      "uk": [
        "Де видно вивчений вітер: OSD, станція, лог",
        "Не було сказано, чи бачить оператор вивчений вітер.",
        "Вивчений і введений вітер оголошується повідомленнями прошивки («NOAID wind …») у панелі повідомлень станції та OSD, якщо вона ввімкнена, і записується в лог (запис NWD). Покажчик вітру на OSD і повідомлення WIND станції його не показують: вони беруть вітер із фільтра EKF3, а вітер лічби без GPS зберігається окремо, тому без GPS на них нуль. Швидкість над землею (GSPD) без GPS, як і раніше, показує повітряну швидкість уздовж носа й вітру не враховує."
      ],
      "en": [
        "Where the learned wind can be seen: OSD, station, log",
        "It was not said whether the operator can see the learned wind.",
        "A learned or entered wind is announced by firmware messages (“NOAID wind …”) in the message panel of the station and of the OSD, if it is enabled, and is written to the log (the NWD record). The wind pointer on the OSD and the WIND message of the station do not show it: they take the wind from the EKF3 filter, while the wind of the dead reckoning without GPS is kept separately, so without GPS they show zero. The speed over the ground (GSPD) without GPS still shows the airspeed along the nose and does not include the wind."
      ]
    },
    {
      "ru": [
        "Конфигуратор: предупреждение и рекомендации у карточки «Ветер»",
        "Карточка «Ветер» не говорила, что функция экспериментальная, и не подсказывала, как учить ветер в полёте.",
        "Над профилем ветра появилось постоянное предупреждение: функция экспериментальная, оценка ветра без GPS может быть неверной, наведение теперь ей верит, функция не заменяет GPS; ссылка ведёт к разделу 3.1 этого списка изменений. В подсказках профиля указано, что он работает с прошивкой 3.0 и новее. В карточку добавлены раздел «Как учить ветер в полёте» (когда и как ставить метки, на каких курсах, что делать перед заходом на посадку и если оценка скачет) и предложение включить плавное применение метки (NOAID_SLEW), когда обучение включено, а метка пока сдвигает позицию мгновенно: тогда крен наведения не скачет после каждой метки. Предложение появляется только при DISARMED и записывает один параметр после подтверждения; уже выбранное значение оно не перезаписывает."
      ],
      "uk": [
        "Конфігуратор: попередження й рекомендації біля картки «Вітер»",
        "Картка «Вітер» не казала, що функція експериментальна, і не підказувала, як навчати вітер у польоті.",
        "Над профілем вітру з’явилося постійне попередження: функція експериментальна, оцінка вітру без GPS може бути хибною, наведення тепер їй вірить, функція не замінює GPS; посилання веде до розділу 3.1 цього списку змін. У підказках профілю зазначено, що він працює з прошивкою 3.0 і новішою. До картки додано розділ «Як навчати вітер у польоті» (коли й як ставити мітки, на яких курсах, що робити перед заходом на посадку і якщо оцінка стрибає) та пропозицію ввімкнути плавне застосування мітки (NOAID_SLEW), коли навчання ввімкнено, а мітка поки що зсуває позицію миттєво: тоді крен наведення не стрибає після кожної мітки. Пропозиція з’являється лише при DISARMED і записує один параметр після підтвердження; уже обране значення вона не перезаписує."
      ],
      "en": [
        "Configurator: a warning and recommendations on the Wind card",
        "The Wind card did not say that the function is experimental and did not tell how to teach the wind in flight.",
        "A permanent warning now sits above the wind profile: the function is experimental, a wind estimate without GPS can be wrong, the navigation now believes it, and the function does not replace GPS; a link leads to the 3.1 section of this changelog. The hints of the profile say that it works with firmware 3.0 and newer. The card also gained a section “How to teach the wind in flight” (when and how to place the fixes, on which headings, what to do before an approach and when the estimate jumps) and an offer to switch on the gradual application of a fix (NOAID_SLEW) when learning is on and a fix still moves the position at once: the roll command of the navigation then does not jump after every fix. The offer appears only while DISARMED and writes one parameter after a confirmation; it never overwrites a value that has already been chosen."
      ]
    },
    {
      "ru": [
        "База прошивки: ArduPlane 4.7.3",
        "Версия 3.0 основана на ArduPlane 4.7.3.",
        "Версия 3.1 основана на том же ArduPlane 4.7.3. Все доработки A.T.L.A.S из версии 3.0 перенесены без изменений, кроме описанного выше; в сообщениях станции о версии прошивки по-прежнему значится V4.7.3."
      ],
      "uk": [
        "База прошивки: ArduPlane 4.7.3",
        "Версія 3.0 заснована на ArduPlane 4.7.3.",
        "Версія 3.1 заснована на тому самому ArduPlane 4.7.3. Усі доопрацювання A.T.L.A.S з версії 3.0 перенесено без змін, окрім описаного вище; у повідомленнях станції про версію прошивки досі значиться V4.7.3."
      ],
      "en": [
        "Firmware base: ArduPlane 4.7.3",
        "Version 3.0 is based on ArduPlane 4.7.3.",
        "Version 3.1 is based on the same ArduPlane 4.7.3. All A.T.L.A.S changes of version 3.0 were carried over unchanged except for what is described above, and the station messages that report the firmware version still say V4.7.3."
      ]
    },
    {
      "ru": [
        "Проверки 3.1 и границы подтверждённого результата",
        "Версия 3.0 проверялась на устойчивость и безопасность; проверки наведения с ветром в ней не было.",
        "Правка проверена в SITL парами «как в 3.0» и «с правкой» при одинаковых условиях: 393 полёта (114 ч). Режимы RTL, TAKEOFF, CRUISE, GUIDED, LOITER и AUTO (в том числе полёт по миссии с взлётом и возвратом и автопосадка: заход по прямой, заход после круга со снижением, RTL с автопосадкой) и FBWA на ветрах с разных сторон и разной силы; точная, неверная и абсурдная команда ветра; ветер, выученный по меткам; штиль; отказы Pitot (недоступен, ноль, залипание); окна GPS; потеря связи с переходом в RTL; переключение NOAID_WIND и команда «ветер 0» в полёте; повторы с разными зёрнами и разными моментами отказа; длинные полёты (больше часа) на всех режимах с окнами GPS и метками оператора. Результат: в режимах с наведением по точке и линии путь прямой, смещение от линии в AUTO исчезает, круг ровный, в автопосадке на боковом ветре смещение от линии захода исчезает, а выравнивание и касание остаются штатными; в TAKEOFF, CRUISE и FBWA отличий нет; предельный крен и запас по скорости не меняются; при NOAID_WIND, равном 0, и в штиль поведение такое же, как в 3.0, а при остальных параметрах NOAID_ по умолчанию и как в 2.2, в том числе по точкам, в LOITER и при автопосадке; при отказах Pitot и окнах GPS результат не хуже, чем в 3.0 (сам отказ датчика опасен в обеих версиях). Это проверка алгоритма на модели; стендовая и лётная проверка на реальном самолёте ещё предстоит, и ошибки ветра на реальном самолёте могут оказаться другими."
      ],
      "uk": [
        "Перевірки 3.1 і межі підтвердженого результату",
        "Версія 3.0 перевірялася на стійкість і безпеку; перевірки наведення з вітром у ній не було.",
        "Правку перевірено в SITL парами «як у 3.0» і «з правкою» за однакових умов: 393 польоти (114 год). Режими RTL, TAKEOFF, CRUISE, GUIDED, LOITER і AUTO (зокрема політ за місією зі зльотом і поверненням та автопосадка: захід за прямою, захід після кола зі зниженням, RTL з автопосадкою) та FBWA за вітрів з різних боків і різної сили; точна, хибна й абсурдна команда вітру; вітер, вивчений за мітками; штиль; відмови Pitot (недоступний, нуль, залипання); вікна GPS; втрата зв’язку з переходом у RTL; перемикання NOAID_WIND і команда «вітер 0» у польоті; повтори з різними зернами й різними моментами відмови; тривалі польоти (понад годину) в усіх режимах із вікнами GPS і мітками оператора. Результат: у режимах із наведенням за точкою та лінією шлях прямий, зміщення від лінії в AUTO зникає, коло рівне, в автопосадці за бічного вітру зміщення від лінії заходу зникає, а вирівнювання й дотик лишаються штатними; у TAKEOFF, CRUISE і FBWA відмінностей немає; граничний крен і запас за швидкістю не змінюються; за NOAID_WIND, рівного 0, і в штиль поведінка така сама, як у 3.0, а за решти параметрів NOAID_ за замовчуванням і як у 2.2, зокрема за точками, у LOITER і за автопосадки; за відмов Pitot і вікон GPS результат не гірший, ніж у 3.0 (сама відмова датчика небезпечна в обох версіях). Це перевірка алгоритму на моделі; стендова й льотна перевірка на реальному літаку ще попереду, і похибки вітру на реальному літаку можуть виявитися іншими."
      ],
      "en": [
        "3.1 validation and its limits",
        "Version 3.0 was validated for stability and safety; there was no check of the navigation with the wind in it.",
        "The change was run through SITL in pairs, “as in 3.0” and “with the change”, under identical conditions: 393 flights (114 h). The modes RTL, TAKEOFF, CRUISE, GUIDED, LOITER and AUTO (including a mission flight with takeoff and return and the autoland: an approach along a straight line, an approach after a circle down to the approach height, RTL with autoland) and FBWA in winds from different sides and of different strength; an exact, a wrong and an absurd wind command; a wind learned from fixes; calm air; Pitot failures (unavailable, zero, frozen); GPS windows; a lost radio with the switch to RTL; switching NOAID_WIND and the wind 0 command in flight; repeats with different seeds and different moments of the failure; long flights (over an hour) in all modes with GPS windows and operator fixes. The result: in the modes that navigate to a point or along a line the path is straight, the offset from the line in AUTO disappears, the circle is round, in the autoland in a crosswind the offset from the approach line disappears while the flare and the touchdown stay stock; TAKEOFF, CRUISE and FBWA show no difference; the bank limit and the speed margin do not change; with NOAID_WIND at 0 and in calm air the behaviour is the same as in 3.0, and with the other NOAID_ parameters at their defaults the same as in 2.2, including the waypoints, LOITER and the autoland; with Pitot failures and GPS windows the result is no worse than in 3.0 (the sensor failure itself is dangerous in both versions). This validates the algorithm on a model; bench and flight validation on a real aircraft is still pending, and the wind errors of a real aircraft may turn out different."
      ]
    }
  ],
  "sources": [
    "libraries/AP_AHRS/AP_AHRS.cpp",
    "libraries/AP_AHRS/AP_AHRS.h",
    "libraries/AP_NavEKF3/AP_NavEKF3.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3.h",
    "libraries/AP_NavEKF3/AP_NavEKF3_PosVelFusion.cpp",
    "libraries/AP_NavEKF3/AP_NavEKF3_core.h"
  ],
  "sourceLabel": {
    "ru": "Файлы подтверждённых изменений",
    "uk": "Файли підтверджених змін",
    "en": "Files containing verified changes"
  }
};
