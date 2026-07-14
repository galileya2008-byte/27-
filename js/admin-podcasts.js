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

  function setFormStatus(text, isError) {
    var el = document.getElementById("podcast-form-status");
    if (!el) return;
    el.textContent = text;
    el.className = isError ? "form__status is-err" : "form__status is-ok";
  }

  function blogShareUrl(slug) {
    var path = window.location.pathname.replace(/admin\.html$/, "blog.html");
    return window.location.origin + path + "#" + slug;
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
    var listEl = document.getElementById("podcast-admin-list");
    if (!listEl) return;
    if (!rows.length) {
      listEl.innerHTML = '<p class="form__hint">Пока нет выпусков в базе.</p>';
      return;
    }
    listEl.innerHTML = rows
      .map(function (row) {
        var share = blogShareUrl(row.slug);
        return (
          '<article class="podcast-admin-item">' +
          '<h3 class="podcast-admin-item__title">' +
          escapeHtml(row.title) +
          "</h3>" +
          '<p class="podcast-admin-item__meta">' +
          escapeHtml(row.slug) +
          " · " +
          escapeHtml(row.published_at || "") +
          (row.duration ? " · " + escapeHtml(row.duration) : "") +
          "</p>" +
          '<p class="podcast-admin-item__desc">' +
          escapeHtml(row.description) +
          "</p>" +
          '<div class="podcast-admin-item__actions">' +
          '<button type="button" class="btn btn--ghost btn--small admin-copy-link" data-url="' +
          escapeHtml(share) +
          '">Скопировать ссылку</button>' +
          '<button type="button" class="btn btn--ghost btn--small admin-delete-podcast" data-slug="' +
          escapeHtml(row.slug) +
          '">Удалить</button>' +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    listEl.querySelectorAll(".admin-copy-link").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var url = btn.getAttribute("data-url");
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url);
        }
        btn.textContent = "Скопировано";
      });
    });

    listEl.querySelectorAll(".admin-delete-podcast").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var slug = btn.getAttribute("data-slug");
        if (!slug || !confirm("Удалить выпуск «" + slug + "»?")) return;
        var c = getClient();
        if (!c) return;
        c.from("podcasts")
          .delete()
          .eq("slug", slug)
          .then(function (res) {
            if (res.error) {
              setFormStatus("Ошибка удаления: " + res.error.message, true);
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
    c.from("podcasts")
      .select("slug,title,description,published_at,duration")
      .order("published_at", { ascending: false })
      .then(function (res) {
        if (res.error) {
          setFormStatus("Не удалось загрузить список: " + res.error.message, true);
          return;
        }
        renderList(res.data || []);
      });
  }

  function uploadAudio(file, slug) {
    var c = getClient();
    if (!c) return Promise.reject(new Error("no_client"));
    var path = slug + "-" + Date.now() + ".mp3";
    return c.storage
      .from("podcast-audio")
      .upload(path, file, { contentType: "audio/mpeg", upsert: true })
      .then(function (res) {
        if (res.error) throw res.error;
        var publicUrl = c.storage.from("podcast-audio").getPublicUrl(path);
        return publicUrl.data.publicUrl;
      });
  }

  function initForm() {
    var form = document.getElementById("podcast-form");
    var titleEl = document.getElementById("podcast-title");
    var slugEl = document.getElementById("podcast-slug");
    var dateEl = document.getElementById("podcast-date");
    if (!form) return;

    if (dateEl && !dateEl.value) {
      dateEl.value = new Date().toISOString().slice(0, 10);
    }

    if (titleEl && slugEl) {
      titleEl.addEventListener("blur", function () {
        if (!slugEl.value.trim()) slugEl.value = slugify(titleEl.value) || "vypusk";
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
      var title = (document.getElementById("podcast-title").value || "").trim();
      var description = (document.getElementById("podcast-desc").value || "").trim();
      var article = (document.getElementById("podcast-article").value || "").trim();
      var duration = (document.getElementById("podcast-duration").value || "").trim();
      var published_at = dateEl.value || new Date().toISOString().slice(0, 10);
      var audioUrlInput = (document.getElementById("podcast-audio-url").value || "").trim();
      var fileInput = document.getElementById("podcast-audio-file");
      var file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

      if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
        setFormStatus("Slug: только латиница, цифры и дефис (например vypusk-3).", true);
        return;
      }
      if (!title || !description) {
        setFormStatus("Заполните заголовок и описание.", true);
        return;
      }

      setFormStatus("Публикую выпуск...", false);

      function savePodcast(audioUrl) {
        return c
          .from("podcasts")
          .upsert({
            slug: slug,
            title: title,
            description: description,
            article: article,
            duration: duration || "—",
            published_at: published_at,
            audio_url: audioUrl || ""
          })
          .then(function (res) {
            if (res.error) throw res.error;
            form.reset();
            if (dateEl) dateEl.value = new Date().toISOString().slice(0, 10);
            setFormStatus("Выпуск опубликован. Ссылка: " + blogShareUrl(slug), false);
            loadList();
          });
      }

      if (file) {
        uploadAudio(file, slug)
          .then(savePodcast)
          .catch(function (err) {
            setFormStatus("Ошибка загрузки аудио: " + (err.message || err), true);
          });
      } else {
        savePodcast(audioUrlInput).catch(function (err) {
          setFormStatus("Ошибка: " + (err.message || err), true);
        });
      }
    });
  }

  window.AdminPodcasts = {
    loadList: loadList,
    init: initForm
  };

  initForm();
})();
