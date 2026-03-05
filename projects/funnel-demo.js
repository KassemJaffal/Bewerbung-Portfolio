const funnelForm = document.getElementById("funnelForm");
const stepPanels = [...document.querySelectorAll("[data-funnel-step]")];
const stepIndicators = [...document.querySelectorAll("[data-funnel-indicator]")];
const prevButton = document.getElementById("funnelPrev");
const nextButton = document.getElementById("funnelNext");
const submitButton = document.getElementById("funnelSubmit");
const feedback = document.getElementById("funnelFeedback");

const packageInputs = [...document.querySelectorAll('input[name="package"]')];
const nameInput = document.getElementById("leadName");
const addressInput = document.getElementById("leadAddress");
const cityInput = document.getElementById("leadCity");
const dateInput = document.getElementById("leadDate");
const slotInput = document.getElementById("leadSlot");

const summaryPackage = document.getElementById("summaryPackage");
const summaryName = document.getElementById("summaryName");
const summaryAddress = document.getElementById("summaryAddress");
const summaryDate = document.getElementById("summaryDate");
const summarySlot = document.getElementById("summarySlot");

let currentStep = 0;

function setTodayAsMinDate() {
  if (!dateInput) {
    return;
  }

  const today = new Date();
  const iso = today.toISOString().split("T")[0];
  dateInput.min = iso;
}

function updateSummary() {
  const activePackage = packageInputs.find((input) => input.checked);
  const packageValue = activePackage ? activePackage.value : "-";

  if (summaryPackage) {
    summaryPackage.textContent = packageValue;
  }

  if (summaryName) {
    summaryName.textContent = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "-";
  }

  if (summaryAddress) {
    if (addressInput && addressInput.value.trim()) {
      const city = cityInput && cityInput.value.trim() ? `, ${cityInput.value.trim()}` : "";
      summaryAddress.textContent = `${addressInput.value.trim()}${city}`;
    } else {
      summaryAddress.textContent = "-";
    }
  }

  if (summaryDate) {
    summaryDate.textContent = dateInput && dateInput.value ? dateInput.value : "-";
  }

  if (summarySlot) {
    summarySlot.textContent = slotInput && slotInput.value ? slotInput.value : "-";
  }
}

function validateStep(index) {
  const panel = stepPanels[index];
  if (!panel) {
    return false;
  }

  const requiredFields = [...panel.querySelectorAll("[required]")];
  for (const field of requiredFields) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }

  return true;
}

function renderStep(index) {
  currentStep = Math.min(Math.max(index, 0), stepPanels.length - 1);

  stepPanels.forEach((panel, panelIndex) => {
    panel.hidden = panelIndex !== currentStep;
  });

  stepIndicators.forEach((indicator, indicatorIndex) => {
    indicator.classList.toggle("is-active", indicatorIndex === currentStep);
    indicator.classList.toggle("is-complete", indicatorIndex < currentStep);
  });

  if (prevButton) {
    prevButton.disabled = currentStep === 0;
  }

  if (nextButton) {
    nextButton.hidden = currentStep === stepPanels.length - 1;
  }

  if (submitButton) {
    submitButton.hidden = currentStep !== stepPanels.length - 1;
  }
}

function handleNext() {
  if (!validateStep(currentStep)) {
    return;
  }

  renderStep(currentStep + 1);
  updateSummary();
}

function handlePrev() {
  renderStep(currentStep - 1);
  updateSummary();
}

function resetFunnel() {
  funnelForm?.reset();
  if (packageInputs.length) {
    packageInputs[0].checked = true;
  }
  setTodayAsMinDate();
  renderStep(0);
  updateSummary();
}

function handleSubmit(event) {
  event.preventDefault();
  if (!validateStep(currentStep)) {
    return;
  }

  updateSummary();

  if (feedback) {
    feedback.hidden = false;
    feedback.textContent = `Anfrage gesendet (Demo): ${summaryPackage?.textContent || "Paket"}, ${summaryName?.textContent || "Name"}, Termin ${summaryDate?.textContent || "-"} ${summarySlot?.textContent || ""}.`;
  }

  window.setTimeout(() => {
    resetFunnel();
  }, 650);
}

if (funnelForm && stepPanels.length) {
  setTodayAsMinDate();
  renderStep(0);
  updateSummary();

  nextButton?.addEventListener("click", handleNext);
  prevButton?.addEventListener("click", handlePrev);
  funnelForm.addEventListener("submit", handleSubmit);

  packageInputs.forEach((input) => input.addEventListener("change", updateSummary));
  nameInput?.addEventListener("input", updateSummary);
  addressInput?.addEventListener("input", updateSummary);
  cityInput?.addEventListener("input", updateSummary);
  dateInput?.addEventListener("change", updateSummary);
  slotInput?.addEventListener("change", updateSummary);
}
