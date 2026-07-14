(function () {
  "use strict";

  var cfg = window.SITE_SUPABASE_CONFIG || {};
  var client = null;

  function getClient() {
    if (window.getAdminSupabaseClient) return window.getAdminSupabaseClient();
    if (client) return client;
    if (!cfg.url || !cfg.anonKey || cfg.url.indexOf("YOUR") !== -1 || cfg.anonKey.indexOf("YOUR") !== -1) return null;
    client = window.supabase.createClient(cfg.url, cfg.anonKey);
    return client;
  }

  function isMissingTableError(err) {
    if (!err) return false;
    var msg = String(err.message || err);
    return msg.indexOf("articles") !== -1 && (msg.indexOf("PGRST205") !== -1 || msg.indexOf("Could not find the table") !== -1);
  }

  function showSetupBanner() {
    var panel = document.getElementById("admin-articles-panel");
    if (!panel || panel.querySelector(".articles-setup-banner")) return;
    var banner = document.createElement("div");
    banner.className = "articles-setup-banner form__status is-err";
    banner.style.marginBottom = "1rem";
    banner.innerHTML =
      "<strong>Таблица статей ещё не создана в Supabase.</strong><br>" +
      "Откройте Supabase → SQL Editor → вставьте и выполните файл <code>supabase/setup-articles.sql</code> из репозитория. " +
      "После этого обновите страницу админки.";
    panel.insertBefore(banner, panel.firstChild);
  }

  function clearSetupBanner() {
    var banner = document.querySelector(".articles-setup-banner");
    if (banner) banner.remove();
  }

  function humanizeError(err) {
    if (isMissingTableError(err)) {
      showSetupBanner();
      return "Таблица articles не найдена. Выполните supabase/setup-articles.sql в Supabase → SQL Editor.";
    }
    if (err && err.message && err.message.indexOf("row-level security") !== -1) {
      return "Нет прав на запись. Выйдите и войдите в админку снова.";
    }
    return err && err.message ? err.message : String(err);
  }

  function setFormStatus(text, isError) {
    var el = document.getElementById("article-form-status");
    if (!el) return;
    el.textContent = text;
    el.className = isError ? "form__status is-err" : "form__status is-ok";
  }

  function blogShareUrl(slug) {
    var path = window.location.pathname.replace(/admin\.html$/, "blog.html");
    return window.location.origin + path + "#article-" + slug;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function slugify(title) {
    var map = {
      а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
      й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
      у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y",
      ь: "", э: "e", ю: "yu", я: "ya"
    };
    return String(title)
      .toLowerCase()
      .split("")
      .map(function (ch) {
        return map[ch] !== undefined ? map[ch] : ch;
      })
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
  }

  function renderList(rows) {
    var listEl = document.getElementById("article-admin-list");
    if (!listEl) return;
    if (!rows.length) {
      listEl.innerHTML = '<p class="form__hint">Пока нет статей в базе.</p>';
      return;
    }
    listEl.innerHTML = rows
      .map(function (row) {
        var share = blogShareUrl(row.slug);
        return (
          '<article class="podcast-admin-item">' +
          (row.image_url
            ? '<img class="article-admin-item__thumb" src="' + escapeHtml(row.image_url) + '" alt="" loading="lazy" />'
            : "") +
          '<h3 class="podcast-admin-item__title">' +
          escapeHtml(row.title) +
          "</h3>" +
          '<p class="podcast-admin-item__meta">' +
          escapeHtml(row.slug) +
          " · " +
          escapeHtml(row.published_at || "") +
          "</p>" +
          '<p class="podcast-admin-item__desc">' +
          escapeHtml(row.description) +
          "</p>" +
          '<div class="podcast-admin-item__actions">' +
          '<button type="button" class="btn btn--ghost btn--small admin-copy-article-link" data-url="' +
          escapeHtml(share) +
          '">Скопировать ссылку</button>' +
          '<button type="button" class="btn btn--ghost btn--small admin-delete-article" data-slug="' +
          escapeHtml(row.slug) +
          '">Удалить</button>' +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    listEl.querySelectorAll(".admin-copy-article-link").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var url = btn.getAttribute("data-url");
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url);
        }
        btn.textContent = "Скопировано";
      });
    });

    listEl.querySelectorAll(".admin-delete-article").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var slug = btn.getAttribute("data-slug");
        if (!slug || !confirm("Удалить статью «" + slug + "»?")) return;
        var c = getClient();
        if (!c) return;
        c.from("articles")
          .delete()
          .eq("slug", slug)
          .then(function (res) {
            if (res.error) {
              setFormStatus("Ошибка удаления: " + humanizeError(res.error), true);
              return;
            }
            loadList();
          });
      });
    });
  }

  function loadList() {
    var c = getClient();
    if (!c) return;
    c.from("articles")
      .select("slug,title,description,published_at,image_url")
      .order("published_at", { ascending: false })
      .then(function (res) {
        if (res.error) {
          setFormStatus("Не удалось загрузить список: " + humanizeError(res.error), true);
          return;
        }
        clearSetupBanner();
        renderList(res.data || []);
      });
  }

  function uploadImage(file, slug) {
    var c = getClient();
    if (!c) return Promise.reject(new Error("no_client"));
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    if (ext === "jpeg") ext = "jpg";
    var path = slug + "-" + Date.now() + "." + ext;
    return c.storage
      .from("article-images")
      .upload(path, file, { contentType: file.type || "image/jpeg", upsert: true })
      .then(function (res) {
        if (res.error) throw res.error;
        var publicUrl = c.storage.from("article-images").getPublicUrl(path);
        return publicUrl.data.publicUrl;
      });
  }

  function initForm() {
    var form = document.getElementById("article-form");
    var titleEl = document.getElementById("article-title");
    var slugEl = document.getElementById("article-slug");
    var dateEl = document.getElementById("article-date");
    if (!form) return;

    if (dateEl && !dateEl.value) {
      dateEl.value = new Date().toISOString().slice(0, 10);
    }

    if (titleEl && slugEl) {
      titleEl.addEventListener("blur", function () {
        if (!slugEl.value.trim()) slugEl.value = slugify(titleEl.value) || "statya";
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var c = getClient();
      if (!c) {
        setFormStatus("Supabase не настроен.", true);
        return;
      }

      var slug = (slugEl.value || "").trim().toLowerCase();
      var title = (document.getElementById("article-title").value || "").trim();
      var description = (document.getElementById("article-desc").value || "").trim();
      var content = (document.getElementById("article-content").value || "").trim();
      var published_at = dateEl.value || new Date().toISOString().slice(0, 10);
      var imageUrlInput = (document.getElementById("article-image-url").value || "").trim();
      var fileInput = document.getElementById("article-image-file");
      var file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

      if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
        setFormStatus("Slug: только латиница, цифры и дефис (например kak-sdelat-sait).", true);
        return;
      }
      if (!title || !description || !content) {
        setFormStatus("Заполните заголовок, описание и текст статьи.", true);
        return;
      }

      setFormStatus("Публикую статью...", false);

      function saveArticle(imageUrl) {
        return c
          .from("articles")
          .upsert({
            slug: slug,
            title: title,
            description: description,
            content: content,
            published_at: published_at,
            image_url: imageUrl || ""
          })
          .then(function (res) {
            if (res.error) throw res.error;
            form.reset();
            if (dateEl) dateEl.value = new Date().toISOString().slice(0, 10);
            setFormStatus("Статья опубликована. Ссылка: " + blogShareUrl(slug), false);
            loadList();
          });
      }

      if (file) {
        uploadImage(file, slug)
          .then(saveArticle)
          .catch(function (err) {
            setFormStatus("Ошибка загрузки изображения: " + humanizeError(err), true);
          });
      } else {
        saveArticle(imageUrlInput).catch(function (err) {
          setFormStatus("Ошибка: " + humanizeError(err), true);
        });
      }
    });
  }

  window.AdminArticles = {
    loadList: loadList,
    init: initForm
  };

  initForm();
})();
