# JSlab

Production: **https://js-lab.site**. На сервере используются PostgreSQL 18 и отдельные службы systemd (`jslab-web`, `jslab-api`, `jslab-runner`) под разными системными пользователями, без Docker. Учебный код выполняется в одноразовом NsJail с отдельными namespaces, read-only корнем, без внешней сети и с ограничениями памяти/CPU/процессов. Корневой helper принимает только проверенный JSON задания и фиксированные операции, API не имеет sudo-доступа.

Исходники: `/home/max/jslab/releases/<commit>`; автономные runtime: `/home/max/jslab/runtime/<commit>`. `current` и `previous` указывают на текущую и единственную резервную версию. Секреты находятся в `/etc/jslab/*.env` с правами 0600; в репозитории их нет. Сборка: `bash deploy/build.sh <commit>`, затем `sudo /usr/local/sbin/jslab-admin backup`, `migrate <commit>`, `activate <commit>`. Первичная установка root-конфигурации: `deploy/provision.py`. Откат: `activate <предыдущий commit>`; миграции БД автоматически назад не выполняются. Nginx обслуживает HTTPS, Certbot продлевает сертификат через systemd timer.

Платформа для изучения **JavaScript, TypeScript, Express и NestJS**. Frontend — Nuxt 4 и Vue 3, backend — NestJS, Prisma 7 и PostgreSQL 18. Nest создан официальной командой:

```sh
npx --yes @nestjs/cli@11 new backend --package-manager npm --skip-git --strict
```

## Возможности

- 4 отдельных направления: 22 темы JavaScript, 12 TypeScript, 12 Express и 14 NestJS.
- В каждой из 60 глав: развёрнутая теория с оглавлением, примеры кода, объяснения граничных случаев, практика с подсказкой и тест из пяти вопросов. Всего 60 задач, 300 вопросов и 213 проверочных случаев.
- Редактор JS/TS, запуск примеров в изолированном браузерном worker, остановка по таймауту и локальные черновики, разделённые по аккаунтам и задачам.
- Независимая серверная проверка в одноразовых Docker-контейнерах. TypeScript проверяется в strict-режиме. Express и NestJS доступны в серверной песочнице.
- Регистрация, вход, HttpOnly-сессия в PostgreSQL, выход, профиль, смена пароля с отзывом всех сессий.
- Теория: 10 XP; практика: 50 XP; тест: 30 XP. Повторные и конкурентные запросы не начисляют опыт дважды. Полное завершение темы требует всех трёх этапов.
- Статусы «Не начата», «В процессе», «Завершена» с отдельными отметками теории, практики и теста. Неудачная попытка сохраняет статус «В процессе»; полное завершение требует всех трёх этапов.
- Профиль с прогрессом по направлениям и этапам, опытом до следующего уровня, дневной целью, серией с учётом часового пояса, активностью за 28 дней и 6 достижениями.
- 4 самостоятельных проекта с критериями и сохранением ссылки на работу. Отправка ссылки не начисляет XP и не означает автоматическую проверку проекта.
- Живой hero с сохранёнными вариантами видео, паузой, reduced motion и остановкой вне экрана/скрытой вкладки. По умолчанию выбран синий вариант со сценической надписью и восстановленными руками. Происхождение и варианты описаны в `scripts/hero-video/README.md`.
- Светлая тема по умолчанию с сохранением выбора; хедер лендинга всегда тёмный. Поиск с общей рамкой фокуса, селекты со стилизованным списком и управлением с клавиатуры.

## Запуск в Docker на Windows

Запустите Docker Desktop с Linux containers. Команды выполняются из корня проекта. Node.js нужен только для первого создания `.env`; существующий файл не перезаписывается.

```powershell
node scripts/configure-dev.mjs
docker compose --profile sandbox up --build -d
```

Откройте **http://localhost:3020**. Первый старт собирает приложение, применяет миграции и готовит отдельный образ исполнителя; это может занять несколько минут. Сохранённые аккаунты находятся в отдельном PostgreSQL volume проекта. Стандартного аккаунта или администратора с известным паролем нет — зарегистрируйтесь через интерфейс.

Порт можно изменить в `.env`: одновременно поменяйте `FRONTEND_PORT` и `ALLOWED_ORIGIN`. Для настройки по умолчанию используйте именно `localhost`, поскольку источник изменяющих запросов проверяется точно.

```powershell
docker compose ps
docker compose logs --tail 30 backend runner
docker compose --profile sandbox down
```

`down` сохраняет базу. Не добавляйте `-v`, если хотите сохранить прогресс. Docker socket Windows/хоста не подключён к приложению: runner управляет отдельным Docker-in-Docker daemon в закрытой управляющей сети.

Чтобы работать без серверной песочницы, задайте `EXECUTION_RUNNER=disabled` и запустите `docker compose up --build -d`. Теория, тесты и браузерные примеры работают; серверная проверка сообщает о недоступности и не начисляет XP.

## Разработка

Нужны **Node.js 24.22.1+ в ветке 24**, npm и PostgreSQL 18. Версия для разработки и CI закреплена в `.nvmrc`; более ранние версии не содержат необходимых исправлений безопасности. Для Docker установленный локально Node не влияет на сборку приложения.

```sh
npm run install:all
```

Создайте отдельную БД `script_lab`, скопируйте `backend/.env.example` в `backend/.env` и задайте свою `DATABASE_URL`. Примерные реквизиты в `.env.example` не создают БД. `ALLOWED_ORIGIN=http://127.0.0.1:3020` соответствует адресу Nuxt dev server. При отключённом runner пользовательский код не исполняется в API или на хосте.

```sh
npm --prefix backend run db:migrate
npm run dev
```

Nuxt: http://127.0.0.1:3020. Nest: http://127.0.0.1:8020/api. Frontend проксирует API через Nitro; приватный `NUXT_API_BASE` можно переопределить в `frontend/.env`.

## Архитектура

```text
frontend/
  app/
    pages/            # Файловая маршрутизация
    layouts/          # Общая оболочка и кабинет
    components/       # UI, редактор, тесты и hero
    composables/      # API, сессия, прогресс и тема
    middleware/       # Навигационная защита для UX
    plugins/          # Клиентское восстановление сессии
    utils/            # Чистые функции и sandbox-протокол
    assets/css/       # Токены и адаптивные стили
  server/api/         # Только Nitro proxy к Nest
  shared/types/       # Типы HTTP-контрактов
  public/             # Локальные видео, постер и шрифт
backend/
  src/
    auth/ catalog/ learning/ profile/ projects/
    common/           # Config, database, errors
  prisma/             # Schema и версионируемые миграции
runner/
  server.mjs          # Авторизованный broker с лимитом параллельности
  sandbox/            # Read-only, non-root, networkless контейнер
scripts/              # Учебный материал, настройка и проверки
```

Организация frontend следует официальной [структуре Nuxt](https://nuxt.com/docs/4.x/directory-structure), [загрузке данных](https://nuxt.com/docs/4.x/getting-started/data-fetching), [SSR-состоянию](https://nuxt.com/docs/4.x/getting-started/state-management) и [общему API-клиенту](https://nuxt.com/docs/4.x/guide/recipes/custom-usefetch). Каталог и теория рендерятся на сервере, кабинет и профиль загружаются на клиенте. Состояние пользователя создаётся через `useState` внутри composables; module-level reactive singletons отсутствуют. Нижний серверный слой не импортирует Vue-код.

Nest организован как `my-songs-site/server`: связанные feature-модули, тонкие контроллеры, сервисы сценариев, DTO с ValidationPipe и общая инфраструктура в `common`. Сессии здесь opaque: cookie содержит случайный токен, БД — его SHA-256; пароль — Argon2id. Изменяющие JSON-запросы требуют точного Origin и специального заголовка, CORS не открыт. Доступ к приватным ресурсам проверяет SessionGuard. Глобальные лимиты и более строгие auth/runner limits включены.

## Учебный материал

Материал написан для JavaScript, TypeScript, Express 5 и NestJS 11; Python-контент и Python runtime отсутствуют. Исходная теория находится в `scripts/curriculum/theory/*.md`, карта тем — в `outline.mjs`, задания и вопросы — в файлах `practice-*.mjs` и `base-lessons.json`. Каталог воспроизводимо создаётся командой `node scripts/build-curriculum.mjs`; обычная сборка требует все 60 глав. Эталонные решения и скрытые проверки остаются на backend и не выдаются через публичное API. Подробнее — [CURRICULUM.md](CURRICULUM.md).

Источники программы: [JavaScript / MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide), [Современный учебник JavaScript](https://learn.javascript.ru/), [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html), [Express](https://expressjs.com/en/guide/routing.html), [NestJS](https://docs.nestjs.com/). Русские объяснения и задания написаны для JSlab; тексты сторонних сайтов не копируются целиком.

## Музыка и поддержка автора

Яндекс Метрика подключается через `NUXT_PUBLIC_METRIKA_ID`. Как в Python Learning, счётчик запускается после выбора пользователя; настройки можно открыть повторно внизу страницы. SPA-переходы учитываются без повторной инициализации, параметры URL и фрагменты не отправляются. Вебвизор скрывает страницы входа, профиль, кабинет и редактор кода. Без согласия, включая режим без JavaScript, запросов счётчику нет.

Фоновая музыка управляется кнопкой динамика в хедере. По умолчанию она включена;
сохранённое выключение имеет приоритет. Выбор хранится в localStorage
(`jslab:background-music`), музыка не перезапускается
при переходах внутри общей оболочки. После перезагрузки браузер может потребовать
первый клик для начала воспроизведения. MP3 запрашивается при попытке воспроизведения.

Используется [Reverie — Scott Buckley](https://www.scottbuckley.com.au/library/reverie/)
по [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Файл размещён локально
без изменений; авторство и ссылка на лицензию указаны в футере и
`frontend/public/audio/ATTRIBUTION.txt`. Музыка воспроизводится отдельно от фонового
видео, с небольшой громкостью и повтором.

Кнопка с сердечком открывает карточку добровольной поддержки автора на создание
и запись музыкального альбома. Она использует ту же ссылку Яндекс Чаевых, что и
`python-learning`: https://tips.yandex.ru/guest/payment/9462891. Карточка открывается
по наведению, фокусу или нажатию; закрывается кнопкой, Escape или нажатием вне неё.
На телефонах кнопка расположена под футером, чтобы не перекрывать содержимое.

## Проверки

```sh
npm run typecheck
npm test
npm --prefix backend run lint
npm run build
docker build -t script-lab-sandbox:1 runner/sandbox
node scripts/test-sandbox.mjs
```

HTTP-интеграционные тесты работают только с отдельной БД `script_lab_test`; production-базы не сбрасывают. Перед прогоном примените миграции к этой БД:

```powershell
$env:DATABASE_URL='postgresql://USER:PASSWORD@127.0.0.1:5432/script_lab_test'
npm --prefix backend run db:migrate
npm --prefix backend run test:e2e -- --runInBand
```

`test-sandbox.mjs` проверяет все 60 решений и 214 случаев, 51 вычисляемый и 15 HTTP-примеров из тестовых вопросов, strict TypeScript, бесконечный цикл, переполнение вывода, запрет записи в корень и запрет сети. CI не запускает браузер. Отдельная проверка браузером выполняется по указанию пользователя; HTTP-тесты не подтверждают визуальное соответствие или browser-only взаимодействия.

После push в `main` workflow [Script Lab checks](.github/workflows/quality.yml) сначала выполняет проверки, затем автоматически публикует прошедший их коммит на https://js-lab.site. Это занимает время на CI и сборку; сам push не переключает сайт мгновенно. Статус публикации виден в job `deploy` и окружении `Production` GitHub Actions. Pull request не запускает деплой.

Для автоматической публикации настроены зашифрованные Actions secrets `SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`. SSH проверяет заранее доверенный ключ сервера. Проверенный Linux runtime передаётся из CI как неизменяемый артефакт, привязанный к коммиту; сервер проверяет SHA-256 и допустимые пути архива. Тяжёлая сборка Nuxt выполняется в CI: серверу с 4 ГБ памяти не требуется повторная компиляция. Нативные зависимости API и CLI миграций устанавливаются на целевом сервере. `deploy/release.sh` создаёт проверенную резервную копию БД, применяет миграции и переключает службы через установленный root-helper. Проверка включает frontend, API и изолированный runner; при неуспешном запуске helper возвращает предыдущую версию приложения. Публикации сериализованы, устаревшие коммиты пропускаются. Пароли БД и runtime-секреты остаются на сервере.

Production frontend запускается из автономного `.output`, без Nuxt dev server. Audit backend и автономного frontend runtime проходит. В полном дереве инструментов Nuxt остаются upstream advisories `braces` и `node-forge`; их нет в автономном runtime. Принудительный downgrade Nuxt через audit fix не применяется. Перед публичным размещением нужны HTTPS, `NODE_ENV=production`, соответствующий `ALLOWED_ORIGIN`, `COOKIE_SECURE=true`, резервные копии БД и отдельный контролируемый узел исполнителя.
