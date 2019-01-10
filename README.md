# koa-db-test

## Описание задачи

Реализовать http-server на базе фреймворка Koa2, соответствующий следующим требованиям:

1) Работает с базой данных mysql. В субд есть табличка books(1e5 записей, забить самостоятельно случайно, у каждой книги должны быть поля title, date, autor, description, image). Реализация смежных табличек на усмотрение кандидата, архитектурные решения оцениваются.Работает на чистом SQL

2) Присутствуют три контроллера:

  2.1)  Добавляет записи в субд

  2.2)  Отдает. Сделать возможность сортировки|группировки по всем возможным полям, возможность порционного получения с оффсетом

  2.3)  Изменяет

замечание к 2.2 - приветствуются варианты кэширования.

## Реализация

Особенность хранения книг в БД состоит в том, что у каждой книги может быть несколько авторов.

Исходя из этого, авторы и сами книги выделены в отдельный сущности (таблицы) в базе, а для реализации связи 
many-to-many выбрана классическая схема с промежуточной таблицей.

Для контроля целостности данных в БД, использованы следующие подходы:

* в таблице авторов требуется уникальность автора по его имени
* в промежуточной таблице использованы внешние ключи по id книги и по id автора
* в промежуточной таблице, также, требуется уникальный ключ "id книги-id автора", чтобы исключить дублирование записей

Кроме того, на уровне приложения при добавлении новой книги производится проверка существоавания такой же книги по 
совпадению названия, года выпуска и списка идентификаторов ее авторов. 

В тестовом наборе данных присутствуют книги, имеющие до трех авторов.

## Особенности реализации

1. При добавлении или редактировании книг целесообразно использовать механизм транзакций в БД, поскольку добавление 
новой книги затрагивает две связанных сущности (таблицу книг и таблицу связей), но сама операция не атомарна.
К сожалению, в ходе разработки выяснилось, что использованный модуль koa2-mysql-wrapper не поддерживает запросы на 
создание транзакций, т.к. реализует только параметризированный протокол. В следующей итерации необходимо 
глубже поисследовать существующие npm-модули для работы с БД, и перейти на использование модуля с поддежркой 
тразакций.

2. При получении списка книг, для каждой книги возвращается массив только с именами авторов, но без их идентификаторов.

3. При добавлении новой книги следует передавать массив идентификаторов авторов, при этом предполагается, что клиент 
API получил эти идентификаторы заранее. 

4. Получение списка книг с авторами, при отсутствии ограничений на выборку, достаточно затратная операция. В 
частиности по причине того, что текущая форма запроса использует filesort. Здесь необходимо дополнительное 
исследование, как можно избавиться от этого. Предполагаемые пути решения проблемы:
* Более тонкая настройка индексов у таблиц в БД;
* Отказ от функции GROUP_CONCAT и получение авторов отдельными запросами;
* Использование аггрегирующих json-функций, типа JSON_OBJECTAGG (возможно это даст выигрыш в производительности). 

## API Endpoints

`GET /books` - получение списка книг

*Request example*

`GET /books`

*Response example*

`{
    "page": 1,
    "onPage": 25,
    "total": 99976,
    "pages": 4000,
    "books": [
        {
            "id": 1,
            "title": "Архитектура в ретроспективе",
            "year": 2004,
            "description": "Интеграл по бесконечной области, однако, объективно предоставляет депрессивный риолит, что несомненно приведет нас к истине. При облучении инфракрасным лазером гелиоцентрическое расстояние раскладывает на элементы гносеологический рекламный клаттер. Глиссандирующая ритмоформула отражает умысел даже в том случае, если непосредственное наблюдение этого явления затруднительно. С другой стороны, определение содержания в почве железа по Тамму показало, что суждение настроено позитивно. Бурное развитие внутреннего туризма привело Томаса Кука к необходимости организовать поездки за границу, при этом трещинноватость пород изящно начинает естественный курс.",
            "image": "book_1.jpg",
            "authors": [
                "Аксёнов Артур",
                "Бунин Глеб"
            ]
        },
        {
            "id": 2,
            "title": "Жизнеописание Аана",
            "year": 1999,
            "description": "Demo description",
            "image": "image-new.jpg",
            "authors": [
                "Аксёнов Артур",
                "Утисов Левон"
            ]
        }
        ...
    ]
}`

`GET /books/:id` - получение книги по ее id

*Request example*

`GET /books/7` 

*Response example*

`{
     "page": 1,
     "onPage": 1,
     "total": 1,
     "pages": 1,
     "books": [
         {
             "id": 7,
             "title": "Жизнеописание Акена",
             "year": 1947,
             "description": "Субтехника подпитывает небольшой жанр. По космогонической гипотезе Джеймса Джинса, просеивание искажает хлоридно-гидрокарбонатный осциллятор. Интересно отметить, что трещинноватость пород обогащена. Декодирование продолжает триплетный разрыв. Сель разрушаем.",
             "image": "book_7.jpg",
             "authors": [
                 "Аксёнов Артур",
                 "Трухин Севастьян"
             ]
         }
     ]
 }`

`GET /books/year/:year` - получение списка книг выпущенных в заданном году

*Request example*

`GET /books/year/2017` 

*Response example*

`{
     "page": 1,
     "onPage": 25,
     "total": 793,
     "pages": 32,
     "books": [
         {
             "id": 47,
             "title": "Жизнеописание Брутана",
             "year": 2017,
             "description": "Исчисление предикатов вызывает коммунальный модернизм. Большая Медведица изменяет полого-холмистый лазер. Акцепт, особенно в условиях политической нестабильности, варьирует бамбук. Современная ситуация имеет ил. Структура политической науки парадоксально вызывает культурный антарктический пояс. Индуцированное соответствие однородно верифицирует валентный электрон.",
             "image": "book_47.jpg",
             "authors": [
                 "Козарь Леопольд",
                 "Крылов Конрад"
             ]
         },
         ...
     ]
 }`

`GET /books/author/:id` - получение списка книг указанного автора

*Request example*

`GET /books/author/38609` 

*Response example*

`{
     "page": 1,
     "onPage": 25,
     "total": 2,
     "pages": 1,
     "author": {
         "id": 1234,
         "name": "Никулин Май"
     },
     "books": [
         {
             "id": 3204,
             "title": "Брошюра \"Запрещеные традиции связанные с магией музыки\"",
             "year": 1964,
             "description": "Арпеджированная фактура заканчивает верлибр, игнорируя силы вязкого трения. Терминатор, в первом приближении, очевиден. Спонсорство, как следует из полевых и лабораторных наблюдений, однократно.",
             "image": "book_3204.jpg",
             "authors": [
                 "Никулин Май",
                 "Потапов Кузьма",
                 "Пузанов Максуд"
             ]
         },
         {
             "id": 27583,
             "title": "Исследование \"Скрытые тайны степных племен\"",
             "year": 1914,
             "description": "Волновая тень предсказуема. Рефлексия понимает под собой бугор пучения. Исследование указанной связи должно опираться на тот факт, что феномер психической мутации эволюционирует в заснеженный растворитель. Отличительной чертой поверхности, сложенной излияниями очень текучей лавы, является то, что искусство просветляет стратегический интеракционизм. Структурализм, обобщая изложенное, берёт поэтический математический горизонт. Как отмечает Теодор Адорно, регрессное требование имеет персональный архетип.",
             "image": "book_27583.jpg",
             "authors": [
                 "Никулин Май"
             ]
         }
     ]
 }`

`POST /books` - добавление книги

*Request example*

`POST /books`

*Request body*

`{
    "title": "Demo book",
    "year": 1997,
    "image": "image-new.jpg",
    "description": "Demo description",
    "authors": [38628, 37625]
 }`

*Response example*

`{
     "id": 100002,
     "title": "Demo book",
     "year": 1997,
     "image": "image-new.jpg",
     "description": "Demo description"
 }`

`PUT /books/:id`  - изменение книги

*Request example*

`PUT /books/100002`

*Request body*

`{
    "title": "Demo book new",
    "year": 1997,
    "image": "image-new.jpg",
    "description": "Demo description new",
    "authors": [38628, 37625]
 }`

*Response example*

`{
     "id": 100002,
     "title": "Demo book new",
     "year": 1997,
     "image": "image-new.jpg",
     "description": "Demo description new"
 }`

`GET /authors` - получение списка авторов

*Request example*

`GET /authors`

*Response example*

`{
     "page": 1,
     "onPage": 25,
     "total": 38707,
     "pages": 1549,
     "authors": [
         {
             "id": 1,
             "name": "Иван Иванов"
         },
         {
             "id": 2,
             "name": "Утисов Левон"
         },
         ...
     ]
 }`

`GET /authors/:id` - получение автора по его id

*Request example*

`GET /authors/4106`

*Response example*

`{
     "page": 1,
     "onPage": 1,
     "total": 1,
     "pages": 1,
     "authors": [
         {
             "id": 4106,
             "name": "Двойнев Геральд"
         }
     ]
 }`

`GET /authors/search/:fragment` - поиск автора по фрагменту имени (регистронезависимый)

*Request example*

`GET /authors/search/%D0%92%D0%BE%D0%BB%D0%BA%D0%BE%D0%B2` (в примере использова url-encoded строка 'волков')

*Response example*

`{
     "page": 1,
     "onPage": 25,
     "total": 52,
     "pages": 3,
     "authors": [
         {
             "id": 16,
             "name": "Староволков Пимен"
         },
         {
             "id": 23,
             "name": "Волков Аполлинарий"
         },
         {
             "id": 1559,
             "name": "Волков Бруно"
         },
         {
             "id": 1788,
             "name": "Староволков Сабир"
         },
         ...
     ]
 }`

`POST /authors` - добавление автора

*Request example*

`POST /authors`

*Request body*

`{
    "name": "Петр Сидоров"
 }`

*Response example*

`{
     "id": 44073,
     "name": "Петр Сидоров"
 }`

`PUT /authors/:id` - изменение автора

*Request example*

`PUT /authors/44073`

*Request body*

`{
    "name": "Сидор Петров"
 }`

*Response example*

`{
     "id": 44073,
     "name": "Сидор Петров"
 }`
 
 ### Общие параметры запросов
 
 Все GET-запросы поддерживают 4 query-параметра:
 
 * page - номер текущей страницы, отсчет начинается с 1, если параметр не передан, то считаеся что страница первая
 * onPage - число элементов в выдаче на странице. Поддерживаются значения от 1 до MAX_ON_PAGE. Если параметр не 
 передан то используется значение DEFAULT_ON_PAGE
 * order - поле сортировки. Если не передан, то полем сортировки считается id. Допустимые значения для книг - id, 
 title, year, image, description. Для авторов - id и name
 * direction - направление сортировки. Допустимые значения asc и desc. Если не передано то считается asc.
 
 ## Настройки
 
Сервер api, через переменные окружения поддерживает следующие настройки:

`SERVER_PORT` - порт на котором работает сервер

`DB_HOST` - хост для подключения к БД

`DB_NAME` - название БД

`DB_USER` - пользователь для подключения к БД

`DB_PASS` - пароль для подключения к БД

`CACHE_TIME` - время жизни кеша, в миллисекундах

`CACHE_CAPACITY` - максимальый размер кеша в записях

`MIN_SUPPORTED_YEAR` - самый старый год выпуска книг (вообще-то надо бы вычислять динамически из БД)

`DEFAULT_ON_PAGE` - число элементов на странце, по умолчанию

`MAX_ON_PAGE` - число элементов на странце, максимальное

## Запуск

После клнирования репозитория необходимо выполнить следующие действия:

1. Выполнить команду `npm install` - для установки модулей

2. Создать в БД пользователя и базу данных для него

3. Залить в БД дамп с тестовыми данными из файла db/koa-test.sql

4. Задать правильные доступы к БД в файл config/config.js или через переменные окружения

5. Выполнить команду `npm run server` для запуска сервера.

Для запуска тестов можно выполнить команду `npm test`

