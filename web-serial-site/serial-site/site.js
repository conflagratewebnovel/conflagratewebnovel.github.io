(function () {
  "use strict";

  var POSTS_FOLDER = "posts";
  var SUPPORTED = ["txt", "md", "markdown", "docx", "pdf", "doc"];

  var DEFAULTS = {
    "site-title": "My Web Serial",
    background: "#161616",
    "text-color": "#f2f2f2",
    "link-color": "#8ab4f8",
    "muted-color": "#9a9a9a",
    "line-color": "#333333",
    font: 'Georgia, "Times New Roman", serif',
    "font-size": "18px",
    "line-height": "1.7",
    "page-width": "700px",
    "text-align": "left",
    "home-align": "left",
    "post-order": "oldest-first",
    "hide-numbers": "no",
    "show-top-bar": "yes",
    footer: "",
    "previous-label": "← Previous",
    "next-label": "Next →",
    "home-label": "Contents",
    "github-repo": "",
    "github-branch": "",
    "custom-css": "",
  };

  var settings = Object.assign({}, DEFAULTS);
  var postsPromise = null;
  var navId = 0;
  var pageEl = document.getElementById("page");

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function yes(v) {
    return /^(yes|y|true|on|1)$/i.test(String(v).trim());
  }

  function withPx(v) {
    v = String(v).trim();
    return /^\d+(\.\d+)?$/.test(v) ? v + "px" : v;
  }

  function fetchBuffer(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) {
        var e = new Error("HTTP " + r.status);
        e.status = r.status;
        throw e;
      }
      return r.arrayBuffer();
    });
  }

  function decodeText(buf) {
    var text;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
    } catch (e) {
      text = new TextDecoder("windows-1252").decode(buf);
    }
    return text.replace(/^﻿/, "");
  }
  function fetchText(url) {
    return fetchBuffer(url).then(decodeText);
  }

  var scriptCache = {};
  function loadScript(src) {
    if (!scriptCache[src]) {
      scriptCache[src] = new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = function () {
          reject(new Error("Could not load " + src));
        };
        document.head.appendChild(s);
      });
    }
    return scriptCache[src];
  }

  function parseSettings(text) {
    var out = {};
    text
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .forEach(function (line) {
        line = line.trim();
        if (!line || line.charAt(0) === "#") return;
        var i = line.indexOf(":");
        if (i < 1) return;
        var key = line.slice(0, i).trim().toLowerCase();
        var val = line.slice(i + 1).trim();
        if (val !== "" || key === "footer" || key === "custom-css")
          out[key] = val;
      });
    return out;
  }

  function applySettings() {
    var root = document.documentElement.style;
    root.setProperty("--bg", settings["background"]);
    root.setProperty("--text", settings["text-color"]);
    root.setProperty("--link", settings["link-color"]);
    root.setProperty("--muted", settings["muted-color"]);
    root.setProperty("--line", settings["line-color"]);
    root.setProperty("--font", settings["font"]);
    root.setProperty("--size", withPx(settings["font-size"]));
    root.setProperty("--leading", settings["line-height"]);
    root.setProperty("--width", withPx(settings["page-width"]));
    root.setProperty("--align", settings["text-align"]);
    root.setProperty("--home-align", settings["home-align"]);

    var titleLink = document.getElementById("site-title");
    titleLink.textContent = settings["site-title"];
    document.getElementById("topbar").style.display = yes(
      settings["show-top-bar"],
    )
      ? ""
      : "none";
    document.getElementById("footer").textContent = settings["footer"];

    if (settings["custom-css"]) {
      var st = document.createElement("style");
      st.textContent = settings["custom-css"];
      document.head.appendChild(st);
    }
  }

  function safeUrl(u) {
    return !/^\s*(javascript|data|vbscript):/i.test(u);
  }

  function inline(s) {
    s = esc(s);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, text, url) {
      if (!safeUrl(url)) return text;
      var ext = /^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : "";
      return '<a href="' + url + '"' + ext + ">" + text + "</a>";
    });
    s = s.replace(/\*\*(\S(?:.*?\S)?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*(\S(?:[^*]*?\S)?)\*/g, "<em>$1</em>");
    s = s.replace(
      /(^|[\s(>])_(\S(?:[^_]*?\S)?)_(?=[\s.,!?;:)<]|$)/g,
      "$1<em>$2</em>",
    );
    return s;
  }

  function renderText(src, opts) {
    opts = opts || {};
    var rich = !!opts.rich;
    var tokens = [];
    src = src.replace(/\r\n?/g, "\n");

    if (opts.placeholders) {
      src = src.replace(
        /\{\{\s*([^{}|]+?)\s*(?:\|\s*([^{}]*?)\s*)?\}\}/g,
        function (m, name, label) {
          var html = opts.placeholders(name.toLowerCase(), label);
          if (html == null) return m;
          tokens.push(html);
          return "" + (tokens.length - 1) + "";
        },
      );
    }

    var out = [],
      para = [],
      list = [],
      quote = [];
    function flush() {
      if (para.length) {
        var joined = para.join("\n");
        if (/^(\d+\s*)+$/.test(joined)) out.push(joined);
        else out.push("<p>" + para.map(inline).join("<br>") + "</p>");
        para = [];
      }
      if (list.length) {
        out.push(
          "<ul>" +
            list
              .map(function (l) {
                return "<li>" + inline(l) + "</li>";
              })
              .join("") +
            "</ul>",
        );
        list = [];
      }
      if (quote.length) {
        out.push(
          "<blockquote>" + quote.map(inline).join("<br>") + "</blockquote>",
        );
        quote = [];
      }
    }

    src.split("\n").forEach(function (raw) {
      var line = raw.trim(),
        m;
      if (!line) {
        flush();
        return;
      }
      if (/^(\*\s*){3,}$|^(-\s*){3,}$|^(_\s*){3,}$/.test(line)) {
        flush();
        out.push("<hr>");
        return;
      }
      if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
        flush();
        out.push(
          "<h" + m[1].length + ">" + inline(m[2]) + "</h" + m[1].length + ">",
        );
        return;
      }
      if (rich && (m = line.match(/^>\s?(.*)$/))) {
        if (para.length || list.length) flush();
        quote.push(m[1]);
        return;
      }
      if (rich && (m = line.match(/^[-*+]\s+(.*)$/))) {
        if (para.length || quote.length) flush();
        list.push(m[1]);
        return;
      }
      if (list.length || quote.length) flush();
      para.push(line);
    });
    flush();

    return out.join("\n").replace(/(\d+)/g, function (m, n) {
      return tokens[+n];
    });
  }

  function sanitize(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    doc
      .querySelectorAll("script,style,iframe,object,embed,link,meta,form")
      .forEach(function (n) {
        n.remove();
      });
    doc.querySelectorAll("*").forEach(function (n) {
      Array.prototype.slice.call(n.attributes).forEach(function (a) {
        if (
          /^on/i.test(a.name) ||
          (/^(href|src)$/i.test(a.name) &&
            /^\s*(javascript|vbscript):/i.test(a.value))
        )
          n.removeAttribute(a.name);
      });
    });
    return doc.body.innerHTML;
  }

  function docxToHtml(buf) {
    return loadScript("lib/mammoth.browser.min.js")
      .then(function () {
        return window.mammoth.convertToHtml({ arrayBuffer: buf });
      })
      .then(function (res) {
        return sanitize(res.value);
      });
  }

  function pdfToHtml(buf) {
    return loadScript("lib/pdf.min.js")
      .then(function () {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "lib/pdf.worker.min.js";
        return window.pdfjsLib.getDocument({ data: new Uint8Array(buf) })
          .promise;
      })
      .then(function (pdf) {
        var endRe = /[.!?…"”’»)\]*_]\s*$/;
        var paras = [],
          cur = "",
          prevEndedSentence = true;

        function addLine(text) {
          if (!cur) {
            cur = text;
            return;
          }
          cur += /-$/.test(cur) ? text : " " + text;
        }
        function newPara() {
          if (cur.trim()) paras.push(cur.trim());
          cur = "";
        }

        function doPage(n) {
          return pdf
            .getPage(n)
            .then(function (page) {
              return page.getTextContent();
            })
            .then(function (tc) {
              var lines = [],
                line = null;
              tc.items.forEach(function (it) {
                if (!("str" in it)) return;
                var y = it.transform[5],
                  x = it.transform[4],
                  h = it.height || 10;
                if (line && Math.abs(y - line.y) < Math.max(2, h * 0.5)) {
                  line.text += it.str;
                  line.w += it.width || 0;
                } else {
                  line = { y: y, x: x, h: h, w: it.width || 0, text: it.str };
                  lines.push(line);
                }
              });
              lines = lines.filter(function (l) {
                return l.text.trim();
              });
              if (!lines.length) return;

              var gaps = [],
                widths = [],
                xs = {};
              lines.forEach(function (l, i) {
                if (i && lines[i - 1].y - l.y > 0)
                  gaps.push(lines[i - 1].y - l.y);
                widths.push(l.w);
                var k = Math.round(l.x);
                xs[k] = (xs[k] || 0) + 1;
              });
              gaps.sort(function (a, b) {
                return a - b;
              });
              widths.sort(function (a, b) {
                return a - b;
              });
              var medGap = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0;
              var wideW = widths[Math.floor(widths.length * 0.85)] || 0;
              var baseX = +Object.keys(xs).sort(function (a, b) {
                return xs[b] - xs[a];
              })[0];

              lines.forEach(function (l, i) {
                var text = l.text.replace(/\s+/g, " ").trim();
                var brk;
                if (i === 0) {
                  brk = prevEndedSentence;
                } else {
                  var prev = lines[i - 1];
                  var gap = prev.y - l.y;
                  var prevText = prev.text.trim();
                  brk =
                    (medGap && gap > medGap * 1.45) ||
                    (endRe.test(prevText) && l.x - baseX > l.h * 0.8) ||
                    (endRe.test(prevText) && wideW && prev.w < wideW * 0.7);
                }
                if (brk) newPara();
                addLine(text);
              });
              prevEndedSentence = endRe.test(
                lines[lines.length - 1].text.trim(),
              );
            });
        }

        var chain = Promise.resolve();
        for (var p = 1; p <= pdf.numPages; p++)
          (function (n) {
            chain = chain.then(function () {
              return doPage(n);
            });
          })(p);
        return chain.then(function () {
          newPara();
          if (!paras.length) throw new Error("no-text");
          return paras
            .map(function (t) {
              return "<p>" + esc(t) + "</p>";
            })
            .join("\n");
        });
      });
  }

  function extOf(name) {
    var m = name.match(/\.([^.]+)$/);
    return m ? m[1].toLowerCase() : "";
  }
  function baseOf(name) {
    return name.replace(/\.[^.]+$/, "");
  }

  function makePost(file) {
    var base = baseOf(file),
      title = base;
    if (yes(settings["hide-numbers"])) {
      var stripped = base
        .replace(/^\s*\d+(?:[.\-_)]\d+)*[\s.\-_):]*/, "")
        .trim();
      if (stripped) title = stripped;
    }
    return {
      file: file,
      ext: extOf(file),
      base: base,
      title: title,
      href: "#/post/" + encodeURIComponent(file),
    };
  }

  function toPosts(names) {
    return names
      .filter(function (n) {
        return (
          n &&
          n.charAt(0) !== "." &&
          n.charAt(0) !== "_" &&
          SUPPORTED.indexOf(extOf(n)) !== -1
        );
      })
      .sort(function (a, b) {
        return a.localeCompare(b, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      })
      .map(makePost);
  }

  function guessRepo() {
    var set = (settings["github-repo"] || "")
      .trim()
      .replace(/^https?:\/\/github\.com\//i, "")
      .replace(/\/+$/, "");
    if (/^[\w.-]+\/[\w.-]+$/.test(set)) return set;
    var host = location.hostname;
    if (/\.github\.io$/i.test(host)) {
      var owner = host.split(".")[0];
      var seg = location.pathname.split("/")[1] || "";
      var repo = !seg || seg.indexOf(".") !== -1 ? owner + ".github.io" : seg;
      return owner + "/" + repo;
    }
    return null;
  }

  function ghJson(url) {
    return fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
    }).then(function (r) {
      if (!r.ok) {
        var e = new Error("GitHub API " + r.status);
        e.status = r.status;
        throw e;
      }
      return r.json();
    });
  }

  function listViaGitHub(repo) {
    var branch = (settings["github-branch"] || "").trim();
    var url =
      "https://api.github.com/repos/" +
      repo +
      "/contents/" +
      POSTS_FOLDER +
      (branch ? "?ref=" + encodeURIComponent(branch) : "");
    return ghJson(url).then(function (items) {
      if (!Array.isArray(items)) throw new Error("Unexpected GitHub answer");
      if (items.length < 1000) {
        return items
          .filter(function (i) {
            return i.type === "file";
          })
          .map(function (i) {
            return i.name;
          });
      }
      return (
        branch
          ? Promise.resolve(branch)
          : ghJson("https://api.github.com/repos/" + repo).then(function (r) {
              return r.default_branch;
            })
      )
        .then(function (b) {
          return ghJson(
            "https://api.github.com/repos/" +
              repo +
              "/git/trees/" +
              encodeURIComponent(b) +
              "?recursive=1",
          );
        })
        .then(function (t) {
          var prefix = POSTS_FOLDER + "/";
          return (t.tree || [])
            .filter(function (i) {
              return (
                i.type === "blob" &&
                i.path.indexOf(prefix) === 0 &&
                i.path.indexOf("/", prefix.length) === -1
              );
            })
            .map(function (i) {
              return i.path.slice(prefix.length);
            });
        });
    });
  }

  function listViaDirectory() {
    return fetchText(POSTS_FOLDER + "/").then(function (html) {
      var doc = new DOMParser().parseFromString(html, "text/html");
      var names = [];
      doc.querySelectorAll("a[href]").forEach(function (a) {
        var href = a.getAttribute("href");
        if (
          !href ||
          href.charAt(0) === "?" ||
          href.charAt(0) === "#" ||
          /\/$/.test(href) ||
          /^[a-z]+:/i.test(href)
        )
          return;
        try {
          names.push(decodeURIComponent(href.split("/").pop()));
        } catch (e) {
          /* ignore */
        }
      });
      if (!names.length) throw new Error("empty listing");
      return names;
    });
  }

  function getPosts() {
    if (postsPromise) return postsPromise;
    var repo = guessRepo();
    var cacheKey = "serial-posts:" + (repo || location.host);
    var cached = null;
    try {
      cached = JSON.parse(sessionStorage.getItem(cacheKey));
    } catch (e) {
      /* storage may be blocked */
    }

    function save(names) {
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ t: Date.now(), names: names }),
        );
      } catch (e) {
        /* ignore */
      }
      return names;
    }

    var p;
    if (cached && Date.now() - cached.t < 60 * 1000) {
      p = Promise.resolve(cached.names);
    } else {
      var firstTry = repo
        ? listViaGitHub(repo)
        : Promise.reject(new Error("no repo"));
      p = firstTry.then(save).catch(function (apiErr) {
        return listViaDirectory()
          .then(save)
          .catch(function () {
            if (cached) return cached.names;
            var err = new Error("list");
            err.apiErr = apiErr;
            err.repo = repo;
            throw err;
          });
      });
    }
    postsPromise = p.then(toPosts);
    postsPromise.catch(function () {
      postsPromise = null;
    });
    return postsPromise;
  }

  function setTitle(t) {
    document.title = t
      ? t + " – " + settings["site-title"]
      : settings["site-title"];
  }
  function notice(html) {
    return '<div class="notice">' + html + "</div>";
  }

  function listError(err) {
    var why;
    if (!err.repo) {
      why =
        "This site could not work out which GitHub repository it lives in. Open <strong>settings.txt</strong> and set <strong>github-repo: your-username/your-repository</strong>.";
    } else if (
      err.apiErr &&
      (err.apiErr.status === 403 || err.apiErr.status === 429)
    ) {
      why =
        "GitHub is limiting requests right now. Please try again in a few minutes.";
    } else if (err.apiErr && err.apiErr.status === 404) {
      why =
        "Could not find a <strong>" +
        POSTS_FOLDER +
        "</strong> folder in <strong>" +
        esc(err.repo) +
        "</strong>. Check that the repository is public, the folder exists, and (if needed) that <strong>github-repo</strong> in settings.txt is right.";
    } else {
      why = "Could not load the list of posts. Please try again in a moment.";
    }
    return notice("<strong>Couldn’t load the posts.</strong><br>" + why);
  }

  function showHome(id) {
    setTitle("");
    Promise.all([
      fetchText("home.txt").catch(function () {
        return "# " + settings["site-title"] + "\n\n{{first}}\n\n{{posts}}";
      }),
      getPosts().then(
        function (p) {
          return { posts: p };
        },
        function (e) {
          return { error: e };
        },
      ),
    ]).then(function (r) {
      if (id !== navId) return;
      var homeText = r[0],
        posts = r[1].posts || [],
        error = r[1].error;
      var ordered = /newest|desc|reverse|latest/i.test(settings["post-order"])
        ? posts.slice().reverse()
        : posts;

      function button(p, label) {
        return '<a class="btn" href="' + p.href + '">' + esc(label) + "</a>";
      }
      var html = renderText(homeText, {
        rich: true,
        placeholders: function (name, label) {
          if (name === "posts") {
            if (error) return listError(error);
            if (!ordered.length)
              return notice(
                "No posts yet. Add files to the <strong>" +
                  POSTS_FOLDER +
                  "</strong> folder and they will appear here.",
              );
            return (
              '<ul class="post-list">' +
              ordered
                .map(function (p) {
                  return (
                    '<li><a href="' + p.href + '">' + esc(p.title) + "</a></li>"
                  );
                })
                .join("") +
              "</ul>"
            );
          }
          if (name === "first")
            return posts.length
              ? button(posts[0], label || "Start reading")
              : "";
          if (name === "latest")
            return posts.length
              ? button(posts[posts.length - 1], label || "Read the latest")
              : "";
          if (name === "count") return String(posts.length);
          if (name === "site-title") return esc(settings["site-title"]);
          return null;
        },
      });
      pageEl.innerHTML = '<div class="home">' + html + "</div>";
      window.scrollTo(0, 0);
    });
  }

  function loadBody(post) {
    var url = POSTS_FOLDER + "/" + encodeURIComponent(post.file);
    switch (post.ext) {
      case "txt":
        return fetchText(url).then(function (t) {
          return renderText(t, { rich: false });
        });
      case "md":
      case "markdown":
        return fetchText(url).then(function (t) {
          return renderText(t, { rich: true });
        });
      case "docx":
        return fetchBuffer(url).then(docxToHtml);
      case "pdf":
        return fetchBuffer(url).then(pdfToHtml);
      default:
        var e = new Error("unsupported");
        e.unsupported = true;
        return Promise.reject(e);
    }
  }

  function pagerHtml(posts, idx) {
    var prev = posts[idx - 1],
      next = posts[idx + 1];
    pageEl.dataset.prev = prev ? prev.href : "";
    pageEl.dataset.next = next ? next.href : "";
    return (
      '<nav class="pager">' +
      '<span class="left">' +
      (prev
        ? '<a class="btn" rel="prev" href="' +
          prev.href +
          '">' +
          esc(settings["previous-label"]) +
          "</a>"
        : "") +
      "</span>" +
      '<span class="mid"><a class="btn" href="#/">' +
      esc(settings["home-label"]) +
      "</a></span>" +
      '<span class="right">' +
      (next
        ? '<a class="btn" rel="next" href="' +
          next.href +
          '">' +
          esc(settings["next-label"]) +
          "</a>"
        : "") +
      "</span>" +
      "</nav>"
    );
  }

  function showPost(file, id) {
    pageEl.innerHTML = '<p class="muted">Loading…</p>';
    getPosts()
      .then(
        function (posts) {
          return { posts: posts };
        },
        function (e) {
          return { error: e };
        },
      )
      .then(function (r) {
        if (id !== navId) return;
        if (r.error) {
          pageEl.innerHTML = listError(r.error);
          return;
        }
        var posts = r.posts;
        var idx = -1;
        posts.forEach(function (p, i) {
          if (p.file === file) idx = i;
        });
        var post = idx >= 0 ? posts[idx] : null;
        if (!post) {
          setTitle("Not found");
          pageEl.innerHTML = notice(
            '<strong>This post could not be found.</strong><br>It may have been renamed or removed. <a href="#/">Back to the contents.</a>',
          );
          return;
        }
        setTitle(post.title);

        return loadBody(post)
          .then(function (bodyHtml) {
            if (id !== navId) return;
            pageEl.innerHTML =
              '<article class="post"><h1>' +
              esc(post.title) +
              "</h1>" +
              '<div class="body">' +
              bodyHtml +
              "</div>" +
              pagerHtml(posts, idx) +
              "</article>";
            window.scrollTo(0, 0);
          })
          .catch(function (err) {
            if (id !== navId) return;
            var dl = POSTS_FOLDER + "/" + encodeURIComponent(post.file);
            var msg;
            if (err && err.unsupported) {
              msg =
                'Old <strong>.doc</strong> files can’t be shown in a web page. Re-save the file as <strong>.docx</strong> (or .txt / .pdf) and upload that instead. <a href="' +
                dl +
                '">Download this file</a>.';
            } else if (err && err.message === "no-text") {
              msg =
                'This PDF has no selectable text (it may be a scan), so it can’t be displayed here. <a href="' +
                dl +
                '">Download it instead</a>.';
            } else if (err && err.status === 404) {
              msg =
                "This post is listed but isn’t published yet. If you just added it, GitHub needs a minute or two — refresh shortly.";
            } else {
              msg =
                'Something went wrong while opening this file. <a href="' +
                dl +
                '">Download it instead</a>.';
            }
            pageEl.innerHTML =
              '<article class="post"><h1>' +
              esc(post.title) +
              "</h1>" +
              notice(msg) +
              pagerHtml(posts, idx) +
              "</article>";
          });
      });
  }

  function route() {
    var id = ++navId;
    pageEl.dataset.prev = "";
    pageEl.dataset.next = "";
    var m = location.hash.match(/^#\/post\/(.+)$/);
    if (m) {
      var file;
      try {
        file = decodeURIComponent(m[1]);
      } catch (e) {
        file = m[1];
      }
      showPost(file, id);
    } else {
      showHome(id);
    }
  }

  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var t = e.target && e.target.tagName;
    if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return;
    var href =
      e.key === "ArrowLeft"
        ? pageEl.dataset.prev
        : e.key === "ArrowRight"
          ? pageEl.dataset.next
          : "";
    if (href) location.hash = href;
  });

  fetchText("settings.txt")
    .catch(function () {
      return "";
    })
    .then(function (text) {
      settings = Object.assign({}, DEFAULTS, parseSettings(text));
      applySettings();
      window.addEventListener("hashchange", route);
      route();
    });
})();
