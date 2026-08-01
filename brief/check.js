/* ==========================================================================
   Проверка связи с Google Apps Script.
   Служебная страница: три пробы подряд показывают, на каком шаге рвётся связь.
   ========================================================================== */

(function () {
  'use strict';

  /* Тот же адрес, что используется в брифе. */
  var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx3I9NLGT-CkhO-jyO_B2wLGXJpMmEJrljfE43McU13zWDDoUwYwmqSuiwVJXVvOaxGXQ/exec';

  var results = document.getElementById('results');
  var endpointInput = document.getElementById('endpoint');

  endpointInput.value = GOOGLE_SCRIPT_URL;

  /** Проверяем тот адрес, который сейчас в поле: новое развёртывание — новый адрес. */
  function getUrl() {
    return endpointInput.value.trim();
  }

  /**
   * Карточка одной пробы. Возвращает функцию завершения.
   */
  function addProbe(name, explanation) {
    var item = document.createElement('li');
    item.className = 'check__item check__item--wait';

    var title = document.createElement('p');
    title.className = 'check__name';
    title.textContent = name;

    var verdict = document.createElement('p');
    verdict.className = 'check__verdict';
    verdict.textContent = 'Проверяем…';

    var hint = document.createElement('p');
    hint.className = 'check__raw';
    hint.textContent = explanation;

    item.appendChild(title);
    item.appendChild(verdict);
    item.appendChild(hint);
    results.appendChild(item);

    return function finish(isOk, message, raw) {
      item.className = 'check__item ' + (isOk ? 'check__item--ok' : 'check__item--fail');
      verdict.textContent = (isOk ? '✓ ' : '✗ ') + message;
      hint.textContent = raw || explanation;
    };
  }

  /**
   * Проба 1. Достижим ли адрес вообще.
   * Режим no-cors не читает ответ, но отличает «сервер ответил» от
   * «запрос никуда не ушёл» — это разные болезни.
   */
  function probeReachable() {
    var finish = addProbe(
      '1. Адрес отвечает?',
      'Проверяем, доходит ли запрос до серверов Google.'
    );

    return window.fetch(getUrl(), { method: 'GET', mode: 'no-cors' })
      .then(function () {
        finish(true, 'Да, сервер Google отвечает.',
          'Значит, адрес живой и сеть не блокирует запрос. ' +
          'Если проба 2 при этом провалится — Google отдаёт ответ без разрешения на чтение, ' +
          'то есть вместо данных возвращает страницу входа или ошибку.');
        return true;
      })
      .catch(function (error) {
        finish(false, 'Нет, запрос не уходит.',
          'Причина: ' + error.message + '\n' +
          'Так бывает, если адрес неверный, развёртывание удалено ' +
          'или соединение блокирует расширение браузера либо антивирус.');
        return false;
      });
  }

  /**
   * Проба 2. Отдаёт ли скрипт данные, которые можно прочитать.
   * Это ровно то, что делает бриф при отправке.
   */
  function probeReadable(isReachable) {
    var finish = addProbe(
      '2. Скрипт отдаёт данные?',
      'Запрашиваем ответ функции doGet — так же, как это делает бриф.'
    );

    return window.fetch(getUrl(), { method: 'GET' })
      .then(function (response) {
        return response.text().then(function (text) {
          var isJson = text.indexOf('"status"') !== -1;

          if (isJson) {
            finish(true, 'Да, ответ получен.', 'Ответ сервера: ' + text.slice(0, 300));
          } else {
            finish(false, 'Пришли не данные, а веб-страница.',
              'Обычно это страница входа Google. Значит, в развёртывании доступ ' +
              'открыт не для всех, либо скрипт принадлежит рабочему аккаунту, ' +
              'где администратор запрещает анонимный доступ.\n\n' +
              'Начало ответа: ' + text.slice(0, 200));
          }

          return isJson;
        });
      })
      .catch(function (error) {
        /* Проба 1 уже показала, доходит ли запрос: это сужает диагноз вдвое. */
        var diagnosis = isReachable
          ? 'Сервер Google ответил (проба 1 прошла), но браузеру запрещено читать ответ.\n' +
            'Значит, вместо данных пришла страница ошибки Apps Script. Две причины:\n\n' +
            '1. Развёрнута старая версия кода — самое частое. Правка кода в редакторе ' +
            'не меняет то, что выполняется по ссылке. Нужно: Развернуть → Управление ' +
            'развёртываниями → карандаш → Версия: «Новая версия» → Развернуть. ' +
            'Адрес при этом не изменится.\n\n' +
            '2. Скрипту не выданы разрешения. Откройте в редакторе любую функцию, ' +
            'нажмите «Выполнить» и разрешите доступ к Таблицам и Диску.'
          : 'Запрос вообще не доходит до Google — смотрите пробу 1.';

        finish(false, 'Ответ прочитать нельзя.', 'Причина: ' + error.message + '\n' + diagnosis);
        return false;
      });
  }

  /**
   * Проба 3. Реальная запись строки — то же, что делает кнопка «Отправить».
   */
  function probeWrite() {
    var finish = addProbe(
      '3. Запись в таблицу',
      'Отправляем тестовую строку тем же способом, что и бриф.'
    );

    var payload = {
      submissionId: 'check-' + Date.now(),
      submittedAt: new Date().toISOString(),
      values: {
        companyName: 'ТЕСТ СВЯЗИ — строку можно удалить',
        contactPerson: 'Проверка',
        phone: '+70000000000',
        email: 'test@example.com'
      },
      files: []
    };

    return window.fetch(getUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return response.text().then(function (text) {
          if (text.indexOf('"status":"ok"') !== -1) {
            finish(true, 'Строка записана. Всё работает.',
              'Ответ сервера: ' + text.slice(0, 300) +
              '\nОткройте таблицу — там появилась строка «ТЕСТ СВЯЗИ».');
          } else {
            finish(false, 'Скрипт ответил ошибкой.',
              'Ответ сервера: ' + text.slice(0, 400));
          }
        });
      })
      .catch(function (error) {
        finish(false, 'Запрос не дошёл.',
          'Причина: ' + error.message +
          '\nТа же ошибка, что и в брифе. Смотрите вывод проб 1 и 2 выше.');
      });
  }

  function runChecks() {
    results.textContent = '';

    if (!getUrl()) {
      return Promise.resolve();
    }

    return probeReachable().then(function (isReachable) {
      return probeReadable(isReachable);
    });
  }

  runChecks();

  document.getElementById('runCheck').addEventListener('click', runChecks);

  document.getElementById('runWrite').addEventListener('click', function (event) {
    event.target.disabled = true;
    probeWrite().then(function () {
      event.target.disabled = false;
    });
  });
})();
