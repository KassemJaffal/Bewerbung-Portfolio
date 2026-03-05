const products = {
  white: {
    name: "T-Shirt Weiß",
    color: "weiß",
    price: 32.9,
    rating: 4.8
  },
  black: {
    name: "T-Shirt Schwarz",
    color: "schwarz",
    price: 36.9,
    rating: 4.9
  },
  blue: {
    name: "T-Shirt Blau",
    color: "blau",
    price: 34.9,
    rating: 4.6
  }
};

const FREE_SHIPPING_THRESHOLD = 90;

const shopGrid = document.getElementById("shopGrid");
const shopSearch = document.getElementById("shopSearch");
const sortSelect = document.getElementById("sortSelect");
const colorFilterButtons = [...document.querySelectorAll("[data-color-filter]")];
const productCards = [...document.querySelectorAll(".product-card")];
const addButtons = [...document.querySelectorAll("[data-add]")];
const wishlistButtons = [...document.querySelectorAll("[data-wishlist]")];

const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartSubtotal = document.getElementById("cartSubtotal");
const shippingLabel = document.getElementById("shippingLabel");
const shippingFill = document.getElementById("shippingFill");
const clearCartButton = document.getElementById("clearCartButton");

const wishlistCountBadge = document.getElementById("wishlistCountBadge");
const shopToast = document.getElementById("shopToast");

const slider = document.getElementById("shopSlider");
const slides = slider ? [...slider.querySelectorAll(".shop-slide")] : [];
const sliderPrev = document.getElementById("sliderPrev");
const sliderNext = document.getElementById("sliderNext");
const sliderDots = document.getElementById("shopSliderDots");

// Defensive cleanup: removes legacy modal markup from old cached versions.
document.getElementById("checkoutModal")?.remove();
document.querySelector(".modal-backdrop")?.remove();
document.body.style.removeProperty("overflow");

const cart = {
  white: 0,
  black: 0,
  blue: 0
};

const wishlist = new Set();

let activeColorFilter = "all";
let sliderIndex = 0;
let sliderTimer = null;
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
  }, 1900);
}

function updateWishlistCount() {
  if (!wishlistCountBadge) {
    return;
  }
  wishlistCountBadge.textContent = `Favoriten: ${wishlist.size}`;
}

function toggleWishlist(productKey, button) {
  if (!products[productKey]) {
    return;
  }

  if (wishlist.has(productKey)) {
    wishlist.delete(productKey);
  } else {
    wishlist.add(productKey);
  }

  const active = wishlist.has(productKey);
  button.classList.toggle("is-active", active);
  button.textContent = active ? "♥" : "♡";
  updateWishlistCount();
}

function sortCards(cards) {
  const mode = sortSelect ? sortSelect.value : "featured";
  const sorted = [...cards];

  if (mode === "price-asc") {
    sorted.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
  } else if (mode === "price-desc") {
    sorted.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
  } else if (mode === "rating-desc") {
    sorted.sort((a, b) => Number(b.dataset.rating) - Number(a.dataset.rating));
  }

  return sorted;
}

function applyProductFilterAndSort() {
  if (!shopGrid) {
    return;
  }

  const term = normalize(shopSearch ? shopSearch.value : "");

  const matchingCards = productCards.filter((card) => {
    const color = normalize(card.dataset.color || "");
    const name = normalize(card.dataset.name || "");
    const extra = normalize(card.dataset.search || "");
    const categoryMatch = activeColorFilter === "all" || color === activeColorFilter;
    const termMatch = term === "" || name.includes(term) || color.includes(term) || extra.includes(term);
    const visible = categoryMatch && termMatch;
    card.hidden = !visible;
    return visible;
  });

  const sorted = sortCards(matchingCards);
  sorted.forEach((card) => {
    shopGrid.appendChild(card);
  });
}

function getCartEntries() {
  return Object.entries(cart).filter(([, quantity]) => quantity > 0);
}

function calculateTotal() {
  return getCartEntries().reduce((sum, [key, quantity]) => sum + products[key].price * quantity, 0);
}

function updateShippingProgress(total) {
  if (!shippingLabel || !shippingFill) {
    return;
  }

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const progress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);

  shippingFill.style.width = `${progress}%`;

  if (remaining <= 0) {
    shippingLabel.textContent = "Gratisversand erreicht.";
  } else {
    shippingLabel.textContent = `Noch ${formatPrice(remaining)} bis zum Gratisversand.`;
  }
}

function renderCart() {
  if (!cartItems || !cartCount || !cartSubtotal) {
    return;
  }

  const entries = getCartEntries();
  const totalItems = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
  const totalPrice = calculateTotal();

  cartCount.textContent = String(totalItems);
  cartSubtotal.textContent = formatPrice(totalPrice);
  updateShippingProgress(totalPrice);

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

function clearCart() {
  Object.keys(cart).forEach((key) => {
    cart[key] = 0;
  });
  renderCart();
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
    .map((_, index) => `<button type="button" aria-label="Folie ${index + 1}" data-slide="${index}"></button>`)
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

shopSearch?.addEventListener("input", applyProductFilterAndSort);
sortSelect?.addEventListener("change", applyProductFilterAndSort);

if (colorFilterButtons.length) {
  colorFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeColorFilter = normalize(button.dataset.colorFilter || "all");
      colorFilterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      applyProductFilterAndSort();
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

if (wishlistButtons.length) {
  wishlistButtons.forEach((button) => {
    button.addEventListener("click", () => {
      toggleWishlist(button.dataset.wishlist || "", button);
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

clearCartButton?.addEventListener("click", () => {
  clearCart();
  showToast("Warenkorb geleert.");
});

bindSlider();
updateWishlistCount();
applyProductFilterAndSort();
renderCart();
