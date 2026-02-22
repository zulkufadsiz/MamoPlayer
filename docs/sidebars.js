/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/index'],
    },
    {
      type: 'category',
      label: 'Core Player',
      items: ['core-player/index', 'core-package'],
    },
    {
      type: 'category',
      label: 'Pro Player',
      items: ['pro-player/index'],
    },
    {
      type: 'category',
      label: 'Analytics & Events',
      items: ['analytics-events/index'],
    },
    {
      type: 'category',
      label: 'Ads & Monetization',
      items: ['ads-monetization/index'],
    },
    {
      type: 'category',
      label: 'Theming & Skins',
      items: ['theming-skins/index'],
    },
    {
      type: 'category',
      label: 'FAQ / Troubleshooting',
      items: ['faq-troubleshooting/index'],
    },
    {
      type: 'category',
      label: 'Changelog',
      items: ['changelog'],
    },
  ],
};

module.exports = sidebars;
