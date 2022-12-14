[![Discord server](https://invidget.switchblade.xyz/W9DF2q3Vv2)](https://discord.gg/W9DF2q3Vv2)

the end goal here is to have a usable discord client for KaiOS, I have no plans on fully replicating a discord client.

### Development and testing

`npm run dev` builds the app in watch mode and serves the site. Great for testing the app in a desktop browser. CORS may or may not work properly on non-KaiOS devices, please use a browser extension.

### Deploying to a device

1. Connect your device to your computer and make sure it appears in WebIDE.
2. `npm install` install dependencies, run it when package.json is modified or if you are building for the first time.
3. `npm run build`
4. In WebIDE, load the `/dist` folder as a packaged app.

### Note:

- Pre-built app packages will only be available through select users of the discord server.
- The app will be fully published to the KaiStore once fully ready.
- Please avoid sharing the app packages, I do not want my app to be seen as a "half assed discord app", if you choose to build the app from source please do me a favor and use it only for personal use. Once the app is considered ready, it would be fine to share.

### Credit

(stuff mentioned here are libraries where the code was modified)

- [luke-chang/js-spatial-navigation](https://github.com/luke-chang/js-spatial-navigation) MPLv2
- [garredow/kaios-lib](https://github.com/garredow/kaios-lib/blob/main/src/modules/qrCode.ts) MIT
- [smoothscroll-polyfill](https://www.npmjs.com/package/smoothscroll-polyfill) MIT
- [ustccjw/unhandled-rejection-polyfill](https://github.com/ustccjw/unhandled-rejection-polyfill) MIT
- [SkeuoCord](https://github.com/Marda33/SkeuoCord) (I asked for permission)

### Special Thanks!

- [Zero Tsus](https://github.com/LolloDev5123)
