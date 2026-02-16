const VERSION = "0.1.5";
const DEFAULT_SETTINGS = {
  enabled: false,
  panoramic: false,
};
const api = typeof browser !== "undefined" ? browser : chrome;

const storageGet = (keys) =>
  new Promise((resolve) => api.storage.local.get(keys, resolve));
const storageSet = (values) =>
  new Promise((resolve) => api.storage.local.set(values, resolve));

const queryActiveTab = () => {
  const result = api.tabs.query({ active: true, currentWindow: true });
  if (result && typeof result.then === "function") {
    return result;
  }
  return new Promise((resolve) =>
    api.tabs.query({ active: true, currentWindow: true }, resolve)
  );
};

const sendUpdate = async (settings) => {
  const tabs = await queryActiveTab();
  if (!tabs || !tabs[0]) {
    return;
  }

  const message = { type: "fanblocker:update", settings };
  const result = api.tabs.sendMessage(tabs[0].id, message);
  if (result && typeof result.catch === "function") {
    result.catch(() => undefined);
  }
};

const setVersionLabel = () => {
  const versionElement = document.getElementById("versionFB");
  if (versionElement) {
    versionElement.textContent = VERSION;
  }
};

const wireOptionsLink = () => {
  const configLink = document.getElementById("openConfig");
  if (!configLink) {
    return;
  }

  configLink.addEventListener("click", (event) => {
    event.preventDefault();
    if (api.runtime && api.runtime.openOptionsPage) {
      api.runtime.openOptionsPage();
    } else if (api.runtime && api.runtime.getURL) {
      window.open(api.runtime.getURL("interface/options.html"));
    }
  });
};

const updatePreview = (preview, isEnabled, panoramicEnabled) => {
  if (!preview) {
    return;
  }

  const hiddenClasses = [
    "_preview-hide-header",
    "_preview-hide-sidebar",
    "_preview-hide-rail",
  ];

  hiddenClasses.forEach((className) => {
    preview.classList.toggle(className, isEnabled);
  });

  preview.classList.toggle("_preview-full-width", panoramicEnabled);
};

document.addEventListener("DOMContentLoaded", async () => {
  setVersionLabel();
  wireOptionsLink();

  const preview = document.querySelector(".preview");
  const panoramicToggle = document.getElementById("panoramicFB");
  const enableButton = document.getElementById("enableFB");

  if (!panoramicToggle || !enableButton) {
    return;
  }

  const stored = await storageGet(DEFAULT_SETTINGS);
  const settings = {
    enabled: !!stored.enabled,
    panoramic: !!stored.panoramic,
  };

  const updateUi = () => {
    const isEnabled = settings.enabled;
    const panoramicEnabled = settings.panoramic && isEnabled;

    panoramicToggle.checked = settings.panoramic;
    panoramicToggle.disabled = !isEnabled;

    enableButton.textContent = isEnabled ? "Disable" : "Enable";
    enableButton.classList.toggle("is-enabled", isEnabled);
    enableButton.classList.toggle("is-disabled", !isEnabled);

    updatePreview(preview, isEnabled, panoramicEnabled);
  };

  updateUi();

  panoramicToggle.addEventListener("change", async () => {
    settings.panoramic = panoramicToggle.checked;
    updateUi();
    await storageSet({ panoramic: settings.panoramic });
    sendUpdate(settings);
  });

  enableButton.addEventListener("click", async () => {
    settings.enabled = !settings.enabled;
    updateUi();
    await storageSet({ enabled: settings.enabled });
    sendUpdate(settings);
  });
});