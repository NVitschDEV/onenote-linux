const notebookHosts = [
  'onenote.cloud.microsoft',
  'onenote.com',
  'cloud.microsoft',
  'sharepoint.com',
  'onedrive.live.com',
  '1drv.ms',
  'office.com',
  'microsoft365.com',
];

const authenticationHosts = [
  'login.microsoftonline.com',
  'login.live.com',
  'account.live.com',
  'login.windows.net',
  'login.microsoft.com',
];

// New-window calls sometimes create about:blank first, then navigate it to a notebook.
// Remember only the opener/target IDs until that target commits to a relevant URL.
const pendingTargets = new Map();

function hostMatches(host, bases) {
  const normalized = host.toLowerCase();
  return bases.some((base) => normalized === base || normalized.endsWith(`.${base}`));
}

function urlHost(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.hostname.toLowerCase() : null;
  } catch {
    return null;
  }
}

function isNotebookContentUrl(value) {
  const host = urlHost(value);
  return host !== null && hostMatches(host, notebookHosts);
}

function isAuthenticationUrl(value) {
  const host = urlHost(value);
  return host !== null && hostMatches(host, authenticationHosts);
}

async function routeIntoApp(sourceTabId, targetTabId, destination) {
  try {
    const sourceTab = await chrome.tabs.get(sourceTabId);
    if (!isNotebookContentUrl(sourceTab.url)) return;
    await chrome.tabs.update(sourceTabId, { url: destination });
    await chrome.tabs.remove(targetTabId);
  } catch {
    // The source or target may have closed before routing completed.
  }
}

chrome.webNavigation.onCreatedNavigationTarget.addListener((details) => {
  if (details.sourceTabId < 0 || details.tabId < 0) return;
  pendingTargets.set(details.tabId, details.sourceTabId);
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  const sourceTabId = pendingTargets.get(details.tabId);
  if (sourceTabId === undefined) return;

  if (isAuthenticationUrl(details.url)) {
    // Do not capture a login popup, including one opened from about:blank.
    pendingTargets.delete(details.tabId);
    return;
  }

  if (!isNotebookContentUrl(details.url)) return;
  pendingTargets.delete(details.tabId);
  void routeIntoApp(sourceTabId, details.tabId, details.url);
}, {
  url: [
    { schemes: ['https'], hostEquals: 'onenote.cloud.microsoft' },
    { schemes: ['https'], hostSuffix: 'cloud.microsoft' },
    { schemes: ['https'], hostEquals: 'onenote.com' },
    { schemes: ['https'], hostSuffix: 'onenote.com' },
    { schemes: ['https'], hostSuffix: 'sharepoint.com' },
    { schemes: ['https'], hostEquals: 'onedrive.live.com' },
    { schemes: ['https'], hostSuffix: 'onedrive.live.com' },
    { schemes: ['https'], hostEquals: '1drv.ms' },
    { schemes: ['https'], hostEquals: 'office.com' },
    { schemes: ['https'], hostSuffix: 'office.com' },
    { schemes: ['https'], hostEquals: 'microsoft365.com' },
    { schemes: ['https'], hostSuffix: 'microsoft365.com' },
    { schemes: ['https'], hostEquals: 'login.microsoftonline.com' },
    { schemes: ['https'], hostSuffix: 'login.microsoftonline.com' },
    { schemes: ['https'], hostEquals: 'login.live.com' },
    { schemes: ['https'], hostEquals: 'account.live.com' },
    { schemes: ['https'], hostEquals: 'login.windows.net' },
    { schemes: ['https'], hostEquals: 'login.microsoft.com' }
  ]
});

chrome.tabs.onRemoved.addListener((tabId) => {
  pendingTargets.delete(tabId);
});
