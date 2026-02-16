const VERSION = "0.1.5";
const DEFAULT_PARTS = {
  header: true,
  sidebar: true,
  rail: true,
  footer: false,
};

const SELECTOR_CATALOG = [
  {
    id: "global-top-navigation",
    label: "Global Top Navigation",
    selector: "#global-top-navigation",
    category: "header",
  },
  {
    id: "global-navigation",
    label: "Global Navigation",
    selector: "#global-navigation",
    category: "header",
  },
  {
    id: "global-navigation-class",
    label: "Global Navigation (class)",
    selector: ".global-navigation",
    category: "header",
  },
  {
    id: "global-navigation-container",
    label: "Global Navigation Container",
    selector: ".global-navigation__container",
    category: "header",
  },
  {
    id: "global-navigation-content",
    label: "Global Navigation Content",
    selector: ".global-navigation__content",
    category: "header",
  },
  {
    id: "fandom-sticky-header",
    label: "Fandom Sticky Header",
    selector: ".fandom-sticky-header",
    category: "header",
  },
  {
    id: "fandom-community-header-tag",
    label: "Fandom Community Header (tag)",
    selector: "header.fandom-community-header",
    category: "header",
  },
  {
    id: "fandom-community-header",
    label: "Fandom Community Header",
    selector: ".fandom-community-header",
    category: "header",
  },
  {
    id: "community-header-wrapper",
    label: "Community Header Wrapper",
    selector: ".community-header-wrapper",
    category: "header",
  },
  {
    id: "wds-global-navigation",
    label: "WDS Global Navigation",
    selector: ".wds-global-navigation",
    category: "header",
  },
  {
    id: "wds-global-navigation-content",
    label: "WDS Global Navigation Content",
    selector: ".wds-global-navigation__content",
    category: "header",
  },
  {
    id: "wds-global-navigation-links",
    label: "WDS Global Navigation Links",
    selector: ".wds-global-navigation__links",
    category: "header",
  },
  {
    id: "global-explore-navigation",
    label: "Global Explore Navigation",
    selector: "#global-explore-navigation",
    category: "sidebar",
  },
  {
    id: "page-left-rail",
    label: "Page Left Rail",
    selector: ".page__left-rail",
    category: "sidebar",
  },
  {
    id: "page-right-rail",
    label: "Page Right Rail",
    selector: ".page__right-rail",
    category: "rail",
  },
  {
    id: "page-rail",
    label: "Page Rail",
    selector: ".page__rail",
    category: "rail",
  },
  {
    id: "page-side-rail",
    label: "Page Side Rail",
    selector: ".page-side-rail",
    category: "rail",
  },
  {
    id: "rail-module",
    label: "Rail Module",
    selector: ".rail-module",
    category: "rail",
  },
  {
    id: "global-footer",
    label: "Global Footer",
    selector: ".global-footer",
    category: "footer",
  },
  {
    id: "global-footer-content",
    label: "Global Footer Content",
    selector: ".global-footer__content",
    category: "footer",
  },
  {
    id: "fandom-footer",
    label: "Fandom Footer",
    selector: "footer.fandom-footer",
    category: "footer",
  },
  {
    id: "page-footer",
    label: "Page Footer",
    selector: ".page-footer",
    category: "footer",
  },
  {
    id: "wikia-footer",
    label: "Wikia Footer",
    selector: ".WikiaFooter",
    category: "footer",
  },
  {
    id: "site-footer",
    label: "Site Footer",
    selector: ".site-footer",
    category: "footer",
  },
];

const DEFAULT_SELECTORS = SELECTOR_CATALOG.reduce((acc, item) => {
  acc[item.id] = true;
  return acc;
}, {});

const DEFAULT_SETTINGS = {
  enabled: false,
  panoramic: false,
  parts: DEFAULT_PARTS,
  selectors: DEFAULT_SELECTORS,
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

const mergeSettings = (base, update = {}) => ({
  enabled: update.enabled !== undefined ? !!update.enabled : base.enabled,
  panoramic:
    update.panoramic !== undefined ? !!update.panoramic : base.panoramic,
  parts: { ...base.parts, ...(update.parts || {}) },
  selectors: { ...base.selectors, ...(update.selectors || {}) },
});

const setVersionLabel = () => {
  const versionElement = document.getElementById("versionFB");
  if (versionElement) {
    versionElement.textContent = VERSION;
  }
};

const updatePreview = (preview, settings) => {
  if (!preview) {
    return;
  }

  const isEnabled = settings.enabled;
  const classMap = {
    header: "_preview-hide-header",
    sidebar: "_preview-hide-sidebar",
    rail: "_preview-hide-rail",
    footer: "_preview-hide-footer",
  };

  preview.classList.toggle(
    classMap.header,
    isEnabled && settings.parts.header
  );
  preview.classList.toggle(
    classMap.sidebar,
    isEnabled && settings.parts.sidebar
  );
  preview.classList.toggle(classMap.rail, isEnabled && settings.parts.rail);
  preview.classList.toggle(
    classMap.footer,
    isEnabled && settings.parts.footer
  );
  preview.classList.toggle(
    "_preview-full-width",
    isEnabled && settings.panoramic
  );
};

const updateToggleUi = (controls, settings) => {
  controls.enableButton.textContent = settings.enabled ? "Disable" : "Enable";
  controls.enableButton.classList.toggle("is-enabled", settings.enabled);
  controls.enableButton.classList.toggle("is-disabled", !settings.enabled);

  controls.panoramicToggle.checked = settings.panoramic;
  controls.partHeader.checked = settings.parts.header;
  controls.partSidebar.checked = settings.parts.sidebar;
  controls.partRail.checked = settings.parts.rail;
  controls.partFooter.checked = settings.parts.footer;
};

const renderSelectorList = (container, settings) => {
  container.innerHTML = "";
  SELECTOR_CATALOG.forEach((item) => {
    const wrapper = document.createElement("label");
    wrapper.className = "dev-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = settings.selectors[item.id] !== false;
    checkbox.dataset.selectorId = item.id;

    const text = document.createElement("span");
    text.textContent = `${item.label} (${item.selector})`;

    wrapper.appendChild(checkbox);
    wrapper.appendChild(text);
    container.appendChild(wrapper);
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  setVersionLabel();

  const preview = document.querySelector(".preview");
  const selectorList = document.getElementById("selectorList");
  const controls = {
    enableButton: document.getElementById("enableFB"),
    panoramicToggle: document.getElementById("panoramicFB"),
    partHeader: document.getElementById("partHeader"),
    partSidebar: document.getElementById("partSidebar"),
    partRail: document.getElementById("partRail"),
    partFooter: document.getElementById("partFooter"),
  };

  if (
    !controls.enableButton ||
    !controls.panoramicToggle ||
    !selectorList ||
    !controls.partHeader ||
    !controls.partSidebar ||
    !controls.partRail ||
    !controls.partFooter
  ) {
    return;
  }

  let settings = mergeSettings(DEFAULT_SETTINGS, {});
  const stored = await storageGet(["enabled", "panoramic", "parts", "selectors"]);
  settings = mergeSettings(settings, stored);

  updateToggleUi(controls, settings);
  updatePreview(preview, settings);
  renderSelectorList(selectorList, settings);

  const persistAndSync = async (update) => {
    settings = mergeSettings(settings, update);
    updateToggleUi(controls, settings);
    updatePreview(preview, settings);
    await storageSet(update);
    sendUpdate(settings);
  };

  controls.panoramicToggle.addEventListener("change", () => {
    persistAndSync({ panoramic: controls.panoramicToggle.checked });
  });

  controls.partHeader.addEventListener("change", () => {
    persistAndSync({
      parts: { ...settings.parts, header: controls.partHeader.checked },
    });
  });

  controls.partSidebar.addEventListener("change", () => {
    persistAndSync({
      parts: { ...settings.parts, sidebar: controls.partSidebar.checked },
    });
  });

  controls.partRail.addEventListener("change", () => {
    persistAndSync({
      parts: { ...settings.parts, rail: controls.partRail.checked },
    });
  });

  controls.partFooter.addEventListener("change", () => {
    persistAndSync({
      parts: { ...settings.parts, footer: controls.partFooter.checked },
    });
  });

  controls.enableButton.addEventListener("click", () => {
    persistAndSync({ enabled: !settings.enabled });
  });

  selectorList.addEventListener("change", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    if (!target.dataset.selectorId) {
      return;
    }
    settings.selectors[target.dataset.selectorId] = target.checked;
    await storageSet({ selectors: settings.selectors });
    sendUpdate(settings);
  });
});
