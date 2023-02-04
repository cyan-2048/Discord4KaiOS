[![Discord server](https://invidget.switchblade.xyz/W9DF2q3Vv2)](https://discord.gg/W9DF2q3Vv2)

the end goal here is to have a usable discord client for KaiOS, I have no plans on fully replicating a discord client.

### Development and testing

`npm run dev` builds the app in watch mode and serves the site. Great for testing the app in a desktop browser. CORS may or may not work properly on non-KaiOS devices, please use a browser extension.

### Deploying to a device

#### Setting up WebIDE and connecting to a device

First, we want to install a version of firefox that includes the WebIDE system, as it has been discontinued in the latest versions. We can get this in firefox version < 56 or with <a href="https://classic.waterfox.net/">Waterfox Classic</a>, what i would recommend and what this guide will be build on

Now, after opening waterfox legacy we want to head over to: `the menu icon, top right` » `Developer` » `WebIDE`</li>
After opening the `WebIDE` you should be able to see your device on the top right

<img width="600px" src="https://user-images.githubusercontent.com/56993729/216789686-84269315-2ae5-4a66-8f3f-3e81540fc448.png"></img>

If it does not show up make sure your phone is in debug mode by calling `*#*#33284#*#*` or join the discord server and we can try to help you get setup

Click your device to select it and then we are ready to prepare the app for installation

#### Creating a build of the client

1. Clone the reposetorry using `git clone https://github.com/cyan-2048/Discord4KaiOS`
2. `npm install` install dependencies, run it when package.json is modified or if you are building for the first time.
3. `npm run build`

#### Installing the build on the phone
Now with the packaged app in hand head over to the `Open packed app` section and select the `/dist` folder we build before.

<img width="600px" src="https://user-images.githubusercontent.com/56993729/216789910-db6d46be-4af3-4aec-8ef9-6fb5d4d9941e.png"></img>

And now with the app loaded, all we need to do is deply it to the phone, click the little "play" arrow at the top

<img width="600px" src="https://user-images.githubusercontent.com/56993729/216790022-f02491e1-d4d2-4025-8f6e-a44a7010934f.png"></img>

You should see the app being installed and the discord loading gif start playing.

#### Post install

To complete the installation we need to login to the app, here we click the app under `RUNTIME APPS`. You will see the developer tools come up, simply find the div with the `loading` id and delete it. 

<img width="600px" src="https://user-images.githubusercontent.com/56993729/216790216-0c98a29d-5963-43c2-b0b5-cf6756709756.png"></img>

This will reveal the login screen for you to sign in :D

### Credit

(stuff mentioned here are libraries where the code was modified)

- [luke-chang/js-spatial-navigation](https://github.com/luke-chang/js-spatial-navigation) MPLv2
- [garredow/kaios-lib](https://github.com/garredow/kaios-lib/blob/main/src/modules/qrCode.ts) MIT
- [smoothscroll-polyfill](https://www.npmjs.com/package/smoothscroll-polyfill) MIT
- [ustccjw/unhandled-rejection-polyfill](https://github.com/ustccjw/unhandled-rejection-polyfill) MIT
- [SkeuoCord](https://github.com/Marda33/SkeuoCord) (I asked for permission)

### Special Thanks!

- [Zero Tsus](https://github.com/LolloDev5123)
