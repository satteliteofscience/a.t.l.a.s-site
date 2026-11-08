/* A.T.L.A.S. Quick Setup — guided workflow. All hardware actions require an explicit user click. */
(() => {
'use strict';
const api=window.AtlasCC,core=window.AtlasQuickSetupCore,$=id=>document.getElementById(id);
if(!api||!core||!$('qsContent'))return;

const copy={
ru:{
 nav:'Быстрая настройка',title:'Прошивка и настройка в один клик',intro:'Пошаговый мастер для уже собранного самолёта с проверенным набором параметров и существующим оборудованием. Это не мастер сборки нового самолёта и не замена полной настройке.',
 scopeTitle:'ВАЖНО · ОБЛАСТЬ ПРИМЕНЕНИЯ',scopeBody:'Используй Quick Setup только с известной конфигурацией самолёта, проверенным .param-файлом и тем же типом оборудования. Для нового планера, новых сервоприводов, ESC, компаса или нестандартной разводки перейди в полноценный конфигуратор.',fullConfigurator:'Открыть полный конфигуратор →',
 back:'Назад',next:'Далее',exit:'Выйти из мастера',finish:'Завершить',reset:'Начать заново',start:'Начать настройку',resume:'Предыдущая сессия достигла этапа',resumeBody:'Для безопасности предыдущие подтверждения оборудования не восстановлены. Начни заново и повторно проверь каждый этап.',
 stepIntro:'Назначение мастера',stepSafety:'Безопасность и подготовка',stepFirmware:'Прошивка контроллера',stepParams:'Параметры самолёта',stepAccel:'Акселерометр · 6 положений',stepLevel:'Установка горизонта',stepReboot:'Перезапуск контроллера',stepEsc:'Калибровка ESC',stepCompass:'Компас',stepFinal:'Итоговая проверка',
 statusPending:'ОЖИДАЕТ',statusDone:'ГОТОВО',statusManual:'ПОДТВЕРЖДЕНО',statusSkipped:'НЕ ТРЕБУЕТСЯ',statusFailed:'ОШИБКА',statusCurrent:'ТЕКУЩИЙ ЭТАП',
 introTitle:'Для проверенной конфигурации',introBody:'Этот мастер предназначен для самолёта, у которого уже выбраны планер, мотор, регулятор, сервоприводы и разводка. Предполагается, что у тебя есть проверенный набор параметров именно для этого оборудования.',introWarn:'Не используй мастер для сборки новой конфигурации, подбора функций выходов или первого запуска неизвестного оборудования. Для этого открой полный конфигуратор и выполняй настройку вручную.',introAck:'Я понимаю назначение и ограничения Quick Setup.',
 safetyTitle:'Перед началом',safetyBody:'Сначала обеспечь безопасное состояние самолёта. Мастер не включает ARM и не подаёт тестовые сигналы на двигатель или сервоприводы.',safetyChecks:['Пропеллер снят; при работах с ESC двигатель физически безопасен.','Контроллер находится в DISARMED; перед калибровками есть свежая USB/MAVLink-связь.','Питание ESC/двигателя отключено на этапах настройки и калибровки, где оно не требуется.','RC-калибровка, сервоприводы, механика и существующая схема самолёта уже настроены и проверены.','Я знаю точную модель контроллера, прошивку и установленное оборудование.'],
 firmwareTitle:'Проверь прошивку',firmwareBody:'Встроенная полная HEX-запись через STM32 DFU в текущей версии доступна только для Matek H743-WING V3. Для Orange Cube используй поддерживаемый внешний способ установки ArduPlane.',board:'Выбранная плата',openFirmware:'Открыть раздел прошивки',firmwareReady:'Прошивка уже установлена и проверена',firmwareManual:'Я подтвердил совместимость прошивки с выбранной платой и целевой версией ArduPlane.',firmwareDfuWait:'После успешной DFU-записи мастер получит подтверждение побайтовой проверки. Затем дождись полной загрузки и повторно подключи USB согласно заметке DFU.',firmwareSuccess:'DFU завершён и контрольное чтение совпало.',firmwareFailure:'DFU не завершился успешно. Повтори процедуру в разделе прошивки.',firmwareExternal:'Для этой платы встроенный DFU-писатель HEX не используется. Установи совместимую ArduPlane-прошивку через официальный инструмент производителя/ArduPilot, затем подтверди результат вручную.',firmwareConfirm:'Подтвердить установленную прошивку',
 paramsTitle:'Выбери источник параметров',paramsBody:'После прошивки подключись к контроллеру по MAVLink и загрузи полный список параметров. Можно оставить текущие значения ArduPlane или применить заранее проверенный .param-файл.',paramsKeep:'Оставить текущие параметры ArduPlane',paramsCustom:'Загрузить проверенный .param-файл',paramsKeepWarn:'Стандартные значения ArduPlane не являются готовой настройкой конкретного самолёта. Они подходят только как исходная база, если это подтверждено для твоей конфигурации.',readParams:'Считать параметры с контроллера',readWaiting:'Ожидается полное чтение параметров.',readComplete:'Полный список параметров получен.',readPartial:'Список параметров неполный. Повтори чтение и проверь связь.',readNoLink:'Подключи контроллер по USB/MAVLink и подтверди DISARMED.',readCount:'Получено параметров',backup:'Скачать резервную копию .param',backupDone:'Резервная копия скачана.',file:'Выбрать .param-файл',fileName:'Файл не выбран',compatConfirm:'Я проверил, что этот .param предназначен для этой платы, этой версии ArduPlane и именно этого самолёта.',preview:'Предварительный просмотр изменений',changed:'Изменений',warnings:'Без локального диапазона в метаданных',errors:'Ошибок проверки',apply:'Записать проверенные параметры',applying:'Запись параметров',cancelApply:'Остановить после текущего подтверждения',applyDone:'Все параметры подтверждены PARAM_VALUE и повторно считаны.',applyPartial:'Запись остановлена или завершилась частично. Проверь параметры и повтори оставшиеся изменения.',applyConfirm:'Будут записаны только показанные изменения. Продолжить?',keepConfirm:'Я понимаю, что текущие/стандартные параметры не являются готовой конфигурацией для полёта этого самолёта.',paramNoChanges:'Файл совпадает с текущими значениями. Запись не требуется.',paramInvalid:'Файл не прошёл проверку. Ничего не записано.',paramUnknown:'Параметр отсутствует в полном списке контроллера.',paramDuplicate:'Повторяющееся имя параметра.',paramRange:'Значение вне диапазона локальных метаданных.',paramFormat:'Не удалось разобрать строку .param.',paramInteger:'Для этого параметра требуется целое число.',paramReadonly:'Параметр помечен как доступный только для чтения.',paramInt64:'64-битный целочисленный параметр не поддерживается этим безопасным импортёром.',paramWarning:'Локальные метаданные неполные. Для параметров без описанного диапазона проверь значения по документации своей версии ArduPlane.',
 accelTitle:'Шестипозиционная калибровка',accelBody:'Используется существующий MAVLink-мастер ArduPlane. Контроллер сам запрашивает каждое положение; подтверждение доступно только после запроса автопилота.',startAccel:'Открыть и начать калибровку',accelWaiting:'Ожидается завершение по результату автопилота.',accelDone:'Шестипозиционная калибровка подтверждена контроллером.',accelFail:'Калибровка не завершилась. Проверь сообщения и повтори процедуру.',accelNeedLink:'Для запуска требуется реальная USB/MAVLink-связь и DISARMED.',
 levelTitle:'Установка горизонта',levelBody:'Установи самолёт в положение, соответствующее горизонтальному полёту. Команда будет отправлена только после отдельного нажатия.',startLevel:'Открыть и установить уровень',levelDone:'Команда установки уровня подтверждена автопилотом.',levelFail:'Установка уровня не подтверждена. Повтори процедуру.',
 rebootTitle:'Перезапуск после пользовательских параметров',rebootNotNeeded:'Пользовательские параметры не записывались — отдельный перезапуск этим мастером не требуется.',rebootBody:'После применения пользовательского .param-файла выполни обычный цикл питания контроллера. Отключи USB/питание, дождись выключения, подключи снова и дождись нового MAVLink heartbeat.',rebootStatus:'Ожидается отключение и повторное подключение контроллера.',rebootDone:'Обнаружено отключение, повторное подключение и новый heartbeat. Повторно считай параметры.',rebootRead:'Перечитать параметры после перезапуска',rebootNeed:'Перезапусти контроллер физически и переподключи USB/MAVLink. Мастер не отправляет команду ARM или reboot автоматически.',
 escTitle:'Проверка и калибровка ESC',escBody:'Определение выполняется по текущим параметрам ArduPlane и назначенным throttle-выходам. Мастер не включает ARM, не меняет газ и не отправляет PWM.',escProtocol:'Определённая конфигурация',escChannels:'Выходы газа',escDshot:'Обнаружен DShot. Калибровка min/max не требуется: цифровой протокол передаёт данные без аналогового диапазона PWM.',escPwm:'Обнаружен обычный PWM-выход газа. Такой ESC может требовать калибровки min/max, но точная процедура зависит от производителя и модели регулятора.',escPulse:'Обнаружен OneShot / OneShot125 / brushed. Не запускай стандартную PWM-процедуру автоматически; проверь руководство ESC.',escUnknown:'Протокол или физический путь ESC не удалось надёжно определить. Не выполняй калибровку по предположению.',escMixed:'Обнаружены смешанные протоколы на throttle-выходах. Проверь каждый канал и его физическое подключение отдельно.',escCubeLimit:'Для Cube Orange выходы MAIN 1–8 не поддерживают DShot. Проверь физическое подключение к AUX и настройки групп выходов.',escNone:'Не найдено назначение throttle-функции SERVOx_FUNCTION 70/73/74. Если у самолёта есть двигатель, остановись и проверь назначение выходов в полном конфигураторе.',escDocs:'Официальная инструкция ArduPlane по ESC ↗',escManual:'Я снял пропеллер и выполнил процедуру из инструкции именно моего ESC либо подтвердил у производителя, что калибровка не требуется.',escDshotConfirm:'Я проверил, что выбранный throttle-выход физически поддерживает DShot и мой ESC совместим. Калибровка min/max не нужна.',escOtherConfirm:'Я проверил протокол, разводку и руководство ESC. Не запускаю неподходящую PWM-калибровку.',escNoneConfirm:'Я подтвердил, что мотор/ESC не используются в этой конфигурации.',
 compassTitle:'Проверка компаса',compassBody:'Мастер проверяет COMPASS_USE / COMPASS_USE2 / COMPASS_USE3. Если компас используется, калибровка запускается отдельной командой и должна завершиться сохранённым отчётом.',compassEnabled:'Активный компас обнаружен.',compassDisabled:'Все полученные экземпляры компаса отключены.',compassUnknown:'Не удалось определить наличие активного компаса. Проверь оборудование и параметры вручную.',startCompass:'Открыть и начать калибровку',compassAwaitSave:'Калибровка завершена, но автопилот ещё не подтвердил сохранение. Открой раздел компаса и нажми «Сохранить результат».',compassDone:'Отчёт калибровки компаса получен, результат сохранён автопилотом.',compassFail:'Калибровка компаса не завершилась успешно.',compassSkip:'Я проверил конфигурацию и подтверждаю, что этот самолёт не использует компас.',compassManual:'Я вручную проверил компас и его использование в полном конфигураторе.',
 finalTitle:'Финальная проверка',finalBody:'Завершение мастера не означает, что самолёт готов к полёту. Перед каждым полётом пилот обязан независимо проверить все системы и пригодность конфигурации.',finalChecks:['Проверены направление, ход, крепление и механика всех рулевых поверхностей.','Проверены RC-входы, режимы, failsafe и потеря связи.','Проверены питание, аккумулятор, BEC, проводка и разъёмы.','Проверены воздушная скорость, трубка Пито и датчики, если установлены.','Проверены компас, GPS и EKF — если эти источники используются.','Проверены мотор, ESC, направление вращения и безопасный запуск без пропеллера.','Выполнен полный внешний предполётный осмотр; пропеллер установлен только после безопасных проверок.','Я понимаю, что Quick Setup не выдаёт разрешение на полёт; окончательное решение принимает пилот/техник.'],finalComplete:'Этапы Quick Setup завершены. Это не допуск к полёту.',doneTitle:'Мастер пройден',doneBody:'Пошаговые процедуры отмечены. Сохрани отчёт и выполни независимую предполётную проверку.',
 live:'СВЯЗЬ',disarmed:'DISARMED',connected:'Подключено',disconnected:'Нет подключения',notComplete:'НЕ ЗАВЕРШЕНО',error:'Ошибка',cancelled:'Остановлено',manual:'Ручное подтверждение',skip:'Пропустить этап',confirm:'Подтвердить',open:'Открыть раздел',download:'Скачать',progress:'ПРОГРЕСС',unsupported:'Не поддерживается автоматически',verified:'ПОДТВЕРЖДЕНО',fullLink:'Перейти к полному конфигуратору'
},
uk:{
 nav:'Швидке налаштування',title:'Прошивка та налаштування в один клік',intro:'Покроковий майстер для вже зібраного літака з перевіреним набором параметрів і наявним обладнанням. Це не майстер складання нового літака й не заміна повного налаштування.',
 scopeTitle:'ВАЖЛИВО · СФЕРА ЗАСТОСУВАННЯ',scopeBody:'Використовуй Quick Setup лише з відомою конфігурацією літака, перевіреним .param-файлом і тим самим типом обладнання. Для нового планера, сервоприводів, ESC, компаса або нестандартного підключення відкрий повний конфігуратор.',fullConfigurator:'Відкрити повний конфігуратор →',
 back:'Назад',next:'Далі',exit:'Вийти з майстра',finish:'Завершити',reset:'Почати спочатку',start:'Почати налаштування',resume:'Попередня сесія дійшла до етапу',resumeBody:'З міркувань безпеки попередні підтвердження обладнання не відновлено. Почни спочатку й повторно перевір кожен етап.',
 stepIntro:'Призначення майстра',stepSafety:'Безпека та підготовка',stepFirmware:'Прошивка контролера',stepParams:'Параметри літака',stepAccel:'Акселерометр · 6 положень',stepLevel:'Встановлення горизонту',stepReboot:'Перезапуск контролера',stepEsc:'Калібрування ESC',stepCompass:'Компас',stepFinal:'Підсумкова перевірка',
 statusPending:'ОЧІКУЄ',statusDone:'ГОТОВО',statusManual:'ПІДТВЕРДЖЕНО',statusSkipped:'НЕ ПОТРІБНО',statusFailed:'ПОМИЛКА',statusCurrent:'ПОТОЧНИЙ ЕТАП',
 introTitle:'Для перевіреної конфігурації',introBody:'Майстер призначений для літака, у якого вже вибрані планер, мотор, регулятор, сервоприводи та схема підключення. Передбачається, що в тебе є перевірений набір параметрів саме для цього обладнання.',introWarn:'Не використовуй майстер для складання нової конфігурації, вибору функцій виходів або першого запуску невідомого обладнання. Для цього відкрий повний конфігуратор.',introAck:'Я розумію призначення та обмеження Quick Setup.',
 safetyTitle:'Перед початком',safetyBody:'Спочатку забезпеч безпечний стан літака. Майстер не вмикає ARM і не подає тестові сигнали на двигун чи сервоприводи.',safetyChecks:['Пропелер знято; під час робіт з ESC двигун фізично безпечний.','Контролер у DISARMED; перед калібруванням є свіже USB/MAVLink-з’єднання.','Живлення ESC/двигуна відключене на етапах, де воно не потрібне.','RC-калібрування, сервоприводи, механіка та наявна схема літака вже налаштовані й перевірені.','Я знаю точну модель контролера, прошивку та встановлене обладнання.'],
 firmwareTitle:'Перевір прошивку',firmwareBody:'Вбудований повний HEX-запис через STM32 DFU у поточній версії доступний лише для Matek H743-WING V3. Для Orange Cube використовуй підтримуваний зовнішній спосіб встановлення ArduPlane.',board:'Вибрана плата',openFirmware:'Відкрити розділ прошивки',firmwareReady:'Прошивка вже встановлена й перевірена',firmwareManual:'Я підтвердив сумісність прошивки з вибраною платою та цільовою версією ArduPlane.',firmwareDfuWait:'Після успішного DFU-запису майстер отримає підтвердження побайтової перевірки. Дочекайся повного завантаження та повторно під’єднай USB згідно з приміткою DFU.',firmwareSuccess:'DFU завершено, контрольне читання збігається.',firmwareFailure:'DFU не завершився успішно. Повтори процедуру в розділі прошивки.',firmwareExternal:'Для цієї плати вбудований DFU-записувач HEX не використовується. Встанови сумісну ArduPlane-прошивку офіційним інструментом, потім підтверди результат вручну.',firmwareConfirm:'Підтвердити встановлену прошивку',
 paramsTitle:'Обери джерело параметрів',paramsBody:'Після прошивки під’єднайся до контролера через MAVLink і завантаж повний список параметрів. Можна залишити поточні значення ArduPlane або застосувати заздалегідь перевірений .param-файл.',paramsKeep:'Залишити поточні параметри ArduPlane',paramsCustom:'Завантажити перевірений .param-файл',paramsKeepWarn:'Стандартні значення ArduPlane не є готовим налаштуванням конкретного літака. Це лише початкова база, якщо її придатність підтверджена для твоєї конфігурації.',readParams:'Зчитати параметри з контролера',readWaiting:'Очікується повне зчитування параметрів.',readComplete:'Повний список параметрів отримано.',readPartial:'Список неповний. Повтори зчитування та перевір з’єднання.',readNoLink:'Під’єднай контролер через USB/MAVLink і підтверди DISARMED.',readCount:'Отримано параметрів',backup:'Завантажити резервну копію .param',backupDone:'Резервну копію завантажено.',file:'Вибрати .param-файл',fileName:'Файл не вибрано',compatConfirm:'Я перевірив, що цей .param призначений для цієї плати, версії ArduPlane та саме цього літака.',preview:'Попередній перегляд змін',changed:'Змін',warnings:'Без локального діапазону в метаданих',errors:'Помилок перевірки',apply:'Записати перевірені параметри',applying:'Запис параметрів',cancelApply:'Зупинити після поточного підтвердження',applyDone:'Усі параметри підтверджено PARAM_VALUE та повторно зчитано.',applyPartial:'Запис зупинено або завершився частково. Перевір параметри та повтори решту змін.',applyConfirm:'Буде записано лише показані зміни. Продовжити?',keepConfirm:'Я розумію, що поточні/стандартні параметри не є готовою конфігурацією для польоту цього літака.',paramNoChanges:'Файл збігається з поточними значеннями. Запис не потрібен.',paramInvalid:'Файл не пройшов перевірку. Нічого не записано.',paramUnknown:'Параметр відсутній у повному списку контролера.',paramDuplicate:'Повторюване ім’я параметра.',paramRange:'Значення поза діапазоном локальних метаданих.',paramFormat:'Не вдалося розібрати рядок .param.',paramInteger:'Для цього параметра потрібне ціле число.',paramReadonly:'Параметр доступний лише для читання.',paramInt64:'64-бітний цілочисельний параметр не підтримується цим імпортером.',paramWarning:'Локальні метадані неповні. Для параметрів без описаного діапазону перевір значення за документацією своєї версії ArduPlane.',
 accelTitle:'Шестипозиційне калібрування',accelBody:'Використовується наявний MAVLink-майстер ArduPlane. Контролер сам запитує кожне положення; підтвердження доступне лише після запиту автопілота.',startAccel:'Відкрити й почати калібрування',accelWaiting:'Очікується завершення за результатом автопілота.',accelDone:'Шестипозиційне калібрування підтверджено контролером.',accelFail:'Калібрування не завершилося. Перевір повідомлення та повтори процедуру.',accelNeedLink:'Для запуску потрібне реальне USB/MAVLink-з’єднання та DISARMED.',
 levelTitle:'Встановлення горизонту',levelBody:'Встанови літак у положення, що відповідає горизонтальному польоту. Команду буде надіслано лише після окремого натискання.',startLevel:'Відкрити й встановити рівень',levelDone:'Команду встановлення рівня підтверджено автопілотом.',levelFail:'Встановлення рівня не підтверджено. Повтори процедуру.',
 rebootTitle:'Перезапуск після користувацьких параметрів',rebootNotNeeded:'Користувацькі параметри не записувалися — окремий перезапуск цим майстром не потрібен.',rebootBody:'Після застосування користувацького .param-файлу виконай звичайний цикл живлення контролера. Від’єднай USB/живлення, дочекайся вимкнення, під’єднай знову та дочекайся нового MAVLink heartbeat.',rebootStatus:'Очікується від’єднання та повторне підключення контролера.',rebootDone:'Виявлено від’єднання, повторне підключення та новий heartbeat. Повторно зчитай параметри.',rebootRead:'Перечитати параметри після перезапуску',rebootNeed:'Перезапусти контролер фізично та перепід’єднай USB/MAVLink. Майстер не надсилає ARM або reboot автоматично.',
 escTitle:'Перевірка та калібрування ESC',escBody:'Визначення виконується за поточними параметрами ArduPlane та призначеними throttle-виходами. Майстер не вмикає ARM, не змінює газ і не надсилає PWM.',escProtocol:'Визначена конфігурація',escChannels:'Виходи газу',escDshot:'Виявлено DShot. Калібрування min/max не потрібне: цифровий протокол передає дані без аналогового діапазону PWM.',escPwm:'Виявлено звичайний PWM-вихід газу. Такий ESC може потребувати калібрування min/max, але точна процедура залежить від виробника та моделі регулятора.',escPulse:'Виявлено OneShot / OneShot125 / brushed. Не запускай стандартну PWM-процедуру автоматично; перевір інструкцію ESC.',escUnknown:'Протокол або фізичний шлях ESC не вдалося надійно визначити. Не виконуй калібрування за припущенням.',escMixed:'Виявлено змішані протоколи на throttle-виходах. Перевір кожен канал і фізичне підключення окремо.',escCubeLimit:'Виходи Cube Orange MAIN 1–8 не підтримують DShot. Перевір фізичне підключення до AUX і налаштування груп виходів.',escNone:'Не знайдено призначення throttle-функції SERVOx_FUNCTION 70/73/74. Якщо літак має двигун, зупинись і перевір призначення виходів у повному конфігураторі.',escDocs:'Офіційна інструкція ArduPlane щодо ESC ↗',escManual:'Я зняв пропелер і виконав процедуру з інструкції саме мого ESC або підтвердив у виробника, що калібрування не потрібне.',escDshotConfirm:'Я перевірив, що вибраний throttle-вихід фізично підтримує DShot і мій ESC сумісний. Калібрування min/max не потрібне.',escOtherConfirm:'Я перевірив протокол, підключення та інструкцію ESC. Не запускаю невідповідне PWM-калібрування.',escNoneConfirm:'Я підтвердив, що мотор/ESC не використовуються в цій конфігурації.',
 compassTitle:'Перевірка компаса',compassBody:'Майстер перевіряє COMPASS_USE / COMPASS_USE2 / COMPASS_USE3. Якщо компас використовується, калібрування запускається окремою командою та має завершитися збереженим звітом.',compassEnabled:'Активний компас виявлено.',compassDisabled:'Усі отримані екземпляри компаса вимкнені.',compassUnknown:'Не вдалося визначити наявність активного компаса. Перевір обладнання та параметри вручну.',startCompass:'Відкрити й почати калібрування',compassAwaitSave:'Калібрування завершено, але автопілот ще не підтвердив збереження. Відкрий розділ компаса й натисни «Зберегти результат».',compassDone:'Звіт калібрування компаса отримано, результат збережено автопілотом.',compassFail:'Калібрування компаса не завершилося успішно.',compassSkip:'Я перевірив конфігурацію та підтверджую, що цей літак не використовує компас.',compassManual:'Я вручну перевірив компас і його використання в повному конфігураторі.',
 finalTitle:'Підсумкова перевірка',finalBody:'Завершення майстра не означає, що літак готовий до польоту. Перед кожним польотом пілот має незалежно перевірити всі системи та придатність конфігурації.',finalChecks:['Перевірено напрямок, хід, кріплення й механіку всіх рулів.','Перевірено RC-входи, режими, failsafe та втрату зв’язку.','Перевірено живлення, акумулятор, BEC, проводку та роз’єми.','Перевірено повітряну швидкість, трубку Піто та датчики, якщо встановлені.','Перевірено компас, GPS та EKF — якщо ці джерела використовуються.','Перевірено мотор, ESC, напрямок обертання та безпечний запуск без пропелера.','Виконано зовнішній передпольотний огляд; пропелер встановлюється лише після безпечних перевірок.','Я розумію, що Quick Setup не видає дозвіл на політ; остаточне рішення приймає пілот/технік.'],finalComplete:'Етапи Quick Setup завершено. Це не допуск до польоту.',doneTitle:'Майстер пройдено',doneBody:'Покрокові процедури відмічено. Збережи звіт і виконай незалежну передпольотну перевірку.',
 live:'ЗВ’ЯЗОК',disarmed:'DISARMED',connected:'Підключено',disconnected:'Немає з’єднання',notComplete:'НЕ ЗАВЕРШЕНО',error:'Помилка',cancelled:'Зупинено',manual:'Ручне підтвердження',skip:'Пропустити етап',confirm:'Підтвердити',open:'Відкрити розділ',download:'Завантажити',progress:'ПРОГРЕС',unsupported:'Не підтримується автоматично',verified:'ПІДТВЕРДЖЕНО',fullLink:'Перейти до повного конфігуратора'
},
en:{
 nav:'Quick Setup',title:'Flash and configure in one click',intro:'A guided workflow for an already assembled aircraft with a verified parameter set and existing hardware. This is not a new-airframe setup wizard and does not replace full configuration.',
 scopeTitle:'IMPORTANT · INTENDED USE',scopeBody:'Use Quick Setup only with a known aircraft configuration, a verified .param file and the same hardware. For a new airframe, new servos, ESC, compass or non-standard wiring, use the full configurator.',fullConfigurator:'Open full configurator →',
 back:'Back',next:'Next',exit:'Exit wizard',finish:'Finish',reset:'Start over',start:'Start setup',resume:'Previous session reached step',resumeBody:'For safety, previous hardware confirmations were not restored. Start again and re-verify each stage.',
 stepIntro:'Wizard scope',stepSafety:'Safety and preparation',stepFirmware:'Flight controller firmware',stepParams:'Aircraft parameters',stepAccel:'Accelerometer · 6 positions',stepLevel:'Level horizon',stepReboot:'Controller reboot',stepEsc:'ESC calibration',stepCompass:'Compass',stepFinal:'Final checks',
 statusPending:'PENDING',statusDone:'DONE',statusManual:'CONFIRMED',statusSkipped:'NOT REQUIRED',statusFailed:'FAILED',statusCurrent:'CURRENT',
 introTitle:'For a verified configuration',introBody:'This wizard is for an aircraft whose airframe, motor, ESC, servos and wiring are already selected. It assumes you have a parameter file verified for this exact hardware.',introWarn:'Do not use this wizard to build a new configuration, choose output functions or bring unknown hardware online for the first time. Use the full configurator for that.',introAck:'I understand the purpose and limitations of Quick Setup.',
 safetyTitle:'Before you begin',safetyBody:'First make the aircraft safe. The wizard never arms the vehicle or sends test signals to the motor or servos.',safetyChecks:['Propeller removed; motor physically safe during ESC work.','Flight controller is DISARMED; a fresh USB/MAVLink link is available before calibration.','ESC/motor power is isolated during setup steps where it is not required.','RC calibration, servos, mechanics and the existing aircraft configuration are already set up and checked.','I know the exact flight-controller model, firmware and installed hardware.'],
 firmwareTitle:'Verify firmware',firmwareBody:'The built-in full HEX STM32 DFU writer currently supports Matek H743-WING V3 only. For Orange Cube, use a supported external ArduPlane installation method.',board:'Selected board',openFirmware:'Open firmware section',firmwareReady:'Firmware is already installed and verified',firmwareManual:'I verified firmware compatibility with this board and the target ArduPlane version.',firmwareDfuWait:'After successful DFU programming, the wizard receives byte-for-byte verification. Wait for full boot and reconnect USB as described in the DFU note.',firmwareSuccess:'DFU completed and readback matched.',firmwareFailure:'DFU did not complete successfully. Retry in the firmware section.',firmwareExternal:'The built-in HEX DFU writer is not used for this board. Install compatible ArduPlane firmware using an approved external tool, then confirm manually.',firmwareConfirm:'Confirm installed firmware',
 paramsTitle:'Choose parameter source',paramsBody:'After flashing, connect to the controller over MAVLink and load the full parameter list. Keep current ArduPlane values or apply a previously verified .param file.',paramsKeep:'Keep current ArduPlane parameters',paramsCustom:'Load a verified .param file',paramsKeepWarn:'ArduPlane defaults are not a ready-to-fly setup for a specific aircraft. They are only a baseline when confirmed suitable for your configuration.',readParams:'Read parameters from controller',readWaiting:'Waiting for a complete parameter read.',readComplete:'Full parameter list received.',readPartial:'Parameter list is incomplete. Retry and check the link.',readNoLink:'Connect the controller over USB/MAVLink and confirm DISARMED.',readCount:'Parameters received',backup:'Download .param backup',backupDone:'Backup downloaded.',file:'Choose .param file',fileName:'No file selected',compatConfirm:'I verified this .param is intended for this board, this ArduPlane version and this exact aircraft.',preview:'Preview changes',changed:'Changes',warnings:'No local metadata range',errors:'Validation errors',apply:'Write verified parameters',applying:'Writing parameters',cancelApply:'Stop after current acknowledgment',applyDone:'All parameters were acknowledged by PARAM_VALUE and read back.',applyPartial:'Write stopped or partially completed. Review parameters and retry the remaining changes.',applyConfirm:'Only the changes shown will be written. Continue?',keepConfirm:'I understand current/default parameters are not a flight-ready configuration for this aircraft.',paramNoChanges:'The file matches current values. No write is needed.',paramInvalid:'The file failed validation. Nothing was written.',paramUnknown:'Parameter is not present in the controller’s complete list.',paramDuplicate:'Duplicate parameter name.',paramRange:'Value is outside the local metadata range.',paramFormat:'Could not parse this .param line.',paramInteger:'This parameter requires an integer.',paramReadonly:'Parameter is marked read-only.',paramInt64:'64-bit integer parameters are not supported by this safe importer.',paramWarning:'Local metadata is partial. For parameters without a described range, verify values against the documentation for your ArduPlane version.',
 accelTitle:'Six-position accelerometer calibration',accelBody:'Uses the existing ArduPlane MAVLink calibration wizard. The controller requests each pose; confirmation is available only after the autopilot requests it.',startAccel:'Open and start calibration',accelWaiting:'Waiting for the autopilot result.',accelDone:'Six-position calibration was confirmed by the controller.',accelFail:'Calibration did not complete. Check messages and retry.',accelNeedLink:'A real USB/MAVLink connection and DISARMED state are required.',
 levelTitle:'Level horizon',levelBody:'Place the aircraft in its level-flight attitude. The command is sent only after a separate user click.',startLevel:'Open and set level',levelDone:'Level command was acknowledged by the autopilot.',levelFail:'Level setting was not confirmed. Retry.',
 rebootTitle:'Reboot after custom parameters',rebootNotNeeded:'No custom parameters were written, so this wizard does not require a separate reboot.',rebootBody:'After applying a custom .param file, perform a normal controller power cycle. Disconnect USB/power, wait for shutdown, reconnect and wait for a new MAVLink heartbeat.',rebootStatus:'Waiting for controller disconnect and reconnect.',rebootDone:'Disconnect, reconnect and a new heartbeat were detected. Read parameters again.',rebootRead:'Read parameters after reboot',rebootNeed:'Power-cycle the controller and reconnect USB/MAVLink. The wizard does not send ARM or reboot automatically.',
 escTitle:'ESC check and calibration',escBody:'Detection uses current ArduPlane parameters and assigned throttle outputs. The wizard never arms, changes throttle or sends PWM.',escProtocol:'Detected configuration',escChannels:'Throttle outputs',escDshot:'DShot detected. Min/max calibration is not required: the digital protocol does not use an analogue PWM range.',escPwm:'Normal PWM throttle output detected. This ESC may need min/max calibration, but the exact procedure depends on the ESC manufacturer and model.',escPulse:'OneShot / OneShot125 / brushed output detected. Do not automatically run the traditional PWM procedure; check the ESC manual.',escUnknown:'The ESC protocol or physical signal path could not be identified safely. Do not calibrate by assumption.',escMixed:'Mixed protocols were detected on throttle outputs. Check each channel and physical connection separately.',escCubeLimit:'Cube Orange MAIN outputs 1–8 do not support DShot. Verify physical AUX wiring and output-group settings.',escNone:'No SERVOx_FUNCTION 70/73/74 throttle output was found. If the aircraft has a motor, stop and verify output assignments in the full configurator.',escDocs:'Official ArduPlane ESC calibration guide ↗',escManual:'I removed the propeller and followed my ESC manufacturer’s procedure, or confirmed with the manufacturer that calibration is not required.',escDshotConfirm:'I verified that the selected throttle output physically supports DShot and my ESC is compatible. Min/max calibration is not needed.',escOtherConfirm:'I verified the protocol, wiring and ESC manual. I am not running an unsuitable PWM calibration.',escNoneConfirm:'I confirmed that no motor/ESC is used in this configuration.',
 compassTitle:'Compass check',compassBody:'The wizard checks COMPASS_USE / COMPASS_USE2 / COMPASS_USE3. If a compass is enabled, calibration is started separately and must finish with a saved report.',compassEnabled:'An enabled compass was detected.',compassDisabled:'All received compass instances are disabled.',compassUnknown:'Could not determine whether a compass is active. Verify hardware and parameters manually.',startCompass:'Open and start calibration',compassAwaitSave:'Calibration completed, but the autopilot has not confirmed saving. Open the compass section and select Save result.',compassDone:'Compass calibration report received and saved by the autopilot.',compassFail:'Compass calibration did not complete successfully.',compassSkip:'I verified the configuration and confirm this aircraft does not use a compass.',compassManual:'I manually checked the compass and its use in the full configurator.',
 finalTitle:'Final checks',finalBody:'Completing this wizard does not mean the aircraft is ready to fly. Before every flight, the pilot must independently verify all systems and configuration suitability.',finalChecks:['Control-surface direction, travel, attachment and mechanics checked.','RC inputs, flight modes, failsafe and link-loss behavior checked.','Power, battery, BEC, wiring and connectors checked.','Airspeed, pitot tube and sensors checked where installed.','Compass, GPS and EKF checked where those sources are used.','Motor, ESC, rotation direction and safe no-propeller start checked.','External preflight inspection completed; propeller installed only after safe checks.','I understand Quick Setup does not grant flight clearance; the pilot/technician makes the final decision.'],finalComplete:'Quick Setup stages completed. This is not flight clearance.',doneTitle:'Wizard completed',doneBody:'The guided stages are marked. Save the report and perform an independent preflight check.',
 live:'LINK',disarmed:'DISARMED',connected:'Connected',disconnected:'Not connected',notComplete:'NOT COMPLETE',error:'Error',cancelled:'Stopped',manual:'Manual confirmation',skip:'Skip stage',confirm:'Confirm',open:'Open section',download:'Download',progress:'PROGRESS',unsupported:'Not supported automatically',verified:'VERIFIED',fullLink:'Open full configurator'
}
};
const stepKeys=['stepIntro','stepSafety','stepFirmware','stepParams','stepAccel','stepLevel','stepReboot','stepEsc','stepCompass','stepFinal'];
const stepNames=['intro','safety','firmware','params','accel','level','reboot','esc','compass','final'];
const saved=(()=>{try{return JSON.parse(localStorage.getItem('atlas.quicksetup.v1')||'null');}catch{return null;}})();
const qs={
 step:0,completed:{},safety:[false,false,false,false,false],firmwareSource:null,firmwareError:'',
 paramsMode:'keep',fileName:'',preview:null,metadata:{},metadataReady:false,backupDownloaded:false,compatConfirmed:false,keepConfirmed:false,applyBusy:false,cancelApply:false,paramsMessage:'',paramsApplied:false,
 accelError:'',levelError:'',rebootBaseline:0,rebootSawDisconnect:false,rebootReading:false,escConfirmed:false,compassAwaitingSave:false,compassError:'',finalChecks:[false,false,false,false,false,false,false,false],
 resumeFrom:saved&&Number.isInteger(saved.step)?saved.step:0
};
function lang(){return window.AtlasLanguage?.()||'ru';}
function t(key){return (copy[lang()]||copy.ru)[key]||(copy.ru[key])||key;}
function el(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;}
function appendText(parent,tag,text,cls){const x=el(tag,cls,text);parent.append(x);return x;}
function button(parent,label,fn,cls='cc-button ghost'){const b=el('button',cls,label);b.type='button';b.addEventListener('click',fn);parent.append(b);return b;}
function callout(parent,text,kind=''){parent.append(el('div','qs-callout'+(kind?' '+kind:''),text));}
function checkbox(parent,text,checked,onChange){
 const label=el('label','qs-check'),input=el('input');input.type='checkbox';input.checked=!!checked;input.addEventListener('change',()=>onChange(input.checked));label.append(input,el('span','',text));parent.append(label);return input;
}
function radio(parent,text,value,checked,onChange){
 const label=el('label','qs-radio'),input=el('input');input.type='radio';input.name='qs-params-mode';input.value=value;input.checked=checked;input.addEventListener('change',()=>{if(input.checked)onChange(value);});label.append(input,el('span','',text));parent.append(label);
}
function link(parent,text,url){const a=el('a','');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=text;parent.append(a);return a;}
function state(){return api.getState();}
function paramReady(s){return !!s.connected&&s.paramComplete===true&&s.params instanceof Map&&s.params.size>0;}
function safeLink(s){return !!s.connected&&s.armed===false&&Date.now()-s.lastHeartbeat<4000&&!s.demo;}
function persist(){try{localStorage.setItem('atlas.quicksetup.v1',JSON.stringify({step:qs.step,paramsMode:qs.paramsMode,updated:Date.now()}));}catch{}}
function complete(step,status='done'){qs.completed[step]=status;persist();render();}
function setStep(index){if(index<0||index>=stepKeys.length)return;qs.step=index;if(index===6&&qs.paramsApplied&&!qs.rebootBaseline)qs.rebootBaseline=state().lastHeartbeat||Date.now();persist();render();}
function canNext(){
 if(qs.step===6&&!qs.paramsApplied)return true;
 if(qs.step===9)return false;
 return !!qs.completed[qs.step]&&!qs.applyBusy;
}
function setGlobal(message,bad=false){$('qsGlobalStatus').textContent=message||'—';$('qsGlobalStatus').style.color=bad?'#e9a17f':'#aeb88d';}
function stepStatus(i){if(qs.completed[i]==='done')return t('statusDone');if(qs.completed[i]==='manual')return t('statusManual');if(qs.completed[i]==='skipped')return t('statusSkipped');if(qs.completed[i]==='failed')return t('statusFailed');return i===qs.step?t('statusCurrent'):t('statusPending');}
function renderStepList(){
 const list=$('qsStepList');list.replaceChildren();
 stepKeys.forEach((key,index)=>{
  const li=el('li'),b=el('button','qs-step-button');b.type='button';b.disabled=index>qs.step;
  if(index===qs.step)b.setAttribute('aria-current','step');
  if(qs.completed[index]&&qs.completed[index]!=='failed')b.classList.add('is-done');
  if(qs.completed[index]==='failed')b.classList.add('is-failed');
  const n=el('span','qs-step-index',String(index+1).padStart(2,'0')),name=el('span','',t(key)),status=el('small','qs-step-state',stepStatus(index));
  b.append(n,name,status);b.addEventListener('click',()=>setStep(index));li.append(b);list.append(li);
 });
}
function renderHeader(){
 const pct=Math.round((Object.keys(qs.completed).length/stepKeys.length)*100);
 $('qsProgressFill').style.width=Math.min(100,pct)+'%';
 $('qsProgressLabel').textContent=t('progress')+' · '+(qs.step+1)+' / '+stepKeys.length;
 $('qsProgressState').textContent=qs.completed[qs.step]?stepStatus(qs.step):t('statusPending');
 $('qsConnectionBadge').textContent=state().connected?t('connected')+' · '+(state().armed===false?t('disarmed'):'ARM / UNKNOWN'):t('disconnected');
 $('qsBackBtn').disabled=qs.step===0||qs.applyBusy;
 $('qsNextBtn').hidden=qs.step===9;
 $('qsNextBtn').disabled=!canNext();
 $('qsNextBtn').textContent=qs.step===8?t('finish'):t('next');
 $('qsExitBtn').disabled=qs.applyBusy;
}
function addHeading(parent,title,body){
 appendText(parent,'h2',title);
 if(body)appendText(parent,'p',body,'qs-lead');
}
function renderIntro(box){
 addHeading(box,t('introTitle'),t('introBody'));
 callout(box,t('introWarn'),'warning');
 checkbox(box,t('introAck'),!!qs.completed[0],checked=>{if(checked)complete(0,'manual');else{delete qs.completed[0];render();}});
 if(qs.resumeFrom>0){
  const notice=el('div','qs-resume',t('resume')+' '+qs.resumeFrom+' / '+stepKeys.length+'. '+t('resumeBody'));box.append(notice);
  button(box,t('reset'),()=>{qs.resumeFrom=0;qs.step=0;qs.completed={};qs.paramsMode='keep';persist();render();});
 }
 button(box,t('start'),()=>{if(!qs.completed[0])complete(0,'manual');});
}
function renderSafety(box){
 addHeading(box,t('safetyTitle'),t('safetyBody'));
 const group=el('div','qs-field-list');
 t('safetyChecks').forEach((label,index)=>checkbox(group,label,qs.safety[index],value=>{qs.safety[index]=value;render();}));
 box.append(group);
 if(qs.safety.every(Boolean))complete(1,'manual');
}
function selectedBoard(){const s=state();return s.selectedBoard||'unknown';}
function boardLabel(id){return id==='matek-h743-wing-v3'?'Matek H743-WING V3':id==='cube-orange'?'Orange Cube':id;}
function renderFirmware(box){
 const board=selectedBoard(),matek=board==='matek-h743-wing-v3';
 addHeading(box,t('firmwareTitle'),t('firmwareBody'));
 const kv=el('div','qs-kv');const item=el('div');item.append(el('small','',t('board')),el('strong','',boardLabel(board)));kv.append(item);box.append(kv);
 if(matek)callout(box,t('firmwareDfuWait'),'warning');else callout(box,t('firmwareExternal'),'warning');
 if(qs.firmwareSource==='dfu')callout(box,t('firmwareSuccess'),'success');
 if(qs.firmwareError)callout(box,t('firmwareFailure'),'danger');
 const actions=el('div','qs-inline-actions');
 button(actions,t('openFirmware'),()=>api.navigate('firmware'),'cc-button ghost');
 box.append(actions);
 checkbox(box,t('firmwareManual'),qs.firmwareSource==='manual',checked=>{
  if(checked){qs.firmwareSource='manual';complete(2,'manual');}
  else{qs.firmwareSource=null;delete qs.completed[2];render();}
 });
 if(qs.firmwareSource==='dfu'||qs.firmwareSource==='manual')callout(box,qs.firmwareSource==='dfu'?t('firmwareSuccess'):t('firmwareReady'),'success');
}
let metadataPromise=null;
async function getMetadata(){
 if(qs.metadataReady)return qs.metadata;
 if(!metadataPromise)metadataPromise=fetch('data/param-metadata.json').then(r=>{if(!r.ok)throw Error('metadata HTTP '+r.status);return r.json();}).then(d=>{qs.metadata=d.parameters||{};qs.metadataReady=true;return qs.metadata;}).catch(()=>{qs.metadata={};qs.metadataReady=true;return qs.metadata;});
 return metadataPromise;
}
function currentParamState(){return state();}
function downloadBackup(){
 const s=currentParamState();if(!paramReady(s))throw Error(t('readWaiting'));
 const lines=['# A.T.L.A.S. Quick Setup backup','# Board: '+boardLabel(s.selectedBoard),'# Generated: '+new Date().toISOString()];
 [...s.params.entries()].sort((a,b)=>a[0].localeCompare(b[0])).forEach(([name,p])=>lines.push(name+' '+Number(p.value)));
 const blob=new Blob([lines.join('\n')+'\n'],{type:'text/plain'}),url=URL.createObjectURL(blob),a=el('a');
 a.href=url;a.download='ATLAS-backup-'+new Date().toISOString().slice(0,10)+'.param';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 qs.backupDownloaded=true;qs.paramsMessage=t('backupDone');render();
}
async function waitForParams(timeout=90000){
 return new Promise(resolve=>{
  const start=Date.now(),timer=setInterval(()=>{
   const s=state();
   if(paramReady(s)){clearInterval(timer);resolve({ok:true,state:s});}
   else if(!s.connected){clearInterval(timer);resolve({ok:false,reason:'disconnected'});}
   else if(!s.paramLoading&&s.paramPhase==='partial'){clearInterval(timer);resolve({ok:false,reason:'partial'});}
   else if(Date.now()-start>timeout){clearInterval(timer);resolve({ok:false,reason:'timeout'});}
  },500);
 });
}
async function loadParams(){
 const s=state();if(!s.connected){qs.paramsMessage=t('readNoLink');render();return;}
 qs.paramsMessage=t('readWaiting');render();
 api.requestParameters();
 const result=await waitForParams();
 qs.paramsMessage=result.ok?t('readComplete'):result.reason==='partial'?t('readPartial'):t('readNoLink');
 render();
}
function paramErrorText(error){
 const keys={unknown:'paramUnknown',duplicate:'paramDuplicate',range:'paramRange',format:'paramFormat',integer:'paramInteger',readonly:'paramReadonly','int64-unsupported':'paramInt64'};
 return t(keys[error.reason]||'paramInvalid')+(error.name?' · '+error.name:'')+(error.line?' · line '+error.line:'');
}
async function onParamFile(file){
 if(!file)return;
 const s=state();
 if(!paramReady(s)){qs.paramsMessage=t('readWaiting');render();return;}
 qs.fileName=file.name;qs.paramsMessage=t('readWaiting');render();
 const metadata=await getMetadata(),result=core.parseParamText(await file.text(),s.params,metadata);
 qs.preview=result;qs.paramsMessage=result.valid?t('preview'):t('paramInvalid');render();
}
async function applyCustomParams(){
 const s=state();
 if(!qs.preview?.valid||!qs.backupDownloaded||!qs.compatConfirmed||!paramReady(s)||!safeLink(s)){qs.paramsMessage=t('paramInvalid');render();return;}
 if(!qs.preview.changes.length){qs.paramsApplied=false;qs.paramsMessage=t('paramNoChanges');complete(3,'manual');return;}
 if(!window.confirm(t('applyConfirm')+'\n\n'+qs.preview.changes.length+' '+t('changed')))return;
 qs.applyBusy=true;qs.cancelApply=false;qs.paramsMessage=t('applying');render();
 try{
  const updates=Object.fromEntries(qs.preview.changes);
  const result=await api.writeAdvancedParams(updates,p=>{qs.paramsMessage=t('applying')+' · '+p.done+'/'+p.total+' · '+(p.name||'');setGlobal(qs.paramsMessage);},()=>qs.cancelApply);
  if(result.done!==result.total)throw Error('Incomplete PARAM_VALUE acknowledgements');
  qs.paramsMessage=t('readWaiting');api.requestParameters();
  const readback=await waitForParams();
  if(!readback.ok)throw Error(t('readPartial'));
  const live=readback.state.params;
  const mismatches=qs.preview.changes.filter(([name,value])=>{const actual=Number(live.get(name)?.value);return !Number.isFinite(actual)||Math.abs(actual-value)>Math.max(1e-5,Math.abs(value)*2e-6);});
  if(mismatches.length)throw Error('Readback mismatch: '+mismatches.map(x=>x[0]).join(', '));
  qs.paramsApplied=true;qs.paramsMessage=t('applyDone');complete(3,'done');
 }catch(error){qs.paramsMessage=t('applyPartial')+' · '+error.message;setGlobal(qs.paramsMessage,true);}
 finally{qs.applyBusy=false;qs.cancelApply=false;render();}
}
function renderParams(box){
 addHeading(box,t('paramsTitle'),t('paramsBody'));
 const s=state(),ready=paramReady(s);
 const status=el('div','qs-kv');
 const a=el('div');a.append(el('small','',t('live')),el('strong','',s.connected?(s.armed===false?t('disarmed'):'ARM / UNKNOWN'):t('disconnected')));
 const b=el('div');b.append(el('small','',t('readCount')),el('strong','',String(s.params?.size||0)+' / '+(s.paramCount??'?')));
 status.append(a,b);box.append(status);
 const actions=el('div','qs-inline-actions');button(actions,t('readParams'),loadParams,'cc-button ghost');button(actions,t('backup'),()=>{try{downloadBackup();}catch(e){setGlobal(e.message,true);}},'cc-button outline');box.append(actions);
 if(ready&&qs.backupDownloaded)callout(box,t('backupDone'),'success');
 if(qs.paramsMessage)callout(box,qs.paramsMessage,qs.paramsMessage.includes(t('applyPartial'))||qs.paramsMessage===t('paramInvalid')?'danger':'');
 radio(box,t('paramsKeep'), 'keep',qs.paramsMode==='keep',value=>{qs.paramsMode=value;qs.preview=null;qs.fileName='';qs.compatConfirmed=false;qs.keepConfirmed=false;delete qs.completed[3];persist();render();});
 radio(box,t('paramsCustom'),'custom',qs.paramsMode==='custom',value=>{qs.paramsMode=value;qs.keepConfirmed=false;delete qs.completed[3];persist();render();});
 if(qs.paramsMode==='keep'){
  callout(box,t('paramsKeepWarn'),'warning');
  if(ready)checkbox(box,t('keepConfirm'),qs.keepConfirmed,value=>{qs.keepConfirmed=value;if(value&&qs.backupDownloaded)complete(3,'manual');else{delete qs.completed[3];render();}});
 }else{
  const fileInput=el('input','qs-input');fileInput.type='file';fileInput.accept='.param,.txt';fileInput.addEventListener('change',event=>onParamFile(event.target.files?.[0]));box.append(el('label','',t('file')),fileInput);
  appendText(box,'p',qs.fileName||t('fileName'),'qs-global-status');
  if(qs.preview){
   const summary=el('div','qs-kv');
   [[t('changed'),String(qs.preview.changes.length)],[t('errors'),String(qs.preview.errors.length)],[t('warnings'),String(qs.preview.warnings.length)]].forEach(pair=>{const cell=el('div');cell.append(el('small','',pair[0]),el('strong','',pair[1]));summary.append(cell);});
   box.append(summary);
   if(qs.preview.errors.length){const list=el('div','qs-callout danger');qs.preview.errors.slice(0,20).forEach(err=>list.append(el('div','',paramErrorText(err))));box.append(list);}
   if(qs.preview.warnings.length)callout(box,t('paramWarning'),'warning');
   const diff=el('div','qs-diff');qs.preview.changes.slice(0,100).forEach(([name,value])=>{const row=el('div','qs-diff-row');row.append(el('code','',name));row.append(el('span','',(s.params.get(name)?.value??'—')+' → '+value));diff.append(row);});if(qs.preview.changes.length>100)diff.append(el('p','', '+ '+(qs.preview.changes.length-100)));box.append(diff);
   checkbox(box,t('compatConfirm'),qs.compatConfirmed,value=>{qs.compatConfirmed=value;render();});
   const canApply=ready&&qs.backupDownloaded&&qs.preview.valid&&qs.compatConfirmed&&safeLink(s)&&!qs.applyBusy;
   const applyRow=el('div','qs-inline-actions');
   button(applyRow,qs.applyBusy?t('applying'):t('apply'),applyCustomParams,'cc-button primary').disabled=!canApply;
   if(qs.applyBusy)button(applyRow,t('cancelApply'),()=>{qs.cancelApply=true;setGlobal(t('cancelled'));},'cc-button outline');
   box.append(applyRow);
  }
 }
 if(qs.paramsMode==='keep'&&ready&&qs.backupDownloaded&&qs.keepConfirmed&&!qs.completed[3])complete(3,'manual');
 if(!ready&&s.paramPhase==='partial')callout(box,t('readPartial'),'warning');
}
function startCalibration(kind){
 if(!api.canCalibrate()){setGlobal(t('accelNeedLink'),true);return;}
 if(kind==='six'){api.navigate('accelerometer');$('accSixBtn')?.click();}
 else if(kind==='level'){api.navigate('accelerometer');$('accLevelBtn')?.click();}
 else if(kind==='compass'){api.navigate('compass');$('compassStartBtn')?.click();}
}
function renderAccel(box){
 addHeading(box,t('accelTitle'),t('accelBody'));
 const s=state();callout(box,api.canCalibrate()?t('disarmed'):t('accelNeedLink'),api.canCalibrate()?'success':'warning');
 if(qs.accelError)callout(box,qs.accelError,'danger');
 button(box,t('startAccel'),()=>startCalibration('six'),'cc-button primary').disabled=!api.canCalibrate();
 if(qs.completed[4])callout(box,t('accelDone'),'success');
}
function renderLevel(box){
 addHeading(box,t('levelTitle'),t('levelBody'));
 if(qs.levelError)callout(box,qs.levelError,'danger');
 callout(box,t('accelNeedLink'),api.canCalibrate()?'success':'warning');
 button(box,t('startLevel'),()=>startCalibration('level'),'cc-button primary').disabled=!api.canCalibrate();
 if(qs.completed[5])callout(box,t('levelDone'),'success');
}
function renderReboot(box){
 addHeading(box,t('rebootTitle'));
 if(!qs.paramsApplied){callout(box,t('rebootNotNeeded'),'success');if(!qs.completed[6])qs.completed[6]='skipped';return;}
 callout(box,t('rebootBody'),'warning');callout(box,t('rebootNeed'),'warning');
 const s=state();
 if(qs.rebootSawDisconnect&&s.connected&&Date.now()-s.lastHeartbeat<4000){
  appendText(box,'p',t('rebootStatus'),'qs-global-status');
  button(box,t('rebootRead'),async()=>{
   if(qs.rebootReading)return;qs.rebootReading=true;render();
   api.requestParameters();const result=await waitForParams();qs.rebootReading=false;
   if(result.ok){complete(6,'done');setGlobal(t('rebootDone'));}else setGlobal(t('readPartial'),true);
  },'cc-button primary').disabled=qs.rebootReading;
 }else appendText(box,'p',t('rebootStatus'),'qs-global-status');
}
function renderEsc(box){
 addHeading(box,t('escTitle'),t('escBody'));
 const s=state();if(!paramReady(s)){callout(box,t('readWaiting'),'warning');return;}
 const result=core.classifyEscProtocol(s.params,s.selectedBoard);
 const channels=result.channels?.length?result.channels.join(', '):'—';
 const kv=el('div','qs-kv');[[t('escProtocol'),result.kind.toUpperCase()],[t('escChannels'),channels]].forEach(pair=>{const cell=el('div');cell.append(el('small','',pair[0]),el('strong','',pair[1]));kv.append(cell);});box.append(kv);
 let message='escUnknown',confirmLabel='escOtherConfirm',status='manual';
 if(result.kind==='dshot'){message='escDshot';confirmLabel='escDshotConfirm';status='skipped';}
 else if(result.kind==='pwm'){message='escPwm';confirmLabel='escManual';status='manual';}
 else if(result.kind==='other-pulse'){message='escPulse';confirmLabel='escOtherConfirm';}
 else if(result.kind==='mixed'){message='escMixed';confirmLabel='escOtherConfirm';}
 else if(result.kind==='dshot-board-limit'){message='escCubeLimit';confirmLabel='escOtherConfirm';}
 else if(result.kind==='no-throttle'){message='escNone';confirmLabel='escNoneConfirm';}
 callout(box,t(message),result.kind==='dshot'?'success':'warning');
 if(result.reason)appendText(box,'p',result.reason,'qs-global-status');
 if(result.kind==='pwm')link(box,t('escDocs'),'https://ardupilot.org/plane/docs/common-esc-calibration.html');
 checkbox(box,t(confirmLabel),!!qs.escConfirmed,value=>{qs.escConfirmed=value;if(value)complete(7,status);else{delete qs.completed[7];render();}});
}
function renderCompass(box){
 addHeading(box,t('compassTitle'),t('compassBody'));
 const s=state();if(!paramReady(s)){callout(box,t('readWaiting'),'warning');return;}
 const result=core.detectCompass(s.params);
 if(result.kind==='enabled'){
  callout(box,t('compassEnabled'),'success');
  if(qs.compassAwaitingSave)callout(box,t('compassAwaitSave'),'warning');
  if(qs.compassError)callout(box,qs.compassError,'danger');
  button(box,t('startCompass'),()=>startCalibration('compass'),'cc-button primary').disabled=!api.canCalibrate();
  button(box,t('open'),()=>api.navigate('compass'),'cc-button ghost');
  if(qs.completed[8])callout(box,t('compassDone'),'success');
 }else if(result.kind==='disabled'){
  callout(box,t('compassDisabled'),'warning');
  checkbox(box,t('compassSkip'),!!qs.completed[8],value=>{if(value)complete(8,'skipped');else{delete qs.completed[8];render();}});
 }else{
  callout(box,t('compassUnknown'),'warning');
  checkbox(box,t('compassManual'),!!qs.completed[8],value=>{if(value)complete(8,'manual');else{delete qs.completed[8];render();}});
 }
}
function renderFinal(box){
 addHeading(box,t('doneTitle'),t('finalBody'));
 const list=el('div','qs-field-list');
 t('finalChecks').forEach((label,index)=>checkbox(list,label,qs.finalChecks[index],value=>{qs.finalChecks[index]=value;render();}));
 box.append(list);
 if(qs.finalChecks.every(Boolean)){
  if(!qs.completed[9])qs.completed[9]='manual';
  callout(box,t('finalComplete'),'warning');
 }else callout(box,t('notComplete'),'warning');
}
function render(){
 const box=$('qsContent');if(!box)return;box.replaceChildren();
 const titles=[t('introTitle'),t('safetyTitle'),t('firmwareTitle'),t('paramsTitle'),t('accelTitle'),t('levelTitle'),t('rebootTitle'),t('escTitle'),t('compassTitle'),t('finalTitle')];
 appendText(box,'div',String(qs.step+1).padStart(2,'0')+' / '+String(stepKeys.length).padStart(2,'0'),'cc-overline');
 if(qs.step===0)renderIntro(box);
 else if(qs.step===1)renderSafety(box);
 else if(qs.step===2)renderFirmware(box);
 else if(qs.step===3)renderParams(box);
 else if(qs.step===4)renderAccel(box);
 else if(qs.step===5)renderLevel(box);
 else if(qs.step===6)renderReboot(box);
 else if(qs.step===7)renderEsc(box);
 else if(qs.step===8)renderCompass(box);
 else renderFinal(box);
 renderStepList();renderHeader();
 if(qs.step===9&&qs.finalChecks.every(Boolean))$('qsNextBtn').hidden=true;
}
$('qsBackBtn').addEventListener('click',()=>setStep(qs.step-1));
$('qsNextBtn').addEventListener('click',()=>{
 if(!canNext())return;
 if(qs.step===6&&!qs.paramsApplied)qs.completed[6]='skipped';
 if(qs.step===9)return;
 setStep(qs.step+1);
});
$('qsExitBtn').addEventListener('click',()=>api.navigate('dashboard'));
$('qsContent').addEventListener('click',event=>{
 const anchor=event.target.closest('a[data-qs-full]');
 if(anchor){event.preventDefault();api.navigate('basic');}
});
document.querySelector('[data-qs-t="fullConfigurator"]')?.addEventListener('click',event=>{event.preventDefault();api.navigate('basic');});
window.addEventListener('atlas:dfu',event=>{
 const d=event.detail||{};
 if(d.success&&d.verified&&d.board===selectedBoard()){qs.firmwareSource='dfu';qs.firmwareError='';complete(2,'done');setGlobal(t('firmwareSuccess'));}
 else if(!d.success){qs.firmwareError=d.reason||t('firmwareFailure');render();}
 else{qs.firmwareError=t('firmwareFailure');render();}
});
window.addEventListener('atlas:calibration',event=>{
 const d=event.detail||{};
 if(d.kind==='six'){if(core.verifiedEvent(d,'six')){qs.accelError='';complete(4,'done');setGlobal(t('accelDone'));}else if(d.status==='failed'){qs.accelError=t('accelFail');qs.completed[4]='failed';render();}}
 if(d.kind==='level'){if(core.verifiedEvent(d,'level')){qs.levelError='';complete(5,'done');setGlobal(t('levelDone'));}else if(d.status==='failed'){qs.levelError=t('levelFail');qs.completed[5]='failed';render();}}
 if(d.kind==='compass'){if(core.verifiedEvent(d,'compass')){qs.compassAwaitingSave=false;qs.compassError='';complete(8,'done');setGlobal(t('compassDone'));}else if(d.status==='awaiting-save'){qs.compassAwaitingSave=true;render();}else if(d.status==='failed'){qs.compassError=t('compassFail');qs.completed[8]='failed';render();}}
});
setInterval(()=>{
 if(qs.step===6&&qs.paramsApplied){
  const s=state();
  if(!s.connected||Date.now()-s.lastHeartbeat>6000)qs.rebootSawDisconnect=true;
  if(qs.rebootSawDisconnect&&s.connected&&s.lastHeartbeat>qs.rebootBaseline&&Date.now()-s.lastHeartbeat<4000){setGlobal(t('rebootDone'));render();}
 }
 if(qs.step===3||qs.step===4||qs.step===5||qs.step===7||qs.step===8)renderHeader();
},1000);
window.addEventListener('atlas:language',render);
window.addEventListener('atlas:parameters',render);
document.querySelectorAll('[data-language]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(render,0)));
render();
})();
