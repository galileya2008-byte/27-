(function () {
  "use strict";

  var ARTICLES = [];
  var ARTICLE_HASH_PREFIX = "article-";

  var gridEl = document.getElementById("articles-grid");
  var readerEl = document.getElementById("article-reader");
  var emptyEl = document.getElementById("articles-empty");
  var activeSlug = null;

  if (!gridEl || !readerEl) return;

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

  function renderContent(text) {
    return escapeHtml(text)
      .split(/\n\n+/)
      .map(function (p) {
        return "<p>" + p.replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  function getArticle(slug) {
    for (var i = 0; i < ARTICLES.length; i++) {
      if (ARTICLES[i].slug === slug) return ARTICLES[i];
    }
    return null;
  }

  function articleShareUrl(slug) {
    var base = window.location.href.split("#")[0].split("?")[0];
    return base + "#" + ARTICLE_HASH_PREFIX + slug;
  }

  function getSlugFromUrl() {
    var hash = (window.location.hash || "").replace(/^#/, "");
    if (hash.indexOf(ARTICLE_HASH_PREFIX) === 0) {
      var slug = hash.slice(ARTICLE_HASH_PREFIX.length);
      if (slug && getArticle(slug)) return slug;
    }
    return null;
  }

  function renderGrid() {
    gridEl.innerHTML = ARTICLES.map(function (article) {
      var isActive = article.slug === activeSlug;
      var hasImage = article.image_url && article.image_url.trim();
      return (
        '<button type="button" class="article-card' +
        (isActive ? " is-active" : "") +
        '" data-slug="' +
        escapeHtml(article.slug) +
        '" aria-current="' +
        (isActive ? "true" : "false") +
        '">' +
        (hasImage
          ? '<img class="article-card__image" src="' +
            escapeHtml(article.image_url) +
            '" alt="" loading="lazy" />'
          : '<div class="article-card__image article-card__image--placeholder" aria-hidden="true"></div>') +
        '<span class="article-card__body">' +
        '<time class="article-card__date" datetime="' +
        escapeHtml(article.date) +
        '">' +
        formatDate(article.date) +
        "</time>" +
        '<span class="article-card__title">' +
        escapeHtml(article.title) +
        "</span>" +
        '<span class="article-card__desc">' +
        escapeHtml(article.description) +
        "</span>" +
        "</span>" +
        "</button>"
      );
    }).join("");
  }

  function renderReader(article) {
    var shareUrl = articleShareUrl(article.slug);
    var hasImage = article.image_url && article.image_url.trim();

    readerEl.innerHTML =
      '<article class="article-reader__inner">' +
      '<div class="article-reader__head">' +
      '<time class="article-reader__date" datetime="' +
      escapeHtml(article.date) +
      '">' +
      formatDate(article.date) +
      "</time>" +
      '<button type="button" class="btn btn--ghost article-reader__share" id="article-share-btn" data-url="' +
      escapeHtml(shareUrl) +
      '">Скопировать ссылку</button>' +
      "</div>" +
      '<h3 class="article-reader__title">' +
      escapeHtml(article.title) +
      "</h3>" +
      '<p class="article-reader__desc">' +
      escapeHtml(article.description) +
      "</p>" +
      (hasImage
        ? '<img class="article-reader__image" src="' +
          escapeHtml(article.image_url) +
          '" alt="' +
          escapeHtml(article.title) +
          '" loading="lazy" />'
        : "") +
      '<div class="article-reader__content">' +
      renderContent(article.content) +
      "</div>" +
      '<p class="article-reader__share-hint" id="article-share-status" role="status" aria-live="polite"></p>' +
      "</article>";

    readerEl.removeAttribute("hidden");
    document.title = article.title + " — база знаний · Галина Оноприенко";

    var shareBtn = document.getElementById("article-share-btn");
    var shareStatus = document.getElementById("article-share-status");
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
  }

  function selectArticle(slug, scrollToReader) {
    var article = getArticle(slug);
    if (!article) return;
    activeSlug = slug;
    renderGrid();
    renderReader(article);
    if (history.replaceState) {
      history.replaceState(null, "", "#" + ARTICLE_HASH_PREFIX + slug);
    } else {
      window.location.hash = ARTICLE_HASH_PREFIX + slug;
    }
    if (scrollToReader) {
      readerEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function hideReader() {
    activeSlug = null;
    readerEl.setAttribute("hidden", "");
    readerEl.innerHTML = "";
    renderGrid();
  }

  function fetchArticlesFromSupabase() {
    var cfg = window.SITE_SUPABASE_CONFIG || {};
    if (!cfg.url || !cfg.anonKey || cfg.url.indexOf("YOUR") !== -1 || cfg.anonKey.indexOf("YOUR") !== -1) {
      return Promise.resolve([]);
    }
    return fetch(
      cfg.url +
        "/rest/v1/articles?select=slug,title,description,content,image_url,published_at&order=published_at.desc",
      {
        headers: {
          apikey: cfg.anonKey,
          Authorization: "Bearer " + cfg.anonKey
        }
      }
    )
      .then(function (res) {
        return res.json();
      })
      .then(function (rows) {
        if (!Array.isArray(rows)) return [];
        return rows.map(function (row) {
          return {
            slug: row.slug,
            title: row.title,
            description: row.description,
            content: row.content,
            image_url: row.image_url,
            date: row.published_at
          };
        });
      })
      .catch(function () {
        return [];
      });
  }

  function initArticles() {
    if (!ARTICLES.length) {
      gridEl.setAttribute("hidden", "");
      if (emptyEl) emptyEl.removeAttribute("hidden");
      return;
    }

    gridEl.removeAttribute("hidden");
    if (emptyEl) emptyEl.setAttribute("hidden", "");

    gridEl.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest(".article-card") : null;
      if (!btn) return;
      var slug = btn.getAttribute("data-slug");
      if (slug) selectArticle(slug, true);
    });

    window.addEventListener("hashchange", function () {
      var slug = getSlugFromUrl();
      if (slug && slug !== activeSlug) {
        selectArticle(slug, true);
      } else if (!slug && activeSlug) {
        hideReader();
      }
    });

    var initialSlug = getSlugFromUrl();
    renderGrid();
    if (initialSlug) {
      selectArticle(initialSlug, false);
    }
  }

  fetchArticlesFromSupabase().then(function (remote) {
    ARTICLES = remote || [];
    initArticles();
  });
})();
