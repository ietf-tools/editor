/* eslint-env node */

/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js

import { configure } from 'quasar/wrappers'
import { readFileSync } from 'node:fs'
import { mergeConfig } from 'vite'

export default configure((/* ctx */) => {
  const curYear = new Date().getFullYear()
  const packageInfo = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)))

  return {
    // https://v2.quasar.dev/quasar-cli/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli/boot-files
    boot: [
      'eventbus',
      'monaco'
    ],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
    css: [
      'app.scss'
    ],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v5',
      // 'fontawesome-v6',
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      'roboto-font', // optional, you are not bound to it
      'mdi-v7' // optional, you are not bound to it
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
    build: {
      target: {
        browser: ['es2022', 'chrome128'],
        node: 'node20'
      },

      vueRouterMode: 'history', // available values: 'hash', 'history'
      // vueRouterBase,
      // vueDevtools,
      // vueOptionsAPI: false,

      // rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

      // publicPath: '/',
      // analyze: true,
      env: {
        APP_VERSION: packageInfo.version
      },
      // rawDefine: {}
      // ignorePublicFolder: true,
      // minify: false,
      // polyfillModulePreload: true,
      // distDir

      extendViteConf (viteConf) {
        viteConf.build = mergeConfig(viteConf.build, {
          chunkSizeWarningLimit: 9999999,
          rollupOptions: {
            output: {
              manualChunks: (id) => {
                if (id.includes('.css') || id.includes('.scss') || id.includes('.sass')) {
                  return 'app'
                }
              }
            }
          }
        })
        // viteConf.build.rollupOptions = {
        //   external: ['monaco-editor'],
        //   output: {
        //     globals: {
        //       'monaco-editor': 'monaco-editor'
        //     }
        //   }
        // }
      }
      // viteVuePluginOptions: {},

      // vitePlugins: [
      //   [ 'package-name', { ..options.. } ]
      // ]
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
    devServer: {
      https: true,
      open: true // opens browser window automatically
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
    framework: {
      config: {
        dark: true,
        notify: {
          position: 'top',
          progress: true,
          color: 'positive',
          icon: 'mdi-check',
          actions: [
            {
              icon: 'mdi-close',
              color: 'white',
              size: 'sm',
              round: true,
              handler: () => {}
            }
          ]
        }
      },

      iconSet: 'mdi-v7', // Quasar icon set
      // lang: 'en-US', // Quasar language pack

      // For special cases outside of where the auto-import strategy can have an impact
      // (like functional components as one of the examples),
      // you can manually specify Quasar components/directives to be available everywhere:
      //
      // components: [],
      // directives: [],

      // Quasar plugins
      plugins: [
        'Dialog',
        'Loading',
        'Notify'
      ]
    },

    // animations: 'all', // --- includes all animations
    // https://v2.quasar.dev/options/animations
    animations: [
      'flash',
      'fadeIn',
      'fadeOut',
      'fadeInDown',
      'fadeInUp',
      'fadeOutDown',
      'fadeOutUp',
      'slideInDown',
      'slideInUp',
      'slideOutDown',
      'slideOutUp'
    ],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#property-sourcefiles
    // sourceFiles: {
    //   rootComponent: 'src/App.vue',
    //   router: 'src/router/index',
    //   store: 'src/store/index',
    //   registerServiceWorker: 'src-pwa/register-service-worker',
    //   serviceWorker: 'src-pwa/custom-service-worker',
    //   pwaManifestFile: 'src-pwa/manifest.json',
    //   electronMain: 'src-electron/electron-main',
    //   electronPreload: 'src-electron/electron-preload'
    // },

    // https://v2.quasar.dev/quasar-cli/developing-ssr/configuring-ssr
    ssr: {
      // ssrPwaHtmlFilename: 'offline.html', // do NOT use index.html as name!
      // will mess up SSR

      // extendSSRWebserverConf (esbuildConf) {},
      // extendPackageJson (json) {},

      pwa: false,

      // manualStoreHydration: true,
      // manualPostHydrationTrigger: true,

      prodPort: 3000, // The default port that the production server should use
      // (gets superseded if process.env.PORT is specified at runtime)

      middlewares: [
        'render' // keep this as last one
      ]
    },

    // https://v2.quasar.dev/quasar-cli/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: 'generateSW', // or 'injectManifest'
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false
      // useFilenameHashes: true,
      // extendGenerateSWOptions (cfg) {}
      // extendInjectManifestOptions (cfg) {},
      // extendManifestJson (json) {}
      // extendPWACustomSWConf (esbuildConf) {}
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli/developing-electron-apps/configuring-electron
    electron: {
      // extendElectronMainConf (esbuildConf)
      // extendElectronPreloadConf (esbuildConf)

      // Electron preload scripts (if any) from /src-electron, WITHOUT file extension
      preloadScripts: ['electron-preload'],

      inspectPort: 5858,

      bundler: 'builder', // 'packager' or 'builder'

      // packager: {
      //   // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options

      //   appCopyright: 'IETF Trust',
      //   arch: ['x64', 'arm64'],
      //   // executableName: 'draftforge',
      //   name: 'ietf-draftforge',
      //   overwrite: true,
      //   // platform: ['darwin', 'linux', 'win32'],

      //   // OS X / Mac App Store
      //   // appBundleId: '',
      //   appCategoryType: 'public.app-category.productivity',
      //   // osxSign: '',
      //   // protocol: 'myapp://path',

      //   // Windows only
      //   win32metadata: {
      //     CompanyName: 'IETF'
      //   }
      // },

      builder: {
        // https://www.electron.build/configuration/configuration

        appId: 'org.ietf.draftforge',
        // eslint-disable-next-line no-template-curly-in-string
        artifactName: 'ietf-draftforge-${os}-${arch}-${version}.${ext}',
        // executableName: 'draftforge',
        copyright: `Copyright © 2023-${curYear} The IETF Trust`,
        mac: {
          electronLanguages: ['en-US'],
          category: 'public.app-category.productivity',
          darkModeSupport: true,
          hardenedRuntime: true,
          gatekeeperAssess: false,
          entitlements: 'build/mac/entitlements.mac.plist',
          entitlementsInherit: 'build/mac/entitlements.mac.plist',
          notarize: true,
          target: [
            {
              target: 'dmg',
              arch: ['x64', 'arm64']
            }
          ],
          publish: [
            {
              provider: 'generic',
              url: 'https://github.com/ietf-tools/editor/releases/latest/download/',
              publishAutoUpdate: true
            }
          ]
        },
        dmg: {
          sign: false
        },
        win: {
          electronLanguages: ['en-US'],
          target: [
            {
              target: 'nsis',
              arch: ['x64', 'arm64']
            }
          ],
          publish: [
            {
              provider: 'generic',
              url: 'https://github.com/ietf-tools/editor/releases/latest/download/',
              publishAutoUpdate: true
            }
          ]
        },
        linux: {
          electronLanguages: ['en-US'],
          category: 'Office',
          target: [
            {
              target: 'AppImage',
              arch: ['x64', 'arm64']
            },
            {
              target: 'deb',
              arch: ['x64', 'arm64']
            },
            {
              target: 'rpm',
              arch: ['x64', 'arm64']
            },
            {
              target: 'tar.gz',
              arch: ['x64', 'arm64']
            }
          ],
          publish: [
            {
              provider: 'generic',
              url: 'https://github.com/ietf-tools/editor/releases/latest/download/',
              publishAutoUpdate: true
            }
          ]
        }
      }
    }
  }
})
