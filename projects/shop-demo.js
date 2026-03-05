const products = {
  white: {
    name: "T-Shirt Weiß",
    color: "weiß",
    price: 32.9
  },
  black: {
    name: "T-Shirt Schwarz",
    color: "schwarz",
    price: 36.9
  },
  blue: {
    name: "T-Shirt Blau",
    color: "blau",
    price: 34.9
  }
};

const shopSearch = document.getElementById("shopSearch");
const colorFilterButtons = [...document.querySelectorAll("[data-color-filter]")];
const productCards = [...document.querySelectorAll(".product-card")];
const addButtons = [...document.querySelectorAll("[data-add]")];

const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartSubtotal = document.getElementById("cartSubtotal");
const checkoutButton = document.getElementById("checkoutButton");

const checkoutModal = document.getElementById("checkoutModal");
const checkoutSummary = document.getElementById("checkoutSummary");
const confirmPaypal = document.getElementById("confirmPaypal");
const closeCheckout = document.getElementById("closeCheckout");
const closeCheckoutX = document.getElementById("closeCheckoutX");

const shopToast = document.getElementById("shopToast");

const slider = document.getElementById("shopSlider");
const slides = slider ? [...slider.querySelectorAll(".shop-slide")] : [];
const sliderPrev = document.getElementById("sliderPrev");
const sliderNext = document.getElementById("sliderNext");
const sliderDots = document.getElementById("shopSliderDots");

const cart = {
  white: 0,
  black: 0,
  blue: 0
};

let activeColorFilter = "all";
let sliderIndex = 0;
let sliderTimer = null;
let checkoutAutoCloseTimer = null;
let toastTimer = null;

function normalize(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss");
}

function formatPrice(value) {
  return `${value.toFixed(2).replace(".", ",")} EUR`;
}

function showToast(message) {
  if (!shopToast) {
    return;
  }

  shopToast.textContent = message;
  shopToast.hidden = false;

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    shopToast.hidden = true;
  }, 1800);
}

function applyProductFilter() {
  const term = normalize(shopSearch ? shopSearch.value : "");

  productCards.forEach((card) => {
    const color = normalize(card.dataset.color || "");
    const name = normalize(card.dataset.name || "");
    const extra = normalize(card.dataset.search || "");
    const categoryMatch = activeColorFilter === "all" || color === activeColorFilter;
    const termMatch = term === "" || name.includes(term) || color.includes(term) || extra.includes(term);

    card.hidden = !(categoryMatch && termMatch);
  });
}

function getCartEntries() {
  return Object.entries(cart).filter(([, quantity]) => quantity > 0);
}

function calculateTotal() {
  return getCartEntries().reduce((sum, [key, quantity]) => {
    return sum + products[key].price * quantity;
  }, 0);
}

function renderCart() {
  if (!cartItems || !cartCount || !cartSubtotal) {
    return;
  }

  const entries = getCartEntries();
  const totalItems = entries.reduce((sum, [, quantity]) => sum + quantity, 0);

  cartCount.textContent = String(totalItems);
  cartSubtotal.textContent = formatPrice(calculateTotal());

  if (!entries.length) {
    cartItems.innerHTML = '<li class="cart-empty">Noch keine Produkte im Warenkorb.</li>';
    return;
  }

  cartItems.innerHTML = entries
    .map(([key, quantity]) => {
      const product = products[key];
      return `
        <li class="cart-item">
          <div>
            <strong>${product.name}</strong>
            <small>${formatPrice(product.price)} / Stück</small>
          </div>
          <div class="qty-controls">
            <button type="button" data-action="dec" data-key="${key}" aria-label="Menge verringern">-</button>
            <span>${quantity}</span>
            <button type="button" data-action="inc" data-key="${key}" aria-label="Menge erhöhen">+</button>
            <button type="button" data-action="remove" data-key="${key}" aria-label="Produkt entfernen">×</button>
          </div>
        </li>
      `;
    })
    .join("");
}

function addToCart(key) {
  if (!products[key]) {
    return;
  }

  cart[key] += 1;
  renderCart();
  showToast(`${products[key].name} wurde in den Warenkorb gelegt.`);
}

function updateQuantity(key, action) {
  if (!products[key]) {
    return;
  }

  if (action === "inc") {
    cart[key] += 1;
  } else if (action === "dec") {
    cart[key] = Math.max(0, cart[key] - 1);
  } else if (action === "remove") {
    cart[key] = 0;
  }

  renderCart();
}

function openCheckoutModal() {
  const entries = getCartEntries();
  if (!entries.length) {
    showToast("Bitte zuerst ein Produkt in den Warenkorb legen.");
    return;
  }

  if (!checkoutModal || !checkoutSummary) {
    return;
  }

  const summary = entries.map(([key, qty]) => `${products[key].name} × ${qty}`).join(", ");
  checkoutSummary.textContent = `Demo-Bestellung: ${summary}. Gesamtsumme: ${formatPrice(calculateTotal())}.`;

  checkoutModal.hidden = false;
  checkoutModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeCheckoutModal() {
  if (!checkoutModal) {
    return;
  }

  checkoutModal.hidden = true;
  checkoutModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  window.clearTimeout(checkoutAutoCloseTimer);
  checkoutAutoCloseTimer = null;
}

function completeDemoCheckout() {
  if (!checkoutSummary) {
    return;
  }

  const entries = getCartEntries();
  if (!entries.length) {
    checkoutSummary.textContent = "Es wurden keine Produkte bestellt.";
    return;
  }

  checkoutSummary.textContent = "Demo erfolgreich: Die PayPal-Zahlung wurde simuliert. Es wurde keine echte Zahlung ausgeführt.";

  Object.keys(cart).forEach((key) => {
    cart[key] = 0;
  });

  renderCart();
  showToast("Demo-Zahlung erfolgreich simuliert.");

  window.clearTimeout(checkoutAutoCloseTimer);
  checkoutAutoCloseTimer = window.setTimeout(() => {
    closeCheckoutModal();
  }, 1200);
}

function setSlide(nextIndex) {
  if (!slides.length) {
    return;
  }

  sliderIndex = (nextIndex + slides.length) % slides.length;

  slides.forEach((slide, index) => {
    slide.classList.toggle("is-active", index === sliderIndex);
  });

  if (!sliderDots) {
    return;
  }

  [...sliderDots.querySelectorAll("button")].forEach((dot, index) => {
    dot.classList.toggle("is-active", index === sliderIndex);
  });
}

function startSliderAuto() {
  if (!slides.length) {
    return;
  }

  window.clearInterval(sliderTimer);
  sliderTimer = window.setInterval(() => {
    setSlide(sliderIndex + 1);
  }, 5200);
}

function buildSliderDots() {
  if (!sliderDots || !slides.length) {
    return;
  }

  sliderDots.innerHTML = slides
    .map((_, index) => {
      return `<button type="button" aria-label="Folie ${index + 1}" data-slide="${index}"></button>`;
    })
    .join("");

  sliderDots.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest("button");
    if (!button) {
      return;
    }

    const index = Number(button.dataset.slide);
    if (!Number.isFinite(index)) {
      return;
    }

    setSlide(index);
    startSliderAuto();
  });
}

function bindSlider() {
  if (!slides.length) {
    return;
  }

  buildSliderDots();
  setSlide(0);
  startSliderAuto();

  sliderPrev?.addEventListener("click", () => {
    setSlide(sliderIndex - 1);
    startSliderAuto();
  });

  sliderNext?.addEventListener("click", () => {
    setSlide(sliderIndex + 1);
    startSliderAuto();
  });

  slider?.addEventListener("pointerenter", () => {
    window.clearInterval(sliderTimer);
  });

  slider?.addEventListener("pointerleave", () => {
    startSliderAuto();
  });
}

shopSearch?.addEventListener("input", applyProductFilter);

if (colorFilterButtons.length) {
  colorFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeColorFilter = normalize(button.dataset.colorFilter || "all");
      colorFilterButtons.forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      applyProductFilter();
    });
  });
}

if (addButtons.length) {
  addButtons.forEach((button) => {
    button.addEventListener("click", () => {
      addToCart(button.dataset.add || "");
    });
  });
}

cartItems?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest("button");
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const key = button.dataset.key;
  if (!action || !key) {
    return;
  }

  updateQuantity(key, action);
});

checkoutButton?.addEventListener("click", openCheckoutModal);
closeCheckout?.addEventListener("click", closeCheckoutModal);
closeCheckoutX?.addEventListener("click", closeCheckoutModal);
confirmPaypal?.addEventListener("click", completeDemoCheckout);

checkoutModal?.addEventListener("click", (event) => {
  if (event.target === checkoutModal) {
    closeCheckoutModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && checkoutModal && !checkoutModal.hidden) {
    closeCheckoutModal();
  }
});

bindSlider();
applyProductFilter();
renderCart();
