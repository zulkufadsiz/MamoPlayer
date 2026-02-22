import { readFile } from 'node:fs/promises';
import path from 'node:path';

type LicenseRecord = {
  customer?: string;
  contactEmail?: string;
  licenseKey?: string;
  tier?: string;
  notes?: string;
};

async function main(): Promise<void> {
  const licenseFilePath = path.resolve(process.cwd(), 'config/licenses.json');
  const raw = await readFile(licenseFilePath, 'utf8');
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('Expected config/licenses.json to contain an array of licenses.');
  }

  const rows = (parsed as LicenseRecord[]).map((license) => ({
    Customer: license.customer ?? '',
    Email: license.contactEmail ?? '',
    'License Key': license.licenseKey ?? '',
    Tier: license.tier ?? '',
    Notes: license.notes ?? '',
  }));

  if (rows.length === 0) {
    console.log('No licenses found in config/licenses.json');
    return;
  }

  console.table(rows);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to list licenses: ${message}`);
  process.exit(1);
});
