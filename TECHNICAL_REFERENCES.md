# Technical references

These public references informed the Helium launcher and notebook-popup routing:

1. Arch AUR package recipe for `helium-browser-bin`: <https://aur.archlinux.org/cgit/aur.git/plain/PKGBUILD?h=helium-browser-bin>
   - Installs `/usr/bin/helium-browser` as a symlink to the packaged Helium wrapper.
2. AUR Helium package documentation/source: <https://github.com/s6muel/helium-browser-bin>
   - Documents the Arch wrapper's argument forwarding to the bundled Chromium binary and user/system flags support.
3. Helium upstream discussion of Linux wrapper flags: <https://github.com/imputnet/helium-linux/issues/152>
   - Shows the wrapper appending configuration flags and then forwarding command-line arguments to Chromium.
4. Chrome Extensions `webNavigation` API: <https://developer.chrome.com/docs/extensions/reference/api/webNavigation>
   - Documents `onCreatedNavigationTarget` (source and target tab IDs) and navigation event order, used to track a blank popup before its notebook URL begins loading.
5. Chromium PWA link-capturing context: <https://developer.chrome.com/docs/web-platform/declarative-link-capturing>
   - Explains why app-scope and newly opened links are not automatically kept in an app window by a simple `--app` launch.
