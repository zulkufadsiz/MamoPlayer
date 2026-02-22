// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'MamoPlayer',
  tagline: 'Production-ready OTT video SDK for React Native',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://zulkufadsiz.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/MamoPlayer-docs/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'zulkufadsiz', // Usually your GitHub org/user name.
  projectName: 'MamoPlayer-docs', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'MamoPlayer',
        logo: {
          alt: 'MamoPlayer Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'getting-started/index',
            position: 'left',
            label: 'Getting Started',
          },
          {
            type: 'doc',
            docId: 'core-player',
            position: 'left',
            label: 'Core',
          },
          {
            type: 'doc',
            docId: 'pro-player/index',
            position: 'left',
            label: 'Pro',
          },
          {
            type: 'doc',
            docId: 'analytics-events/index',
            position: 'left',
            label: 'Analytics',
          },
          {
            type: 'doc',
            docId: 'ads-monetization/index',
            position: 'left',
            label: 'Ads',
          },
          {
            type: 'doc',
            docId: 'theming-skins/index',
            position: 'left',
            label: 'Theming',
          },
          {
            type: 'doc',
            docId: 'faq-troubleshooting/index',
            position: 'left',
            label: 'FAQ',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting Started',
                to: '/docs/getting-started/index',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/zulkufadsiz/MamoPlayer',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Changelog',
                to: '/docs/versioning-changelog',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} MamoPlayer. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
