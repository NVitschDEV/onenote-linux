(() => {
  const authenticationHosts = [
    'login.microsoftonline.com',
    'login.live.com',
    'account.live.com',
    'login.windows.net',
    'login.microsoft.com',
  ];

  function isAuthenticationUrl(value) {
    try {
      const url = new URL(value, window.location.href);
      const host = url.hostname.toLowerCase();
      return authenticationHosts.some((base) => host === base || host.endsWith(`.${base}`));
    } catch {
      return false;
    }
  }

  function shouldStayInApp(value) {
    try {
      const url = new URL(value, window.location.href);
      return url.protocol === 'https:' && !isAuthenticationUrl(url.href);
    } catch {
      return false;
    }
  }

  document.addEventListener('click', (event) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    const anchor = event.composedPath().find((node) => {
      return node instanceof HTMLAnchorElement && node.target && node.target.toLowerCase() !== '_self';
    });
    if (anchor && shouldStayInApp(anchor.href)) {
      // Keep ordinary web navigation in OneNote's app window; preserve explicit sign-in popups.
      anchor.target = '_self';
    }
  }, true);

  const nativeOpen = window.open;
  window.open = function (url, target, features) {
    if (url != null && shouldStayInApp(url)) {
      const destination = new URL(url, window.location.href).href;
      window.location.assign(destination);
      return window;
    }
    return Reflect.apply(nativeOpen, this, arguments);
  };
})();
