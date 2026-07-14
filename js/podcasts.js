(function () {
  "use strict";

  // Добавляйте новые выпуски в начало массива.
  // audio — путь к файлу в папке audio/ (например "audio/vypusk-1.mp3")
  var PODCASTS = [
    {
      id: "vypusk-1",
      title: "Зачем эксперту свой сайт, а не только соцсети",
      date: "2026-07-14",
      duration: "—",
      audio: "",
      description:
        "Коротко о том, почему соцсети полезны, но не заменяют собственную площадку: заявки, оплата и доверие работают стабильнее на сайте.",
      article:
        "Соцсети дают охват, но правила и алгоритмы меняются. Свой сайт — это точка, которой вы владеете: структура, воронка, заявки и оплата под вашим контролем.\n\n" +
        "В этом выпуске разбираю, с чего начать, если вы эксперт или ведёте онлайн-школу, и как сайт становится базой для автоматизации продаж 24/7."
    },
    {
      id: "vypusk-2",
      title: "Интерактив или лендинг: что выбрать для прогрева аудитории",
      date: "2026-07-14",
      duration: "—",
      audio: "",
      description:
        "Когда достаточно лендинга, а когда лучше квиз, диагностика или карта — и как это ведёт к заявке без лишних шагов.",
      article:
        "Лендинг хорошо объясняет услугу. Интерактив даёт личный опыт: человек отвечает на вопросы и получает результат — и быстрее понимает, зачем ему ваш продукт.\n\n" +
        "Рассказываю, как выбрать формат под нишу и как связать интерактив с Telegram, WhatsApp или оплатой."
    }
  ];

  var listEl = document.getElementById("podcast-list");
  var emptyEl = document.getElementById("podcast-empty");
  if (!listEl) return;

  function formatDate(iso) {
    if (!iso) return "";
    var parts = iso.split("-");
    if (parts.length !== 3) return iso;
    var months = [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря"
    ];
    var d = parseInt(parts[2], 10);
    var m = parseInt(parts[1], 10) - 1;
    return d + " " + (months[m] || parts[1]) + " " + parts[0];
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderArticle(text) {
    return escapeHtml(text)
      .split(/\n\n+/)
      .map(function (p) {
        return "<p>" + p.replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  function renderPodcasts() {
    if (!PODCASTS.length) {
      listEl.innerHTML = "";
      if (emptyEl) emptyEl.removeAttribute("hidden");
      return;
    }
    if (emptyEl) emptyEl.setAttribute("hidden", "");

    listEl.innerHTML = PODCASTS.map(function (ep, index) {
      var hasAudio = ep.audio && ep.audio.trim();
      var audioBlock = hasAudio
        ? '<audio class="podcast-card__audio" controls preload="metadata" src="' + escapeHtml(ep.audio) + '">' +
          "Ваш браузер не поддерживает аудио." +
          "</audio>"
        : '<p class="podcast-card__audio-soon">Аудио скоро будет добавлено. Пока можно прочитать текст выпуска ниже.</p>';

      return (
        '<article class="podcast-card reveal" id="' + escapeHtml(ep.id) + '">' +
        '<div class="podcast-card__head">' +
        '<span class="podcast-card__num">Выпуск ' + (PODCASTS.length - index) + "</span>" +
        '<time class="podcast-card__date" datetime="' + escapeHtml(ep.date) + '">' + formatDate(ep.date) + "</time>" +
        (ep.duration && ep.duration !== "—" ? '<span class="podcast-card__duration">' + escapeHtml(ep.duration) + "</span>" : "") +
        "</div>" +
        '<h3 class="podcast-card__title">' + escapeHtml(ep.title) + "</h3>" +
        '<p class="podcast-card__desc">' + escapeHtml(ep.description) + "</p>" +
        audioBlock +
        (ep.article
          ? '<div class="podcast-card__article">' + renderArticle(ep.article) + "</div>"
          : "") +
        "</article>"
      );
    }).join("");

    if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var cards = listEl.querySelectorAll(".podcast-card.reveal");
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          });
        },
        { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      cards.forEach(function (el, i) {
        el.style.transitionDelay = i * 0.06 + "s";
        io.observe(el);
      });
    } else {
      listEl.querySelectorAll(".podcast-card.reveal").forEach(function (el) {
        el.classList.add("is-visible");
      });
    }
  }

  renderPodcasts();
})();
