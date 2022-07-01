## join the [discord server](https://discord.gg/W9DF2q3Vv2) to get more up to date information...

```
legend:
- ** -> does not support sending
- * -> only supports_
- \ -> partially
- ! -> does not support_
- ✅ -> supported, api is implemented
- ? ->  no ui
example: \?** -> partially no ui, does not support sending

frontend ->
- markdown✅
- sed or s/e/x✅
- folders✅
- qrcode scanner✅
- hide channels with no read perms✅
- highlight message if mentioned✅
- typing indicators✅
- a custom rpc that shows you are using Discord4KaiOS✅
- edit messages✅
- delete messages✅
- replies✅
- discord emojis✅**
- stickers✅**
- reactions✅**
- embed links✅(\)
- attachments✅(*images, \?**)
- discord mentions✅(@ / #, \*(no spaces username))
- image viewer✅(\*(messages with one image))
- more options✅(\)
- settings(?)
- load more button

maybe ->
- threads
- plugins

backend ->
- unread/read/mentions indicators✅(\!dms)
- discord presence in dms✅(\*custom_status!emojis)
- update cached data when needed

events ->
(updates):
- message✅
- channel✅
- read state✅
- presence✅(\)

no plans on supporting ->
- video player
- voice calls/chats, streaming, video calls...
- moderating servers
```

the end goal here is to have a usable discord client for KaiOS, I have no plans on fully replicating a discord client(replicating it way too much could actually be dangerous... discord might think the api is being used maliciously and ban the user)

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

### Special Thanks!
- [Zero Tsus](https://github.com/LolloDev5123)
