(function () {
  "use strict";

  var cfg = window.SITE_SUPABASE_CONFIG || {};
  var statusEl = document.getElementById("admin-status");
  var authBox = document.getElementById("admin-auth");
  var panelBox = document.getElementById("admin-panel");
  var emailEl = document.getElementById("admin-email");
  var passwordEl = document.getElementById("admin-password");
  var loginBtn = document.getElementById("admin-login");
  var refreshBtn = document.getElementById("refresh-stats");
  var logoutBtn = document.getElementById("logout-stats");
  var cardsEl = document.getElementById("stats-cards");
  var tableEl = document.getElementById("stats-table");

  function setStatus(text, isError) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = isError ? "form__status is-err" : "form__status";
  }

  function isConfigValid() {
    if (!cfg.url || !cfg.anonKey) return false;
    if (cfg.url.indexOf("YOUR") !== -1 || cfg.anonKey.indexOf("YOUR") !== -1) return false;
    if (cfg.url.indexOf("supabase.co") === -1) return false;
    return true;
  }

  if (!isConfigValid()) {
    setStatus("Проверьте js/supabase-config.js: url и anonKey должны быть без шаблонных YOUR_...", true);
    return;
  }

  var client = window.supabase.createClient(cfg.url, cfg.anonKey);
  window.getAdminSupabaseClient = function () {
    return client;
  };

  function formatDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    return d.toLocaleString("ru-RU");
  }

  function renderCards(rows) {
    var total = rows.length;
    var uniquePages = {};
    var refs = {};

    rows.forEach(function (row) {
      var p = row.page_path || "/";
      uniquePages[p] = true;
      var ref = row.referrer || "direct";
      refs[ref] = (refs[ref] || 0) + 1;
    });

    var topRef = "direct";
    var topRefCount = 0;
    Object.keys(refs).forEach(function (key) {
      if (refs[key] > topRefCount) {
        topRefCount = refs[key];
        topRef = key;
      }
    });

    cardsEl.innerHTML =
      '<article class="card"><h3 class="card__title">Визитов (последние 7 дней)</h3><p class="card__text">' + total + "</p></article>" +
      '<article class="card"><h3 class="card__title">Страниц</h3><p class="card__text">' + Object.keys(uniquePages).length + "</p></article>" +
      '<article class="card"><h3 class="card__title">Топ источник</h3><p class="card__text">' + topRef + "</p></article>";
  }

  function renderTable(rows) {
    var head =
      "<thead><tr>" +
      '<th style="text-align:left;padding:8px;border-bottom:1px solid rgba(121,255,217,.3)">Когда</th>' +
      '<th style="text-align:left;padding:8px;border-bottom:1px solid rgba(121,255,217,.3)">Страница</th>' +
      '<th style="text-align:left;padding:8px;border-bottom:1px solid rgba(121,255,217,.3)">Источник</th>' +
      '<th style="text-align:left;padding:8px;border-bottom:1px solid rgba(121,255,217,.3)">Язык</th>' +
      "</tr></thead>";

    var body = "<tbody>";
    rows.slice(0, 30).forEach(function (row) {
      body +=
        "<tr>" +
        '<td style="padding:8px;border-bottom:1px solid rgba(121,255,217,.12)">' + formatDate(row.visited_at) + "</td>" +
        '<td style="padding:8px;border-bottom:1px solid rgba(121,255,217,.12)">' + (row.page_path || "/") + "</td>" +
        '<td style="padding:8px;border-bottom:1px solid rgba(121,255,217,.12)">' + (row.referrer || "direct") + "</td>" +
        '<td style="padding:8px;border-bottom:1px solid rgba(121,255,217,.12)">' + (row.language || "—") + "</td>" +
        "</tr>";
    });
    body += "</tbody>";
    tableEl.innerHTML = head + body;
  }

  function loadStats() {
    setStatus("Загружаю статистику...", false);
    client
      .from("visits")
      .select("visited_at,page_path,referrer,language", { count: "exact" })
      .gte("visited_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("visited_at", { ascending: false })
      .limit(300)
      .then(function (res) {
        if (res.error) {
          setStatus("Не удалось загрузить статистику: " + res.error.message, true);
          return;
        }
        var rows = res.data || [];
        renderCards(rows);
        renderTable(rows);
        setStatus("Статистика обновлена.", false);
      });
  }

  function showPanel() {
    authBox.setAttribute("hidden", "");
    panelBox.removeAttribute("hidden");
    loadStats();
    if (window.AdminPodcasts && window.AdminPodcasts.loadList) {
      window.AdminPodcasts.loadList();
    }
    if (window.AdminArticles && window.AdminArticles.loadList) {
      window.AdminArticles.loadList();
    }
  }

  var tabButtons = document.querySelectorAll(".admin-tab");
  var statsPanel = document.getElementById("admin-stats-panel");
  var podcastsPanel = document.getElementById("admin-podcasts-panel");
  var articlesPanel = document.getElementById("admin-articles-panel");

  function switchTab(name) {
    tabButtons.forEach(function (btn) {
      var active = btn.getAttribute("data-tab") === name;
      btn.classList.toggle("is-active", active);
      btn.classList.toggle("btn--primary", active);
      btn.classList.toggle("btn--ghost", !active);
    });
    if (statsPanel) statsPanel.hidden = name !== "stats";
    if (podcastsPanel) podcastsPanel.hidden = name !== "podcasts";
    if (articlesPanel) articlesPanel.hidden = name !== "articles";
    if (name === "podcasts" && window.AdminPodcasts && window.AdminPodcasts.loadList) {
      window.AdminPodcasts.loadList();
    }
    if (name === "articles" && window.AdminArticles && window.AdminArticles.loadList) {
      window.AdminArticles.loadList();
    }
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchTab(btn.getAttribute("data-tab"));
    });
  });

  client.auth.getSession().then(function (res) {
    if (res.data && res.data.session) {
      showPanel();
    }
  });

  loginBtn.addEventListener("click", function () {
    var email = (emailEl.value || "").trim();
    var password = passwordEl.value || "";
    if (!email || !password) {
      setStatus("Введите email и пароль.", true);
      return;
    }
    setStatus("Выполняю вход...", false);
    client.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
      if (res.error) {
        var msg = res.error.message;
        if (msg.indexOf("Invalid login credentials") !== -1) {
          msg = "Неверный email или пароль. Проверьте данные пользователя в Supabase → Authentication → Users.";
        } else if (msg.indexOf("Email not confirmed") !== -1) {
          msg = "Email не подтверждён. В Supabase откройте пользователя и включите Auto Confirm User.";
        }
        setStatus("Ошибка входа: " + msg, true);
        return;
      }
      setStatus("", false);
      showPanel();
    });
  });

  if (passwordEl) {
    passwordEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") loginBtn.click();
    });
  }

  refreshBtn.addEventListener("click", loadStats);
  logoutBtn.addEventListener("click", function () {
    client.auth.signOut().then(function () {
      panelBox.setAttribute("hidden", "");
      authBox.removeAttribute("hidden");
      setStatus("Вы вышли из админки.", false);
    });
  });
})();
