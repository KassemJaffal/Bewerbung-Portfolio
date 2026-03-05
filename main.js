const progressBar = document.getElementById("scrollProgress");
const navLinks = [...document.querySelectorAll(".site-nav__link")];
const revealTargets = [...document.querySelectorAll("[data-reveal]")];
const countTargets = [...document.querySelectorAll("[data-count]")];
const searchInput = document.getElementById("portfolioSearch");
const portfolioGrid = document.getElementById("portfolioGrid");
const resultCount = document.getElementById("portfolioResultCount");
const emptyState = document.getElementById("portfolioEmptyState");
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const copyEmailButton = document.getElementById("copyEmailButton");
const copyToast = document.getElementById("copyToast");

const scenarioButtons = [...document.querySelectorAll("[data-scenario]")];
const scenarioTitle = document.getElementById("scenarioTitle");
const scenarioText = document.getElementById("scenarioText");
const scenarioImage = document.getElementById("scenarioImage");

const visitorsRange = document.getElementById("visitorsRange");
const conversionRange = document.getElementById("conversionRange");
const basketRange = document.getElementById("basketRange");
const visitorsValue = document.getElementById("visitorsValue");
const conversionValue = document.getElementById("conversionValue");
const basketValue = document.getElementById("basketValue");
const ordersOutput = document.getElementById("ordersOutput");
const revenueOutput = document.getElementById("revenueOutput");

const tiltTargets = [...document.querySelectorAll("[data-tilt]")];

let activeFilter = "all";
let rafScroll = null;

const scenarios = {
  launch: {
    title: "Launch Week",
    text: "Fokus auf klare Navigation, Hero-Angebote und schnelle Orientierung für neue Besucher.",
    image: "assets/ecom-scenario-launch.svg",
    alt: "Szenario-Vorschau Launch Week"
  },
  sale: {
    title: "Sale Event",
    text: "Prominente Deal-Flächen, Produktkarten mit starken Preisankern und schnelle Add-to-Cart Wege.",
    image: "assets/ecom-scenario-sale.svg",
    alt: "Szenario-Vorschau Sale Event"
  },
  retain: {
    title: "Retention",
    text: "Wiederkehrende Nutzer durch personalisierte Vorschläge, übersichtliche Kontobereiche und klare Reorder-Pfade.",
    image: "assets/ecom-scenario-retain.svg",
    alt: "Szenario-Vorschau Retention"
  }
};

function normalize(value) {
  return (value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss");
}

function formatInteger(value) {
  return new Intl.NumberFormat("de-DE").format(Math.round(value));
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(value)} EUR`;
}

function updateProgressBar() {
  if (!progressBar) {
    return;
  }

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = `${progress}%`;
}

function bindScrollProgress() {
  window.addEventListener(
    "scroll",
    () => {
      if (rafScroll !== null) {
        return;
      }

      rafScroll = window.requestAnimationFrame(() => {
        updateProgressBar();
        rafScroll = null;
      });
    },
    { passive: true }
  );
}

function bindSectionHighlight() {
  if (!navLinks.length) {
    return;
  }

  const mapping = navLinks
    .map((link) => {
      const href = link.getAttribute("href");
      return {
        link,
        section: href ? document.querySelector(href) : null
      };
    })
    .filter((item) => item.section);

  if (!mapping.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const id = `#${entry.target.id}`;
        mapping.forEach(({ link }) => {
          link.classList.toggle("is-active", link.getAttribute("href") === id);
        });
      });
    },
    { rootMargin: "-40% 0px -46% 0px", threshold: 0 }
  );

  mapping.forEach(({ section }) => observer.observe(section));
}

function bindReveal() {
  if (!revealTargets.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );

  revealTargets.forEach((target) => observer.observe(target));
}

function animateCounter(element) {
  const target = Number(element.dataset.count);
  if (!Number.isFinite(target)) {
    return;
  }

  const start = performance.now();
  const duration = 900;

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
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
    { threshold: 0.5 }
  );

  countTargets.forEach((target) => observer.observe(target));
}

function filterPortfolio() {
  if (!portfolioGrid || !resultCount || !emptyState) {
    return;
  }

  const cards = [...portfolioGrid.querySelectorAll(".portfolio-card")];
  const term = normalize(searchInput ? searchInput.value : "");
  let visibleCount = 0;

  cards.forEach((card) => {
    const category = card.dataset.category || "";
    const haystack = normalize(card.dataset.search || "");
    const categoryMatch = activeFilter === "all" || category === activeFilter;
    const textMatch = term === "" || haystack.includes(term);
    const visible = categoryMatch && textMatch;

    card.classList.toggle("is-hidden", !visible);
    if (visible) {
      visibleCount += 1;
    }
  });

  resultCount.textContent = `${visibleCount} Projekt${visibleCount === 1 ? "" : "e"} gefunden`;
  emptyState.hidden = visibleCount !== 0;
}

function bindPortfolioFilters() {
  if (searchInput) {
    searchInput.addEventListener("input", filterPortfolio);
  }

  if (!filterButtons.length) {
    return;
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";
      filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      filterPortfolio();
    });
  });
}

function bindCopyEmail() {
  if (!copyEmailButton || !copyToast) {
    return;
  }

  copyEmailButton.addEventListener("click", async () => {
    const value = copyEmailButton.dataset.copy || "";
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      copyToast.hidden = false;
      window.clearTimeout(bindCopyEmail.timeoutId);
      bindCopyEmail.timeoutId = window.setTimeout(() => {
        copyToast.hidden = true;
      }, 1700);
    } catch {
      copyToast.textContent = "Kopieren nicht möglich";
      copyToast.hidden = false;
      window.clearTimeout(bindCopyEmail.timeoutId);
      bindCopyEmail.timeoutId = window.setTimeout(() => {
        copyToast.hidden = true;
        copyToast.textContent = "E-Mail-Adresse kopiert";
      }, 1700);
    }
  });
}

function bindScenarioSwitcher() {
  if (!scenarioButtons.length || !scenarioTitle || !scenarioText || !scenarioImage) {
    return;
  }

  scenarioButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.scenario;
      const scenario = key ? scenarios[key] : null;
      if (!scenario) {
        return;
      }

      scenarioTitle.textContent = scenario.title;
      scenarioText.textContent = scenario.text;
      scenarioImage.src = scenario.image;
      scenarioImage.alt = scenario.alt;

      scenarioButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    });
  });
}

function updateKpiCalculator() {
  if (!visitorsRange || !conversionRange || !basketRange) {
    return;
  }

  const visitors = Number(visitorsRange.value);
  const conversion = Number(conversionRange.value);
  const basket = Number(basketRange.value);

  const orders = Math.round((visitors * conversion) / 100);
  const revenue = orders * basket;

  if (visitorsValue) {
    visitorsValue.textContent = formatInteger(visitors);
  }
  if (conversionValue) {
    conversionValue.textContent = `${conversion.toFixed(1)}%`;
  }
  if (basketValue) {
    basketValue.textContent = `${formatInteger(basket)} EUR`;
  }
  if (ordersOutput) {
    ordersOutput.textContent = formatInteger(orders);
  }
  if (revenueOutput) {
    revenueOutput.textContent = formatCurrency(revenue);
  }
}

function bindKpiCalculator() {
  if (!visitorsRange || !conversionRange || !basketRange) {
    return;
  }

  [visitorsRange, conversionRange, basketRange].forEach((input) => {
    input.addEventListener("input", updateKpiCalculator);
  });

  updateKpiCalculator();
}

function bindTilt() {
  if (!tiltTargets.length) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    return;
  }

  tiltTargets.forEach((target) => {
    target.addEventListener("pointermove", (event) => {
      const rect = target.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * 4;
      const rotateY = (x - 0.5) * 5;
      target.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    });

    target.addEventListener("pointerleave", () => {
      target.style.transform = "";
    });
  });
}

bindScrollProgress();
bindSectionHighlight();
bindReveal();
bindCounters();
bindPortfolioFilters();
bindCopyEmail();
bindScenarioSwitcher();
bindKpiCalculator();
bindTilt();

updateProgressBar();
filterPortfolio();
