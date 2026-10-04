# OneNote for Linux — dedicated Helium app window

This unofficial AppImage launches Microsoft's official OneNote web app in its own Chromium-based app window and **its own persistent Helium profile**. That gives the OneNote app a separate browser process, so Helium receives the app-mode and notebook-routing flags even while your regular Helium browser is open. Notebook switches—including OneNote's blank-popup-then-navigation flow—stay in the app window. Microsoft sign-in popups remain separate.

## Requirements

- **Chromium Browser** (recommended on Arch; app window, no tabs/address bar)
- **Firefox** (fallback; kiosk/full-screen mode; Chromium routing helper is not injected)

The launcher searches `PATH` first for Helium (`helium-browser`, `helium`, or `helium-chromium`), then Chromium/Chrome, then Firefox. On Arch, the `helium-browser-bin` package exposes `helium-browser`.

## Profile and sign-in

The Chromium app profile is stored persistently under Electron's OneNote user-data folder, normally `~/.config/OneNote/helium-profile`. It is separate from your regular Helium profile, which remains untouched. **You will need to sign into OneNote once in this new profile.** Browser cookies, saved passwords, and extensions from your regular Helium profile are not copied. OS/hardware security keys may still be available; install/configure any password-manager extension in this app profile if you rely on one. Notification/site permissions are also separate and may need to be granted again.

## Run

```sh
chmod +x OneNote-1.3.0-x86_64.AppImage
./OneNote-1.3.0-x86_64.AppImage
```

The OneNote helper is loaded into this separate profile and only operates on OneNote/Microsoft productivity pages. It redirects notebook windows into the existing app window and leaves recognized Microsoft sign-in hosts alone.

## Build

On x86_64 Linux with Node.js 22+ and npm:

```sh
npm install
npm run build
```

The output is `dist/OneNote-1.3.0-x86_64.AppImage`.

## Branding and affiliation

This unofficial wrapper is not affiliated with or endorsed by Microsoft. Microsoft and OneNote are trademarks of Microsoft Corporation.
