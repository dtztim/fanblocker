const DEFAULT_ENABLED = true;
const INJECT_LABEL = 'Inject';
const DONE_LABEL = 'Done!';
const NOT_ON_FANDOM_LABEL = 'Not on Fandom.com';

function withActiveTab(handler) {
  if (typeof browser === 'undefined' || !browser.tabs) {
    return Promise.resolve();
  }

  return browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const activeTab = tabs && tabs[0];
    if (!activeTab || !activeTab.id) {
      return null;
    }

    return handler(activeTab);
  });
}

function sendMessageToActiveTab(message) {
  return withActiveTab((activeTab) => {
    return browser.tabs.sendMessage(activeTab.id, message).catch(() => {
      // Ignore if the page does not have the content script.
    });
  });
}

function reinjectActiveTab() {
  return sendMessageToActiveTab({ type: 'fanblocker-reinject' });
}

function setEnabledState(enabled, options) {
  const shouldReload = options && options.reload;

  if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
    browser.storage.local.set({ enabled });
  }

  sendMessageToActiveTab({
    type: 'fanblocker-set-enabled',
    enabled,
  });

  if (shouldReload && typeof browser !== 'undefined' && browser.tabs) {
    withActiveTab((activeTab) => {
      return browser.tabs.reload(activeTab.id);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const reinjectButton = document.getElementById('fanblocker-reinject');
  const enableToggle = document.getElementById('fanblocker-enable');
  let reinjectResetTimer = null;

  const updateButtonLabel = (label) => {
    if (reinjectButton) {
      reinjectButton.textContent = label;
    }
  };

  const updateUiDisabledState = (disabled, labelOverride) => {
    if (reinjectButton) {
      reinjectButton.disabled = disabled;
      updateButtonLabel(labelOverride || INJECT_LABEL);
    }

    if (enableToggle) {
      enableToggle.disabled = disabled;
    }
  };

  const showDoneState = () => {
    updateButtonLabel(DONE_LABEL);

    if (reinjectResetTimer) {
      clearTimeout(reinjectResetTimer);
    }

    reinjectResetTimer = setTimeout(() => {
      updateButtonLabel(INJECT_LABEL);
      reinjectResetTimer = null;
    }, 2000);
  };

  withActiveTab((activeTab) => {
    let isFandom = false;

    if (activeTab && activeTab.url) {
      try {
        const url = new URL(activeTab.url);
        isFandom = url.hostname === 'fandom.com' || url.hostname.endsWith('.fandom.com');
      } catch (error) {
        isFandom = false;
      }
    }

    updateUiDisabledState(!isFandom, isFandom ? INJECT_LABEL : NOT_ON_FANDOM_LABEL);

    if (!enableToggle) {
      return;
    }

    if (!isFandom) {
      enableToggle.checked = false;
      return;
    }

    if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
      browser.storage.local.get({ enabled: DEFAULT_ENABLED }).then((result) => {
        enableToggle.checked = result.enabled !== false;
      });
    }
  });

  if (reinjectButton) {
    reinjectButton.addEventListener('click', (event) => {
      event.preventDefault();

      if (reinjectButton.disabled) {
        return;
      }

      if (enableToggle && !enableToggle.checked) {
        enableToggle.checked = true;
        setEnabledState(true, { reload: false });
      }

      reinjectActiveTab();
      showDoneState();
    });
  }

  if (enableToggle) {
    enableToggle.addEventListener('change', () => {
      const enabled = enableToggle.checked;
      setEnabledState(enabled, { reload: !enabled });
    });
  }
});
