import {themes as prismThemes, type PrismTheme} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {sectionHeaderSidebarGenerator} from './src/lib/sidebar-section-headers';

/**
 * Custom Prism theme: low-saturation, brand-aligned, easy on the eyes.
 *
 * Built-in dark themes (oneDark / nightOwl / vsDark) are tuned for IDE
 * use and lean on vivid coral / purple / electric blue. In long-form
 * docs that becomes visual fatigue. This palette caps at five hues,
 * all desaturated, drawn from the OvenMedia Labs brand palette:
 *
 *   #7DD3FC  light sky   tag name, function/class, attr-value
 *                        (the "name / pointer" tokens)
 *   #C5A38E  warm tan    attr-name, number, boolean
 *                        (the "label / literal" tokens)
 *   #38BDF8  brand sky   keyword, builtin
 *                        (the single saturated accent — only for actual
 *                         language keywords, which are rare in XML)
 *   #6E7681  dim gray    comment (italic), punctuation, operator
 *                        (the "scaffolding" tokens that should recede)
 *   #D4D4D4  default     plain text content, strings, variables
 *
 * Earlier revisions chose four near-identical grays (`#9BA4B4`, `#8B949E`,
 * `#C9D1D9`, `#6E7681`) for tags / punctuation / default / comment, and
 * the result rendered as a single washed-out gray block. The fix: tags
 * (the most important XML token) get the visible light-sky, not yet
 * another shade of gray. */
const omeCodeTheme: PrismTheme = {
  plain: {
    color: '#d4d4d4',
    backgroundColor: '#0d1117',
  },
  styles: [
    {types: ['comment', 'prolog', 'doctype', 'cdata'], style: {color: '#6e7681', fontStyle: 'italic'}},
    {types: ['punctuation', 'operator', 'entity', 'url'], style: {color: '#6e7681'}},
    {types: ['tag', 'namespace', 'selector'], style: {color: '#7dd3fc'}},
    {types: ['attr-name'], style: {color: '#c5a38e'}},
    {types: ['string', 'attr-value', 'char', 'regex'], style: {color: '#9ba4b4'}},
    {types: ['number', 'boolean', 'constant', 'symbol'], style: {color: '#c5a38e'}},
    {types: ['keyword', 'builtin', 'rule', 'important'], style: {color: '#38bdf8'}},
    {types: ['function', 'method', 'class-name'], style: {color: '#7dd3fc'}},
    {types: ['variable', 'parameter', 'property'], style: {color: '#d4d4d4'}},
    {types: ['deleted'], style: {color: '#ff9999'}},
    {types: ['inserted'], style: {color: '#9bd99b'}},
  ],
};

// When upstream editors run `docs-site/preview.sh`, the script starts
// the site with OML_PREVIEW_SOURCE=ome|ome-enterprise|ovenplayer. That
// switches the site into "docs-only" mode: marketing nav/footer items
// are hidden, and `/` redirects to `/docs/<source>/`. The rest of the
// site stays reachable by direct URL so nothing actually breaks — the
// editor just never sees marketing chrome while previewing docs.
const PREVIEW_SOURCE = process.env.OML_PREVIEW_SOURCE || '';

const config: Config = {
  title: 'OvenMedia Labs',
  tagline: 'Sub-second latency live streaming, powered by OvenMediaEngine.',
  favicon: 'images/ico/favicon.ico',

  customFields: {
    previewSource: PREVIEW_SOURCE,
  },

  future: {
    v4: true,
    faster: true,
  },

  url: 'https://ovenmedialabs.com',
  baseUrl: '/',

  organizationName: 'OvenMediaLabs',
  projectName: 'ovenmedialabs.com',
  trailingSlash: false,

  // Build fails on any broken link / anchor / markdown image. Caught
  // every existing case during the migration; new ones should surface
  // immediately in CI rather than rot.
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
      onBrokenMarkdownImages: 'throw',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  clientModules: [
    './src/clientModules/bootstrap-dark.ts',
    './src/clientModules/legacy-marketing.ts',
    './src/clientModules/preview-redirect.ts',
  ],

  headTags: [
    // ----- Tracking & consent (production only) -----
    // Order matters: Google Consent Mode defaults must run BEFORE any other
    // analytics/ads code so the initial gtag('consent', 'default', ...) call
    // is in effect when Cookiebot/GTM/GA4 start firing.
    //
    // Cookiebot id + GTM/GA4/Ads ids preserved verbatim from the legacy
    // index.html. `data-cookieconsent="ignore"` keeps this consent-defaults
    // script itself out of Cookiebot's auto-blocking sweep.
    ...(process.env.NODE_ENV === 'production' ? [
      {
        tagName: 'script' as const,
        attributes: {'data-cookieconsent': 'ignore'},
        innerHTML:
          "window.dataLayer=window.dataLayer||[];" +
          "function gtag(){dataLayer.push(arguments);}" +
          "gtag('consent','default',{" +
            "ad_personalization:'denied'," +
            "ad_storage:'denied'," +
            "ad_user_data:'denied'," +
            "analytics_storage:'denied'," +
            "functionality_storage:'denied'," +
            "personalization_storage:'denied'," +
            "security_storage:'granted'," +
            "wait_for_update:500" +
          "});" +
          "gtag('set','ads_data_redaction',true);" +
          "gtag('set','url_passthrough',false);",
      },
      {
        tagName: 'script' as const,
        attributes: {
          id: 'Cookiebot',
          src: 'https://consent.cookiebot.com/uc.js',
          'data-cbid': 'dcd64d7e-3ca2-4039-8c6c-759a3286d6e9',
          'data-blockingmode': 'auto',
          type: 'text/javascript',
          async: 'true',
        },
      },
      {
        tagName: 'script' as const,
        attributes: {},
        innerHTML:
          "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});" +
          "var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';" +
          "j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;" +
          "f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-THBJMSZV');",
      },
      {
        tagName: 'script' as const,
        attributes: {
          async: 'true',
          src: 'https://www.googletagmanager.com/gtag/js?id=G-YF1TS3WD9S',
        },
      },
      {
        tagName: 'script' as const,
        attributes: {},
        innerHTML:
          "gtag('js',new Date());" +
          "gtag('config','G-YF1TS3WD9S');" +  // GA4
          "gtag('config','AW-955539851');",  // Google Ads
      },
    ] : []),

    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
      },
    },
    {
      // Inline script ensures Bootstrap's data-bs-theme attribute is set
      // synchronously, before first paint, to avoid a flash of light theme.
      tagName: 'script',
      attributes: {},
      innerHTML: "document.documentElement.setAttribute('data-bs-theme','dark');",
    },
    {
      tagName: 'script',
      attributes: {
        src: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
        defer: 'true',
      },
    },
    {
      tagName: 'script',
      attributes: {
        src: 'https://unpkg.com/@phosphor-icons/web',
        defer: 'true',
      },
    },
    // The legacy /assets/js/main.js is intentionally NOT loaded here. Its
    // logic has been ported to src/clientModules/legacy-marketing.ts which
    // re-runs on every SPA route change and null-guards every DOM lookup.
  ],

  presets: [
    [
      'classic',
      {
        // Disable the default docs instance — we register three named
        // instances under `plugins` below (ome / ome-enterprise / ovenplayer)
        // so each product has its own sidebar and route base path.
        docs: false,
        blog: {
          showReadingTime: true,
          routeBasePath: 'blog',
          // Keep Docusaurus's default `GlobExcludeDefault` patterns
          // (which skip `_*` files/folders, hence `_template/`) and add
          // `README.md` so the contributor guide colocated with posts
          // doesn't get rendered as a post itself.
          exclude: [
            '**/_*.{js,jsx,ts,tsx,md,mdx}',
            '**/_*/**',
            '**/*.test.{js,jsx,ts,tsx}',
            '**/__tests__/**',
            'README.md',
          ],
          blogTitle: 'OvenMedia Labs Blog',
          blogDescription: 'Sub-second latency live streaming insights from OvenMedia Labs.',
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
            title: 'OvenMedia Labs Blog',
            description: 'Sub-second latency live streaming insights from OvenMedia Labs.',
          },
          // editUrl intentionally omitted: editors and contributors don't
          // need a per-post "Edit this page" link on the live blog. The
          // GitHub source is one click away from the footer for the rare
          // case someone wants to open a PR.
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          // Order matters: custom.css first (Infima token overrides), legacy
          // marketing CSS second so its rules win over both Infima and
          // Bootstrap on shared selectors.
          customCss: ['./src/css/custom.css', './src/css/legacy-marketing.css'],
        },
        sitemap: {
          lastmod: 'date',
          changefreq: 'weekly',
          priority: 0.5,
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'ome',
        path: 'docs/ome',
        routeBasePath: 'docs/ome',
        sidebarPath: './sidebars-ome.ts',
        sidebarItemsGenerator: sectionHeaderSidebarGenerator,
        // README.md and STYLE.md are contributor-facing (preview script
        // pointer + authoring guide); they ship in the upstream `docs/`
        // tree but must not appear in the public sidebar/routes.
        exclude: ['README.md', 'STYLE.md'],
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'ome-enterprise',
        path: 'docs/ome-enterprise',
        routeBasePath: 'docs/ome-enterprise',
        sidebarPath: './sidebars-ome-enterprise.ts',
        sidebarItemsGenerator: sectionHeaderSidebarGenerator,
        exclude: ['README.md', 'STYLE.md'],
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'ovenplayer',
        path: 'docs/ovenplayer',
        routeBasePath: 'docs/ovenplayer',
        sidebarPath: './sidebars-ovenplayer.ts',
        sidebarItemsGenerator: sectionHeaderSidebarGenerator,
        exclude: ['README.md', 'STYLE.md'],
      },
    ],
  ],

  themeConfig: {
    image: 'images/og/og_oml.png',
    metadata: [
      {name: 'keywords', content: 'ovenmedia, oven media, ovenmedia labs, airensoft, ovenmediaengine, ome, ome enterprise, ovenplayer, ovenlivekit, sub second latency streaming, webrtc streaming, llhls streaming, srt streaming, open source streaming server'},
    ],
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: '',
      logo: {
        alt: 'OvenMedia Labs',
        src: 'images/airen_ci/OML_Letter_GGL.svg',
        href: '/',
      },
      items: [
        {to: '/ome', label: 'OvenMediaEngine', position: 'left'},
        {to: '/ome-enterprise', label: 'OvenMediaEngine Enterprise', position: 'left'},
        {
          // The swizzled NavbarContent recognizes `customMenu: 'resources'`
          // and renders items from src/config/navbarResources.ts (which
          // contains divider/header entries that Docusaurus's themeConfig
          // schema rejects). The empty `items` array satisfies the schema.
          label: 'Resources',
          position: 'left',
          customMenu: 'resources',
          items: [],
        } as any,
        {to: '/company', label: 'Company', position: 'right'},
        {to: '/contact', label: 'Contact', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Products',
          items: [
            {label: 'OvenMediaEngine', to: '/ome'},
            {label: 'OvenMediaEngine Enterprise', to: '/ome-enterprise'},
            {label: 'Sub-second Latency', to: '/latency'},
          ],
        },
        {
          title: 'Resources',
          items: [
            {label: 'OvenMediaEngine Guide', to: '/docs/ome'},
            {label: 'OvenMediaEngine Enterprise Guide', to: '/docs/ome-enterprise'},
            {label: 'OvenPlayer Guide', to: '/docs/ovenplayer'},
            {label: 'Blog', to: '/blog'},
            {label: 'GitHub', href: 'https://github.com/AirenSoft'},
            {label: 'Community Discussions', href: 'https://github.com/AirenSoft/OvenMediaEngine/discussions'},
          ],
        },
        {
          title: 'Company',
          items: [
            {label: 'About', to: '/company'},
            {label: 'Contact', to: '/contact'},
            {label: 'AGPLv3', to: '/agplv3'},
            {label: 'EULA', to: '/eula'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} OvenMedia Labs (Formerly AirenSoft). All rights reserved.`,
    },
    prism: {
      // Custom theme — see `omeCodeTheme` above this config block.
      // Built-in dark themes (oneDark / nightOwl / vsDark) tested and
      // all failed the eye-strain bar: too vivid, too many hues.
      theme: omeCodeTheme,
      darkTheme: omeCodeTheme,
      additionalLanguages: ['bash', 'json', 'yaml', 'markup', 'docker', 'nginx', 'go', 'python'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
