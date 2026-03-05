const searchInput = document.getElementById("portfolioSearch");
const portfolioGrid = document.getElementById("portfolioGrid");
const resultCount = document.getElementById("portfolioResultCount");
const emptyState = document.getElementById("portfolioEmptyState");
const chips = [...document.querySelectorAll("[data-filter]")];
const faqTriggers = [...document.querySelectorAll(".faq-trigger")];
const progressBar = document.getElementById("scrollProgress");
const navLinks = [...document.querySelectorAll(".site-nav__link")];
const announcementText = document.getElementById("announcementText");
const revealTargets = [...document.querySelectorAll("[data-reveal]")];
const countTargets = [...document.querySelectorAll("[data-count]")];
const copyEmailButton = document.getElementById("copyEmailButton");
const copyToast = document.getElementById("copyToast");
const spotlightTargets = [...document.querySelectorAll("[data-spotlight]")];
const typeTargets = [
  ...document.querySelectorAll(
    ".hero h1, .section-heading h2, .project-hero__copy h1, .project-panel > h2, .legal-panel > h1"
  )
];

const announcements = [
  "Lebenslauf, Werdegang und Portfolio sind direkt auf dieser Bewerbungswebsite für Zander integriert.",
  "Support, Systemadministration, Python und Service-Dokumentation stehen im Mittelpunkt meiner Bewerbung.",
  "Suchfunktion, Spotlight-Hover, Motion und klare Struktur zeigen meine technischen Themen kompakt und modern."
];

let activeFilter = "all";
let announcementIndex = 0;
let lastScrollY = window.scrollY;
let scrollDirectionFrame = null;

function normalize(text) {
  return (text || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function runWithTransition(fn) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReducedMotion && typeof document.startViewTransition === "function") {
    document.startViewTransition(fn);
    return;
  }
  fn();
}

function updateScrollProgress() {
  if (!progressBar) {
    return window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = `${progress}%`;
  return progress / 100;
}

function updateScrollChrome() {
  const currentScrollY = window.scrollY;
  const delta = currentScrollY - lastScrollY;
  const normalizedProgress = updateScrollProgress();
  document.body.style.setProperty("--scroll-darkness", String(Math.min(1, normalizedProgress * 1.2)));

  if (currentScrollY < 36) {
    document.body.classList.remove("is-scrolling-down", "is-scrolling-up");
    lastScrollY = currentScrollY;
    return;
  }

  if (Math.abs(delta) < 6) {
    return;
  }

  if (delta > 0 && currentScrollY > 120) {
    document.body.classList.add("is-scrolling-down");
    document.body.classList.remove("is-scrolling-up");
  } else if (delta < 0) {
    document.body.classList.add("is-scrolling-up");
    document.body.classList.remove("is-scrolling-down");
  }

  lastScrollY = currentScrollY;
}

function bindScrollChrome() {
  window.addEventListener(
    "scroll",
    () => {
      if (scrollDirectionFrame !== null) {
        return;
      }

      scrollDirectionFrame = window.requestAnimationFrame(() => {
        updateScrollChrome();
        scrollDirectionFrame = null;
      });
    },
    { passive: true }
  );
}

function filterPortfolio() {
  if (!searchInput || !portfolioGrid || !resultCount || !emptyState) {
    return;
  }

  const term = normalize(searchInput.value);
  const cards = [...portfolioGrid.querySelectorAll(".portfolio-card")];
  let matches = 0;

  cards.forEach((card) => {
    const category = card.dataset.category;
    const haystack = normalize(card.dataset.search || "");
    const categoryMatch = activeFilter === "all" || category === activeFilter;
    const textMatch = term === "" || haystack.includes(term);
    const visible = categoryMatch && textMatch;
    card.classList.toggle("is-hidden", !visible);

    if (visible) {
      matches += 1;
    }
  });

  resultCount.textContent = `${matches} Projekt${matches === 1 ? "" : "e"} gefunden`;
  emptyState.hidden = matches !== 0;
}

function bindFilterChips() {
  if (!chips.length) {
    return;
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      runWithTransition(() => {
        activeFilter = chip.dataset.filter || "all";
        chips.forEach((button) => button.classList.toggle("is-active", button === chip));
        filterPortfolio();
      });
    });
  });
}

function bindFaq() {
  faqTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const isOpen = trigger.getAttribute("aria-expanded") === "true";

      runWithTransition(() => {
        faqTriggers.forEach((button) => {
          button.setAttribute("aria-expanded", "false");
          button.nextElementSibling.hidden = true;
        });

        if (!isOpen) {
          trigger.setAttribute("aria-expanded", "true");
          trigger.nextElementSibling.hidden = false;
        }
      });
    });
  });
}

function bindKeyboardShortcuts() {
  window.addEventListener("keydown", (event) => {
    const typingTarget =
      event.target instanceof HTMLElement &&
      ["INPUT", "TEXTAREA"].includes(event.target.tagName);

    if (event.key === "/" && !typingTarget && searchInput) {
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });
}

function bindSectionHighlight() {
  const sections = [...document.querySelectorAll("[data-section]")];
  const targets = navLinks
    .map((link) => {
      const id = link.getAttribute("href");
      return { link, target: id ? document.querySelector(id) : null };
    })
    .filter((item) => item.target);

  if (!targets.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const currentId = `#${entry.target.id}`;
        targets.forEach(({ link }) => {
          link.classList.toggle("is-active", link.getAttribute("href") === currentId);
        });
      });
    },
    { rootMargin: "-35% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

function bindPointerAmbient() {
  window.addEventListener(
    "pointermove",
    (event) => {
      document.body.style.setProperty("--pointer-x", `${event.clientX}px`);
      document.body.style.setProperty("--pointer-y", `${event.clientY}px`);
    },
    { passive: true }
  );
}

function bindSpotlights() {
  spotlightTargets.forEach((target) => {
    target.addEventListener("pointermove", (event) => {
      const rect = target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      target.style.setProperty("--spotlight-x", `${x}px`);
      target.style.setProperty("--spotlight-y", `${y}px`);
    });
  });
}

function bindCopyButton() {
  if (!copyEmailButton || !copyToast) {
    return;
  }

  copyEmailButton.addEventListener("click", async () => {
    const value = copyEmailButton.dataset.copy || "";
    try {
      await navigator.clipboard.writeText(value);
      copyToast.hidden = false;
      window.clearTimeout(bindCopyButton.timeoutId);
      bindCopyButton.timeoutId = window.setTimeout(() => {
        copyToast.hidden = true;
      }, 1800);
    } catch {
      copyToast.textContent = "Kopieren nicht möglich";
      copyToast.hidden = false;
      window.clearTimeout(bindCopyButton.timeoutId);
      bindCopyButton.timeoutId = window.setTimeout(() => {
        copyToast.hidden = true;
        copyToast.textContent = "E-Mail-Adresse kopiert";
      }, 1800);
    }
  });
}

function startAnnouncementRotation() {
  if (!announcementText) {
    return;
  }

  window.setInterval(() => {
    announcementIndex = (announcementIndex + 1) % announcements.length;
    announcementText.textContent = announcements[announcementIndex];
  }, 3400);
}

function bindRevealObserver() {
  if (!revealTargets.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );

  revealTargets.forEach((target) => observer.observe(target));
}

function prepareTypeScroll() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    return;
  }

  typeTargets.forEach((target) => {
    if (!target || target.dataset.typePrepared === "true") {
      return;
    }

    const originalText = target.textContent || "";
    if (!originalText.trim()) {
      return;
    }

    target.dataset.typePrepared = "true";
    target.setAttribute("aria-label", originalText);
    target.classList.add("type-scroll");
    target.textContent = "";

    const tokens = originalText.split(/(\s+)/);
    let charIndex = 0;

    tokens.forEach((token) => {
      if (!token) {
        return;
      }

      if (/^\s+$/.test(token)) {
        target.appendChild(document.createTextNode(token));
        return;
      }

      const word = document.createElement("span");
      word.className = "type-scroll__word";
      word.setAttribute("aria-hidden", "true");

      [...token].forEach((character) => {
        const span = document.createElement("span");
        span.className = "type-scroll__char";
        span.style.setProperty("--char-index", String(charIndex));
        span.setAttribute("aria-hidden", "true");
        span.textContent = character;
        word.appendChild(span);
        charIndex += 1;
      });

      target.appendChild(word);
    });
  });
}

function bindTypeScroll() {
  if (!typeTargets.length) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    typeTargets.forEach((target) => target.classList.add("is-typed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-typed");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -16% 0px", threshold: 0.28 }
  );

  typeTargets.forEach((target) => observer.observe(target));
}

function animateCounter(element) {
  const target = Number(element.dataset.count);
  if (!Number.isFinite(target)) {
    return;
  }

  const duration = 900;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.round(target * (1 - Math.pow(1 - progress, 3)));
    element.textContent = String(value);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  }

  window.requestAnimationFrame(step);
}

function bindCounters() {
  if (!countTargets.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.45 }
  );

  countTargets.forEach((target) => observer.observe(target));
}

if (searchInput) {
  searchInput.addEventListener("input", filterPortfolio);
}

bindFilterChips();
bindFaq();
bindKeyboardShortcuts();
bindSectionHighlight();
bindRevealObserver();
bindCounters();
prepareTypeScroll();
bindTypeScroll();
bindPointerAmbient();
bindSpotlights();
bindCopyButton();
bindScrollChrome();
startAnnouncementRotation();
updateScrollChrome();
filterPortfolio();
