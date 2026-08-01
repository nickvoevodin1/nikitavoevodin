/* ==========================================================================
   Бриф проекта — Никита Воеводин
   Блоки: Config · State · Storage · Loader · Screens · Progress · Navigation
          · Validation · Files · Review · Submit · Success
   ========================================================================== */

(function () {
  'use strict';

  /* Config
     ------------------------------------------------------------------------ */

  /**
   * Адрес веб-приложения Google Apps Script.
   * Инструкция по получению ссылки — в README.md.
   */
  var GOOGLE_SCRIPT_URL = '';

  var STORAGE_KEY = 'nv-brief-draft';
  var LOADER_DURATION = 3000;
  var SAVE_DELAY = 400;
  var REQUEST_TIMEOUT = 60000;

  var ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'pdf', 'docx', 'zip', 'rar'];
  var MAX_TOTAL_FILE_SIZE = 10 * 1024 * 1024;

  var MESSAGES = {
    required: 'Пожалуйста, заполните это поле.',
    email: 'Проверьте адрес электронной почты.',
    phone: 'Проверьте номер телефона.',
    url: 'Проверьте ссылку. Например: company.ru',
    fileType: 'Такой формат не поддерживается: ',
    fileSize: 'Общий размер файлов не должен превышать 10 МБ.',
    network: 'Не удалось отправить данные. Проверьте подключение к интернету и попробуйте ещё раз.',
    notConfigured: 'Отправка не настроена. Укажите адрес Google Apps Script в файле script.js.'
  };

  /* State
     ------------------------------------------------------------------------ */

  var form = document.getElementById('briefForm');
  var appMain = document.getElementById('appMain');
  var appFooter = document.getElementById('appFooter');
  var progress = document.getElementById('progress');
  var progressBar = document.getElementById('progressBar');
  var backButton = document.getElementById('backButton');
  var nextButton = document.getElementById('nextButton');
  var reviewList = document.getElementById('reviewList');
  var submitError = document.getElementById('submitError');
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
  var totalStages = stepScreens.length + 1;

  var currentScreen = null;
  var currentStepIndex = 0;
  var selectedFiles = [];
  var submissionId = '';
  var saveTimer = null;
  var isSubmitting = false;
  var isSubmitted = false;

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

  function saveDraft() {
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
    saveTimer = window.setTimeout(saveDraft, SAVE_DELAY);
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
        resizeTextarea(control);
      }
    });
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
      }, 250);
    }, LOADER_DURATION);
  }

  /* Screens
     ------------------------------------------------------------------------ */

  function showScreen(element) {
    if (currentScreen === element) {
      return;
    }

    if (currentScreen) {
      currentScreen.hidden = true;
    }

    element.hidden = false;
    currentScreen = element;

    /* Перезапуск анимации появления. */
    element.style.animation = 'none';
    void element.offsetWidth;
    element.style.animation = '';

    form.hidden = element.closest('form') !== form;

    var isStep = element.dataset.screen === 'step';
    var isReview = element.dataset.screen === 'review';

    appFooter.hidden = !(isStep || isReview);
    progress.hidden = !(isStep || isReview);
    backButton.hidden = isStep && currentStepIndex === 0;
    nextButton.textContent = isReview ? 'Отправить' : 'Далее';

    /* Высоту textarea можно измерить только на видимом экране. */
    Array.prototype.forEach.call(element.querySelectorAll('textarea'), resizeTextarea);

    appMain.scrollTop = 0;
    window.scrollTo(0, 0);
    focusFirstControl(element);
  }

  function focusFirstControl(element) {
    var heading = element.querySelector('h1, h2');

    if (!heading) {
      return;
    }

    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }

  function showStep(index) {
    currentStepIndex = Math.min(Math.max(index, 0), stepScreens.length - 1);
    showScreen(stepScreens[currentStepIndex]);
    updateProgress(currentStepIndex);
    saveDraft();
  }

  function showReview() {
    renderReview();
    hide(submitError);
    showScreen(screens.review);
    updateProgress(stepScreens.length);
  }

  function hide(element) {
    element.hidden = true;
    element.textContent = '';
  }

  /* Progress
     ------------------------------------------------------------------------ */

  function updateProgress(stageIndex) {
    var value = Math.round(((stageIndex + 1) / totalStages) * 100);
    progressBar.style.width = value + '%';
    progress.setAttribute('aria-valuenow', String(value));
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

    if (currentStepIndex === stepScreens.length - 1) {
      showReview();
    } else {
      showStep(currentStepIndex + 1);
    }
  }

  function goBack() {
    if (currentScreen && currentScreen.dataset.screen === 'review') {
      showStep(stepScreens.length - 1);
      return;
    }

    showStep(currentStepIndex - 1);
  }

  /* Validation
     ------------------------------------------------------------------------ */

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var URL_PATTERN = /^(https?:\/\/)?([\wЀ-ӿ-]+\.)+[a-zЀ-ӿ]{2,}(\/[^\s]*)?$/i;

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

    if (control.type === 'url' || control.dataset.validate === 'url') {
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

  function validateStep(step) {
    var controls = getControls(step).filter(function (control) {
      return control.type !== 'checkbox' && control.type !== 'radio';
    });

    var firstInvalid = null;

    controls.forEach(function (control) {
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
    for (var index = 0; index < stepScreens.length; index += 1) {
      var invalid = getControls(stepScreens[index]).some(function (control) {
        return control.type !== 'checkbox' && control.type !== 'radio' && getFieldError(control) !== '';
      });

      if (invalid) {
        return index;
      }
    }

    return -1;
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

  function addFiles(files) {
    var rejected = [];
    var accepted = [];

    Array.prototype.forEach.call(files, function (file) {
      if (ALLOWED_EXTENSIONS.indexOf(getExtension(file.name)) === -1) {
        rejected.push(file.name);
        return;
      }

      var duplicate = selectedFiles.some(function (existing) {
        return existing.name === file.name && existing.size === file.size;
      });

      if (!duplicate) {
        accepted.push(file);
      }
    });

    var totalSize = selectedFiles.concat(accepted).reduce(function (sum, file) {
      return sum + file.size;
    }, 0);

    if (totalSize > MAX_TOTAL_FILE_SIZE) {
      showFilesError(MESSAGES.fileSize);
      return;
    }

    selectedFiles = selectedFiles.concat(accepted);

    if (rejected.length) {
      showFilesError(MESSAGES.fileType + rejected.join(', '));
    } else {
      hide(filesError);
    }

    renderFiles();
  }

  function removeFile(index) {
    selectedFiles.splice(index, 1);
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
      var item = document.createElement('li');
      item.className = 'file';

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
      fileList.appendChild(item);
    });
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

  function getControlLabel(control) {
    if (control.type === 'checkbox' || control.type === 'radio') {
      var group = control.closest('fieldset');
      var legend = group && group.querySelector('legend');
      return legend ? legend.textContent.trim() : control.name;
    }

    var label = control.labels && control.labels[0];

    if (label) {
      return label.textContent.replace('*', '').trim();
    }

    var described = control.getAttribute('aria-labelledby');
    var heading = described && document.getElementById(described);

    return heading ? heading.textContent.trim() : control.name;
  }

  function collectStepAnswers(step) {
    var answers = [];
    var seenGroups = {};
    var stepTitle = step.querySelector('h2').textContent.trim();

    function addAnswer(label, value) {
      /* Если подпись поля повторяет заголовок экрана, показываем только ответ. */
      answers.push({ label: label === stepTitle ? '' : label, value: value });
    }

    getControls(step).forEach(function (control) {
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

        if (checked.length) {
          addAnswer(getControlLabel(control), checked.join(', '));
        }
        return;
      }

      var value = control.value.trim();

      if (value) {
        addAnswer(getControlLabel(control), value);
      }
    });

    return answers;
  }

  function renderReview() {
    reviewList.textContent = '';

    stepScreens.forEach(function (step, index) {
      var answers = collectStepAnswers(step);

      if (step.id === 'step-materials') {
        answers = selectedFiles.map(function (file) {
          return { label: 'Файл', value: file.name + ' · ' + formatSize(file.size) };
        });
      }

      if (!answers.length) {
        return;
      }

      reviewList.appendChild(createReviewCard(step, index, answers));
    });

    if (!reviewList.children.length) {
      var empty = document.createElement('p');
      empty.className = 'screen__text';
      empty.textContent = 'Пока ничего не заполнено. Вернитесь назад и ответьте на вопросы.';
      reviewList.appendChild(empty);
    }
  }

  function createReviewCard(step, index, answers) {
    var card = document.createElement('article');
    card.className = 'card';

    var head = document.createElement('p');
    head.className = 'card__head';

    var title = document.createElement('span');
    title.className = 'card__title';
    title.textContent = step.querySelector('h2').textContent;

    var edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'card__edit';
    edit.textContent = 'Изменить';
    edit.addEventListener('click', function () {
      showStep(index);
    });

    head.appendChild(title);
    head.appendChild(edit);

    var list = document.createElement('dl');
    list.className = 'card__list';

    answers.forEach(function (answer) {
      var label = document.createElement('dt');
      label.className = 'card__label';
      label.textContent = answer.label;
      label.hidden = answer.label === '';

      var value = document.createElement('dd');
      value.className = 'card__value';
      value.textContent = answer.value;

      list.appendChild(label);
      list.appendChild(value);
    });

    card.appendChild(head);
    card.appendChild(list);

    return card;
  }

  /* Submit
     ------------------------------------------------------------------------ */

  function buildPayload(files) {
    var values = collectValues();

    return {
      submissionId: submissionId,
      submittedAt: new Date().toISOString(),
      values: values,
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
    showScreen(screens.sending);

    Promise.all(selectedFiles.map(readFileAsBase64))
      .then(function (files) {
        return sendPayload(buildPayload(files));
      })
      .then(function () {
        isSubmitted = true;
        window.clearTimeout(saveTimer);
        clearDraft();
        showScreen(screens.success);
      })
      .catch(function () {
        showReview();
        showSubmitError(MESSAGES.network);
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

      if (event.target.classList.contains('is-invalid') && !getFieldError(event.target)) {
        clearFieldError(event.target);
      }

      scheduleSave();
    });

    form.addEventListener('change', scheduleSave);

    form.addEventListener('blur', function (event) {
      var control = event.target;

      if (!control.name || control.type === 'checkbox' || control.type === 'radio' || control.type === 'file') {
        return;
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

  bindEvents();
  runLoader();
})();
