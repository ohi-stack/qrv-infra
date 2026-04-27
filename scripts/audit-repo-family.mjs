const SERVICES = [
  { name: 'issuer', repo: 'issuer-qrv', required: ['REGISTRY_API_URL', 'ISSUER_ID', 'ISSUER_API_KEY', 'PUBLIC_VERIFY_BASE_URL'] },
  { name: 'api', repo: 'qrv-api', required: ['REGISTRY_API_URL'] },
  { name: 'verify', repo: 'qrv-verify', required: ['DATABASE_URL', 'APP_BASE_URL'] },
  { name: 'registry', repo: 'qrv-registry', required: ['DATABASE_URL', 'REGISTRY_API_KEY'] }
];

const EXPECTED_HOSTS = [
  'issuer.qrv.network',
  'api.qrv.network',
  'verify.qrv.network',
  'registry.qrv.network'
];

function readEnv(name) {
  return process.env[name] || '';
}

function mask(value) {
  if (!value) return 'MISSING';
  if (value.length <= 8) return 'SET';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function auditService(service) {
  const missing = service.required.filter((key) => !readEnv(key));
  return {
    name: service.name,
    repo: service.repo,
    required: Object.fromEntries(service.required.map((key) => [key, mask(readEnv(key))])),
    missing,
    ok: missing.length === 0
  };
}

function auditUrls() {
  const values = Object.entries(process.env)
    .filter(([key]) => key.startsWith('QRV_') || key.includes('URL'))
    .map(([key, value]) => ({ key, value }));

  const notes = [];
  for (const host of EXPECTED_HOSTS) {
    const found = values.some(({ value }) => String(value).includes(host));
    notes.push({ host, referenced: found });
  }
  return notes;
}

const serviceResults = SERVICES.map(auditService);
const report = {
  service: 'qrv-repo-family-audit',
  timestamp: new Date().toISOString(),
  services: serviceResults,
  hostReferences: auditUrls(),
  ok: serviceResults.every((item) => item.ok)
};

console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  process.exitCode = 1;
}
