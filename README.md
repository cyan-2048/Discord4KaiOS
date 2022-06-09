## join the [discord server](https://discord.gg/W9DF2q3Vv2) to get more up to date information...

```
frontend ->
- markdown support✅
- sed or s/e/x✅
- server folders✅
- qrcode scanner to scan token✅
- discord emojis✅(partial, you can't send discord emojis yet)
- stickers✅(partial, you can't send stickers yet)
- replies✅(partial, user can't reply to messages yet)
- attachments✅(partial only supports images for now, you can't send attachments yet)
- discord mentions✅(@ / #, partial you can only mention users by typing @<insert unique username/nickname and without spaces> at the very end of the textbox)
- highlight message if user is mentioned✅
- embed links✅(partial support, missing support for videos)

- typing indicator✅(partial, other people can see you typing, you can only see other people typing on dms, unknown reason why servers don't work)
- edit messages✅(partial, only works on desktop browser by double clicking on a message, will be fully supported once "more options" is partially supported)
- load more messages button
- more options
- image viewer

maybe ->
- threads

backend or discord gateway ->
- change edited/deleted messages✅
- hide channels that are not supposed to be seen✅(bitwise was the weirdest thing ever...)
- unread/read/mentions indicators✅(partial, dms do not work yet...)
- discord presence in dms✅(partial no support for presences that are not the status of the user, no support for emojis as well)

no plans on supporting ->
- a video player will probably not be supported because most video formats probably won't work
- voice calls/chats, streaming, video calls... well it's obvious why
- the end goal here is to have a usable discord client for KaiOS, I have no plans on fully replicating a discord client
```

### Development and testing

`npm run dev` builds the app in watch mode and serves the site. Great for testing your app in a desktop browser.

### Deploying to a device

1. Connect your device to your computer and make sure it appears in WebIDE.
2. `npm run build`
3. In WebIDE, load the `/dist` folder as a packaged app.

Pre-built app packages will only be available through select users of the discord server.
The app will be fully published to the KaiStore once fully ready.
