const DEFAULT_ENABLED = true;
const SELECTORS = {
  sidebar: 'global-explore-navigation',
  header: 'global-top-navigation',
  mainContent: '.main-container',
  banner: '.fandom-community-header__background',
  rightRail: '.page__right-rail',
  footer: '.global-footer',
};

let isEnabled = null;
let hasStarted = false;

function removeIfPresent(element) {
  if (element && element.remove) {
    element.remove();
  }
}

function applyFanblocker() {
  if (!isEnabled) {
    return;
  }

  const fandomSidebar = document.getElementById(SELECTORS.sidebar);
  const fandomHeader = document.getElementById(SELECTORS.header);
  const fandomMainContent = document.querySelector(SELECTORS.mainContent);
  const fandomMainBanner = document.querySelector(SELECTORS.banner);
  const fandomRightRail = document.querySelector(SELECTORS.rightRail);
  const fandomFooter = document.querySelectorAll(SELECTORS.footer);

  removeIfPresent(fandomSidebar);
  removeIfPresent(fandomHeader);
  removeIfPresent(fandomRightRail);
  fandomFooter.forEach((footer) => removeIfPresent(footer));

  if (fandomMainContent) {
    fandomMainContent.style.marginLeft = '0';
    fandomMainContent.style.width = '100%';
  }

  if (fandomMainBanner) {
    fandomMainBanner.style.transform = 'none';
  }
}

function setEnabledState(value) {
  isEnabled = value !== false;
  if (isEnabled) {
    applyFanblocker();
  }
}

function getStoredEnabled() {
  if (typeof browser === 'undefined' || !browser.storage || !browser.storage.local) {
    return Promise.resolve(DEFAULT_ENABLED);
  }

  return browser.storage.local
    .get({ enabled: DEFAULT_ENABLED })
    .then((result) => result.enabled !== false)
    .catch(() => DEFAULT_ENABLED);
}

function startFanblocker() {
  if (hasStarted) {
    return;
  }

  hasStarted = true;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFanblocker);
  } else {
    applyFanblocker();
  }
}

function initFanblocker() {
  getStoredEnabled().then((enabled) => {
    setEnabledState(enabled);
    startFanblocker();
  });

  if (typeof browser !== 'undefined' && browser.storage && browser.storage.onChanged) {
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.enabled) {
        setEnabledState(changes.enabled.newValue);
      }
    });
  }
}

initFanblocker();

const observer = new MutationObserver(() => {
  if (isEnabled) {
    applyFanblocker();
  }
});

if (document.documentElement) {
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
  browser.runtime.onMessage.addListener((message) => {
    if (!message) {
      return;
    }

    if (message.type === 'fanblocker-reinject') {
      applyFanblocker();
      return;
    }

    if (message.type === 'fanblocker-set-enabled') {
      setEnabledState(message.enabled);
    }
  });
}