# kaios-preact-starter

a sveltejs template for KaiOS that just works!!

## Additional Notes (pretty much how this template works)

- KaiOS v2.5 is "partial es6" because of this, transpilers like babel will assume it is es5 which makes the code really bulky, thankfully this template uses esbuild to transpile.
- "partial es6" refers to KaiOS not supporting literally two es6 features (es modules and `for (const`).
- because we are not using babel, all polyfills will have to be manually added to the project, this template has core-js and a [polyfills.js](./scripts/polyfills.js) file.
