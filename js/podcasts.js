(function () {
  "use strict";

  // Добавляйте новые выпуски в начало массива.
  // Прямая ссылка на выпуск: blog.html#vypusk-1
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

  var catalogEl = document.getElementById("podcast-catalog");
  var navEl = document.getElementById("podcast-nav");
  var playerEl = document.getElementById("podcast-player");
  var emptyEl = document.getElementById("podcast-empty");
  var activeId = null;

  if (!catalogEl || !navEl || !playerEl) return;

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

  function getEpisode(id) {
    for (var i = 0; i < PODCASTS.length; i++) {
      if (PODCASTS[i].id === id) return { ep: PODCASTS[i], index: i };
    }
    return null;
  }

  function episodeNumber(index) {
    return PODCASTS.length - index;
  }

  function episodeShareUrl(id) {
    var base = window.location.href.split("#")[0].split("?")[0];
    return base + "#" + id;
  }

  function getIdFromUrl() {
    var hash = (window.location.hash || "").replace(/^#/, "");
    if (hash && getEpisode(hash)) return hash;
    return PODCASTS.length ? PODCASTS[0].id : null;
  }

  function renderNav() {
    navEl.innerHTML =
      '<p class="podcast-catalog__nav-title">Все выпуски</p>' +
      '<div class="podcast-catalog__nav-list">' +
      PODCASTS.map(function (ep, index) {
        var num = episodeNumber(index);
        var isActive = ep.id === activeId;
        return (
          '<button type="button" class="podcast-nav__item' +
          (isActive ? " is-active" : "") +
          '" data-id="' +
          escapeHtml(ep.id) +
          '" aria-current="' +
          (isActive ? "true" : "false") +
          '">' +
          '<span class="podcast-nav__num">№' +
          num +
          "</span>" +
          '<span class="podcast-nav__body">' +
          '<span class="podcast-nav__title">' +
          escapeHtml(ep.title) +
          "</span>" +
          '<span class="podcast-nav__meta">' +
          formatDate(ep.date) +
          (ep.duration && ep.duration !== "—" ? " · " + escapeHtml(ep.duration) : "") +
          "</span>" +
          "</span>" +
          "</button>"
        );
      }).join("") +
      "</div>";
  }

  function renderPlayer(ep, index) {
    var hasAudio = ep.audio && ep.audio.trim();
    var num = episodeNumber(index);
    var shareUrl = episodeShareUrl(ep.id);

    var audioBlock = hasAudio
      ? '<audio class="podcast-player__audio" controls preload="metadata" src="' +
        escapeHtml(ep.audio) +
        '">Ваш браузер не поддерживает аудио.</audio>'
      : '<p class="podcast-player__audio-soon">Аудио скоро будет добавлено. Пока можно прочитать текст выпуска ниже.</p>';

    playerEl.innerHTML =
      '<div class="podcast-player__head">' +
      '<div class="podcast-player__labels">' +
      '<span class="podcast-player__num">Выпуск №' +
      num +
      "</span>" +
      '<time class="podcast-player__date" datetime="' +
      escapeHtml(ep.date) +
      '">' +
      formatDate(ep.date) +
      "</time>" +
      (ep.duration && ep.duration !== "—"
        ? '<span class="podcast-player__duration">' + escapeHtml(ep.duration) + "</span>"
        : "") +
      "</div>" +
      '<button type="button" class="btn btn--ghost podcast-player__share" id="podcast-share-btn" data-url="' +
      escapeHtml(shareUrl) +
      '">Скопировать ссылку</button>' +
      "</div>" +
      '<h3 class="podcast-player__title">' +
      escapeHtml(ep.title) +
      "</h3>" +
      '<p class="podcast-player__desc">' +
      escapeHtml(ep.description) +
      "</p>" +
      audioBlock +
      (ep.article ? '<div class="podcast-player__article">' + renderArticle(ep.article) + "</div>" : "") +
      '<p class="podcast-player__share-hint" id="podcast-share-status" role="status" aria-live="polite"></p>';

    document.title = ep.title + " — подкаст · Галина Оноприенко";

    var shareBtn = document.getElementById("podcast-share-btn");
    var shareStatus = document.getElementById("podcast-share-status");
    if (shareBtn) {
      shareBtn.addEventListener("click", function () {
        var url = shareBtn.getAttribute("data-url") || shareUrl;
        function showOk() {
          if (shareStatus) shareStatus.textContent = "Ссылка скопирована — можно отправлять в Telegram или соцсети.";
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(showOk).catch(function () {
            if (shareStatus) shareStatus.textContent = url;
          });
        } else {
          if (shareStatus) shareStatus.textContent = url;
        }
      });
    }

    if (hasAudio) {
      var audio = playerEl.querySelector(".podcast-player__audio");
      if (audio && window.location.hash.replace(/^#/, "") === ep.id) {
        audio.play().catch(function () {});
      }
    }
  }

  function selectEpisode(id, scrollToPlayer) {
    var found = getEpisode(id);
    if (!found) return;
    activeId = id;
    renderNav();
    renderPlayer(found.ep, found.index);
    if (history.replaceState) {
      history.replaceState(null, "", "#" + id);
    } else {
      window.location.hash = id;
    }
    if (scrollToPlayer && window.matchMedia("(max-width: 899px)").matches) {
      playerEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function initCatalog() {
    if (!PODCASTS.length) {
      catalogEl.setAttribute("hidden", "");
      if (emptyEl) emptyEl.removeAttribute("hidden");
      return;
    }
    catalogEl.removeAttribute("hidden");
    if (emptyEl) emptyEl.setAttribute("hidden", "");

    navEl.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest(".podcast-nav__item") : null;
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      if (id) selectEpisode(id, true);
    });

    window.addEventListener("hashchange", function () {
      var id = getIdFromUrl();
      if (id && id !== activeId) selectEpisode(id, true);
    });

    selectEpisode(getIdFromUrl(), false);
  }

  initCatalog();
})();
