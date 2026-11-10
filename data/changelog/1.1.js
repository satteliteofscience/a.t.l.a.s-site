'use strict';

// Each entry contains a title, the upstream behavior, and the A.T.L.A.S. behavior.
window.AtlasRelease11 = (() => {
  const entry = (ru, uk, en) => ({ru, uk, en});
  return {
    version: '1.1',
    id: 'release-1-1',
    channel: 'SOURCE',
    hint: {
      ru: 'Сверка рабочего дерева A.T.L.A.S. с тегом Plane-4.7.2. Наличие записи здесь не определяет доступность сборок.',
      uk: 'Звірка робочого дерева A.T.L.A.S. з тегом Plane-4.7.2. Наявність запису тут не визначає доступність збірок.',
      en: 'A.T.L.A.S. working tree compared with the Plane-4.7.2 tag. Build availability is listed separately.'
    },
    sourceLabel: {
      ru: '47 изменённых или добавленных файлов кода и поддержки плат',
      uk: '47 змінених або доданих файлів коду та підтримки плат',
      en: '47 modified or added code and board-support files'
    },
    changes: [
      entry(
        ['Старт EKF3 без GPS', 'Инициализация самолёта учитывает доступность GPS и выбранные источники.', 'Для явной конфигурации NOAID с компасом и барометром добавлен путь инициализации без 3D-фикса. Ветка с выбранным GPS сохраняет собственные проверки.'],
        ['Старт EKF3 без GPS', 'Ініціалізація літака враховує доступність GPS та вибрані джерела.', 'Для явної конфігурації NOAID з компасом і барометром додано шлях ініціалізації без 3D-фікса. Гілка з вибраним GPS зберігає власні перевірки.'],
        ['GPS-free EKF3 startup', 'Plane initialization considers GPS availability and the selected sources.', 'An explicit compass/barometer NOAID configuration can initialize without a 3D fix. The GPS-selected path retains its own checks.']),
      entry(
        ['Выбор активного AHRS', 'В ArduPlane переключение оценщика учитывает статус горизонтального решения.', 'При явном NOAID EKF3 может отдавать ориентацию и высоту без горизонтального решения GPS. Проверки пригодности фильтра остаются.'],
        ['Вибір активного AHRS', 'В ArduPlane перемикання оцінювача враховує статус горизонтального розв’язку.', 'За явного NOAID EKF3 може віддавати орієнтацію та висоту без горизонтального розв’язку GPS. Перевірки придатності фільтра зберігаються.'],
        ['Active AHRS selection', 'ArduPlane estimator selection considers horizontal-solution status.', 'Explicit NOAID can supply EKF3 attitude and height without a GPS horizontal solution. Estimator suitability checks remain in place.']),
      entry(
        ['Вектор скорости для L1', 'L1 получает общий вектор путевой скорости AHRS.', 'Для маршрута, виража ожидания и удержания направления используется отдельный навигационный вектор. В NOAID он может строиться из измеренной TAS и курса EKF3 с допущением нулевого ветра.'],
        ['Вектор швидкості для L1', 'L1 отримує загальний вектор шляхової швидкості AHRS.', 'Для маршруту, віражу очікування й утримання напрямку використовується окремий навігаційний вектор. У NOAID він може будуватися з виміряної TAS і курсу EKF3 з припущенням нульового вітру.'],
        ['L1 velocity vector', 'L1 takes the general AHRS groundspeed vector.', 'Waypoint, loiter and heading control use a separate navigation vector. In NOAID it can use measured TAS and EKF3 heading under a zero-wind assumption.']),
      entry(
        ['Скорость в телеметрии', 'Индикация пользуется общим расчётом AHRS.', 'Разделены скалярная индикация GSPD, навигационный вектор и состояние скорости EKF3. Измеренная скорость воздуха не становится измерением скорости относительно земли.'],
        ['Швидкість у телеметрії', 'Індикація використовує загальний розрахунок AHRS.', 'Розділено скалярну індикацію GSPD, навігаційний вектор і стан швидкості EKF3. Виміряна швидкість повітря не стає виміром швидкості відносно землі.'],
        ['Telemetry speed', 'The display uses the general AHRS calculation.', 'Scalar GSPD, the navigation vector and the EKF3 velocity state are handled separately. Airspeed does not become a measurement of speed over the ground.']),
      entry(
        ['Проверка запуска NOAID', 'Отдельного детектора запуска для псевдоскорости NOAID нет.', 'Продольный импульс IMU открывает кандидата. Проверяется накопленный прирост скорости, с учётом торможения и предельного окна времени. ARM и продувка Пито сами по себе запуск не подтверждают.'],
        ['Перевірка запуску NOAID', 'Окремого детектора запуску для псевдошвидкості NOAID немає.', 'Поздовжній імпульс IMU відкриває кандидата. Перевіряється накопичений приріст швидкості з урахуванням гальмування та обмеження часу. ARM і продування Піто самі по собі запуск не підтверджують.'],
        ['NOAID launch check', 'There is no dedicated launch detector for NOAID pseudo-velocity.', 'A forward IMU impulse opens a candidate. Accumulated speed change, deceleration and the time window determine confirmation. Arming and Pitot pressure alone cannot confirm a launch.']),
      entry(
        ['Отмена ложного запуска и потеря TAS', 'Нет переходов для специального наблюдения TAS в NOAID.', 'Отклонённый кандидат возвращает наземные ограничения. После подтверждения полёта просроченная или невалидная TAS прекращает соответствующее слияние, оставляя инерциальный прогноз и независимый канал высоты.'],
        ['Скасування хибного запуску та втрата TAS', 'Немає переходів для спеціального спостереження TAS у NOAID.', 'Відхилений кандидат повертає наземні обмеження. Після підтвердження польоту застаріла або невалідна TAS припиняє відповідне злиття, залишаючи інерціальний прогноз і незалежний канал висоти.'],
        ['Rejected launch and TAS loss', 'There are no transitions for a dedicated NOAID TAS observation.', 'A rejected candidate restores ground constraints. After flight confirmation, stale or invalid TAS stops the corresponding fusion while inertial prediction and independent height aiding continue.']),
      entry(
        ['Состояние полёта EKF3', 'Штатные признаки движения и высоты определяют состояние на земле и в воздухе.', 'Для NOAID связаны запуск, инерциальные признаки и изменение барометрической высоты. Подтверждение полёта отделено от разрешения полного 3D-слияния магнитометра.'],
        ['Стан польоту EKF3', 'Штатні ознаки руху й висоти визначають стан на землі та в повітрі.', 'Для NOAID пов’язано запуск, інерціальні ознаки та зміну барометричної висоти. Підтвердження польоту відокремлено від дозволу повного 3D-злиття магнітометра.'],
        ['EKF3 flight state', 'Stock motion and height cues determine ground and airborne status.', 'NOAID links launch, inertial cues and barometric height change. Flight confirmation is separate from authorization for full 3D magnetometer fusion.']),
      entry(
        ['Модель TAS в EKF3', 'В NOAID отсутствует модифицированное двухосевое наблюдение скорости из TAS и ориентации.', 'Горизонтальная проекция TAS формирует совместное N/E-наблюдение. Якобиан учитывает квартернион, а шум двух компонент включает общую ошибку Пито.'],
        ['Модель TAS в EKF3', 'У NOAID відсутнє модифіковане двовісне спостереження швидкості з TAS та орієнтації.', 'Горизонтальна проєкція TAS формує спільне N/E-спостереження. Якобіан враховує кватерніон, а шум двох компонент включає спільну похибку Піто.'],
        ['EKF3 TAS model', 'NOAID has no modified two-axis velocity observation from TAS and attitude.', 'The horizontal TAS projection forms a joint N/E observation. Its Jacobian includes quaternion terms and its two-axis noise includes shared Pitot uncertainty.']),
      entry(
        ['Вес TAS в манёвре', 'Стандартная обработка NOAID не включает этот вес псевдоскорости.', 'Шум псевдоскорости меняется по признакам манёвра. При достоверной TAS продольные и поперечные инерциальные приращения обрабатываются с учётом реального ускорения в вираже.'],
        ['Вага TAS у маневрі', 'Стандартна обробка NOAID не включає цю вагу псевдошвидкості.', 'Шум псевдошвидкості змінюється за ознаками маневру. За достовірної TAS поздовжні й поперечні інерціальні прирости обробляються з урахуванням реального прискорення у віражі.'],
        ['TAS weighting in maneuvers', 'Stock NOAID does not use this pseudo-velocity weighting.', 'Pseudo-velocity noise varies with maneuver cues. With valid TAS, inertial increments can retain the real acceleration in a turn.']),
      entry(
        ['Смещения акселерометра и ковариация', 'Стандартные обновления используют штатные маски усиления.', 'Добавлены выборочные маски NOAID и согласованное обновление ковариации в форме Джозефа в изменённых ветвях с маскированным усилением. Ограничение дисперсий позиции масштабирует связанные ковариации.'],
        ['Зміщення акселерометра та коваріація', 'Стандартні оновлення використовують штатні маски підсилення.', 'Додано вибіркові маски NOAID та узгоджене оновлення коваріації у формі Джозефа у змінених гілках із маскованим підсиленням. Обмеження дисперсій позиції масштабує пов’язані коваріації.'],
        ['Accelerometer bias and covariance', 'Stock updates use the standard gain masks.', 'NOAID adds selective masks and Joseph-form covariance updates in the modified masked-gain paths. Position variance limiting scales the related cross-covariances.']),
      entry(
        ['Барометр и вертикальные состояния', 'Высота обрабатывается штатным скалярным обновлением.', 'В изменённом вертикальном обновлении фильтр может подавлять небезопасные компоненты усиления, сохраняя пригодное наблюдение высоты. Добавлена диагностика невязки и вертикальной ковариации.'],
        ['Барометр і вертикальні стани', 'Висота обробляється штатним скалярним оновленням.', 'У зміненому вертикальному оновленні фільтр може пригнічувати небезпечні компоненти підсилення, зберігаючи придатне спостереження висоти. Додано діагностику нев’язки й вертикальної коваріації.'],
        ['Barometer and vertical states', 'Height uses the stock scalar update.', 'The modified vertical update can suppress unsafe gain components while retaining a usable height observation. Innovation and vertical covariance diagnostics were added.']),
      entry(
        ['Магнитный курс в NOAID', 'Магнитное слияние и сбросы курса следуют штатным веткам.', 'Для конфигурации только с компасом изменены допуски и условия коррекции yaw, исключена подмена курса GPS, добавлена обработка повторного чтения выбранного компаса через проверки невязки.'],
        ['Магнітний курс у NOAID', 'Магнітне злиття та скидання курсу йдуть штатними гілками.', 'Для конфігурації лише з компасом змінено допуски та умови корекції yaw, виключено підміну курсу GPS, додано повторне читання вибраного компаса через перевірки нев’язки.'],
        ['Magnetic heading in NOAID', 'Magnetic fusion and heading resets use stock paths.', 'Compass-only operation has revised yaw correction gates and avoids substitution from GPS course. It can retry the selected compass through innovation checks.']),
      entry(
        ['Диагностика NOAID', 'Используются штатные сообщения и пакеты EKF3.', 'NFST, NFPB, NFMG, NFGP, NFSN и XKD показывают состояние полёта, bias, ветки компаса и GPS, свежесть данных и диагностику высоты.'],
        ['Діагностика NOAID', 'Використовуються штатні повідомлення та пакети EKF3.', 'NFST, NFPB, NFMG, NFGP, NFSN та XKD показують стан польоту, bias, гілки компаса й GPS, свіжість даних і діагностику висоти.'],
        ['NOAID diagnostics', 'Stock EKF3 messages and log packets are available.', 'NFST, NFPB, NFMG, NFGP, NFSN and XKD expose flight state, bias, compass and GPS paths, data age, and height diagnostics.']),
      entry(
        ['TAKEOFF без GPS', 'TAKEOFF использует штатные признаки места, курса и высоты.', 'Добавлен путь с курсом AHRS и относительной высотой по барометру для явно выбранного GPS-free запуска. Учтены вход в режим уже в воздухе и тайм-аут.'],
        ['TAKEOFF без GPS', 'TAKEOFF використовує штатні ознаки місця, курсу й висоти.', 'Додано шлях із курсом AHRS та відносною висотою за барометром для явно вибраного запуску без GPS. Враховано вхід у режим уже в повітрі та тайм-аут.'],
        ['TAKEOFF without GPS', 'TAKEOFF uses the stock position, course and height logic.', 'Explicit GPS-free launch can use AHRS heading and barometric relative height. Airborne re-entry and timeout are also handled.']),
      entry(
        ['Условия запуска и этапы взлёта', 'Используются стандартные проверки броска, тяги и переходов.', 'Переработаны проверки ARM, безопасности, ускорения, счётчика событий и EAS. Обновлены запуск тяги, подъём носа, завершение набора, переходы AUTO NAV_TAKEOFF/NAV_LAND и обработка прерывания.'],
        ['Умови запуску та етапи зльоту', 'Використовуються стандартні перевірки кидка, тяги й переходів.', 'Перероблено перевірки ARM, безпеки, прискорення, лічильника подій та EAS. Оновлено запуск тяги, підйом носа, завершення набору, переходи AUTO NAV_TAKEOFF/NAV_LAND та обробку переривання.'],
        ['Launch gates and takeoff stages', 'The stock launch, throttle and transition checks apply.', 'Arming, safety, acceleration, event count and EAS checks were revised. Throttle release, rotation, level-off, AUTO NAV_TAKEOFF/NAV_LAND stages and abort handling were updated.']),
      entry(
        ['Заводские значения параметров', 'AUTOTUNE_LEVEL = 6, TKOFF_THR_MINACC = 0, TKOFF_THR_DELAY = 2, TKOFF_THR_MAX_T = 4, TKOFF_THR_IDLE = 0.', 'В исходниках значения соответственно 5, 10, 0, 10 и 30. Также изменён дефолт TKOFF_ALT до 150 м. Сохранённый профиль может их переопределять.'],
        ['Заводські значення параметрів', 'AUTOTUNE_LEVEL = 6, TKOFF_THR_MINACC = 0, TKOFF_THR_DELAY = 2, TKOFF_THR_MAX_T = 4, TKOFF_THR_IDLE = 0.', 'У коді значення відповідно 5, 10, 0, 10 і 30. Також змінено типове TKOFF_ALT до 150 м. Збережений профіль може їх перевизначати.'],
        ['Firmware defaults', 'AUTOTUNE_LEVEL = 6, TKOFF_THR_MINACC = 0, TKOFF_THR_DELAY = 2, TKOFF_THR_MAX_T = 4, TKOFF_THR_IDLE = 0.', 'The source defaults are 5, 10, 0, 10 and 30 respectively. TKOFF_ALT defaults to 150 m. Saved profiles can override these values.']),
      entry(
        ['CRUISE: управление курсом', 'Штатный CRUISE удерживает курс через геометрию маршрута.', 'Захват ждёт выравнивания крыльев либо тайм-аута. Стик меняет целевой курс с мёртвой зоной и ограничением упреждения, AHRS служит опорой для удержания курса.'],
        ['CRUISE: керування курсом', 'Штатний CRUISE утримує курс через геометрію маршруту.', 'Захоплення чекає вирівнювання крил або тайм-ауту. Стик змінює цільовий курс із мертвою зоною та обмеженням випередження, AHRS є опорою для утримання курсу.'],
        ['CRUISE heading control', 'Stock CRUISE holds course through waypoint geometry.', 'Heading capture waits for wings level or a timeout. Stick input slews the target with a deadband and lead limit, and AHRS supplies the heading reference.']),
      entry(
        ['CRUISE: высота и тяга', 'Применяется штатная логика высоты CRUISE.', 'Стик тангажа меняет целевую высоту с темпом FBWB_CLIMB_RATE. После отпускания удерживается цель, а TECS распределяет тангаж и тягу с ограничением набора при малой скорости.'],
        ['CRUISE: висота й тяга', 'Застосовується штатна логіка висоти CRUISE.', 'Стик тангажу змінює цільову висоту з темпом FBWB_CLIMB_RATE. Після відпускання утримується ціль, а TECS розподіляє тангаж і тягу з обмеженням набору за малої швидкості.'],
        ['CRUISE height and throttle', 'CRUISE uses its stock altitude logic.', 'Elevator input adjusts the target at FBWB_CLIMB_RATE. Releasing the stick holds that target, with TECS managing pitch and throttle and low-speed climb protection.']),
      entry(
        ['AUTOLAND: источник направления', 'Используется штатное определение направления захода.', 'AUTOLAND_OPTIONS = 0 использует направление компаса, захваченное при ARM, и оценку позиции AHRS. Бит 0 (значение 1) выбирает путевой курс GPS. Добавлены статусы захвата направления.'],
        ['AUTOLAND: джерело напрямку', 'Використовується штатне визначення напрямку заходу.', 'AUTOLAND_OPTIONS = 0 використовує напрямок компаса, захоплений під час ARM, та оцінку позиції AHRS. Біт 0 (значення 1) вибирає шляховий курс GPS. Додано статуси захоплення напрямку.'],
        ['AUTOLAND direction source', 'Approach direction follows stock logic.', 'AUTOLAND_OPTIONS = 0 uses compass heading captured at arming and AHRS position. Bit 0 (value 1) selects GPS ground course. Direction capture status is reported.']),
      entry(
        ['FBWA: RUD_LIMIT_DEG', 'Элероны задают крен, ручной руль добавляется в канал рыскания.', 'Экспериментальные 0–45° задают добавку к общему запросу крена при согласованном вводе стиков. Учитываются угол, измеренная скорость, защита от сваливания и общий потолок команды.'],
        ['FBWA: RUD_LIMIT_DEG', 'Елерони задають крен, ручне кермо додається в канал рискання.', 'Експериментальні 0–45° задають добавку до спільного запиту крену за узгодженого вводу стиків. Враховуються кут, виміряна швидкість, захист від звалювання та загальна межа команди.'],
        ['FBWA RUD_LIMIT_DEG', 'Ailerons command bank and manual rudder adds yaw input.', 'The experimental 0–45° allowance adds to a shared bank request when both sticks agree. Bank, measured airspeed, stall prevention and a total demand ceiling are considered.']),
      entry(
        ['FBWA: остаточный ручной руль', 'Нет специального прогнозного ограничения ручного руля по крену.', 'Ручная добавка учитывает фактический крен, скорость его изменения, воздушную скорость и смену направления. Сохранены противоположный руль и автокоординация. При RUD_LIMIT_DEG = 0 доступна прежняя ветка RUD_RLL_ADD.'],
        ['FBWA: залишкове ручне кермо', 'Немає спеціального прогнозного обмеження ручного керма за креном.', 'Ручна добавка враховує фактичний крен, швидкість його зміни, повітряну швидкість і зміну напрямку. Збережено протилежне кермо й автокоординацію. За RUD_LIMIT_DEG = 0 доступна попередня гілка RUD_RLL_ADD.'],
        ['FBWA residual manual rudder', 'There is no dedicated predictive bank limiter for manual rudder.', 'The manual contribution considers actual bank, bank rate, airspeed and reversals. Opposite rudder and automatic coordination are retained. RUD_LIMIT_DEG = 0 leaves the earlier RUD_RLL_ADD path available.']),
      entry(
        ['Интегратор регулятора крена', 'Используется стандартная обработка интегратора при низкой скорости.', 'В регуляторе разрешено уменьшение накопленного интеграла при ограничении по скорости. Связанные значения I сохраняются согласованными.'],
        ['Інтегратор регулятора крену', 'Використовується стандартна обробка інтегратора за низької швидкості.', 'У регуляторі дозволено зменшення накопиченого інтеграла при обмеженні за швидкістю. Пов’язані значення I залишаються узгодженими.'],
        ['Roll controller integrator', 'The stock low-speed integrator handling applies.', 'The controller can unwind the accumulated integral while airspeed is limiting it. The associated I terms stay consistent.']),
      entry(
        ['Арминг и диагностика сборки', 'Штатные проверки ARM и идентификаторы ArduPlane.', 'Добавлены проверка нижнего газа RC3 и звуковое предупреждение при запрете, идентификатор A.T.L.A.S. и периодические сообщения о сборке, оценщике и платформе.'],
        ['Армінг і діагностика збірки', 'Штатні перевірки ARM та ідентифікатори ArduPlane.', 'Додано перевірку нижнього газу RC3 і звукове попередження при забороні, ідентифікатор A.T.L.A.S. та періодичні повідомлення про збірку, оцінювач і платформу.'],
        ['Arming and build diagnostics', 'Stock arming checks and ArduPlane identifiers apply.', 'Adds an RC3 low-throttle check and tone on that refusal, the A.T.L.A.S. build identity, and periodic build, estimator and platform messages.']),
      entry(
        ['Телеметрия одного ESC', 'BLHeli использует штатный приём телеметрии ESC.', 'Для одного ESC добавлены поиск границ по CRC, подтверждение тремя последовательными кадрами, повторная синхронизация и тайм-аут SERVO_BLH_TMOUT. Для нескольких ESC остаётся маршрутизация по запросу.'],
        ['Телеметрія одного ESC', 'BLHeli використовує штатне приймання телеметрії ESC.', 'Для одного ESC додано пошук меж за CRC, підтвердження трьома послідовними кадрами, повторну синхронізацію й тайм-аут SERVO_BLH_TMOUT. Для кількох ESC зберігається маршрутизація за запитом.'],
        ['Single-ESC telemetry', 'BLHeli uses stock ESC telemetry reception.', 'A single ESC gets CRC-based frame alignment, three-frame confirmation, resynchronization and SERVO_BLH_TMOUT. Multiple ESCs retain request-based routing.']),
      entry(
        ['Переключение VTX по RC', 'Используются штатные способы изменения VTX.', 'VTX_RC_CH выбирает RC-канал. Восемь диапазонов PWM выбирают позиции канала VTX, а VTX_RC_SOUND подтверждает фактическое переключение. Также изменена обработка pit mode при ARM/DISARM.'],
        ['Перемикання VTX через RC', 'Використовуються штатні способи зміни VTX.', 'VTX_RC_CH вибирає RC-канал. Вісім діапазонів PWM вибирають позиції каналу VTX, а VTX_RC_SOUND підтверджує фактичне перемикання. Також змінено обробку pit mode під час ARM/DISARM.'],
        ['RC-controlled VTX', 'The stock VTX control paths are available.', 'VTX_RC_CH selects the RC channel. Eight PWM ranges select VTX channel slots, and VTX_RC_SOUND acknowledges actual changes. Arming/disarming pit-mode handling was revised.']),
      entry(
        ['Звуки операций MAVLink', 'Стандартный набор уведомлений и подтверждений.', 'Добавлены собственные сигналы старта, сохранения параметров, требуемой перезагрузки, этапов и исходов калибровки и успешной загрузки миссии. Серии записей параметров объединяются в одно уведомление.'],
        ['Звуки операцій MAVLink', 'Стандартний набір сповіщень і підтверджень.', 'Додано власні сигнали старту, збереження параметрів, необхідного перезавантаження, етапів і результатів калібрування та успішного завантаження місії. Серії записів параметрів об’єднуються в одне сповіщення.'],
        ['MAVLink operation tones', 'The stock notification and acknowledgment set applies.', 'Adds tones for startup, saved parameters, reboot required, calibration stages and outcomes, and successful mission uploads. Parameter-write bursts are batched into one notification.']),
      entry(
        ['Поддержка плат и загрузчиков', 'MatekH743 и CubeOrangePlus имеют штатные hwdef. Uni_IC743Mini отсутствует в сверяемом теге.', 'В hwdef MatekH743 и CubeOrangePlus указано 480 МГц. Добавлены идентификатор платы Uni_IC743Mini, определения платы и её загрузчика, образы BIN и HEX.'],
        ['Підтримка плат і завантажувачів', 'MatekH743 і CubeOrangePlus мають штатні hwdef. Uni_IC743Mini відсутня в тегу звірки.', 'У hwdef MatekH743 і CubeOrangePlus вказано 480 МГц. Додано ідентифікатор плати Uni_IC743Mini, визначення плати та її завантажувача, образи BIN і HEX.'],
        ['Board and bootloader support', 'MatekH743 and CubeOrangePlus use stock hwdefs. Uni_IC743Mini is absent from the compared tag.', 'MatekH743 and CubeOrangePlus hwdefs declare 480 MHz. Uni_IC743Mini adds a board ID, board and bootloader definitions, and BIN/HEX bootloader images.'])
    ],
    sources: [
      'ArduPlane/AP_Arming_Plane.cpp',
      'ArduPlane/Attitude.cpp',
      'ArduPlane/Parameters.cpp',
      'ArduPlane/Parameters.h',
      'ArduPlane/Plane.cpp',
      'ArduPlane/Plane.h',
      'ArduPlane/RudderBankLimit.h',
      'ArduPlane/mode.h',
      'ArduPlane/mode_autoland.cpp',
      'ArduPlane/mode_cruise.cpp',
      'ArduPlane/mode_fbwa.cpp',
      'ArduPlane/mode_takeoff.cpp',
      'ArduPlane/servos.cpp',
      'ArduPlane/takeoff.cpp',
      'ArduPlane/version.h',
      'Tools/AP_Bootloader/board_types.txt',
      'Tools/bootloaders/Uni_IC743Mini_bl.bin',
      'Tools/bootloaders/Uni_IC743Mini_bl.hex',
      'libraries/APM_Control/AP_FW_Controller.cpp',
      'libraries/AP_AHRS/AP_AHRS.cpp',
      'libraries/AP_AHRS/AP_AHRS.h',
      'libraries/AP_BLHeli/AP_BLHeli.cpp',
      'libraries/AP_BLHeli/AP_BLHeli.h',
      'libraries/AP_HAL_ChibiOS/hwdef/CubeOrangePlus/hwdef.dat',
      'libraries/AP_HAL_ChibiOS/hwdef/MatekH743/hwdef.dat',
      'libraries/AP_HAL_ChibiOS/hwdef/Uni_IC743Mini/hwdef-bl.dat',
      'libraries/AP_HAL_ChibiOS/hwdef/Uni_IC743Mini/hwdef.dat',
      'libraries/AP_L1_Control/AP_L1_Control.cpp',
      ...[
        'Control.cpp', 'Logging.cpp', 'MagFusion.cpp', 'Measurements.cpp',
        'NoAidBias.h', 'NoAidLaunch.h', 'NoAidTasModel.h', 'PosVelFusion.cpp',
        'VehicleStatus.cpp', 'core.cpp', 'core.h'
      ].map(file => 'libraries/AP_NavEKF3/AP_NavEKF3_' + file),
      'libraries/AP_Notify/AP_Notify.h',
      'libraries/AP_Notify/ToneAlarm.cpp',
      'libraries/AP_Notify/ToneAlarm.h',
      'libraries/AP_VideoTX/AP_VideoTX.cpp',
      'libraries/AP_VideoTX/AP_VideoTX.h',
      'libraries/GCS_MAVLink/GCS_Common.cpp',
      'libraries/GCS_MAVLink/GCS_Param.cpp',
      'libraries/GCS_MAVLink/MissionItemProtocol.cpp'
    ]
  };
})();
