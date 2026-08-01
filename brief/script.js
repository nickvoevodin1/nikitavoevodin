/* ==========================================================================
   Бриф проекта — Никита Воеводин
   Блоки: Config · State · Storage · Loader · Screens · Progress · Navigation
          · Validation · Reveals · Files · Review · Submit · Success
   ========================================================================== */

(function () {
  'use strict';

  /* Config
     ------------------------------------------------------------------------ */

  /**
   * Адрес веб-приложения Google Apps Script.
   * Инструкция по получению ссылки — в README.md.
   */
  var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxFjvkC76Ab_J1M2etqHND61xcvCy7RPfyrFvXGmOLAil7BjFwlf7ZZYhDySv-eEQLV/exec';

  var STORAGE_KEY = 'nv-brief-draft';
  var LOADER_DURATION = 800;
  var SAVE_DELAY = 400;
  var SAVED_HINT_DURATION = 2000;
  var LEAVE_DURATION = 160;
  var REQUEST_TIMEOUT = 120000;

  var ALLOWED_EXTENSIONS = [
    'png', 'jpg', 'jpeg', 'svg', 'pdf', 'docx', 'xlsx', 'pptx',
    'ai', 'psd', 'cdr', 'mp4', 'mov', 'zip', 'rar'
  ];
  var IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg'];
  var MAX_TOTAL_FILE_SIZE = 100 * 1024 * 1024;

  var MESSAGES = {
    required: 'Пожалуйста, заполните это поле.',
    email: 'Проверьте адрес электронной почты.',
    phone: 'Проверьте номер телефона.',
    url: 'Проверьте ссылку. Например: company.ru',
    empty: '— не указано',
    network: 'Не удалось отправить данные. Проверьте подключение к интернету и попробуйте ещё раз.',
    notConfigured: 'Отправка не настроена. Укажите адрес Google Apps Script в файле script.js.'
  };

  /* State
     ------------------------------------------------------------------------ */

  var form = document.getElementById('briefForm');
  var appMain = document.getElementById('appMain');
  var appFooter = document.getElementById('appFooter');
  var progress = document.getElementById('progress');
  var counter = document.getElementById('counter');
  var savedHint = document.getElementById('savedHint');
  var backButton = document.getElementById('backButton');
  var nextButton = document.getElementById('nextButton');
  var reviewList = document.getElementById('reviewList');
  var submitError = document.getElementById('submitError');
  var submitErrorDetail = document.getElementById('submitErrorDetail');
  var fileInput = document.getElementById('fileInput');
  var fileList = document.getElementById('fileList');
  var filesError = document.getElementById('files-error');
  var dropzone = document.getElementById('dropzone');

  var screens = {
    draft: document.getElementById('screen-draft'),
    welcome: document.getElementById('screen-welcome'),
    review: document.getElementById('screen-review'),
    sending: document.getElementById('screen-sending'),
    success: document.getElementById('screen-success')
  };

  var stepScreens = Array.prototype.slice.call(form.querySelectorAll('[data-screen="step"]'));
  var totalSteps = stepScreens.length;
  var totalStages = totalSteps + 1;
  var ticks = [];

  var currentScreen = null;
  var currentStepIndex = 0;
  var selectedFiles = [];
  var submissionId = '';
  var saveTimer = null;
  var savedHintTimer = null;
  var isSubmitting = false;
  var isSubmitted = false;

  var prefersPointer = window.matchMedia('(pointer: fine)').matches;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Storage
     ------------------------------------------------------------------------ */

  function readDraft() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveDraft(withHint) {
    /* После успешной отправки черновик больше не нужен. */
    if (isSubmitted) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        submissionId: submissionId,
        stepIndex: currentStepIndex,
        values: collectValues()
      }));

      if (withHint) {
        showSavedHint();
      }
    } catch {
      /* Приватный режим браузера — черновик просто не сохраняется. */
    }
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Нечего очищать. */
    }
  }

  function scheduleSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(function () {
      saveDraft(true);
    }, SAVE_DELAY);
  }

  function showSavedHint() {
    savedHint.classList.add('is-visible');
    window.clearTimeout(savedHintTimer);
    savedHintTimer = window.setTimeout(function () {
      savedHint.classList.remove('is-visible');
    }, SAVED_HINT_DURATION);
  }

  function collectValues() {
    var values = {};

    getControls(form).forEach(function (control) {
      if (control.type === 'checkbox') {
        if (!values[control.name]) {
          values[control.name] = [];
        }
        if (control.checked) {
          values[control.name].push(control.value);
        }
      } else if (control.type === 'radio') {
        if (control.checked) {
          values[control.name] = control.value;
        } else if (!(control.name in values)) {
          values[control.name] = '';
        }
      } else {
        values[control.name] = control.value.trim();
      }
    });

    return values;
  }

  function restoreValues(values) {
    if (!values) {
      return;
    }

    getControls(form).forEach(function (control) {
      var stored = values[control.name];

      if (stored === undefined) {
        return;
      }

      if (control.type === 'checkbox') {
        control.checked = Array.isArray(stored) && stored.indexOf(control.value) !== -1;
      } else if (control.type === 'radio') {
        control.checked = stored === control.value;
      } else {
        control.value = stored;
        markFilled(control);
      }
    });

    updateReveals();
  }

  function hasAnswers(values) {
    if (!values) {
      return false;
    }

    return Object.keys(values).some(function (key) {
      var value = values[key];
      return Array.isArray(value) ? value.length > 0 : String(value).trim() !== '';
    });
  }

  function getControls(root) {
    return Array.prototype.slice
      .call(root.querySelectorAll('input, textarea'))
      .filter(function (control) {
        return control.name && control.type !== 'file';
      });
  }

  function createSubmissionId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return String(Date.now()) + '-' + Math.random().toString(36).slice(2, 10);
  }

  /* Loader
     ------------------------------------------------------------------------ */

  function runLoader() {
    var loader = document.getElementById('loader');
    var loaderBar = document.getElementById('loaderBar');

    window.requestAnimationFrame(function () {
      loaderBar.style.transitionDuration = LOADER_DURATION + 'ms';
      loaderBar.style.width = '100%';
    });

    window.setTimeout(function () {
      startApp();
      loader.classList.add('is-hidden');
      window.setTimeout(function () {
        loader.remove();
      }, LEAVE_DURATION);
    }, LOADER_DURATION);
  }

  /* Screens
     ------------------------------------------------------------------------ */

  function showScreen(element) {
    if (currentScreen === element) {
      return;
    }

    var previous = currentScreen;
    currentScreen = element;

    if (previous && !prefersReducedMotion) {
      previous.classList.add('is-leaving');
      window.setTimeout(function () {
        previous.classList.remove('is-leaving');
        previous.hidden = true;

        /* За время анимации мог быть запрошен уже другой экран. */
        if (currentScreen === element) {
          revealScreen(element);
        }
      }, LEAVE_DURATION);
      return;
    }

    if (previous) {
      previous.hidden = true;
    }

    revealScreen(element);
  }

  function revealScreen(element) {
    element.hidden = false;

    /* Перезапуск анимации появления. */
    element.style.animation = 'none';
    void element.offsetWidth;
    element.style.animation = '';

    form.hidden = element.closest('form') !== form;

    var isStep = element.dataset.screen === 'step';
    var isReview = element.dataset.screen === 'review';

    appFooter.hidden = !(isStep || isReview);
    progress.hidden = !(isStep || isReview);
    counter.hidden = !(isStep || isReview);
    backButton.hidden = isStep && currentStepIndex === 0;
    nextButton.textContent = isReview ? 'Отправить' : 'Далее';

    /* Высоту textarea можно измерить только на видимом экране. */
    Array.prototype.forEach.call(element.querySelectorAll('textarea'), resizeTextarea);

    appMain.scrollTop = 0;
    window.scrollTo(0, 0);
    focusScreen(element);
  }

  /**
   * На десктопе фокус уходит в первое поле — так быстрее заполнять.
   * На тач-устройствах это открыло бы клавиатуру поверх вопроса,
   * поэтому фокус получает заголовок: скринридер объявит вопрос.
   */
  function focusScreen(element) {
    var firstControl = prefersPointer
      ? element.querySelector('input[type="text"], input[type="email"], input[type="tel"], textarea')
      : null;

    if (firstControl && !isInsideHiddenBlock(firstControl, element)) {
      firstControl.focus({ preventScroll: true });
      return;
    }

    var heading = element.querySelector('h1, h2');

    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }

  function showStep(index) {
    currentStepIndex = Math.min(Math.max(index, 0), totalSteps - 1);
    showScreen(stepScreens[currentStepIndex]);
    updateProgress(currentStepIndex);
    saveDraft();
  }

  function showReview() {
    renderReview();
    hide(submitError);
    hide(submitErrorDetail);
    showScreen(screens.review);
    updateProgress(totalSteps);
  }

  function hide(element) {
    element.hidden = true;
    element.textContent = '';
  }

  /* Progress
     ------------------------------------------------------------------------ */

  function buildScale() {
    for (var index = 0; index < totalSteps; index += 1) {
      var tick = document.createElement('span');
      tick.className = 'tick';
      progress.appendChild(tick);
      ticks.push(tick);
    }
  }

  function updateProgress(stageIndex) {
    var value = Math.round(((stageIndex + 1) / totalStages) * 100);

    progress.setAttribute('aria-valuenow', String(value));
    counter.textContent = pad(Math.min(stageIndex + 1, totalSteps)) + ' / ' + pad(totalSteps);

    /* Небольшая задержка — засечки заполняются после смены экрана. */
    window.setTimeout(function () {
      ticks.forEach(function (tick, index) {
        tick.classList.toggle('is-done', index < stageIndex);
        tick.classList.toggle('is-current', index === stageIndex);
      });
    }, prefersReducedMotion ? 0 : 80);
  }

  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  /* Navigation
     ------------------------------------------------------------------------ */

  function goNext() {
    if (currentScreen && currentScreen.dataset.screen === 'review') {
      submitBrief();
      return;
    }

    if (!validateStep(stepScreens[currentStepIndex])) {
      return;
    }

    if (currentStepIndex === totalSteps - 1) {
      showReview();
    } else {
      showStep(currentStepIndex + 1);
    }
  }

  function goBack() {
    if (currentScreen && currentScreen.dataset.screen === 'review') {
      showStep(totalSteps - 1);
      return;
    }

    showStep(currentStepIndex - 1);
  }

  /* Validation
     ------------------------------------------------------------------------ */

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var URL_PATTERN = /^https?:\/\/([\wЀ-ӿ-]+\.)+[a-zЀ-ӿ]{2,}(\/[^\s]*)?$/i;

  function isUrlField(control) {
    return control.dataset.validate === 'url';
  }

  /**
   * Клиент вводит ровно то, что видит в плейсхолдере — «company.ru».
   * Схему подставляем сами, иначе корректный ввод отбивался бы ошибкой.
   */
  function normalizeUrl(control) {
    var value = control.value.trim();

    if (value === '' || /^https?:\/\//i.test(value)) {
      control.value = value;
      return;
    }

    control.value = 'https://' + value.replace(/^\/+/, '');
  }

  function getFieldError(control) {
    var value = control.value.trim();

    if (control.required && value === '') {
      return MESSAGES.required;
    }

    if (value === '') {
      return '';
    }

    if (control.type === 'email') {
      return EMAIL_PATTERN.test(value) ? '' : MESSAGES.email;
    }

    if (control.type === 'tel') {
      var digits = value.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 15 ? '' : MESSAGES.phone;
    }

    if (isUrlField(control)) {
      return URL_PATTERN.test(value) ? '' : MESSAGES.url;
    }

    return '';
  }

  function showFieldError(control, message) {
    var errorElement = document.getElementById(control.id + '-error');

    control.classList.add('is-invalid');
    control.setAttribute('aria-invalid', 'true');

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.hidden = false;
      control.setAttribute('aria-describedby', errorElement.id);
    }
  }

  function clearFieldError(control) {
    var errorElement = document.getElementById(control.id + '-error');

    control.classList.remove('is-invalid');
    control.removeAttribute('aria-invalid');

    if (errorElement) {
      errorElement.hidden = true;
      errorElement.textContent = '';
      control.removeAttribute('aria-describedby');
    }
  }

  function markFilled(control) {
    control.classList.toggle('is-filled', control.value.trim() !== '');
  }

  /**
   * Экран целиком скрыт, пока он не активен, поэтому проверять
   * `closest('[hidden]')` нельзя — ищем скрытый блок только внутри шага.
   */
  function isInsideHiddenBlock(control, step) {
    var node = control.parentElement;

    while (node && node !== step) {
      if (node.hidden) {
        return true;
      }
      node = node.parentElement;
    }

    return false;
  }

  function getValidatableControls(step) {
    return getControls(step).filter(function (control) {
      return control.type !== 'checkbox' &&
        control.type !== 'radio' &&
        !isInsideHiddenBlock(control, step);
    });
  }

  function validateStep(step) {
    var firstInvalid = null;

    getValidatableControls(step).forEach(function (control) {
      if (isUrlField(control)) {
        normalizeUrl(control);
      }

      var message = getFieldError(control);

      if (message) {
        showFieldError(control, message);
        if (!firstInvalid) {
          firstInvalid = control;
        }
      } else {
        clearFieldError(control);
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }

    return true;
  }

  function findFirstInvalidStepIndex() {
    for (var index = 0; index < totalSteps; index += 1) {
      var invalid = getValidatableControls(stepScreens[index]).some(function (control) {
        return getFieldError(control) !== '';
      });

      if (invalid) {
        return index;
      }
    }

    return -1;
  }

  /* Reveals — условные поля за чекбоксом «Другое» и подобными
     ------------------------------------------------------------------------ */

  function updateReveals() {
    var triggers = Array.prototype.slice.call(form.querySelectorAll('[data-reveals]'));
    var targets = {};

    triggers.forEach(function (trigger) {
      var id = trigger.dataset.reveals;
      targets[id] = targets[id] || false;
      if (trigger.checked) {
        targets[id] = true;
      }
    });

    Object.keys(targets).forEach(function (id) {
      var target = document.getElementById(id);

      if (!target || target.hidden === !targets[id]) {
        return;
      }

      target.hidden = !targets[id];

      /* Скрытое поле не должно попасть в ответы. */
      if (target.hidden) {
        getControls(target).forEach(function (control) {
          if (control.type === 'checkbox' || control.type === 'radio') {
            control.checked = false;
          } else {
            control.value = '';
            markFilled(control);
          }
          clearFieldError(control);
        });
      }
    });
  }

  /* Files
     ------------------------------------------------------------------------ */

  function getExtension(name) {
    var parts = name.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  function formatSize(bytes) {
    if (bytes < 1024) {
      return bytes + ' Б';
    }
    if (bytes < 1024 * 1024) {
      return Math.round(bytes / 1024) + ' КБ';
    }
    return (bytes / (1024 * 1024)).toFixed(1).replace('.', ',') + ' МБ';
  }

  function getTotalSize(files) {
    return files.reduce(function (sum, file) {
      return sum + file.size;
    }, 0);
  }

  function addFiles(files) {
    var rejectedType = [];
    var rejectedSize = [];
    var accepted = [];
    var totalSize = getTotalSize(selectedFiles);

    Array.prototype.forEach.call(files, function (file) {
      if (ALLOWED_EXTENSIONS.indexOf(getExtension(file.name)) === -1) {
        rejectedType.push(file.name);
        return;
      }

      var duplicate = selectedFiles.concat(accepted).some(function (existing) {
        return existing.name === file.name && existing.size === file.size;
      });

      if (duplicate) {
        return;
      }

      if (totalSize + file.size > MAX_TOTAL_FILE_SIZE) {
        rejectedSize.push(file.name);
        return;
      }

      totalSize += file.size;
      accepted.push(file);
    });

    selectedFiles = selectedFiles.concat(accepted);

    var problems = [];

    if (rejectedType.length) {
      problems.push('Не подходит формат: ' + rejectedType.join(', ') + '.');
    }

    if (rejectedSize.length) {
      problems.push('Не поместилось в лимит 100 МБ: ' + rejectedSize.join(', ') + '.');
    }

    if (problems.length) {
      showFilesError(problems.join(' '));
    } else {
      hide(filesError);
    }

    renderFiles();
  }

  function removeFile(index) {
    var removed = selectedFiles[index];

    selectedFiles.splice(index, 1);

    if (removed && removed.previewUrl) {
      window.URL.revokeObjectURL(removed.previewUrl);
    }

    hide(filesError);
    renderFiles();
  }

  function showFilesError(message) {
    filesError.textContent = message;
    filesError.hidden = false;
  }

  function renderFiles() {
    fileList.textContent = '';

    selectedFiles.forEach(function (file, index) {
      fileList.appendChild(createFileRow(file, index));
    });
  }

  function createFileRow(file, index) {
    var item = document.createElement('li');
    item.className = 'file';

    var extension = getExtension(file.name);

    if (IMAGE_EXTENSIONS.indexOf(extension) !== -1) {
      if (!file.previewUrl) {
        file.previewUrl = window.URL.createObjectURL(file);
      }

      var preview = document.createElement('img');
      preview.className = 'file__preview';
      preview.src = file.previewUrl;
      preview.alt = '';
      preview.width = 40;
      preview.height = 40;
      item.appendChild(preview);
    } else {
      var badge = document.createElement('span');
      badge.className = 'file__badge';
      badge.textContent = extension;
      item.appendChild(badge);
    }

    var name = document.createElement('span');
    name.className = 'file__name';
    name.textContent = file.name;

    var size = document.createElement('span');
    size.className = 'file__size';
    size.textContent = formatSize(file.size);

    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'file__remove';
    remove.setAttribute('aria-label', 'Удалить файл ' + file.name);
    remove.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    remove.addEventListener('click', function () {
      removeFile(index);
    });

    item.appendChild(name);
    item.appendChild(size);
    item.appendChild(remove);

    return item;
  }

  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();

      reader.onload = function () {
        var result = String(reader.result);
        resolve({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          content: result.slice(result.indexOf(',') + 1)
        });
      };

      reader.onerror = function () {
        reject(new Error('Не удалось прочитать файл ' + file.name));
      };

      reader.readAsDataURL(file);
    });
  }

  /* Review
     ------------------------------------------------------------------------ */

  function getControlLabel(control, step) {
    if (control.type === 'checkbox' || control.type === 'radio') {
      var group = control.closest('fieldset');
      var legend = group && group.querySelector('legend');
      return legend ? legend.textContent.trim() : control.name;
    }

    var label = control.labels && control.labels[0];

    if (label) {
      return label.textContent.replace('*', '').trim();
    }

    /* Поле, подписанное заголовком экрана: в карточке заголовок уже есть. */
    return step.dataset.label || 'Ответ';
  }

  function collectStepAnswers(step) {
    var answers = [];
    var seenGroups = {};

    getControls(step).forEach(function (control) {
      if (isInsideHiddenBlock(control, step)) {
        return;
      }

      if (control.type === 'checkbox' || control.type === 'radio') {
        if (seenGroups[control.name]) {
          return;
        }
        seenGroups[control.name] = true;

        var checked = Array.prototype.slice
          .call(step.querySelectorAll('[name="' + control.name + '"]:checked'))
          .map(function (item) {
            return item.value;
          });

        answers.push({ label: getControlLabel(control, step), value: checked.join(', ') });
        return;
      }

      answers.push({ label: getControlLabel(control, step), value: control.value.trim() });
    });

    if (step.id === 'step-materials') {
      answers.unshift({
        label: 'Файлы',
        value: selectedFiles.map(function (file) {
          return file.name + ' · ' + formatSize(file.size);
        }).join('\n')
      });
    }

    return answers;
  }

  function renderReview() {
    reviewList.textContent = '';

    stepScreens.forEach(function (step, index) {
      reviewList.appendChild(createReviewCard(step, index, collectStepAnswers(step)));
    });
  }

  function createReviewCard(step, index, answers) {
    var card = document.createElement('article');
    card.className = 'card';

    var head = document.createElement('p');
    head.className = 'card__head';

    var overline = document.createElement('span');
    overline.className = 'card__overline';
    overline.textContent = pad(index + 1) + ' · ' + (step.dataset.label || '');

    var edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'card__edit';
    edit.textContent = 'Изменить';
    edit.setAttribute('aria-label', 'Изменить: ' + (step.dataset.label || ''));
    edit.addEventListener('click', function () {
      showStep(index);
    });

    head.appendChild(overline);
    head.appendChild(edit);

    var list = document.createElement('dl');
    list.className = 'card__list';

    answers.forEach(function (answer) {
      var row = document.createElement('div');
      row.className = 'card__row';

      var label = document.createElement('dt');
      label.className = 'card__label';
      label.textContent = answer.label;

      var value = document.createElement('dd');
      value.className = 'card__value';

      if (answer.value === '') {
        value.classList.add('card__value--empty');
        value.textContent = MESSAGES.empty;
      } else {
        value.textContent = answer.value;
      }

      row.appendChild(label);
      row.appendChild(value);
      list.appendChild(row);
    });

    card.appendChild(head);
    card.appendChild(list);

    return card;
  }

  /* Submit
     ------------------------------------------------------------------------ */

  function buildPayload(files) {
    return {
      submissionId: submissionId,
      submittedAt: new Date().toISOString(),
      values: collectValues(),
      files: files
    };
  }

  function sendPayload(payload) {
    var controller = new AbortController();
    var timer = window.setTimeout(function () {
      controller.abort();
    }, REQUEST_TIMEOUT);

    return window.fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      /* text/plain избавляет от preflight-запроса, который Apps Script не обрабатывает. */
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: controller.signal
    }).then(function (response) {
      window.clearTimeout(timer);

      if (!response.ok) {
        throw new Error('Ответ сервера: ' + response.status);
      }

      return response.json();
    }).then(function (result) {
      if (!result || result.status !== 'ok') {
        throw new Error(result && result.message ? result.message : 'Неизвестная ошибка');
      }

      return result;
    }).catch(function (error) {
      window.clearTimeout(timer);
      throw error;
    });
  }

  function submitBrief() {
    if (isSubmitting) {
      return;
    }

    var invalidStepIndex = findFirstInvalidStepIndex();

    if (invalidStepIndex !== -1) {
      showStep(invalidStepIndex);
      validateStep(stepScreens[invalidStepIndex]);
      return;
    }

    if (!GOOGLE_SCRIPT_URL) {
      showSubmitError(MESSAGES.notConfigured);
      return;
    }

    isSubmitting = true;
    nextButton.classList.add('is-loading');
    hide(submitError);
    hide(submitErrorDetail);
    showScreen(screens.sending);

    Promise.all(selectedFiles.map(readFileAsBase64))
      .then(function (files) {
        return sendPayload(buildPayload(files));
      })
      .then(function () {
        isSubmitted = true;
        window.clearTimeout(saveTimer);
        window.clearTimeout(savedHintTimer);
        savedHint.classList.remove('is-visible');
        clearDraft();
        showScreen(screens.success);
      })
      .catch(function (error) {
        showReview();
        showSubmitError(MESSAGES.network);
        showSubmitErrorDetail(error);
      })
      .then(function () {
        isSubmitting = false;
        nextButton.classList.remove('is-loading');
      });
  }

  function showSubmitError(message) {
    submitError.textContent = message;
    submitError.hidden = false;
  }

  /**
   * Расшифровка сбоя: без неё любая причина выглядит как «нет интернета»,
   * и понять, что именно чинить в Apps Script, невозможно.
   */
  function describeFailure(error) {
    var reason = error && error.message ? error.message : String(error);

    if (error && error.name === 'AbortError') {
      return 'Ответ не пришёл за отведённое время. Возможно, файлы слишком тяжёлые.';
    }

    if (reason.indexOf('Failed to fetch') !== -1 || reason.indexOf('NetworkError') !== -1) {
      return 'Запрос не дошёл до Google. Чаще всего это значит, что у веб-приложения ' +
        'в настройках развёртывания доступ выставлен не на «Все».';
    }

    if (reason.indexOf('JSON') !== -1 || reason.indexOf('Unexpected token') !== -1) {
      return 'Google ответил не данными, а страницей — обычно это страница входа. ' +
        'Проверьте, что доступ к веб-приложению открыт всем.';
    }

    return 'Техническая причина: ' + reason;
  }

  function showSubmitErrorDetail(error) {
    submitErrorDetail.textContent = describeFailure(error);
    submitErrorDetail.hidden = false;
  }

  /* Success
     ------------------------------------------------------------------------ */

  function closePage() {
    window.close();
    window.setTimeout(function () {
      document.getElementById('closeHint').hidden = false;
    }, 300);
  }

  /* Textarea
     ------------------------------------------------------------------------ */

  function resizeTextarea(control) {
    if (control.tagName !== 'TEXTAREA') {
      return;
    }

    control.style.height = 'auto';

    /* На скрытом экране высота недоступна — оставляем значение из CSS. */
    if (control.scrollHeight > 0) {
      control.style.height = control.scrollHeight + 'px';
    } else {
      control.style.height = '';
    }
  }

  /* Init
     ------------------------------------------------------------------------ */

  function startApp() {
    var draft = readDraft();

    if (draft && hasAnswers(draft.values)) {
      submissionId = draft.submissionId || createSubmissionId();
      showScreen(screens.draft);
      screens.draft.addEventListener('click', function handleDraftChoice(event) {
        var action = event.target.dataset.action;

        if (action === 'draft-continue') {
          restoreValues(draft.values);
          showStep(draft.stepIndex || 0);
        } else if (action === 'draft-reset') {
          clearDraft();
          submissionId = createSubmissionId();
          showScreen(screens.welcome);
        } else {
          return;
        }

        screens.draft.removeEventListener('click', handleDraftChoice);
      });
      return;
    }

    submissionId = createSubmissionId();
    showScreen(screens.welcome);
  }

  function bindEvents() {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      goNext();
    });

    backButton.addEventListener('click', goBack);

    form.addEventListener('input', function (event) {
      resizeTextarea(event.target);
      markFilled(event.target);

      if (event.target.classList.contains('is-invalid') && !getFieldError(event.target)) {
        clearFieldError(event.target);
      }

      scheduleSave();
    });

    form.addEventListener('change', function () {
      updateReveals();
      scheduleSave();
    });

    form.addEventListener('blur', function (event) {
      var control = event.target;

      if (!control.name || control.type === 'checkbox' || control.type === 'radio') {
        return;
      }

      if (isUrlField(control)) {
        normalizeUrl(control);
        markFilled(control);
      }

      var message = getFieldError(control);

      if (message && control.value.trim() !== '') {
        showFieldError(control, message);
      }
    }, true);

    screens.welcome.addEventListener('click', function (event) {
      if (event.target.dataset.action === 'start') {
        showStep(0);
      }
    });

    screens.success.addEventListener('click', function (event) {
      if (event.target.dataset.action === 'close') {
        closePage();
      }
    });

    document.getElementById('pickFiles').addEventListener('click', function (event) {
      event.stopPropagation();
      fileInput.click();
    });

    fileInput.addEventListener('change', function () {
      addFiles(fileInput.files);
      fileInput.value = '';
    });

    dropzone.addEventListener('click', function () {
      fileInput.click();
    });

    ['dragenter', 'dragover'].forEach(function (eventName) {
      dropzone.addEventListener(eventName, function (event) {
        event.preventDefault();
        dropzone.classList.add('is-active');
      });
    });

    ['dragleave', 'drop'].forEach(function (eventName) {
      dropzone.addEventListener(eventName, function (event) {
        event.preventDefault();
        dropzone.classList.remove('is-active');
      });
    });

    dropzone.addEventListener('drop', function (event) {
      if (event.dataTransfer && event.dataTransfer.files.length) {
        addFiles(event.dataTransfer.files);
      }
    });

    window.addEventListener('beforeunload', function () {
      if (!isSubmitting) {
        saveDraft();
      }
    });

    /* На мобильных вкладка часто закрывается без beforeunload. */
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden' && !isSubmitting) {
        saveDraft();
      }
    });
  }

  buildScale();
  bindEvents();
  runLoader();
})();
