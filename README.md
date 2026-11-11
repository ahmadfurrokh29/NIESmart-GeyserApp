# Smart IoT Geyser

A React Native app, built with [Expo](https://expo.dev) SDK 53, for controlling an ESP32-based smart geyser over Firebase.

## Requirements

- [Node.js](https://nodejs.org) (LTS)
- An Android phone with **Expo Go for SDK 53**, client version 2.33.x (see below)
- The phone and the PC on the **same Wi-Fi network**

### Install the right Expo Go

The Play Store version of Expo Go only supports the newest Expo SDK, so it **cannot** run this SDK 53 project.

1. Uninstall Expo Go if it is already on your phone.
2. On the phone, open <https://expo.dev/go>, select **SDK 53** and **Android**, then download and install the APK.
3. In the Play Store, open Expo Go, tap **⋮** and turn off **Enable auto update**. If you skip this, the Play Store will replace it with the newer version.

## First-time setup (Windows)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Allow the phone to connect to the dev server. Open **PowerShell as Administrator** and run:

   ```powershell
   New-NetFirewallRule -DisplayName "Expo Metro 8081" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -Profile Private
   ```

## Running the app

1. **On any new Wi-Fi network**, mark it as Private. Run this in **PowerShell as Administrator**:

   ```powershell
   Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private
   ```

   You only need to do this once per network.

2. In the project folder, start the dev server:

   ```bash
   npx expo start --go --offline
   ```

3. In **Expo Go**, scan the QR code, or tap **Enter URL manually** and type the `exp://...` address printed in the terminal. The first load takes up to a minute.

Stop the server with **Ctrl+C** before you close the terminal. If you just close the window, the server can keep running in the background and hold port 8081.

### Why these flags?

- `--go`: the project includes `expo-dev-client`, so without this flag Expo expects a custom development build. If you are asked "Development Build or Expo Go?", choose **Expo Go**.
- `--offline`: `app.json` links the project to the `apple420` Expo account. Without this flag the server stops at an "Expo user account is required" login prompt, and the phone shows *Failed to download remote update*.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `java.io.IOException: Failed to download remote update` | Check that you started with `--offline`, that Expo Go supports **SDK 53**, and that the Wi-Fi is set to **Private**. |
| "Port 8081 is being used… Use port 8082?" | Answer **n**, because the firewall rule only opens port 8081. Stop the old server: run `Get-NetTCPConnection -LocalPort 8081 \| Select OwningProcess`, then `Stop-Process -Id <id> -Force`. |
| Phone still can't connect | On the phone's browser, open `http://<PC-IP>:8081/status`. If it does not show `packager-status:running`, the network blocks devices from reaching each other. Use `npx expo start --go --offline --tunnel`, or connect the PC to your phone's hotspot and set that network to Private. |

## Other ways to run

- **Web browser:** `npx expo start --web` opens at <http://localhost:8081>. Phone-only features such as notifications, background scheduling and the camera are limited on the web.
- **Native Android build:** `npm run android` needs Android Studio, an Android SDK and a JDK installed.
