(function () {
  "use strict";

  var prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var heroNumEl = document.getElementById("hero-years");
  if (heroNumEl) {
    if (prefersReduce) {
      heroNumEl.textContent = String(heroNumEl.getAttribute("data-target") || "15");
    }
  }

  // Полоса прогресса скролла
  var progressBar = document.getElementById("scroll-progress-bar");
  function updateScrollProgress() {
    if (!progressBar) return;
    var r = document.documentElement;
    var max = r.scrollHeight - r.clientHeight;
    var t = max > 0 ? r.scrollTop / max : 0;
    t = Math.min(1, Math.max(0, t));
    progressBar.style.transform = "scaleX(" + t + ")";
  }
  if (progressBar) {
    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress, { passive: true });
  }

  // Счётчик «15» в hero (один раз при появлении)
  if (heroNumEl && !prefersReduce) {
    var targetN = parseInt(heroNumEl.getAttribute("data-target"), 10) || 15;
    if (!isNaN(targetN)) {
      if ("IntersectionObserver" in window) {
        var countDone = false;
        var badge = document.getElementById("hero-badge");
        var ioCount = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting || countDone) return;
              countDone = true;
              ioCount.disconnect();
              var startT = null;
              var duration = 1100;
              function easeOutQuart(t) {
                return 1 - Math.pow(1 - t, 4);
              }
              function step(now) {
                if (startT === null) startT = now;
                var p = Math.min(1, (now - startT) / duration);
                var v = Math.round(easeOutQuart(p) * targetN);
                heroNumEl.textContent = String(v);
                if (p < 1) {
                  requestAnimationFrame(step);
                } else {
                  heroNumEl.textContent = String(targetN);
                }
              }
              requestAnimationFrame(step);
            });
          },
          { root: null, threshold: 0.35, rootMargin: "0px" }
        );
        ioCount.observe(badge || heroNumEl);
      } else {
        heroNumEl.textContent = String(targetN);
      }
    }
  }

  // Магнит к кнопкам/CTA: только тонкий указатель, без тача
  function initMagnetic() {
    if (prefersReduce) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    var nodes = document.querySelectorAll(
      "a.btn--magnetic, button.btn--magnetic, a.header__link--magnetic, a.mobile-nav__link--magnetic"
    );
    function onMove(e) {
      var el = e.currentTarget;
      var rect = el.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      var mx = Math.max(-5, Math.min(5, x * 9));
      var my = Math.max(-5, Math.min(5, y * 9));
      el.style.setProperty("--mx", mx + "px");
      el.style.setProperty("--my", my + "px");
    }
    function onLeave(e) {
      e.currentTarget.style.setProperty("--mx", "0px");
      e.currentTarget.style.setProperty("--my", "0px");
    }
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].addEventListener("pointermove", onMove);
      nodes[i].addEventListener("pointerleave", onLeave);
    }
  }
  initMagnetic();

  // Фиксированный хедер: тень при скролле
  var header = document.querySelector(".header");
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 24) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Мобильное меню
  var menuBtn = document.querySelector(".header__menu-btn");
  var mobileNav = document.getElementById("mobile-nav");
  var mobileLinks = mobileNav ? mobileNav.querySelectorAll("a[href^='#']") : [];

  function setMenuOpen(isOpen) {
    if (!menuBtn || !mobileNav) return;
    menuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (isOpen) {
      mobileNav.removeAttribute("hidden");
    } else {
      mobileNav.setAttribute("hidden", "");
    }
  }

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      var isOpen = menuBtn.getAttribute("aria-expanded") === "true";
      setMenuOpen(!isOpen);
    });
    mobileLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        setMenuOpen(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenuOpen(false);
    });
    window.addEventListener(
      "resize",
      function () {
        if (window.matchMedia("(min-width: 900px)").matches) setMenuOpen(false);
      },
      { passive: true }
    );
  }

  // Плавное появление блоков
  var revealEls = document.querySelectorAll(".reveal");

  if (!prefersReduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var baseDelay = 0;
          var heroText = el.closest ? el.closest(".hero__text") : null;
          if (heroText) {
            var sibs = heroText.querySelectorAll(".reveal");
            var hi = Array.prototype.indexOf.call(sibs, el);
            var heroDel = [0.05, 0.12, 0.2, 0.28];
            if (hi >= 0) baseDelay = heroDel[hi] != null ? heroDel[hi] : hi * 0.08;
          } else if (el.classList.contains("card") || el.classList.contains("project") || el.classList.contains("process__step") || el.classList.contains("features__item") || el.classList.contains("audience__chip")) {
            var parent = el.parentElement;
            if (parent) {
              var siblings = parent.querySelectorAll(
                ".card, .project, .process__step, .features__item, .audience__chip"
              );
              var j = Array.prototype.indexOf.call(siblings, el);
              if (j >= 0) baseDelay = j * 0.06;
            }
          }
          el.style.transitionDelay = baseDelay + "s";
          el.classList.add("is-visible");
          io.unobserve(el);
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // Кликабельные карточки проектов
  var clickableProjects = document.querySelectorAll(".project--clickable[data-url]");
  clickableProjects.forEach(function (card) {
    var url = card.getAttribute("data-url");
    if (!url) return;
    card.addEventListener("click", function (e) {
      if (e.target && e.target.closest("a")) return;
      window.open(url, "_blank", "noopener,noreferrer");
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.open(url, "_blank", "noopener,noreferrer");
      }
    });
  });

  // Пошаговый квиз (3 шага) с итогом и переходом в Telegram
  var quizBox = document.getElementById("quiz-box");
  var quizStepLabel = document.getElementById("quiz-step-label");
  var quizQuestion = document.getElementById("quiz-question");
  var quizOptions = document.getElementById("quiz-options");
  var quizBack = document.getElementById("quiz-back");
  var quizNext = document.getElementById("quiz-next");
  var quizResult = document.getElementById("quiz-result");
  var quizResultTitle = document.getElementById("quiz-result-title");
  var quizResultText = document.getElementById("quiz-result-text");
  var quizResultLink = document.getElementById("quiz-result-link");
  var quizAnswers = { need: "", niche: "", goal: "" };
  var quizStep = 0;
  var quizSteps = [
    {
      key: "need",
      label: "Шаг 1 из 3",
      q: "Что вам нужно в первую очередь?",
      options: [
        { value: "site", label: "Сайт под ключ" },
        { value: "assistant", label: "AI-ассистент" },
        { value: "bot", label: "Чат-бот в Telegram" },
        { value: "quiz", label: "Интерактив / квиз" }
      ]
    },
    {
      key: "niche",
      label: "Шаг 2 из 3",
      q: "Какая у вас ниша?",
      options: [
        { value: "soft", label: "Мягкая ниша (помогающие практики)" },
        { value: "business", label: "Бизнес / услуги" },
        { value: "school", label: "Онлайн-школа" },
        { value: "other", label: "Другая ниша" }
      ]
    },
    {
      key: "goal",
      label: "Шаг 3 из 3",
      q: "Какая цель сейчас приоритетна?",
      options: [
        { value: "leads", label: "Больше заявок" },
        { value: "sales", label: "Рост продаж" },
        { value: "automation", label: "Автоматизация процессов" },
        { value: "packaging", label: "Упаковка и системность" }
      ]
    }
  ];
  function renderQuizStep() {
    if (!quizBox || !quizStepLabel || !quizQuestion || !quizOptions || !quizBack || !quizNext) return;
    var stepMeta = quizSteps[quizStep];
    if (!stepMeta) return;
    quizBox.setAttribute("data-step", String(quizStep + 1));
    quizStepLabel.textContent = stepMeta.label;
    quizQuestion.textContent = stepMeta.q;
    quizOptions.innerHTML = "";
    stepMeta.options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz__option btn--magnetic";
      btn.setAttribute("data-value", opt.value);
      btn.textContent = opt.label;
      if (quizAnswers[stepMeta.key] === opt.value) btn.classList.add("is-selected");
      btn.addEventListener("click", function () {
        quizAnswers[stepMeta.key] = opt.value;
        renderQuizStep();
      });
      quizOptions.appendChild(btn);
    });
    quizBack.disabled = quizStep === 0;
    quizNext.disabled = !quizAnswers[stepMeta.key];
    quizNext.textContent = quizStep === quizSteps.length - 1 ? "Показать результат" : "Далее";
  }
  function finalizeQuiz() {
    if (!quizResult || !quizResultTitle || !quizResultText || !quizResultLink) return;
    var needLabel = (quizSteps[0].options.find(function (o) { return o.value === quizAnswers.need; }) || {}).label || "формат";
    var nicheLabel = (quizSteps[1].options.find(function (o) { return o.value === quizAnswers.niche; }) || {}).label || "ниша";
    var goalLabel = (quizSteps[2].options.find(function (o) { return o.value === quizAnswers.goal; }) || {}).label || "цель";
    quizResultTitle.textContent = "Рекомендую начать с: " + needLabel;
    quizResultText.textContent =
      "Под ваш запрос (" + nicheLabel + ", цель: " + goalLabel + ") подготовлю рабочую связку: стратегия + реализация + запуск.";
    var tgText = encodeURIComponent(
      "Здравствуйте! Я прошел(ла) квиз на сайте.\n" +
      "Что нужно: " + needLabel + "\n" +
      "Ниша: " + nicheLabel + "\n" +
      "Цель: " + goalLabel + "\n" +
      "Хочу обсудить проект."
    );
    quizResultLink.href = "https://t.me/galina1901?text=" + tgText;
    quizResult.hidden = false;
  }
  if (quizBox && quizBack && quizNext) {
    renderQuizStep();
    quizBack.addEventListener("click", function () {
      if (quizStep > 0) {
        quizStep -= 1;
        renderQuizStep();
      }
    });
    quizNext.addEventListener("click", function () {
      if (quizStep < quizSteps.length - 1) {
        quizStep += 1;
        renderQuizStep();
      } else {
        finalizeQuiz();
      }
    });
  }

  // Форма заявки: Telegram Bot API
  var form = document.getElementById("lead-form");
  var formStatus = document.getElementById("form-status");
  // TODO: вставьте значения вашего бота
  var BOT_TOKEN = "8605850996:AAFy0j4FMt6wrcAIFQsRcQ6sV5X_BAC_ATA";
  var CHAT_ID = "526988738";
  var TELEGRAM_HANDLE = "galina1901";

  function normalizeInputValue(v) {
    return (v || "")
      .replace(/\u00A0/g, " ")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim();
  }

  function setInvalid(input) {
    input.classList.add("is-invalid");
  }
  function clearInvalid(input) {
    input.classList.remove("is-invalid");
  }

  if (form && formStatus) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameInput = document.getElementById("name");
      var contactInput = document.getElementById("contact");
      var questionInput = document.getElementById("question");
      if (!nameInput || !contactInput) return;

      var fd = new FormData(form);
      var name = normalizeInputValue(fd.get("name")) || normalizeInputValue(nameInput.value) || normalizeInputValue(nameInput.getAttribute("value"));
      var contact = normalizeInputValue(fd.get("contact")) || normalizeInputValue(contactInput.value) || normalizeInputValue(contactInput.getAttribute("value"));
      var question = normalizeInputValue(fd.get("question")) || (questionInput ? normalizeInputValue(questionInput.value) : "");
      var ok = true;
      if (!name) {
        setInvalid(nameInput);
        ok = false;
      } else clearInvalid(nameInput);
      if (!contact) {
        setInvalid(contactInput);
        ok = false;
      } else clearInvalid(contactInput);
      if (!ok) {
        formStatus.textContent = "Заполните имя и контакт, чтобы я могла ответить.";
        formStatus.className = "form__status is-err";
        return;
      }

      var tgLink = "https://t.me/" + TELEGRAM_HANDLE + "?text=" + encodeURIComponent("Здравствуйте! Оставляю заявку с сайта.");

      if (!BOT_TOKEN || !CHAT_ID) {
        formStatus.className = "form__status is-err";
        formStatus.innerHTML =
          "Telegram-бот еще не настроен. Вставьте BOT_TOKEN и CHAT_ID в <code>js/main.js</code>. " +
          "Пока можно написать сюда: <a class=\"project__link\" href=\"" +
          tgLink +
          "\" target=\"_blank\" rel=\"noopener noreferrer\">@galina1901</a>";
        return;
      }

      var message =
        "🟢 Новая заявка с сайта\n" +
        "Имя: " +
        name +
        "\n" +
        "Контакт: " +
        contact +
        "\n" +
        "Вопрос/уточнение: " +
        (question || "—") +
        "\n" +
        "Время: " +
        new Date().toLocaleString("ru-RU");

      formStatus.className = "form__status";
      formStatus.textContent = "Отправляю заявку в Telegram...";

      fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message
        })
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data && data.ok) {
            formStatus.className = "form__status is-ok";
            formStatus.textContent = "Заявка успешно отправлена в Telegram.";
            form.reset();
          } else {
            throw new Error("telegram_api_error");
          }
        })
        .catch(function () {
          formStatus.className = "form__status is-err";
          formStatus.innerHTML =
            "Не удалось отправить заявку автоматически. Напишите в Telegram: <a class=\"project__link\" href=\"" +
            tgLink +
            "\" target=\"_blank\" rel=\"noopener noreferrer\">@galina1901</a>";
        });
    });

    [document.getElementById("name"), document.getElementById("contact")].forEach(function (inp) {
      if (inp) {
        inp.addEventListener("input", function () {
          clearInvalid(inp);
          formStatus.className = "form__status";
          formStatus.textContent = "";
        });
      }
    });
  }

  // Уведомление о cookie при первом визите
  var COOKIE_KEY = "cookieConsent";
  var cookieBanner = document.getElementById("cookie-banner");
  var cookieAccept = document.getElementById("cookie-accept");

  if (cookieBanner && cookieAccept) {
    function hideCookieBanner() {
      cookieBanner.classList.remove("is-visible");
      cookieBanner.setAttribute("hidden", "");
    }

    function showCookieBanner() {
      cookieBanner.removeAttribute("hidden");
      requestAnimationFrame(function () {
        cookieBanner.classList.add("is-visible");
      });
    }

    if (!localStorage.getItem(COOKIE_KEY)) {
      showCookieBanner();
    }

    cookieAccept.addEventListener("click", function () {
      localStorage.setItem(COOKIE_KEY, "accepted");
      hideCookieBanner();
    });
  }
})();
