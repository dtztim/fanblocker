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

const STYLE_ID = "fanblocker-style";
const ROOT_ENABLED_CLASS = "fanblocker-enabled";
const ROOT_PANORAMIC_CLASS = "fanblocker-panoramic";
const api = typeof browser !== "undefined" ? browser : chrome;

const panoramicSelectors = [
	".page__main",
	".main-container",
	".resizable-container",
	".page-content",
	".page-content__inner",
	"#content",
];

const storageGet = (keys) =>
	new Promise((resolve) => api.storage.local.get(keys, resolve));

let currentSettings = {
	...DEFAULT_SETTINGS,
	parts: { ...DEFAULT_PARTS },
	selectors: { ...DEFAULT_SELECTORS },
};

function mergeSettings(base, update = {}) {
	return {
		enabled:
			update.enabled !== undefined ? !!update.enabled : base.enabled,
		panoramic:
			update.panoramic !== undefined
				? !!update.panoramic
				: base.panoramic,
		parts: { ...base.parts, ...(update.parts || {}) },
		selectors: { ...base.selectors, ...(update.selectors || {}) },
	};
}

function getSelectorsByCategory(category, settings) {
	return SELECTOR_CATALOG.filter(
		(item) =>
			item.category === category && settings.selectors[item.id] !== false
	).map((item) => item.selector);
}

function ensureStyleElement() {
	let style = document.getElementById(STYLE_ID);
	if (!style) {
		style = document.createElement("style");
		style.id = STYLE_ID;
		(document.head || document.documentElement).appendChild(style);
	}
	return style;
}

function buildCss(settings) {
	if (!settings.enabled) {
		return "";
	}

	const activeSelectors = [];
	if (settings.parts.header) {
		activeSelectors.push(...getSelectorsByCategory("header", settings));
	}
	if (settings.parts.sidebar) {
		activeSelectors.push(...getSelectorsByCategory("sidebar", settings));
	}
	if (settings.parts.rail) {
		activeSelectors.push(...getSelectorsByCategory("rail", settings));
	}
	if (settings.parts.footer) {
		activeSelectors.push(...getSelectorsByCategory("footer", settings));
	}

	const baseRule = activeSelectors.length
		? `html.${ROOT_ENABLED_CLASS} ${activeSelectors.join(
				",\nhtml." + ROOT_ENABLED_CLASS + " "
		  )} {\n  display: none !important;\n}`
		: "";

	const mainContainerRule = `\nhtml.${ROOT_ENABLED_CLASS} .main-container {\n  margin-left: 0 !important;\n  width: 100% !important;\n  max-width: 100% !important;\n}`;

	if (!settings.panoramic) {
		return baseRule + mainContainerRule;
	}

	const panoramicRule = `\nhtml.${ROOT_PANORAMIC_CLASS} ${panoramicSelectors.join(
		",\nhtml." + ROOT_PANORAMIC_CLASS + " "
	)} {\n  max-width: 100% !important;\n  width: 100% !important;\n  margin: 0 auto !important;\n}`;

	return baseRule + mainContainerRule + panoramicRule;
}

function applySettings(settings) {
	currentSettings = mergeSettings(currentSettings, settings);
	const root = document.documentElement;
	if (!root) {
		return;
	}

	if (currentSettings.enabled) {
		root.classList.add(ROOT_ENABLED_CLASS);
	} else {
		root.classList.remove(ROOT_ENABLED_CLASS);
	}

	if (currentSettings.enabled && currentSettings.panoramic) {
		root.classList.add(ROOT_PANORAMIC_CLASS);
	} else {
		root.classList.remove(ROOT_PANORAMIC_CLASS);
	}

	const style = ensureStyleElement();
	const css = buildCss(currentSettings);
	if (css) {
		style.textContent = css;
	} else if (style.parentNode) {
		style.parentNode.removeChild(style);
	}
}

function listenForUpdates() {
	if (api.runtime && api.runtime.onMessage) {
		api.runtime.onMessage.addListener((message) => {
			if (message && message.type === "fanblocker:update") {
				applySettings(message.settings || {});
			}
		});
	}

	if (api.storage && api.storage.onChanged) {
		api.storage.onChanged.addListener((changes, area) => {
			if (area !== "local") {
				return;
			}

			if (
				changes.enabled ||
				changes.panoramic ||
				changes.parts ||
				changes.selectors
			) {
				applySettings({
					enabled: changes.enabled
						? !!changes.enabled.newValue
						: currentSettings.enabled,
					panoramic: changes.panoramic
						? !!changes.panoramic.newValue
						: currentSettings.panoramic,
					parts: changes.parts
						? changes.parts.newValue || {}
						: currentSettings.parts,
					selectors: changes.selectors
						? changes.selectors.newValue || {}
						: currentSettings.selectors,
				});
			}
		});
	}
}

storageGet(["enabled", "panoramic", "parts", "selectors"]).then(
	(stored) => {
		applySettings(
			mergeSettings(currentSettings, {
				enabled: stored.enabled,
				panoramic: stored.panoramic,
				parts: stored.parts,
				selectors: stored.selectors,
			})
		);
		listenForUpdates();
	}
);
