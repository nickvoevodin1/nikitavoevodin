/* ==========================================================================
   Никита Воеводин — сайты для бизнеса за 72 часа
   CONFIG → CASES → утилиты → инициализация блоков → запуск
   ========================================================================== */

(function () {
  'use strict';

  var CONFIG = {
    // Эндпоинт приёма заявок. Заполнить перед публикацией.
    FORM_ENDPOINT: '',
    TELEGRAM: 'https://t.me/nickvoevoda',
    EMAIL: 'nickvoevodinwork@gmail.com',
    PHONE: '+79143395343'
  };

  var CASES = [
    {
      id: 'scout',
      title: 'Скаут',
      type: 'Сервис',
      card: 'Аналитика стартапов и лучших компаний — сайт продукта для сбора заявок',
      image: 'assets/cases/scout.png',
      meta: ['Сервис', 'Дизайн и разработка', 'Около 3 дней'],
      task: 'Сервис разбирает, как устроены сильные компании и стартапы в России и мире. Продукт неочевидный: его нельзя объяснить одной строкой, а без объяснения непонятно, за что платить. Нужен был сайт, который последовательно раскрывает продукт, показывает этапы работы и доносит ценность — чтобы дальше использовать его как основную точку сбора заявок.',
      solution: 'Выстроил страницу как объяснение по шагам: что делает сервис, как проходит работа, что клиент получает на выходе. Тяжёлые смыслы разбиты на блоки, каждый решает одну задачу. Собрано с нуля за трое суток.',
      result: 'Продукт получил законченную страницу, на которую можно вести трафик и ссылаться в переписке. Сайт работает как основная точка входа в сервис.',
      links: [{ label: 'Открыть сайт', url: 'https://scoutbusiness.vercel.app/' }]
    },
    {
      id: 'scout-articles',
      title: 'Система статей «Скаута»',
      type: 'Система',
      card: 'Каталог разборов компаний, который наполняется почти без участия человека',
      image: 'assets/cases/scout-articles.png',
      meta: ['Система', 'Проектирование и разработка'],
      task: 'Сервису нужен был поток аналитических материалов — разборов компаний и стартапов. Писать и вёрстывать каждый вручную нереально: это съедает всё время, которое должно уходить на сам продукт. Требовалась система, где статья появляется автоматически, а человек только проверяет результат.',
      solution: 'Спроектировал единый шаблон разбора и каталог материалов: одинаковая структура для любой компании, автоматическая сборка страницы, минимальное участие человека на выходе. Оформление подчинено чтению — длинный текст должен читаться без усилий.',
      result: 'Материалы выпускаются потоком, а не поштучно. Каждый разбор выглядит одинаково аккуратно независимо от того, о какой компании он написан.',
      links: [
        { label: 'Открыть каталог', url: 'https://scoutarticles.vercel.app/' },
        { label: 'Пример статьи', url: 'https://scoutarticles.vercel.app/articles/duolingo' }
      ]
    },
    {
      id: 'kaba',
      title: 'КАБА',
      type: 'Собственный проект',
      card: 'Внешний дизайн-отдел по подписке — сайт собственного продукта',
      image: 'assets/cases/kaba.png',
      meta: ['Собственный проект', 'Дизайн и разработка'],
      task: 'Собственный продукт: дизайн-отдел на аутсорсе для небольших компаний, у которых нет своего дизайнера, но задачи появляются постоянно. Модель подписки объяснить сложнее, чем разовую услугу, — нужно показать, что человек покупает не макет, а постоянную мощность.',
      solution: 'Построил страницу вокруг логики подписки: что входит, как ставятся задачи, чем это отличается от найма дизайнера и от разовых заказов. Сдержанное оформление, вся нагрузка — на структуру и объяснение.',
      result: 'У продукта появилась страница, на которую можно вести клиентов и по которой понятна модель работы без дополнительных созвонов.',
      links: [{ label: 'Открыть сайт', url: 'https://designdepartment.vercel.app/' }]
    },
    {
      id: 'arkanar',
      title: 'Арканар',
      type: 'Лендинг',
      card: 'Лендинг эксперта по подготовке стартапов к встрече с инвесторами',
      image: 'assets/cases/arkanar.png',
      meta: ['Лендинг', 'Дизайн и разработка'],
      task: 'Эксперт помогает основателям подготовиться к разговору с инвесторами. Целевое действие — записаться на созвон, но для этого посетитель должен сначала поверить в экспертизу. Задача сайта: донести опыт и подход так, чтобы заявка выглядела логичным следующим шагом, а не риском.',
      solution: 'Страница построена как последовательное снятие сомнений: в чём именно состоит помощь, кому она подходит, как проходит работа. Экспертиза показана содержанием, а не эпитетами. Путь к записи на созвон короткий с любого места страницы.',
      result: 'Эксперт получил страницу, которая объясняет услугу и ведёт к записи на созвон, — её можно использовать как основную ссылку в коммуникации.',
      links: [{ label: 'Открыть сайт', url: 'https://arkanar.online/' }]
    },
    {
      id: 'kazakov',
      title: 'Продукт Антона Казакова',
      type: 'Лендинг',
      card: 'Быстрый лендинг под запуск продукта предпринимателя',
      image: 'assets/cases/kazakov.png',
      meta: ['Лендинг', 'Дизайн и разработка'],
      task: 'Предпринимателю нужно было упаковать продукт в страницу и быстро начать продавать — в первую очередь чтобы проверить саму гипотезу: есть ли спрос и работает ли предложение в таком виде. Долгая разработка здесь бессмысленна: пока сайт делается, проверять уже нечего.',
      solution: 'Собрал компактный лендинг с одним целевым действием: оффер, объяснение продукта, снятие возражений, заявка. Никаких лишних блоков — всё, что не помогает решению, убрано.',
      result: 'Продукт получил рабочую страницу для запуска и проверки спроса в короткий срок.',
      links: [{ label: 'Открыть сайт', url: 'https://antonkazakov.netlify.app/' }]
    },
    {
      id: 'bizbilet',
      title: 'Бизбилет',
      type: 'Лендинг',
      card: 'Книжный клуб предпринимателя — страница для набора участников',
      image: 'assets/cases/bizbilet.png',
      meta: ['Лендинг', 'Дизайн и разработка'],
      task: 'Книжный клуб для предпринимателей: формат понятен изнутри, но снаружи требует объяснения — что происходит на встречах, зачем это занятому человеку и почему стоит подписаться. Целевое действие — подписка на клуб.',
      solution: 'Показал ценность через формат участия: как устроены встречи, что человек получает, кто уже внутри. Атмосфера клуба передана оформлением, но структура остаётся продающей — подписка доступна с любой точки страницы.',
      result: 'У клуба появилась страница, которая объясняет формат и собирает подписки без личного объяснения каждому.',
      links: [{ label: 'Открыть сайт', url: 'https://bizbilet.netlify.app/' }]
    }
  ];

  /* ============ Утилиты ============ */

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Один общий наблюдатель на все появляющиеся элементы. */
  var revealObserver = null;

  function observeReveal(element) {
    if (prefersReducedMotion) {
      element.classList.add('is-visible');
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    }

    revealObserver.observe(element);
  }

  function initReveal() {
    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), observeReveal);
  }

  /* ============ Шапка ============ */

  function initHeader() {
    var header = document.getElementById('header');

    if (!header) {
      return;
    }

    var ticking = false;

    function update() {
      header.classList.toggle('is-stuck', window.scrollY > 40);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  /* ============ Шкала 72 часов ============ */

  function initScale() {
    var fill = document.getElementById('scaleFill');

    if (!fill) {
      return;
    }

    /* Класс назначается в следующем кадре, иначе переход не запустится. */
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        fill.classList.add('is-filled');
      });
    });
  }

  /* ============ Шаги процесса ============ */

  function initSteps() {
    var container = document.getElementById('steps');
    var progress = document.getElementById('stepsProgress');

    if (!container || !progress) {
      return;
    }

    var steps = Array.prototype.slice.call(container.querySelectorAll('[data-step]'));

    if (!steps.length) {
      return;
    }

    var reached = 0;

    function paint() {
      var last = steps[reached - 1];

      if (!last) {
        return;
      }

      var node = last.querySelector('.step__node');
      var top = container.getBoundingClientRect().top;
      var nodeTop = node.getBoundingClientRect().top;

      progress.style.height = Math.max(nodeTop - top + 5, 0) + 'px';
    }

    function activate(index) {
      /* Пройденное состояние не откатывается. */
      if (index + 1 <= reached) {
        return;
      }

      for (var i = reached; i <= index; i += 1) {
        steps[i].classList.add('is-active');
      }

      reached = index + 1;
      paint();
    }

    if (prefersReducedMotion) {
      activate(steps.length - 1);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          activate(steps.indexOf(entry.target));
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    steps.forEach(function (step) {
      observer.observe(step);
    });

    window.addEventListener('resize', paint);
  }

  /* ============ Работы ============ */

  function caseMarkup(item, index) {
    var eager = index < 2;

    return '<button class="case reveal" type="button" data-case="' + escapeHtml(item.id) + '" style="--i:' + (index % 2) + '">' +
      '<span class="case__preview">' +
        '<img class="case__image" src="' + escapeHtml(item.image) + '" alt="Превью проекта «' + escapeHtml(item.title) + '»"' +
        (eager ? '' : ' loading="lazy"') + '>' +
      '</span>' +
      '<span class="case__row">' +
        '<span class="case__title">' + escapeHtml(item.title) + '</span>' +
        '<span class="case__type">' + escapeHtml(item.type) + '</span>' +
      '</span>' +
      '<span class="case__desc">' + escapeHtml(item.card) + '</span>' +
    '</button>';
  }

  /* Пустое состояние вместо сломанной картинки. */
  function markPreviewEmpty(image, title) {
    var preview = image.parentNode;

    image.remove();
    preview.classList.add('case__preview--empty');
    preview.innerHTML = '<span class="case__empty-title">' + escapeHtml(title) + '</span>' +
      '<span class="case__empty-note">Скриншот скоро</span>';
  }

  function initWorks() {
    var grid = document.getElementById('worksGrid');

    if (!grid) {
      return;
    }

    grid.innerHTML = CASES.map(caseMarkup).join('');

    CASES.forEach(function (item) {
      var button = grid.querySelector('[data-case="' + item.id + '"]');
      var image = button && button.querySelector('.case__image');

      if (!image) {
        return;
      }

      image.addEventListener('error', function () {
        markPreviewEmpty(image, item.title);
      });

      if (image.complete && image.naturalWidth === 0) {
        markPreviewEmpty(image, item.title);
      }
    });

    Array.prototype.forEach.call(grid.querySelectorAll('.reveal'), observeReveal);

    grid.addEventListener('click', function (event) {
      var button = event.target.closest('[data-case]');

      if (button) {
        openModal(button.dataset.case, button);
      }
    });
  }

  /* ============ Модальное окно ============ */

  var modal = null;
  var lastFocused = null;

  function buildModal() {
    var node = document.createElement('div');

    node.className = 'modal';
    node.id = 'caseModal';
    node.hidden = true;
    node.innerHTML =
      '<div class="modal__overlay" data-close></div>' +
      '<div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="caseModalTitle">' +
        '<button class="modal__close" type="button" data-close aria-label="Закрыть">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false">' +
            '<path d="M6 6l12 12M18 6L6 18"/>' +
          '</svg>' +
        '</button>' +
        '<div class="modal__body" id="caseModalBody"></div>' +
      '</div>';

    document.body.appendChild(node);

    return node;
  }

  function modalMarkup(item) {
    var links = item.links.map(function (link) {
      return '<a class="link" href="' + escapeHtml(link.url) + '" target="_blank" rel="noopener">' +
        escapeHtml(link.label) + '</a>';
    }).join('');

    return '<h3 class="modal__title" id="caseModalTitle">' + escapeHtml(item.title) + '</h3>' +
      '<p class="modal__meta">' + item.meta.map(escapeHtml).join(' · ') + '</p>' +
      '<div class="modal__media">' +
        '<img class="modal__image" src="' + escapeHtml(item.image) + '" alt="Превью проекта «' + escapeHtml(item.title) + '»">' +
      '</div>' +
      '<p class="modal__subtitle">Задача</p>' +
      '<p class="modal__text">' + escapeHtml(item.task) + '</p>' +
      '<p class="modal__subtitle">Решение</p>' +
      '<p class="modal__text">' + escapeHtml(item.solution) + '</p>' +
      '<p class="modal__subtitle">Результат</p>' +
      '<p class="modal__text">' + escapeHtml(item.result) + '</p>' +
      '<p class="modal__links">' + links + '</p>';
  }

  function focusable() {
    return Array.prototype.slice.call(
      modal.querySelectorAll('button, a[href], input, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(function (element) {
      return element.offsetParent !== null;
    });
  }

  function trapFocus(event) {
    if (event.key !== 'Tab') {
      return;
    }

    var items = focusable();

    if (!items.length) {
      return;
    }

    var first = items[0];
    var last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onModalKeydown(event) {
    if (event.key === 'Escape') {
      closeModal();
      return;
    }

    trapFocus(event);
  }

  function openModal(id, source) {
    var item = CASES.filter(function (entry) {
      return entry.id === id;
    })[0];

    if (!item) {
      return;
    }

    if (!modal) {
      modal = buildModal();
      modal.addEventListener('click', function (event) {
        if (event.target.closest('[data-close]')) {
          closeModal();
        }
      });
    }

    lastFocused = source || null;

    var body = modal.querySelector('#caseModalBody');
    body.innerHTML = modalMarkup(item);

    var image = body.querySelector('.modal__image');
    image.addEventListener('error', function () {
      image.remove();
    });

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onModalKeydown);

    window.requestAnimationFrame(function () {
      modal.classList.add('is-open');
      modal.querySelector('.modal__close').focus();
    });
  }

  function closeModal() {
    if (!modal || modal.hidden) {
      return;
    }

    modal.classList.remove('is-open');
    document.removeEventListener('keydown', onModalKeydown);
    document.body.style.overflow = '';

    var hide = function () {
      modal.hidden = true;

      if (lastFocused) {
        lastFocused.focus();
        lastFocused = null;
      }
    };

    if (prefersReducedMotion) {
      hide();
    } else {
      window.setTimeout(hide, 180);
    }
  }

  /* ============ Форма ============ */

  var FORM_MESSAGES = {
    name: 'Напишите, как к вам обращаться',
    contact: 'Оставьте телеграм или телефон — иначе я не смогу ответить',
    network: 'Не удалось отправить заявку. Напишите, пожалуйста, напрямую в Telegram — отвечу так же быстро.'
  };

  function showFieldError(input, message) {
    var error = document.getElementById(input.id + '-error');

    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');

    if (error) {
      error.textContent = message;
      error.classList.add('is-shown');
    }
  }

  function clearFieldError(input) {
    var error = document.getElementById(input.id + '-error');

    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');

    if (error) {
      error.textContent = '';
      error.classList.remove('is-shown');
    }
  }

  function showSuccess(form) {
    var success = document.createElement('div');

    success.className = 'form__success';
    success.setAttribute('role', 'status');
    success.innerHTML =
      '<p class="form__success-title">Заявка отправлена</p>' +
      '<p class="form__success-text">Спасибо. Я получил вашу заявку и отвечу в течение дня. ' +
      'Если вопрос срочный — напишите напрямую в <a class="link" href="' + CONFIG.TELEGRAM +
      '" target="_blank" rel="noopener">Telegram</a>.</p>';

    form.replaceWith(success);
  }

  function initForm() {
    var form = document.getElementById('form');

    if (!form) {
      return;
    }

    var nameInput = form.querySelector('#name');
    var contactInput = form.querySelector('#contact-field');
    var taskInput = form.querySelector('#task');
    var trapInput = form.querySelector('#company');
    var submit = document.getElementById('formSubmit');
    var note = document.getElementById('formNote');

    form.addEventListener('input', function (event) {
      if (event.target.classList.contains('is-invalid')) {
        clearFieldError(event.target);
      }
    });

    function showNetworkError() {
      note.innerHTML = 'Не удалось отправить заявку. Напишите, пожалуйста, напрямую в ' +
        '<a class="link" href="' + CONFIG.TELEGRAM + '" target="_blank" rel="noopener">Telegram</a> — ' +
        'отвечу так же быстро.';
      note.classList.add('is-shown');
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var invalid = null;

      if (nameInput.value.trim().length < 2) {
        showFieldError(nameInput, FORM_MESSAGES.name);
        invalid = invalid || nameInput;
      } else {
        clearFieldError(nameInput);
      }

      if (contactInput.value.trim().length < 5) {
        showFieldError(contactInput, FORM_MESSAGES.contact);
        invalid = invalid || contactInput;
      } else {
        clearFieldError(contactInput);
      }

      if (invalid) {
        invalid.focus();
        return;
      }

      note.classList.remove('is-shown');
      submit.disabled = true;
      submit.textContent = 'Отправляю…';

      /* Ловушка для ботов: делаем вид, что всё отправлено. */
      if (trapInput && trapInput.value !== '') {
        window.setTimeout(function () {
          showSuccess(form);
        }, 700);
        return;
      }

      if (!CONFIG.FORM_ENDPOINT) {
        console.warn('CONFIG.FORM_ENDPOINT не заполнен — форма работает в демонстрационном режиме, заявка не отправлена.');
        window.setTimeout(function () {
          showSuccess(form);
        }, 700);
        return;
      }

      window.fetch(CONFIG.FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.value.trim(),
          contact: contactInput.value.trim(),
          task: taskInput.value.trim(),
          page: location.href
        })
      }).then(function (response) {
        if (!response.ok) {
          throw new Error('Ответ сервера: ' + response.status);
        }

        showSuccess(form);
      }).catch(function () {
        submit.disabled = false;
        submit.textContent = 'Отправить заявку';
        showNetworkError();
      });
    });
  }

  /* ============ Год в подвале ============ */

  function initYear() {
    var year = document.getElementById('year');

    if (year) {
      year.textContent = String(new Date().getFullYear());
    }
  }

  /* ============ Запуск ============ */

  function init() {
    initHeader();
    initScale();
    initReveal();
    initSteps();
    initWorks();
    initForm();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
