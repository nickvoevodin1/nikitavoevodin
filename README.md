# Бриф проекта — Никита Воеводин

Сайт-бриф, который клиент получает после оплаты разработки сайта. Пошаговая анкета
собирает информацию о бизнесе и отправляет её в Google Sheets.

Адрес: **https://nikitavoevodin.vercel.app/brief**

Это не лендинг и не CRM. Сайт решает одну задачу — быстро и удобно собрать информацию
о будущем проекте.

## Основные функции

- Экран загрузки (0,8 с) и приветственный экран.
- Пошаговый мастер из 15 экранов: по одной теме на экран.
- Прогресс-шкала с засечками по числу шагов и моноширинный счётчик `04 / 15`.
- Валидация email, телефона, ссылок и обязательных полей — сообщения под полем.
  Ссылку можно вводить без схемы: `company.ru` нормализуется в `https://company.ru`.
- Условные поля: чекбокс «Другое» и подобные выборы раскрывают текстовое поле,
  при снятии выбора значение очищается.
- Автосохранение черновика в `localStorage` со статусом «Сохранено» и предложением
  продолжить заполнение при повторном открытии.
- Загрузка файлов: Drag & Drop и выбор вручную, превью для изображений, размер и
  удаление, до 100 МБ суммарно. Альтернатива — поле «Или ссылка на облако».
- Экран проверки: все ответы, включая пропущенные (`— не указано`), с кнопкой
  «Изменить» у каждой группы.
- Отправка в Google Sheets через Google Apps Script, файлы сохраняются в Google Drive.
- Экран благодарности после успешной отправки, черновик при этом удаляется.

## Технологии

HTML5, CSS3 и Vanilla JavaScript (ES6+). Без фреймворков, без CSS-библиотек,
без npm-зависимостей и без сборки.

Шрифты подключены локально, подмножествами латиницы и кириллицы:

| Шрифт | Роль | Размер |
|---|---|---|
| Inter 400–700 | основной текст, поля | 37 КБ |
| Onest 600 | заголовки | 11 КБ |
| JetBrains Mono 500 | счётчик шагов, надзаголовки | 7 КБ |

## Структура файлов

```
/
├── brief/
│   ├── index.html          — разметка всех экранов
│   ├── style.css           — стили: reset, токены, типографика, layout,
│   │                         кнопки, поля, карточки, прогресс, анимации, адаптив
│   ├── script.js           — логика: загрузка, навигация, валидация, условные
│   │                         поля, черновик, файлы, проверка, отправка
│   ├── fonts/
│   │   ├── Inter.woff2
│   │   ├── Onest-600.woff2
│   │   └── JetBrainsMono-500.woff2
│   ├── og.png              — превью для мессенджеров
│   ├── favicon.svg
│   └── favicon.ico
│
├── vercel.json             — маршрут /brief, заголовки кэширования и безопасности
└── README.md
```

Корень домена (`/`) намеренно оставлен свободным под основной сайт продукта.

## Локальный запуск

Проект состоит из статических файлов, сборка не нужна. Нужен любой локальный сервер —
открывать `index.html` через `file://` нельзя, иначе не сработают шрифты и запросы.

```bash
python3 -m http.server 3000
```

Затем откройте `http://localhost:3000/brief/`.

Альтернатива без Python:

```bash
npx serve .
```

## Подключение Google Apps Script

### 1. Создайте таблицу

Создайте новую Google-таблицу — в неё будут попадать заявки. Заголовки создавать
не нужно, скрипт добавит их сам при первой отправке.

### 2. Добавьте скрипт

В таблице откройте **Расширения → Apps Script**, удалите содержимое файла
`Код.gs` и вставьте код ниже.

```javascript
/** Бриф проекта — приём заявок в Google Sheets. */

var SHEET_NAME = 'Брифы';
var DRIVE_FOLDER_NAME = 'Бриф — файлы клиентов';

/** Порядок колонок таблицы: ключ поля формы → заголовок. */
var FIELDS = [
  ['companyName', 'Название компании'],
  ['contactPerson', 'Контактное лицо'],
  ['phone', 'Телефон'],
  ['email', 'Email'],
  ['website', 'Сайт'],
  ['socials', 'Соцсети'],
  ['businessDescription', 'Чем занимается компания'],
  ['services', 'Основные услуги'],
  ['mainService', 'Самая важная услуга'],
  ['results', 'Результаты сайта'],
  ['resultsOther', 'Результаты — другое'],
  ['mainResult', 'Главный результат'],
  ['idealClient', 'Идеальный клиент'],
  ['region', 'Регион работы'],
  ['advantages', 'Отличие от конкурентов'],
  ['competitor1', 'Конкурент 1'],
  ['competitor2', 'Конкурент 2'],
  ['competitor3', 'Конкурент 3'],
  ['competitorsLiked', 'Что у конкурентов сделано сильно'],
  ['example1', 'Референс 1'],
  ['example2', 'Референс 2'],
  ['example3', 'Референс 3'],
  ['examplesLiked', 'Что привлекло в референсах'],
  ['mustHave', 'Обязательные блоки'],
  ['mustHaveOther', 'Обязательные блоки — другое'],
  ['avoid', 'Стоп-лист'],
  ['hasBranding', 'Фирменный стиль'],
  ['brandingAssets', 'Что есть в наличии'],
  ['siteContactPhone', 'Контакт: телефон'],
  ['siteContactWhatsapp', 'Контакт: WhatsApp'],
  ['siteContactTelegram', 'Контакт: Telegram'],
  ['siteContactEmail', 'Контакт: email'],
  ['siteContactAddress', 'Контакт: адрес'],
  ['siteContactHours', 'Контакт: время работы'],
  ['siteContactSocials', 'Контакт: соцсети'],
  ['materialsLink', 'Ссылка на облако'],
  ['deadline', 'Срок'],
  ['deadlineDate', 'Точная дата'],
  ['additionalInfo', 'Дополнительно']
];

function doPost(request) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var payload = JSON.parse(request.postData.contents);
    var sheet = getSheet();

    if (isDuplicate(sheet, payload.submissionId)) {
      return jsonResponse({ status: 'ok', duplicate: true });
    }

    var values = payload.values || {};
    var row = [new Date(payload.submittedAt || Date.now())];

    FIELDS.forEach(function (field) {
      row.push(formatValue(values[field[0]]));
    });

    row.push(saveFiles(payload.files, payload.submissionId));
    row.push(payload.submissionId || '');

    sheet.appendRow(row);

    return jsonResponse({ status: 'ok' });
  } catch (error) {
    return jsonResponse({ status: 'error', message: String(error) });
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    var headers = ['Дата отправки'];

    FIELDS.forEach(function (field) {
      headers.push(field[1]);
    });

    headers.push('Файлы', 'ID заявки');
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function isDuplicate(sheet, submissionId) {
  if (!submissionId || sheet.getLastRow() < 2) {
    return false;
  }

  var column = sheet.getLastColumn();
  var ids = sheet.getRange(2, column, sheet.getLastRow() - 1, 1).getValues();

  return ids.some(function (cell) {
    return String(cell[0]) === String(submissionId);
  });
}

function formatValue(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return Array.isArray(value) ? value.join(', ') : String(value);
}

function saveFiles(files, submissionId) {
  if (!files || !files.length) {
    return '';
  }

  var folder = getFolder(DRIVE_FOLDER_NAME).createFolder(submissionId || String(Date.now()));

  return files.map(function (file) {
    var blob = Utilities.newBlob(Utilities.base64Decode(file.content), file.type, file.name);
    return folder.createFile(blob).getUrl();
  }).join('\n');
}

function getFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 3. Опубликуйте веб-приложение

1. Нажмите **Начать развёртывание → Новое развёртывание**.
2. Тип — **Веб-приложение**.
3. **Выполнять от имени:** «Я».
4. **У кого есть доступ:** «Все».
5. Нажмите **Развернуть** и разрешите доступ к Google Drive и Google Sheets.
6. Скопируйте выданный адрес — он заканчивается на `/exec`.

### 4. Укажите адрес в проекте

Откройте `brief/script.js` и вставьте адрес в константу в начале файла:

```javascript
var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/…/exec';
```

Пока константа пустая, форма заполняется и сохраняет черновик, но при отправке
показывает сообщение о том, что отправка не настроена.

После изменения кода в Apps Script нужно каждый раз создавать **новую версию**
развёртывания, иначе изменения не применятся.

## Публикация на Vercel

1. Загрузите репозиторий на GitHub.
2. На [vercel.com](https://vercel.com) нажмите **Add New → Project** и выберите
   репозиторий.
3. Framework Preset — **Other**. Build Command и Output Directory оставьте пустыми:
   проект статический.
4. Нажмите **Deploy**.

Бриф будет доступен по адресу `https://<проект>.vercel.app/brief`.
Маршрут задан в `vercel.json`, дополнительная настройка не требуется.

Дальнейшие изменения публикуются автоматически при push в основную ветку.

## Данные

- Черновик хранится только в браузере клиента (`localStorage`, ключ `nv-brief-draft`)
  и удаляется сразу после успешной отправки.
- Каждая заявка получает уникальный идентификатор, поэтому повторная отправка
  не создаёт дубль строки в таблице.
- Сторонняя аналитика, рекламные пиксели и внешние скрипты не подключены.

## Ограничение на размер файлов

В интерфейсе стоит лимит 100 МБ суммарно, как требует ТЗ. При этом Google Apps
Script принимает запрос примерно до 40–50 МБ, а base64-кодирование увеличивает
объём примерно на треть. То есть загрузки до ~30 МБ проходят надёжно, а более
крупные могут завершиться ошибкой отправки — данные при этом не теряются, форма
остаётся заполненной и предлагает повторить.

Для тяжёлых материалов (видео, каталоги, исходники) предусмотрено поле
«Или ссылка на облако» на экране «Материалы» — это надёжный путь без ограничений.
