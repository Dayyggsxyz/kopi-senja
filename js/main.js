/* Kopi Senja: navigation, tabs, reveals, hours status. No dependencies. */
(function () {
  "use strict";

  var doc = document;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* --------------------------------------------------------------------
     Sticky header state (IntersectionObserver, no scroll listeners)
     -------------------------------------------------------------------- */
  var header = doc.getElementById("site-header");
  var sentinel = doc.getElementById("sentinel");

  if (header && sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle("is-stuck", !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* --------------------------------------------------------------------
     Mobile navigation
     -------------------------------------------------------------------- */
  var nav = doc.getElementById("site-nav");
  var toggle = doc.querySelector(".nav-toggle");
  var menuOpen = false;
  var lastFocused = null;

  function setMenu(open) {
    if (!header || !toggle) return;
    menuOpen = open;
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    doc.body.classList.toggle("menu-open", open);

    if (open) {
      lastFocused = doc.activeElement;
      var firstLink = nav && nav.querySelector("a, button");
      if (firstLink) firstLink.focus();
    } else if (lastFocused === toggle || (nav && nav.contains(lastFocused))) {
      toggle.focus();
    }
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      setMenu(!menuOpen);
    });
  }

  if (nav) {
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a") && menuOpen) setMenu(false);
    });
  }

  doc.addEventListener("keydown", function (event) {
    if (!menuOpen) return;

    if (event.key === "Escape") {
      setMenu(false);
      return;
    }

    if (event.key === "Tab") {
      var focusables = header.querySelectorAll(
        '.brand[href], .nav a[href], .nav button:not([disabled]), .nav-toggle'
      );
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];

      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  var wideQuery = window.matchMedia("(min-width: 64rem)");
  var onWideChange = function (event) {
    if (event.matches && menuOpen) setMenu(false);
  };
  if (typeof wideQuery.addEventListener === "function") {
    wideQuery.addEventListener("change", onWideChange);
  } else if (typeof wideQuery.addListener === "function") {
    wideQuery.addListener(onWideChange);
  }

  /* --------------------------------------------------------------------
     Scroll reveals
     -------------------------------------------------------------------- */
  var revealItems = doc.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else if (!reduced.matches) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
    );
    revealItems.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealItems.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* --------------------------------------------------------------------
     Menu tabs (WAI-ARIA tabs pattern)
     -------------------------------------------------------------------- */
  var tabs = Array.prototype.slice.call(doc.querySelectorAll('[role="tab"]'));
  var panels = Array.prototype.slice.call(doc.querySelectorAll('[role="tabpanel"]'));

  function selectTab(index, moveFocus) {
    tabs.forEach(function (tab, i) {
      var selected = i === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (panels[i]) panels[i].hidden = !selected;
    });
    if (moveFocus && tabs[index]) tabs[index].focus();
  }

  if (tabs.length && panels.length) {
    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        selectTab(index, false);
      });

      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;

        if (next !== null) {
          event.preventDefault();
          selectTab(next, true);
        }
      });
    });
    selectTab(0, false);
  }

  /* --------------------------------------------------------------------
     Opening hours: today's row plus live open or closed status,
     computed in the shop's own timezone (Asia/Jakarta)
     -------------------------------------------------------------------- */
  var SCHEDULE = {
    0: [450, 1320], // Sunday    07:30 - 22:00
    1: [480, 1320], // Monday    08:00 - 22:00
    2: [480, 1320],
    3: [480, 1320],
    4: [480, 1320],
    5: [480, 1380], // Friday    08:00 - 23:00
    6: [450, 1380] // Saturday  07:30 - 23:00
  };
  var DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  var DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

  function shopClock() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta",
        hourCycle: "h23",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit"
      }).formatToParts(new Date());
      var get = function (type) {
        var found = parts.find(function (part) {
          return part.type === type;
        });
        return found ? found.value : "";
      };
      return {
        day: DAY_INDEX[get("weekday")],
        minutes: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10)
      };
    } catch (error) {
      var local = new Date();
      return { day: local.getDay(), minutes: local.getHours() * 60 + local.getMinutes() };
    }
  }

  function clockLabel(minutes) {
    var hour = Math.floor(minutes / 60);
    var minute = minutes % 60;
    return (hour < 10 ? "0" : "") + hour + ":" + (minute < 10 ? "0" : "") + minute;
  }

  function refreshHours() {
    var now = shopClock();
    var todayRow = doc.querySelector('.hours-table tr[data-day="' + now.day + '"]');

    doc.querySelectorAll(".hours-table tr.is-today").forEach(function (row) {
      row.classList.remove("is-today");
      row.removeAttribute("aria-current");
      var tag = row.querySelector(".today-tag");
      if (tag) tag.hidden = true;
    });

    if (todayRow) {
      todayRow.classList.add("is-today");
      todayRow.setAttribute("aria-current", "date");
      var todayTag = todayRow.querySelector(".today-tag");
      if (todayTag) todayTag.hidden = false;
    }

    var status = doc.getElementById("status");
    if (!status) return;

    var today = SCHEDULE[now.day];
    var text;
    var state;

    if (now.minutes >= today[0] && now.minutes < today[1]) {
      state = "open";
      text = "Open now, closes at " + clockLabel(today[1]);
    } else if (now.minutes < today[0]) {
      state = "closed";
      text = "Closed right now, opens at " + clockLabel(today[0]);
    } else {
      state = "closed";
      var order = DAY_ORDER.slice(DAY_ORDER.indexOf(now.day) + 1).concat(
        DAY_ORDER.slice(0, DAY_ORDER.indexOf(now.day) + 1)
      );
      var nextDay = order.find(function (day) {
        return SCHEDULE[day];
      });
      var tomorrow = nextDay !== now.day;
      text =
        "Closed now, opens " +
        (tomorrow ? "tomorrow" : "") +
        " at " +
        clockLabel(SCHEDULE[nextDay][0]);
    }

    status.hidden = false;
    status.dataset.state = state;
    status.textContent = text;
  }

  refreshHours();
  window.setInterval(refreshHours, 60000);

  /* --------------------------------------------------------------------
     Highlight the section currently being read
     -------------------------------------------------------------------- */
  var sectionLinks = Array.prototype.slice.call(
    doc.querySelectorAll('.nav-list a[href^="#"]')
  );

  if ("IntersectionObserver" in window && sectionLinks.length) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = "#" + entry.target.id;
          sectionLinks.forEach(function (link) {
            if (link.getAttribute("href") === id) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sectionLinks.forEach(function (link) {
      var target = doc.querySelector(link.getAttribute("href"));
      if (target) sectionObserver.observe(target);
    });
  }

  /* --------------------------------------------------------------------
     Floating WhatsApp button appears once the hero is behind us
     -------------------------------------------------------------------- */
  var fab = doc.getElementById("wa-fab");
  var hero = doc.querySelector(".hero");

  if (fab && hero && "IntersectionObserver" in window) {
    var showFab = function (show) {
      if (show) {
        fab.hidden = false;
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            fab.classList.add("is-visible");
          });
        });
      } else {
        fab.classList.remove("is-visible");
        window.setTimeout(function () {
          if (!fab.classList.contains("is-visible")) fab.hidden = true;
        }, 500);
      }
    };

    new IntersectionObserver(function (entries) {
      showFab(!entries[0].isIntersecting);
    }).observe(hero);
  }

  /* --------------------------------------------------------------------
     Footer year
     -------------------------------------------------------------------- */
  var year = doc.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
