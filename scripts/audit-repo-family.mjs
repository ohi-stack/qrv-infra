const STRICT = process.env.QRV_AUDIT_STRICT === '1';

const SERVICES = [
  {
    name: 'issuer',
    repo: 'issuer-qrv',
    required: ['DATABASE_URL', 'ISSUER_TOKEN', 'JWT_SECRET', 'SIGNING_SECRET', 'APP_BASE_URL', 'NEXT_PUBLIC_QRV_API_BASE_URL', 'NEXT_PUBLIC_QRV_VERIFY_BASE_URL']
  },
  {
    name: 'api',
    repo: 'qrv-api',
    required: ['DATABASE_URL', 'APP_BASE_URL']
  },
  {
    name: 'verify',
    repo: 'qrv-verify',
    required: ['DATABASE_URL', 'APP_BASE_URL']
  },
  {
    name: 'registry',
    repo: 'qrv-registry',
    required: ['DATABASE_URL', 'REGISTRY_API_KEY']
  }
];

const EXPECTED_HOSTS = [
  'issuer.qrv.network',
  'api.qrv.network',
  'verify.qrv.network',
  'registry.qrv.network'
];

const CANONICAL_PUBLIC_URLS = {
  issuer: process.env.QRV_ISSUER_BASE_URL || 'https://issuer.qrv.network',
  api: process.env.QRV_API_BASE_URL || 'https://api.qrv.network',
  verify: process.env.QRV_VERIFY_BASE_URL || 'https://verify.qrv.network',
  registry: process.env.QRV_REGISTRY_BASE_URL || 'https://registry.qrv.network'
};

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
    .filter(([key]) => key.startsWith('QRV_') || key.includes('URL') || key.includes('BASE'))
    .map(([key, value]) => ({ key, value }));

  const notes = [];
  for (const host of EXPECTED_HOSTS) {
    const found = values.some(({ value }) => String(value).includes(host));
    notes.push({ host, referenced: found });
  }
  return notes;
}

function auditCanonicalUrls() {
  return Object.entries(CANONICAL_PUBLIC_URLS).map(([service, url]) => ({
    service,
    url,
    https: String(url).startsWith('https://'),
    hostOk: String(url).includes(`${service}.qrv.network`)
  }));
}

const serviceResults = SERVICES.map(auditService);
const canonicalUrls = auditCanonicalUrls();
const missingRequired = serviceResults.some((item) => !item.ok);
const urlFailures = canonicalUrls.some((item) => !item.https || !item.hostOk);

const report = {
  service: 'qrv-repo-family-audit',
  timestamp: new Date().toISOString(),
  strict: STRICT,
  services: serviceResults,
  canonicalUrls,
  hostReferences: auditUrls(),
  ok: STRICT ? !missingRequired && !urlFailures : !urlFailures
};

console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  process.exitCode = 1;
}
