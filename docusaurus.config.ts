import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'OvenMediaLabs',
  tagline: 'Sub-second latency live streaming, powered by OvenMediaEngine.',
  favicon: 'images/ico/favicon.ico',

  future: {
    v4: true,
    faster: true,
  },

  url: 'https://ovenmedialabs.com',
  baseUrl: '/',

  organizationName: 'OvenMediaLabs',
  projectName: 'airensoft.com',
  trailingSlash: false,

  // Warn (don't throw) during migration; flip to 'throw' before cutover.
  onBrokenLinks: 'warn',
  onBrokenAnchors: 'warn',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  clientModules: [
    './src/clientModules/bootstrap-dark.ts',
    './src/clientModules/legacy-marketing.ts',
  ],

  headTags: [
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
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap',
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
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/OvenMediaLabs/airensoft.com/tree/main/',
          routeBasePath: 'docs',
        },
        blog: {
          showReadingTime: true,
          routeBasePath: 'blog',
          blogTitle: 'OvenMediaLabs Blog',
          blogDescription: 'Sub-second latency live streaming insights from OvenMediaLabs.',
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
            title: 'OvenMediaLabs Blog',
            description: 'Sub-second latency live streaming insights from OvenMediaLabs.',
          },
          editUrl:
            'https://github.com/OvenMediaLabs/airensoft.com/tree/main/',
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
        {to: '/docs', label: 'Docs', position: 'left'},
        {to: '/blog', label: 'Blog', position: 'left'},
        {to: '/company', label: 'Company', position: 'right'},
        {to: '/contact', label: 'Contact', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Product',
          items: [
            {label: 'OvenMediaEngine', to: '/ome'},
            {label: 'OvenMediaEngine Enterprise', to: '/ome-enterprise'},
            {label: 'Sub-second Latency', to: '/latency'},
          ],
        },
        {
          title: 'Resources',
          items: [
            {label: 'Docs', to: '/docs'},
            {label: 'Blog', to: '/blog'},
            {label: 'GitHub', href: 'https://github.com/AirenSoft/OvenMediaEngine'},
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
      copyright: `Copyright © ${new Date().getFullYear()} OvenMediaLabs (Formerly AirenSoft). All rights reserved.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml', 'markup', 'docker', 'nginx', 'go', 'python'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
