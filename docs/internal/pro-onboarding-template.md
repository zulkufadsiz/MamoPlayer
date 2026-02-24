# Pro Onboarding Email Template

## Subject

Your MamoPlayer Pro Access

## Email Body

Hi {{CUSTOMER_NAME}},

Thank you for purchasing **MamoPlayer Pro** — we’re excited to have you onboard.

To get started, please follow the steps below.

### 1) Configure your npm registry access

Create or update your `.npmrc` file with your private registry settings and token:

```ini
@mamoplayer:registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken={{NPM_TOKEN}}
always-auth=true
```

If your organization uses a different private registry, replace the registry URL accordingly.

### 2) Install the Pro package

Run the install command in your project:

```bash
npm install @mamoplayer/pro
```

If you’re using Yarn or pnpm, use the equivalent command:

```bash
yarn add @mamoplayer/pro
# or
pnpm add @mamoplayer/pro
```

### 3) Read the documentation

Use this docs base URL: {{DOCS_URL}}

- Getting Started: {{DOCS_URL}}/getting-started
- Pro Player: {{DOCS_URL}}/pro-player
- Ads: {{DOCS_URL}}/ads-monetization
- Theming: {{DOCS_URL}}/theming-skins

### 4) License key (if issued)

Your license key:

```text
{{LICENSE_KEY}}
```

If a license key is not required for your plan, you can ignore this section.

If you need any help with setup, integration, or migration, contact us at {{SUPPORT_EMAIL}}.

Best regards,
MamoPlayer Team
