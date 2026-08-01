/**
 * Бриф проекта — Никита Воеводин
 * Приём заявок с https://nikitavoevodin.vercel.app/brief в Google Sheets.
 *
 * Как подключить:
 * 1. Откройте нужную Google-таблицу → Расширения → Apps Script.
 * 2. Удалите всё содержимое файла «Код.gs» и вставьте этот код целиком.
 * 3. Сохраните (Ctrl+S).
 * 4. Развернуть → Новое развёртывание → тип «Веб-приложение».
 *    Выполнять от имени: «Я».
 *    У кого есть доступ: «Все».  ← без этого форма получит ошибку
 * 5. Развернуть, разрешить доступ к Google Диску и Таблицам.
 * 6. Скопируйте адрес, заканчивающийся на /exec.
 *
 * Проверка: откройте этот адрес в браузере. Ответ покажет, в какую таблицу
 * и на какой лист скрипт пишет заявки.
 * Если вместо этого — страница входа Google, значит в пункте 4
 * доступ выставлен не на «Все».
 *
 * После любой правки этого кода: Развернуть → Управление развёртываниями →
 * изменить версию на «Новая». Иначе продолжит работать старый код.
 */

/**
 * Таблица, в которую пишутся заявки.
 * Пусто — скрипт пишет в ту таблицу, из которой он открыт (Расширения → Apps Script).
 * Если скрипт создан отдельно, вставьте сюда ID таблицы — это часть её адреса
 * между /d/ и /edit.
 */
var SPREADSHEET_ID = '';

/** Лист таблицы, в который пишутся заявки. Создаётся автоматически. */
var SHEET_NAME = 'Брифы';

/** Папка на Google Диске для вложений. Создаётся автоматически. */
var DRIVE_FOLDER_NAME = 'Бриф — файлы клиентов';

/** Порядок колонок: ключ поля формы → заголовок в таблице. */
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

/**
 * Открытие адреса в браузере — быстрая проверка, что развёртывание живое.
 */
function doGet() {
  try {
    var sheet = getSheet();
    var spreadsheet = sheet.getParent();

    return jsonResponse({
      status: 'ok',
      message: 'Бриф проекта: приём заявок работает.',
      spreadsheet: spreadsheet.getName(),
      sheet: sheet.getName(),
      rows: Math.max(sheet.getLastRow() - 1, 0),
      url: spreadsheet.getUrl()
    });
  } catch (error) {
    return jsonResponse({ status: 'error', message: String(error) });
  }
}

/**
 * Приём заявки из формы.
 */
function doPost(request) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    if (!request || !request.postData || !request.postData.contents) {
      return jsonResponse({ status: 'error', message: 'Пустой запрос' });
    }

    var payload = JSON.parse(request.postData.contents);
    var sheet = getSheet();

    /* Повторная отправка той же заявки не должна создавать вторую строку. */
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

    var spreadsheet = sheet.getParent();

    return jsonResponse({
      status: 'ok',
      spreadsheet: spreadsheet.getName(),
      sheet: sheet.getName(),
      row: sheet.getLastRow(),
      url: spreadsheet.getUrl()
    });
  } catch (error) {
    return jsonResponse({ status: 'error', message: String(error) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Лист заявок. При первом обращении создаёт лист и строку заголовков.
 */
function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }

  var active = SpreadsheetApp.getActiveSpreadsheet();

  if (!active) {
    throw new Error(
      'Скрипт не привязан к таблице. Укажите ID таблицы в константе SPREADSHEET_ID ' +
      'либо создайте скрипт из самой таблицы: Расширения → Apps Script.'
    );
  }

  return active;
}

function getSheet() {
  var spreadsheet = getSpreadsheet();
  var sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    var headers = ['Дата отправки'];

    FIELDS.forEach(function (field) {
      headers.push(field[1]);
    });

    headers.push('Файлы', 'ID заявки');

    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }

  return sheet;
}

/**
 * Заявка уже записана? Сравниваем по идентификатору в колонке «ID заявки».
 */
function isDuplicate(sheet, submissionId) {
  if (!submissionId || sheet.getLastRow() < 2) {
    return false;
  }

  /* Строго колонка «ID заявки»: последняя заполненная может быть чужой. */
  var column = FIELDS.length + 3;
  var ids = sheet.getRange(2, column, sheet.getLastRow() - 1, 1).getValues();

  return ids.some(function (cell) {
    return String(cell[0]) === String(submissionId);
  });
}

/**
 * Чекбоксы приходят массивом — склеиваем в одну ячейку.
 */
function formatValue(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return Array.isArray(value) ? value.join(', ') : String(value);
}

/**
 * Вложения складываем на Диск, в таблицу пишем ссылки.
 */
function saveFiles(files, submissionId) {
  if (!files || !files.length) {
    return '';
  }

  var parent = getFolder(DRIVE_FOLDER_NAME);
  var folder = parent.createFolder(submissionId || String(Date.now()));

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
