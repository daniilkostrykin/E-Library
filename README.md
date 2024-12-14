# E-Library

Серверная система учёта библиотечного фонда: единый каталог печатных и онлайн-изданий, выдача книг с контрольной датой возврата, учёт задолженностей и разграничение доступа по ролям. Состоит из REST API на [Flask](https://flask.palletsprojects.com/) + [PostgreSQL](https://www.postgresql.org/) и статического веб-интерфейса без сборки; авторизация — по [JWT](https://datatracker.ietf.org/doc/html/rfc7519), восстановление пароля — письмом по SMTP, ссылки на чтение онлайн-версий подбираются из открытого каталога [aldebaran.ru](https://aldebaran.ru).

![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white) ![Flask](https://img.shields.io/badge/Flask-3.1-000000?logo=flask&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12%2B-4169E1?logo=postgresql&logoColor=white)

## Как это выглядит в работе

```
┌──────────────────┐  REST + JWT  ┌───────────────────────┐  psycopg2  ┌───────────────────┐
│  SPA без сборки  │ ───────────► │   REST API  :3000     │ ─────────► │    PostgreSQL     │
│  Live Server     │              │   Flask 3.1 · bcrypt  │            │  users · students │
│  :5500           │ ◄─────────── │   роли · SMTP-почта   │ ◄───────── │  books ·          │
└──────────────────┘              └───────────┬───────────┘            │  taken_books      │
                                              │                        └───────────────────┘
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
          ┌─────────────────────┐                        ┌──────────────────────────┐
          │  Парсер aldebaran.ru│                        │  SMTP (Gmail): письмо    │
          │  подбор онлайн-     │                        │  со ссылкой для сброса   │
          │  версий книг        │                        │  пароля                  │
          └─────────────────────┘                        └──────────────────────────┘
```

Полный сценарий «регистрация → вход → поиск → выдача → возврат» через REST API:

```bash
# 1. Регистрация читателя (роль определяется по имени, см. «Роли и доступ»)
$ curl -s -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Иван Петров","group":"УВП-212","email":"ivan@example.com","password":"secret123"}'
{"success":true,"userId":1}                                    # 201 Created

# 2. Вход: JWT действует 24 часа
$ curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"ivan@example.com","password":"secret123"}'
{"success":true,"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}   # 200 OK
$ TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 3. Поиск по каталогу: подстрока в названии или авторе, без учёта регистра
$ curl -s "http://localhost:3000/api/books?query=живаго" -H "Authorization: Bearer $TOKEN"
[[5,"Доктор Живаго","Борис Пастернак",2,"https://aldebaran.ru/author/.../read","Зал 1"]]

# 4. Выдача: запись о задолженности и отдельное списание экземпляра
$ curl -s -X POST http://localhost:3000/api/taken_books -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" -d '{"studentId":1,"bookId":5,"dueDate":"2026-10-17"}'
{"success":true,"message":"Книга успешно взята"}                # 201 Created
$ curl -s -X POST http://localhost:3000/api/books/5 -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" -d '[5,"Доктор Живаго","Борис Пастернак"]'
{"success":true,"message":"Количество книги 'Доктор Живаго' (ID: 5) уменьшено на 1"}

# 5. Возврат: запись закрывается, остаток увеличивается на 1
$ curl -s -X POST http://localhost:3000/api/taken_books/return \
    -H "Content-Type: application/json" -d '{"bookName":"Доктор Живаго","studentId":1}'
{"message":"Книга успешно возвращена.","success":true}          # 200 OK
```

Проверка доступности API: `curl http://localhost:3000/` → `API is running. Use /api/auth/register or /api/auth/login endpoints.`

## Веб-интерфейс

Статические страницы без сборщика; API вызывается через [axios](https://axios-http.com/) с захардкоженным `axios.defaults.baseURL = "http://localhost:3000"`. Токен хранится в `localStorage`, профиль — в `localStorage.userData`.

| Страница | Назначение |
|---|---|
| `index.html` | вход и регистрация; после входа редирект по роли |
| `user/personalCabinet.html` | личный кабинет: взятые книги, задолженность, поиск каталога, взятие и возврат — открывается с параметрами `?fio=&group=&id=` |
| `library/library.html` | каталог с поиском |
| `admin/admin0.html` | панель управления: поиск книг и читателей, переход к редактору (у роли `librarian` кнопка редактирования скрыта) |
| `admin/admin.html` | редактор фонда: добавление, правка, удаление книг, подстановка онлайн-версии через парсер |
| `forgotPassword/mail.html`, `forgotPassword/newPassword.html` | восстановление пароля: запрос письма → установка нового пароля по токену из ссылки |
| `showToast/` | переиспользуемый компонент всплывающих уведомлений |
| `librarian/librarian.html`, `example.js`, `examples/searchStudent.js` | устаревшие страницы и демо-скрипты, к API не подключены|

## Предметная модель

**Ролевая модель (RBAC).** Система разграничивает права на уровне читателей (`user`), персонала (`librarian`) и администраторов (`admin`)[cite: 18]. В демонстрационных целях для быстрого тестирования интерфейсов без ручного заполнения базы данных поддержан тестовый маппинг: учетные записи с маркерами `admin` или `librarian` в имени получают соответствующие привилегии[cite: 18]. В штатном режиме роли назначаются администратором напрямую через базу данных[cite: 18].

| Роль | Права | Стартовый экран |
|---|---|---|
| `admin` | Полный доступ: управление каталогом, списание, аналитика | `admin/admin0.html`[cite: 18] |
| `librarian` | Просмотр читателей, фиксация выдачи и возврата | `admin/admin0.html`[cite: 18] |
| `user` | Личный кабинет, поиск книг, просмотр задолженностей | `user/personalCabinet.html`[cite: 18] |

**Фонд и выдача.** Каждая единица учета отражает физический остаток книги (`books.quantity`)[cite: 18]. Выдача фиксирует факт задолженности читателя в таблице `taken_books` (с ограничением уникальности пары `book_id + student_id`) и декрементирует складской остаток[cite: 18]. Возврат закрывает долговую запись и возвращает экземпляр на баланс[cite: 18].

**Онлайн-версии.** Сервис `GET /api/search_first_read_link` запрашивает каталог [aldebaran.ru](https://aldebaran.ru/pages/rmd_search/) через библиотеку `requests` и разбирает DOM-структуру посредством `BeautifulSoup`[cite: 18]. Найденная ссылка сохраняется в поле `online_version` и отображается в карточке издания для перехода к чтению[cite: 18].

**Безопасность сессий.** Пароли хэшируются с солью через `bcrypt`[cite: 18]. Токен доступа формируется по стандарту [JWT](https://datatracker.ietf.org/doc/html/rfc7519) со сроком жизни 24 часа[cite: 18]. Для сброса пароля генерируется отдельный временный токен на 1 час, передаваемый пользователю в теле письма по протоколу SMTP[cite: 18].

## API

База: `http://localhost:3000`. Формат — JSON. Защищённые маршруты требуют заголовок `Authorization: Bearer <token>`; токен выдаёт `POST /api/auth/login`. В столбце «Ответ» указаны коды и форма тела.

### Аутентификация и аккаунты

| Метод | Эндпоинт | Назначение | Тело / параметры | Ответ |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | регистрация аккаунта | `{name, group, email, password}` | `201` → `{success, userId}`; `400` — не все поля; `500` — email занят |
| `POST` | `/api/auth/login` | вход, выдача JWT | `{email, password}` | `200` → `{success, token}`; `401` — неверная пара email/пароль |
| `GET` | `/api/auth/user-info` | профиль текущего пользователя | JWT | `200` → `{user: {id, role, name, group}}`; `404`, `500` |
| `POST` | `/api/auth/reset-password` | письмо со ссылкой сброса (токен на 1 час) | `{email}` | `200` → `{success, message}`; `404` — email не найден; `500` — ошибка SMTP |
| `POST` | `/api/auth/reset-password/<token>` | установка нового пароля по токену из письма | `{newPassword}` | `200`; `400` — токен истёк или неверен |
| `GET` | `/api/accounts` | проверка существования email | `?email=` | `200` → `{exists: true/false}`; `400` — email не передан |

### Каталог книг

Строки книг во всех ответах каталога — позиционные массивы `[id, title, author, quantity, online_version, location]`.

| Метод | Эндпоинт | Назначение | Тело / параметры | Ответ |
|---|---|---|---|---|
| `GET` | `/api/books` | поиск по названию или автору; пустой `query` — весь каталог | JWT; `?query=` | `200` → массив строк книг |
| `GET` | `/api/books/all` | весь каталог по возрастанию `id` | JWT | `200` → массив строк книг |
| `POST` | `/api/books` | добавить книгу | JWT; `{"Название","Автор","Количество","Электронная версия","Местоположение"}` | `201`; `400` — нет обязательных полей или количество не число/меньше 0 |
| `POST` | `/api/books/update` | массовая правка карточек в одной транзакции | массив `{id, title, author, quantity, online_version, location}` | `200` → `{success: true}`; `400` — пустой или некорректный элемент |
| `DELETE` | `/api/books/<id>` | удалить книгу | — | `200`; `404` — не найдена |
| `POST` | `/api/books/<id>` | списать один экземпляр (`quantity − 1`) | JWT; позиционный массив `[id, title, author]` | `200`; `400` — экземпляров нет; `404` — книга не найдена |

### Читатели

| Метод | Эндпоинт | Назначение | Тело / параметры | Ответ |
|---|---|---|---|---|
| `GET` | `/api/students` | поиск по имени и группе | JWT; `?query=` | `200` → массив `[user_id, ФИО, группа]` |
| `GET` | `/api/students/<id>` | карточка читателя | JWT | `200` → массив `[id, ФИО, группа]`; `404` |

### Выдача и возврат

| Метод | Эндпоинт | Назначение | Тело / параметры | Ответ |
|---|---|---|---|---|
| `POST` | `/api/taken_books` | выдать книгу: запись о задолженности | JWT; `{studentId, bookId, dueDate}` | `201` → `{success, message}`; `400` — неполные данные; `500` — «Пользователь уже взял эту книгу» |
| `GET` | `/api/taken_books` | все активные записи выдачи | JWT | `200` → массив строк `taken_books` |
| `GET` | `/api/taken_books/<user_id>` | книги читателя | JWT | `200` → `{books: [{name, author, due_date}]}` |
| `GET` | `/api/taken_books/student/<student_id>` | книги читателя, без обёртки | JWT | `200` → `[{name, author, due_date}]` |
| `POST` | `/api/taken_books/<student_id>` | выдача пачки книг (используется веб-интерфейсом) | JWT; `{books: [{id, dueDate}]}` | `200`; `500` — дубликат в списке, откат всей пачки |
| `DELETE` | `/api/taken_books/<book_id>/<student_id>` | закрыть конкретную запись, остаток не меняется | JWT | `200` |
| `DELETE` | `/api/taken-books/<student_id>` | закрыть все записи читателя (обратите внимание на дефис) | JWT | `200` |
| `POST` | `/api/taken_books/return` | возврат по названию книги: закрыть запись и `quantity + 1` | `{bookName, studentId}` | `200`; `404` — книга не найдена или не была выдана |
| `GET` | `/api/user/<id>/debt` | число активных выдач (задолженность) | JWT | `200` → `{debt_count: n}` |
| `POST` | `/api/check_if_book_taken` | проверка «книга уже взята этим читателем?» | JWT; `{student_id, book_title}` | `200` → `{success: true/false}`; `400` |

### Онлайн-версии и служебные маршруты

| Метод | Эндпоинт | Назначение | Тело / параметры | Ответ |
|---|---|---|---|---|
| `GET` | `/api/search_first_read_link` | ссылка на чтение из каталога aldebaran.ru | `?book_name=` | `200` → `{read_link}`; `400` — нет параметра; `404` — не найдена |
| `PUT` | `/books/update-online-versions` | массовая подстановка ссылок по названию; маршрут вне префикса `/api` | массив `[{title, online_version}]` | `200` → `{message, updated_books}`; `400` — не массив |
| `GET` | `/` | проверка доступности API | — | `200` → текстовая строка |
| `GET` | `/api/test_email` | проверка отправки письма на адрес-заглушку | — | `200` или `500` с текстом ошибки |

### Вспомогательные скрипты

| Скрипт | Назначение | Запуск |
|---|---|---|
| `backend/parsing.py` | интерактивный подбор ссылки на чтение по введённому названию | `cd backend && python parsing.py` |
| `backend/update_links.py` | заполнение `online_version` для всех книг, где ссылка пуста | `cd backend && python update_links.py` |

## Схема данных

API ожидает готовую схему — миграций и автосоздания таблиц в репозитории нет. Ограничение `UNIQUE (book_id, student_id)` соответствует обработке ошибки `23505` в `backend/models.py`.

```sql
CREATE TABLE users (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    group_name TEXT,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,                -- bcrypt-хэш
    role       TEXT NOT NULL DEFAULT 'user'  -- user / librarian / admin
);

CREATE TABLE students (
    user_id    INTEGER PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    group_name TEXT NOT NULL
);

CREATE TABLE books (
    id             SERIAL PRIMARY KEY,
    title          TEXT NOT NULL,
    author         TEXT NOT NULL,
    quantity       INTEGER NOT NULL DEFAULT 0,
    online_version TEXT,
    location       TEXT
);

CREATE TABLE taken_books (
    book_id    INTEGER NOT NULL REFERENCES books (id),
    student_id INTEGER NOT NULL REFERENCES users (id),
    due_date   DATE,
    UNIQUE (book_id, student_id)
);
```

## Установка и запуск

Требования: [Python](https://www.python.org/) 3.11+, [PostgreSQL](https://www.postgresql.org/) 12+ (или [Docker](https://www.docker.com/)), VS Code с расширением [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) для веб-интерфейса.

### 1. Код и зависимости

```bash
git clone https://github.com/daniilkostrykin/E-Library.git
cd E-Library

python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS

pip install Flask==3.1.0 Flask-Bcrypt==1.0.1 Flask-Cors==5.0.0 \
    Flask-JWT-Extended==4.7.1 Flask-Mail==0.10.0 psycopg2==2.9.10 \
    python-dotenv==1.0.1 requests==2.32.3 beautifulsoup4==4.12.3 PyJWT==2.10.0
```

`axios` подключается со CDN на каждой странице (`jwt-decode` — только в личном кабинете и в коде не используется); локальная копия axios лежит в `node_modules/`, поэтому `npm install` для запуска не нужен.

### 2. База данных

Быстрый вариант — PostgreSQL в Docker на порту `55432`, который ожидает API по умолчанию:

```bash
docker run --name e-library-pg -e POSTGRES_PASSWORD=<ваш_пароль_БД> -p 55432:5432 -d postgres:16
```

Примените DDL из раздела «Схема данных» в любом SQL-клиенте (`psql`, DBeaver, pgAdmin): сохраните его в `schema.sql` и выполните, например:

```bash
psql "postgresql://postgres:<ваш_пароль_БД>@localhost:55432/postgres" -f schema.sql
```

### 3. Переменные окружения

`backend/db.py` читает `backend/.env` (файл загружается относительно текущего каталога, поэтому API нужно запускать из `backend/`). Значения задаются в `backend/.env` (не коммитится; шаблон — `backend/.env.example`):

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `DB_HOST` | `localhost` | хост PostgreSQL |
| `DB_NAME` | `postgres` | имя базы данных |
| `DB_USER` | `postgres` | пользователь БД |
| `DB_PASSWORD` | — (без значения подключение не выполняется) | пароль пользователя БД |
| `DB_PORT` | `55432` | порт PostgreSQL |

Ключи `JWT_SECRET_KEY`, `SECRET_KEY` и SMTP-учётные данные (`MAIL_USERNAME`, `MAIL_PASSWORD`) читаются из `backend/.env` (шаблон — `backend/.env.example`); без собственного почтового ящика восстановление пароля работать не будет.

### 4. Запуск API

```bash
cd backend
python app.py
# * Running on all addresses (0.0.0.0)
# * Running on http://127.0.0.1:3000
```

Проверка: `curl http://localhost:3000/`.

### 5. Запуск веб-интерфейса

CORS-политика API допускает единственный источник — `http://127.0.0.1:5500`:

1. Установите расширение Live Server в VS Code.
2. Откройте `index.html` в корне репозитория → **Open with Live Server** (порт задаётся параметром `liveServer.settings.port`, если 5500 занят).
3. Адрес входа: `http://127.0.0.1:5500/index.html`.

### 6. Первый вход и роли

- Читатель: зарегистрируйтесь на странице входа — откроется личный кабинет.
- Администратор или библиотекарь: зарегистрируйте аккаунт, в имени которого есть подстрока `admin` или `librarian` (например, `Анна admin`). Для эксплуатации надёжнее назначать роль в БД: `UPDATE users SET role = 'admin' WHERE email = '...';`.

## Структура репозитория

```
backend/          REST API (Flask): app.py — маршруты, models.py — SQL-слой, db.py — подключение,
                  parsing.py и update_links.py — работа с онлайн-версиями, .env — параметры БД
index.html         вход и регистрация (страница-точка входа)
library/           каталог с поиском
user/              личный кабинет читателя
admin/             панель управления: admin0 — обзор, admin — редактирование фонда
librarian/         устаревшая страница рабочего места библиотекаря
forgotPassword/    восстановление пароля: запрос письма, установка нового пароля
showToast/         компонент уведомлений
assets/            графика интерфейса
examples/          устаревшие демо-скрипты
```
