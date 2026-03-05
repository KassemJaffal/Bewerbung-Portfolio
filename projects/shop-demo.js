const products = {
  white: {
    name: "T-Shirt Weiss",
    color: "weiss",
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

const cart = {
  white: 0,
  black: 0,
  blue: 0
};

let activeColorFilter = "all";

function normalize(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatPrice(value) {
  return `${value.toFixed(2).replace(".", ",")} EUR`;
}

function applyProductFilter() {
  const term = normalize(shopSearch ? shopSearch.value : "");

  productCards.forEach((card) => {
    const color = normalize(card.dataset.color || "");
    const name = normalize(card.dataset.name || "");
    const colorMatch = activeColorFilter === "all" || color === activeColorFilter;
    const termMatch = term === "" || name.includes(term) || color.includes(term);
    const visible = colorMatch && termMatch;
    card.hidden = !visible;
  });
}

function getCartEntries() {
  return Object.entries(cart).filter(([, quantity]) => quantity > 0);
}

function calculateTotal() {
  return getCartEntries().reduce((sum, [key, quantity]) => {
    const product = products[key];
    return sum + product.price * quantity;
  }, 0);
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
            <small>${formatPrice(product.price)} / Stueck</small>
          </div>
          <div class="qty-controls">
            <button type="button" data-action="dec" data-key="${key}" aria-label="Menge verringern">-</button>
            <span>${quantity}</span>
            <button type="button" data-action="inc" data-key="${key}" aria-label="Menge erhoehen">+</button>
            <button type="button" data-action="remove" data-key="${key}" aria-label="Produkt entfernen">x</button>
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
  if (!checkoutModal || !checkoutSummary) {
    return;
  }

  const entries = getCartEntries();
  if (!entries.length) {
    checkoutSummary.textContent = "Dein Warenkorb ist leer. Bitte zuerst ein Produkt auswaehlen.";
    checkoutModal.hidden = false;
    return;
  }

  const itemSummary = entries
    .map(([key, quantity]) => `${products[key].name} x ${quantity}`)
    .join(", ");
  checkoutSummary.textContent = `Demo-Bestellung: ${itemSummary}. Gesamtsumme: ${formatPrice(calculateTotal())}.`;
  checkoutModal.hidden = false;
}

function closeCheckoutModal() {
  if (!checkoutModal) {
    return;
  }
  checkoutModal.hidden = true;
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

  checkoutSummary.textContent = "Demo erfolgreich: Die PayPal-Zahlung wurde simuliert. Keine echte Zahlung wurde ausgefuehrt.";

  Object.keys(cart).forEach((key) => {
    cart[key] = 0;
  });
  renderCart();
}

if (shopSearch) {
  shopSearch.addEventListener("input", applyProductFilter);
}

if (colorFilterButtons.length) {
  colorFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeColorFilter = normalize(button.dataset.colorFilter || "all");
      colorFilterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      applyProductFilter();
    });
  });
}

if (addButtons.length) {
  addButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.add;
      addToCart(key);
    });
  });
}

if (cartItems) {
  cartItems.addEventListener("click", (event) => {
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
}

if (checkoutButton) {
  checkoutButton.addEventListener("click", openCheckoutModal);
}

if (closeCheckout) {
  closeCheckout.addEventListener("click", closeCheckoutModal);
}

if (confirmPaypal) {
  confirmPaypal.addEventListener("click", completeDemoCheckout);
}

if (checkoutModal) {
  checkoutModal.addEventListener("click", (event) => {
    if (event.target === checkoutModal) {
      closeCheckoutModal();
    }
  });
}

applyProductFilter();
renderCart();
