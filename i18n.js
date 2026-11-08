(() => {
 'use strict';
 const dictionary = {
 "uk": {
  "Релизы": "Релізи",
  "Публичные сборки на сайте.": "Публічні збірки на сайті.",
  "Актуальные и архивные прошивки доступны в каталоге этого сайта. Исходный репозиторий разработчика не публикуется; для распространяемых сборок соответствующие исходники должны быть доступны отдельно согласно GNU GPL.": "Поточні та архівні прошивки доступні в каталозі цього сайту. Приватний репозиторій розробника не публікується; відповідний вихідний код розповсюджуваних збірок має бути доступний окремо відповідно до GNU GPL.",
  "Каталог прошивок ↗": "Каталог прошивок ↗",
  "Загрузка, история версий и откат — здесь, на сайте A.T.L.A.S.": "Завантаження, історія версій і повернення до старої збірки — тут, на сайті A.T.L.A.S.",
  "* GNU GPLv3: при публичной раздаче HEX необходимо обеспечить соответствующие исходники именно этой версии сборки. Закрытый служебный репозиторий не заменяет доступ к исходникам для получателей прошивки.": "* GNU GPLv3: у разі публічного розповсюдження HEX необхідно надати відповідний вихідний код саме цієї збірки. Приватний репозиторій не замінює доступ до коду для одержувачів прошивки.",
  "Поддержать проект": "Підтримати проєкт",
  "Поддержать разработчиков A.T.L.A.S.": "Підтримати розробників A.T.L.A.S.",
  "A.T.L.A.S. развивается благодаря работе авторов и поддержке сообщества. Добровольные пожертвования помогают продолжать разработку, проводить испытания и выпускать новые версии прошивки.": "A.T.L.A.S. розвивається завдяки роботі авторів і підтримці спільноти. Добровільні внески допомагають продовжувати розробку, проводити випробування та випускати нові версії прошивки.",
  "Добровольная поддержка проекта": "Добровільна підтримка проєкту",
  "Разработка и испытания новых возможностей": "Розробка й випробування нових можливостей",
  "Подготовка публичных обновлений": "Підготовка публічних оновлень",
  "Способы поддержки и контакт для записи в программу будут добавлены здесь после настройки платёжной платформы.": "Способи підтримки та контакт для запису до програми з’являться тут після налаштування платіжної платформи.",
  "Список ранних тестировщиков": "Список ранніх тестувальників",
  "Те, кто поддерживает развитие A.T.L.A.S. и хочет участвовать в тестировании, по своему согласию включаются в специальный список. Участников будут приглашать для проверки новых функций и возможностей до их выхода в общедоступной версии прошивки.": "Ті, хто підтримує розвиток A.T.L.A.S. і хоче взяти участь у тестуванні, за власною згодою потрапляють до спеціального списку. Учасників запрошуватимуть перевіряти нові функції та можливості до їх виходу в загальнодоступній версії прошивки.",
  "Поддержать разработку добровольным пожертвованием.": "Підтримати розробку добровільним внеском.",
  "Подтвердить желание участвовать в ранних испытаниях.": "Підтвердити бажання брати участь у ранніх випробуваннях.",
  "Получать приглашения на подходящие тесты по мере готовности функций.": "Отримувати запрошення на відповідні випробування, коли функції будуть готові.",
  "Приглашения зависят от готовности сборки, доступных мест и требований безопасности. Участие не означает гарантированного доступа к каждой тестовой версии. Получатели прошивки сохраняют права, предусмотренные GNU GPL.": "Запрошення залежать від готовності збірки, наявності місць і вимог безпеки. Участь не гарантує доступу до кожної тестової версії. Одержувачі прошивки зберігають права, передбачені GNU GPL.",
  "Ответы на вопросы": "Питання та відповіді",
  "Конфигуратор ↗": "Конфігуратор ↗",
  "Список изменений": "Список змін",
  "Исходники готовятся к публикации.": "Вихідний код готується до публікації.",
  "Конфигуратор": "Конфігуратор",
  "О проекте": "Про проєкт",
  "Возможности": "Можливості",
  "Сборки": "Збірки",
  "Установка": "Встановлення",
  "Выбрать прошивку": "Обрати прошивку",
  "Изучить проект": "Дізнатися про проєкт",
  "A.T.L.A.S. — экспериментальная ветка ArduPlane с собственными алгоритмами ориентации, управления и автоматизации полёта. Создана для исследований, испытаний и сообщества разработчиков.": "A.T.L.A.S. — експериментальна гілка ArduPlane з власними алгоритмами орієнтації, керування й автоматизації польоту. Створена для досліджень, випробувань і спільноти розробників.",
  "Экспериментальное ПО. Не используйте в реальном полёте без самостоятельной проверки.": "Експериментальне ПЗ. Не використовуйте в реальному польоті без власної перевірки.",
  "ДЕМО · НЕ ЖИВАЯ ТЕЛЕМЕТРИЯ": "ДЕМО · НЕ РЕАЛЬНА ТЕЛЕМЕТРІЯ",
  "Наведи мышь": "Наведи курсор",
  "— крен / тангаж ·": "— крен / тангаж ·",
  "Удерживай ЛКМ": "Утримуй ЛКМ",
  "— ускорение": "— прискорення",
  "Можно использовать клавиши ↑ ↓ ← → и пробел.": "Можна використовувати клавіші ↑ ↓ ← → та пробіл.",
  "ОСНОВА": "ОСНОВА",
  "ОРИЕНТАЦИЯ": "ОРІЄНТАЦІЯ",
  "ПОДХОД": "ПІДХІД",
  "СТАТУС": "СТАТУС",
  "Исследовательские возможности, созданные на базе ArduPlane. Каждый алгоритм развивается и проходит отдельные испытания.": "Дослідницькі можливості на основі ArduPlane. Кожен алгоритм розвивається та проходить окремі випробування.",
  "EKF3 без GPS": "EKF3 без GPS",
  "Экспериментальные изменения оценки ориентации и скорости при отсутствии спутниковой навигации.": "Експериментальні зміни оцінювання орієнтації та швидкості за відсутності супутникової навігації.",
  "TAKEOFF без GPS": "TAKEOFF без GPS",
  "Адаптированная логика старта, обнаружения полёта и переходов между режимами.": "Адаптована логіка запуску, визначення польоту та переходів між режимами.",
  "Автопосадка": "Автопосадка",
  "Разрабатываемые сценарии посадки без GPS. Требуют самостоятельной проверки на совместимость и отказоустойчивость.": "Сценарії посадки без GPS, які перебувають у розробці. Потребують окремої перевірки сумісності та відмовостійкості.",
  "Управление FBWA": "Керування FBWA",
  "Экспериментальный RUD_LIMIT_DEG: согласование ручного рудера и дополнительного крена.": "Експериментальний RUD_LIMIT_DEG: узгодження ручного керма напрямку та додаткового крену.",
  "Здесь отображаются только реальные сборки, привязанные к конкретной плате. Пока файл не опубликован и не проверен, кнопка скачивания неактивна.": "Тут відображаються лише реальні збірки для конкретних плат. Поки файл не опублікований і не перевірений, завантаження недоступне.",
  "Все платы": "Усі плати",
  "Есть сборка": "Є збірка",
  "В подготовке": "У підготовці",
  "Загружаем список платформ…": "Завантаження списку платформ…",
  "Не видишь своей платы? Не прошивай сборку для другой аппаратной ревизии. Совместимость зависит от target/hwdef, загрузчика и распиновки.": "Не бачиш своєї плати? Не встановлюй збірку для іншої апаратної ревізії. Сумісність залежить від target/hwdef, завантажувача та розпінування.",
  "Как запросить поддержку": "Як запросити підтримку",
  "Не пропускай проверку аппаратной ревизии и резервное копирование параметров. Прошивка управляет реальными исполнительными механизмами.": "Не пропускай перевірку апаратної ревізії та резервне копіювання параметрів. Прошивка керує реальними виконавчими механізмами.",
  "Уточни плату": "Перевір плату",
  "Найди точную модель и ревизию полётного контроллера. Название должно совпадать со сборкой.": "Дізнайся точну модель і ревізію польотного контролера. Назва має відповідати збірці.",
  "Сохрани параметры": "Збережи параметри",
  "Экспортируй параметры и проверь инструкции по совместимости. Не переноси вслепую конфигурацию из другой версии.": "Експортуй параметри й перевір інструкції із сумісності. Не перенось навмання конфігурацію з іншої версії.",
  "Установи прошивку": "Встанови прошивку",
  "Используй совместимый загрузчик и режим установки прошивки в Mission Planner. Проводить настройку — без пропеллера.": "Використовуй сумісний завантажувач і режим встановлення у Mission Planner. Налаштовуй без пропелера.",
  "Протестируй": "Протестуй",
  "Проверь датчики, рули, направления, failsafe и режимы в SITL и на земле прежде, чем рассматривать полёт.": "Перевір датчики, кермові поверхні, напрями, failsafe та режими в SITL і на землі до польоту.",
  "A.T.L.A.S. не является подтверждённой заменой штатного ArduPlane для любых самолётов. Функции без GPS зависят от датчиков, модели полёта и калибровок. Наличие сборки для платы не означает проверенную безопасность конкретного самолёта.": "A.T.L.A.S. не є перевіреною заміною штатного ArduPlane для всіх літаків. Функції без GPS залежать від датчиків, моделі польоту та калібрувань. Наявність збірки для плати не гарантує безпеки конкретного літака.",
  "Релизы, изменения, отчёты о проблемах и обсуждения проекта будут доступны в репозитории. Документация развивается вместе с прошивкой.": "Релізи, зміни, повідомлення про проблеми й обговорення будуть доступні в репозиторії. Документація розвивається разом із прошивкою.",
  "РАЗРАБОТКА": "РОЗРОБКА",
  "Перейти в репозиторий ↗": "Відкрити репозиторій ↗",
  "Ссылка на репозиторий появится после публикации": "Посилання на репозиторій з’явиться після публікації",
  "* Сохраняйте лицензии и уведомления исходных компонентов ArduPilot. Файлы сайта не содержат исходников ArduPilot.": "* Зберігайте ліцензії та повідомлення про оригінальні компоненти ArduPilot. Файли сайту не містять вихідного коду ArduPilot.",
  "Pre-Release ArduPlane project by Oleksandr & AI CODEX. Not an official ArduPilot release.": "Передрелізний проєкт ArduPlane від Oleksandr та AI CODEX. Неофіційний реліз ArduPilot.",
  "A.T.L.A.S., наверх": "A.T.L.A.S., нагору",
  "Главное меню": "Головне меню",
  "Мобильное меню": "Мобільне меню",
  "Открыть меню": "Відкрити меню",
  "Закрыть меню": "Закрити меню",
  "Ссылка появится после подключения репозитория": "Посилання з’явиться після підключення репозиторію",
  "Интерактивная симуляция самолёта на авиагоризонте": "Інтерактивна симуляція літака на авіагоризонті",
  "Интерактивная демонстрация самолёта A.T.L.A.S.: перемещайте мышь для управления креном и тангажом, удерживайте левую кнопку мыши для ускорения, либо используйте стрелки и пробел": "Інтерактивна демонстрація літака A.T.L.A.S.: рухайте мишу для керування креном і тангажом, утримуйте ЛКМ для прискорення або використовуйте стрілки та пробіл",
  "Ключевые характеристики": "Ключові характеристики",
  "Найти полётный контроллер...": "Знайти польотний контролер...",
  "Фильтр по статусу": "Фільтр за статусом",
  "Выбор языка": "Вибір мови",
  "Статус проекта": "Статус проєкту",
  "● ОПУБЛИКОВАНО": "● ОПУБЛІКОВАНО",
  "◷ ПОДГОТОВКА": "◷ ПІДГОТОВКА",
  "НЕ ПРОВЕРЕНО": "НЕ ПЕРЕВІРЕНО",
  "Flight controller": "Польотний контролер",
  "Неизвестная плата": "Невідома плата",
  "Описание отсутствует.": "Опис відсутній.",
  "База ": "Основа ",
  "СКАЧАТЬ ↗": "ЗАВАНТАЖИТИ ↗",
  "Копировать SHA-256": "Копіювати SHA-256",
  "Скопировано ✓": "Скопійовано ✓",
  "Невозможно скопировать": "Не вдалося скопіювати",
  "Нет подтверждённых сборок для этой платформы": "Немає перевірених збірок для цієї платформи",
  "Сборка пока не опубликована": "Збірку ще не опубліковано",
  "Ничего не найдено": "Нічого не знайдено",
  "Измените поисковый запрос или фильтр.": "Змініть пошуковий запит або фільтр.",
  "Показано": "Показано",
  "из": "із",
  "платформ": "платформ",
  "Опубликованных сборок": "Опублікованих збірок",
  "Запросить поддержку": "Запросити підтримку",
  "Не удалось прочитать каталог сборок.": "Не вдалося прочитати каталог збірок.",
  "Каталог пока недоступен": "Каталог поки недоступний",
  "Запустите сайт через HTTP-сервер или проверьте файл data/releases.json.": "Запустіть сайт через HTTP-сервер або перевірте файл data/releases.json.",
  "RELEASES AVAILABLE": "RELEASES AVAILABLE",
  "HOVER TO CONTROL": "НАВЕДИ ДЛЯ КЕРУВАННЯ",
  "FLIGHT CONTROL": "КЕРУВАННЯ ПОЛЬОТОМ",
  "BOOST ACTIVE": "ПРИСКОРЕННЯ",
  "Целевая аппаратная платформа. Совместимость и прошивку конкретной ревизии необходимо подтвердить до публикации.": "Цільова апаратна платформа. Сумісність і прошивку конкретної ревізії потрібно підтвердити до публікації.",
  "Уточняется для релиза": "Уточнюється для релізу",
  "Контроллер семейства Cube. Точную модель, аппаратную ревизию и совместимую сборку необходимо подтвердить до публикации.": "Контролер сімейства Cube. Точну модель, апаратну ревізію та сумісну збірку необхідно підтвердити до публікації.",
  "Точная модель уточняется": "Точна модель уточнюється",
  "Lead developer: Oleksandr · AI copilot: CODEX": "Головний розробник: Oleksandr · ШІ-помічник: CODEX",
  "Экспериментальный проект": "Експериментальний проєкт"
 },
 "en": {
  "Релизы": "Releases",
  "Публичные сборки на сайте.": "Public firmware builds on this website.",
  "Актуальные и архивные прошивки доступны в каталоге этого сайта. Исходный репозиторий разработчика не публикуется; для распространяемых сборок соответствующие исходники должны быть доступны отдельно согласно GNU GPL.": "Current and archived firmware builds are available in this website’s download catalog. The developer’s private repository is not linked; corresponding source code for distributed builds must be made available separately under the GNU GPL.",
  "Каталог прошивок ↗": "Firmware catalog ↗",
  "Загрузка, история версий и откат — здесь, на сайте A.T.L.A.S.": "Downloads, version history and rollback are available here on the A.T.L.A.S. website.",
  "* GNU GPLv3: при публичной раздаче HEX необходимо обеспечить соответствующие исходники именно этой версии сборки. Закрытый служебный репозиторий не заменяет доступ к исходникам для получателей прошивки.": "* GNU GPLv3: distributing a HEX publicly requires the corresponding source code for that exact build. A private repository is not a substitute for providing recipients access to the sources.",
  "Поддержать проект": "Support the project",
  "Поддержать разработчиков A.T.L.A.S.": "Support the A.T.L.A.S. developers",
  "A.T.L.A.S. развивается благодаря работе авторов и поддержке сообщества. Добровольные пожертвования помогают продолжать разработку, проводить испытания и выпускать новые версии прошивки.": "A.T.L.A.S. grows through the work of its developers and community support. Voluntary donations help fund further development, testing, and new firmware releases.",
  "Добровольная поддержка проекта": "Voluntary project support",
  "Разработка и испытания новых возможностей": "Development and testing of new features",
  "Подготовка публичных обновлений": "Preparing public releases",
  "Способы поддержки и контакт для записи в программу будут добавлены здесь после настройки платёжной платформы.": "Donation options and a contact for joining the programme will appear here once a payment platform is set up.",
  "Список ранних тестировщиков": "Early tester list",
  "Те, кто поддерживает развитие A.T.L.A.S. и хочет участвовать в тестировании, по своему согласию включаются в специальный список. Участников будут приглашать для проверки новых функций и возможностей до их выхода в общедоступной версии прошивки.": "People who support A.T.L.A.S. and wish to help with testing can opt in to a special list. Members will be invited to try new features before they reach the public firmware release.",
  "Поддержать разработку добровольным пожертвованием.": "Make a voluntary contribution to development.",
  "Подтвердить желание участвовать в ранних испытаниях.": "Confirm that you would like to join early testing.",
  "Получать приглашения на подходящие тесты по мере готовности функций.": "Receive invitations to suitable tests as features become ready.",
  "Приглашения зависят от готовности сборки, доступных мест и требований безопасности. Участие не означает гарантированного доступа к каждой тестовой версии. Получатели прошивки сохраняют права, предусмотренные GNU GPL.": "Invitations depend on build readiness, available places, and safety requirements. Participation does not guarantee access to every test build. Recipients retain their rights under the GNU GPL.",
  "Ответы на вопросы": "Questions & Answers",
  "Конфигуратор ↗": "Configurator ↗",
  "Список изменений": "Changelog",
  "Исходники готовятся к публикации.": "Source code is being prepared for release.",
  "Конфигуратор": "Configurator",
  "О проекте": "About",
  "Возможности": "Features",
  "Сборки": "Builds",
  "Установка": "Install",
  "Выбрать прошивку": "Choose firmware",
  "Изучить проект": "Explore the project",
  "A.T.L.A.S. — экспериментальная ветка ArduPlane с собственными алгоритмами ориентации, управления и автоматизации полёта. Создана для исследований, испытаний и сообщества разработчиков.": "A.T.L.A.S. is an experimental ArduPlane fork with custom attitude estimation, control, and flight automation algorithms. Built for research, testing, and the developer community.",
  "Экспериментальное ПО. Не используйте в реальном полёте без самостоятельной проверки.": "Experimental software. Do not fly without independently verifying it.",
  "ДЕМО · НЕ ЖИВАЯ ТЕЛЕМЕТРИЯ": "DEMO · NOT LIVE TELEMETRY",
  "Наведи мышь": "Move your mouse",
  "— крен / тангаж ·": "— roll / pitch ·",
  "Удерживай ЛКМ": "Hold left mouse",
  "— ускорение": "— accelerate",
  "Можно использовать клавиши ↑ ↓ ← → и пробел.": "You can also use ↑ ↓ ← → and Space.",
  "ОСНОВА": "BASE",
  "ОРИЕНТАЦИЯ": "ATTITUDE",
  "ПОДХОД": "APPROACH",
  "СТАТУС": "STATUS",
  "Исследовательские возможности, созданные на базе ArduPlane. Каждый алгоритм развивается и проходит отдельные испытания.": "Experimental capabilities built on ArduPlane. Each algorithm evolves and is tested separately.",
  "EKF3 без GPS": "GPS-free EKF3",
  "Экспериментальные изменения оценки ориентации и скорости при отсутствии спутниковой навигации.": "Experimental attitude and velocity estimation changes for operation without satellite navigation.",
  "TAKEOFF без GPS": "GPS-free TAKEOFF",
  "Адаптированная логика старта, обнаружения полёта и переходов между режимами.": "Adapted launch logic, in-flight detection, and transitions between flight modes.",
  "Автопосадка": "Autoland",
  "Разрабатываемые сценарии посадки без GPS. Требуют самостоятельной проверки на совместимость и отказоустойчивость.": "GPS-free landing scenarios in development. Require independent compatibility and fault-tolerance testing.",
  "Управление FBWA": "FBWA control",
  "Экспериментальный RUD_LIMIT_DEG: согласование ручного рудера и дополнительного крена.": "Experimental RUD_LIMIT_DEG: coordinates pilot rudder input with additional commanded bank.",
  "Здесь отображаются только реальные сборки, привязанные к конкретной плате. Пока файл не опубликован и не проверен, кнопка скачивания неактивна.": "Only actual builds for specific boards are listed here. Download buttons stay disabled until a file is published and verified.",
  "Все платы": "All boards",
  "Есть сборка": "Available",
  "В подготовке": "Planned",
  "Загружаем список платформ…": "Loading board list…",
  "Не видишь своей платы? Не прошивай сборку для другой аппаратной ревизии. Совместимость зависит от target/hwdef, загрузчика и распиновки.": "Can’t find your board? Never flash a build for a different hardware revision. Compatibility depends on target/hwdef, bootloader, and pinout.",
  "Как запросить поддержку": "Request board support",
  "Не пропускай проверку аппаратной ревизии и резервное копирование параметров. Прошивка управляет реальными исполнительными механизмами.": "Verify the exact hardware revision and back up your parameters. Firmware controls real actuators.",
  "Уточни плату": "Identify your board",
  "Найди точную модель и ревизию полётного контроллера. Название должно совпадать со сборкой.": "Find the exact flight controller model and revision. It must match the firmware build.",
  "Сохрани параметры": "Back up parameters",
  "Экспортируй параметры и проверь инструкции по совместимости. Не переноси вслепую конфигурацию из другой версии.": "Export your parameters and check compatibility notes. Do not blindly import a configuration from another version.",
  "Установи прошивку": "Flash firmware",
  "Используй совместимый загрузчик и режим установки прошивки в Mission Planner. Проводить настройку — без пропеллера.": "Use a compatible bootloader and the firmware installation workflow in Mission Planner. Remove the propeller before setup.",
  "Протестируй": "Verify operation",
  "Проверь датчики, рули, направления, failsafe и режимы в SITL и на земле прежде, чем рассматривать полёт.": "Check sensors, control surfaces, directions, failsafe, and flight modes in SITL and on the ground before considering flight.",
  "A.T.L.A.S. не является подтверждённой заменой штатного ArduPlane для любых самолётов. Функции без GPS зависят от датчиков, модели полёта и калибровок. Наличие сборки для платы не означает проверенную безопасность конкретного самолёта.": "A.T.L.A.S. is not a validated drop-in replacement for stock ArduPlane on every aircraft. GPS-free features depend on sensors, flight dynamics, and calibration. Availability of a board build does not imply flight safety for any specific aircraft.",
  "Релизы, изменения, отчёты о проблемах и обсуждения проекта будут доступны в репозитории. Документация развивается вместе с прошивкой.": "Releases, changes, issue reports, and discussions will be available in the repository. Documentation evolves alongside the firmware.",
  "РАЗРАБОТКА": "DEVELOPED BY",
  "Перейти в репозиторий ↗": "View repository ↗",
  "Ссылка на репозиторий появится после публикации": "Repository link will appear after publication",
  "* Сохраняйте лицензии и уведомления исходных компонентов ArduPilot. Файлы сайта не содержат исходников ArduPilot.": "* Retain the licenses and notices for upstream ArduPilot components. This website does not contain ArduPilot source code.",
  "Pre-Release ArduPlane project by Oleksandr & AI CODEX. Not an official ArduPilot release.": "Pre-Release ArduPlane project by Oleksandr & AI CODEX. Not an official ArduPilot release.",
  "A.T.L.A.S., наверх": "A.T.L.A.S., back to top",
  "Главное меню": "Main navigation",
  "Мобильное меню": "Mobile navigation",
  "Открыть меню": "Open menu",
  "Закрыть меню": "Close menu",
  "Ссылка появится после подключения репозитория": "Link will appear when a repository is connected",
  "Интерактивная симуляция самолёта на авиагоризонте": "Interactive aircraft simulation in attitude HUD",
  "Интерактивная демонстрация самолёта A.T.L.A.S.: перемещайте мышь для управления креном и тангажом, удерживайте левую кнопку мыши для ускорения, либо используйте стрелки и пробел": "Interactive A.T.L.A.S. aircraft demo: move the mouse to control roll and pitch, hold the left mouse button to accelerate, or use arrow keys and Space",
  "Ключевые характеристики": "Key specifications",
  "Найти полётный контроллер...": "Search flight controllers...",
  "Фильтр по статусу": "Filter by status",
  "Выбор языка": "Language selection",
  "Статус проекта": "Project status",
  "● ОПУБЛИКОВАНО": "● PUBLISHED",
  "◷ ПОДГОТОВКА": "◷ PLANNED",
  "НЕ ПРОВЕРЕНО": "UNVERIFIED",
  "Flight controller": "Flight controller",
  "Неизвестная плата": "Unknown board",
  "Описание отсутствует.": "No description available.",
  "База ": "Base ",
  "СКАЧАТЬ ↗": "DOWNLOAD ↗",
  "Копировать SHA-256": "Copy SHA-256",
  "Скопировано ✓": "Copied ✓",
  "Невозможно скопировать": "Could not copy",
  "Нет подтверждённых сборок для этой платформы": "No verified builds for this platform",
  "Сборка пока не опубликована": "Build not published yet",
  "Ничего не найдено": "No results",
  "Измените поисковый запрос или фильтр.": "Try another search or filter.",
  "Показано": "Showing",
  "из": "of",
  "платформ": "platforms",
  "Опубликованных сборок": "Published builds",
  "Запросить поддержку": "Request support",
  "Не удалось прочитать каталог сборок.": "Could not load the build catalog.",
  "Каталог пока недоступен": "Catalog unavailable",
  "Запустите сайт через HTTP-сервер или проверьте файл data/releases.json.": "Run the site via an HTTP server or check data/releases.json.",
  "RELEASES AVAILABLE": "RELEASES AVAILABLE",
  "HOVER TO CONTROL": "HOVER TO CONTROL",
  "FLIGHT CONTROL": "FLIGHT CONTROL",
  "BOOST ACTIVE": "BOOST ACTIVE",
  "Целевая аппаратная платформа. Совместимость и прошивку конкретной ревизии необходимо подтвердить до публикации.": "Target hardware platform. Compatibility and firmware for this exact revision must be verified before publication.",
  "Уточняется для релиза": "Pending for release",
  "Контроллер семейства Cube. Точную модель, аппаратную ревизию и совместимую сборку необходимо подтвердить до публикации.": "Cube-family flight controller. The exact model, hardware revision, and compatible build must be verified before publication.",
  "Точная модель уточняется": "Exact model pending",
  "Lead developer: Oleksandr · AI copilot: CODEX": "Lead developer: Oleksandr · AI copilot: CODEX",
  "Экспериментальный проект": "Experimental project"
 }
};
 const headlines = {"hero": {"ru": "ПОЛЁТ. БЕЗ ГРАНИЦ ПРИВЫЧНОГО.", "uk": "ПОЛІТ. ПОЗА МЕЖАМИ ЗВИЧНОГО.", "en": "FLIGHT. BEYOND THE ORDINARY."}, "features": {"ru": "Больше, чем обычная прошивка.", "uk": "Більше ніж звичайна прошивка.", "en": "More than just firmware."}, "downloads": {"ru": "Выбери свою платформу.", "uk": "Обери свою платформу.", "en": "Choose your controller."}, "guide": {"ru": "От выбора платы до первого старта.", "uk": "Від вибору плати до першого запуску.", "en": "From board to first flight."}, "safety": {"ru": "Экспериментальная прошивка. Ответственная эксплуатация.", "uk": "Експериментальна прошивка. Безпека.", "en": "Experimental firmware. Fly safely."}, "project": {"ru": "Исходники открыты для сообщества.", "uk": "Відкритий код для спільноти.", "en": "Open source. Built for community."}};
 const valid = ['ru', 'uk', 'en'];
 let lang = 'ru';
 try { const saved = localStorage.getItem('atlas-language'); if (valid.includes(saved)) lang=saved; } catch {};
 const textNodes = [];
 const attributes = [];
 const normalize = s => s.replace(/\s+/g,' ').trim();
 const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
   acceptNode(node) {
     if (!node.parentElement || ['SCRIPT','STYLE','NOSCRIPT'].includes(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
     return dictionary.uk[normalize(node.textContent)] !== undefined || dictionary.en[normalize(node.textContent)] !== undefined ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
   }
 });
 while(walker.nextNode()) {
   const node = walker.currentNode, original = node.textContent, key=normalize(original);
   textNodes.push({node, original, key});
 }
 const attrNames=['aria-label','placeholder','title'];
 for(const element of document.querySelectorAll('*')) {
   for(const name of attrNames) {
     const original=element.getAttribute(name);
     if(original && (dictionary.uk[normalize(original)]!==undefined || dictionary.en[normalize(original)]!==undefined)) attributes.push({element,name,original,key:normalize(original)});
   }
 }
 function t(key){return (dictionary[lang]||{})[key] ?? key;}
 function apply(next){
   if(!valid.includes(next)) return;
   lang=next;
   document.documentElement.lang=next;
   for(const item of textNodes) {
     const translated=t(item.key);
     item.node.textContent = (item.original.match(/^\s*/) || [''])[0] + translated + (item.original.match(/\s*$/) || [''])[0];
   }
   for(const a of attributes) a.element.setAttribute(a.name,t(a.key));
   for (const name of Object.keys(headlines)) {
     const image=document.querySelector(`img[data-headline="${name}"]`);
     if(image){image.src=`assets/headline-${name}${lang==='ru'?'':'-'+lang}.png`;image.alt=headlines[name][lang];}
   }
   for(const b of document.querySelectorAll('[data-lang]')) {
     const active=b.dataset.lang===lang;
     b.classList.toggle('is-selected',active);
     b.setAttribute('aria-pressed',String(active));
   }
   try{localStorage.setItem('atlas-language',lang);}catch{}
   window.dispatchEvent(new CustomEvent('atlas:languagechange',{detail:{lang}}));
 }
 window.AtlasI18n={t,get lang(){return lang;},set:apply};
 for(const button of document.querySelectorAll('.locale-button'))button.addEventListener('click',()=>apply(button.dataset.lang));
 apply(lang);
})();
