// @ts-nocheck

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';

type ParsedArgs = {
  name?: string;
  email?: string;
  licenseKey?: string;
  docsUrl?: string;
  supportEmail?: string;
  out?: string;
  stdout: boolean;
  file: boolean;
};

const ROOT_DIR = process.cwd();
const TEMPLATE_PATH = path.join(ROOT_DIR, 'docs', 'internal', 'pro-onboarding-template.md');
const GENERATED_DIR = path.join(ROOT_DIR, 'generated');

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = { stdout: false, file: false };
  const positional: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('-')) {
      positional.push(token);
      continue;
    }

    const [flag, inlineValue] = token.split('=', 2);
    const nextValue =
      inlineValue ??
      (argv[index + 1] && !argv[index + 1].startsWith('-') ? argv[index + 1] : undefined);

    const consumeNext = inlineValue === undefined && nextValue !== undefined;
    if (consumeNext) {
      index += 1;
    }

    switch (flag) {
      case '--name':
      case '-n':
        parsed.name = nextValue;
        break;
      case '--email':
      case '-e':
        parsed.email = nextValue;
        break;
      case '--license-key':
      case '--licenseKey':
      case '-k':
        parsed.licenseKey = nextValue;
        break;
      case '--docs-url':
      case '--docsUrl':
        parsed.docsUrl = nextValue;
        break;
      case '--support-email':
      case '--supportEmail':
        parsed.supportEmail = nextValue;
        break;
      case '--out':
      case '-o':
        parsed.out = nextValue;
        break;
      case '--stdout':
        parsed.stdout = true;
        break;
      case '--file':
        parsed.file = true;
        break;
      default:
        break;
    }
  }

  if (!parsed.name && positional[0]) {
    parsed.name = positional[0];
  }
  if (!parsed.email && positional[1]) {
    parsed.email = positional[1];
  }
  if (!parsed.licenseKey && positional[2]) {
    parsed.licenseKey = positional[2];
  }

  return parsed;
}

function getDefaultOutputFileName(customerName: string): string {
  const slug = customerName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const timestamp = new Date().toISOString().slice(0, 10);
  return `onboarding-${slug || 'customer'}-${timestamp}.md`;
}

function replaceTemplatePlaceholders(template: string, values: Record<string, string>): string {
  let content = template;

  for (const [key, value] of Object.entries(values)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    content = content.replace(pattern, value);
  }

  return content;
}

function extractEmailBody(markdown: string): string {
  const match = markdown.match(/##\s+Email Body\s*\n\n([\s\S]*)$/m);
  return match?.[1]?.trim() ?? markdown.trim();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const rl = createInterface({ input, output });
  const ask = async (label: string, currentValue?: string, fallback = '') => {
    if (currentValue && currentValue.trim()) {
      return currentValue.trim();
    }

    const promptSuffix = fallback ? ` (${fallback})` : '';
    const response = await rl.question(`${label}${promptSuffix}: `);
    return (response.trim() || fallback).trim();
  };

  try {
    const customerName = await ask('Customer name', args.name);
    const customerEmail = await ask('Customer email', args.email);
    const licenseKey = await ask('License key', args.licenseKey);
    const docsUrl = await ask('Docs URL', args.docsUrl, 'https://docs.mamoplayer.com');
    const supportEmail = await ask('Support email', args.supportEmail, 'support@mamoplayer.com');

    const templateRaw = await fs.readFile(TEMPLATE_PATH, 'utf8');
    const renderedTemplate = replaceTemplatePlaceholders(templateRaw, {
      CUSTOMER_NAME: customerName,
      CUSTOMER_EMAIL: customerEmail,
      LICENSE_KEY: licenseKey,
      DOCS_URL: docsUrl,
      SUPPORT_EMAIL: supportEmail,
    });

    const finalEmailBody = extractEmailBody(renderedTemplate);

    let shouldWriteFile = args.file || Boolean(args.out);
    if (!args.stdout && !shouldWriteFile) {
      const saveAnswer = await rl.question('Save output to generated/ file? (y/N): ');
      shouldWriteFile = /^y(es)?$/i.test(saveAnswer.trim());
    }

    if (shouldWriteFile) {
      const defaultName = getDefaultOutputFileName(customerName);
      const userOut = args.out
        ? args.out.trim()
        : await rl.question(`Output filename (${defaultName}): `);
      const chosenName = userOut.trim() || defaultName;
      const outputPath = path.isAbsolute(chosenName)
        ? chosenName
        : path.join(GENERATED_DIR, chosenName);

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, finalEmailBody, 'utf8');
      output.write(`\nGenerated onboarding email: ${outputPath}\n`);
    } else {
      output.write('\n--- Onboarding Email Body ---\n\n');
      output.write(`${finalEmailBody}\n`);
      output.write('\n--- End ---\n');
    }
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Failed to generate onboarding email: ${message}\n`);
  process.exitCode = 1;
});
