const DEFAULT_TARGETS = [
  { name: 'issuer', url: process.env.QRV_ISSUER_URL || 'https://issuer.qrv.network/health' },
  { name: 'api', url: process.env.QRV_API_URL || 'https://api.qrv.network/health' },
  { name: 'verify', url: process.env.QRV_VERIFY_URL || 'https://verify.qrv.network/healthz' },
  { name: 'registry', url: process.env.QRV_REGISTRY_URL || 'https://registry.qrv.network/health' }
];

const USER_AGENT = process.env.QRV_ACCEPTANCE_USER_AGENT || 'QRV-Monitor/1.0 (+https://qrv.network)';
const MIN_DELAY_MS = Number(process.env.QRV_ACCEPTANCE_MIN_DELAY_MS || 1200);
const MAX_DELAY_MS = Number(process.env.QRV_ACCEPTANCE_MAX_DELAY_MS || 2500);
const RETRIES = Number(process.env.QRV_ACCEPTANCE_RETRIES || 3);
const TIMEOUT_MS = Number(process.env.QRV_ACCEPTANCE_TIMEOUT_MS || 10_000);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter() {
  const spread = Math.max(0, MAX_DELAY_MS - MIN_DELAY_MS);
  return MIN_DELAY_MS + Math.floor(Math.random() * (spread + 1));
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': USER_AGENT,
        accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
        'cache-control': 'no-cache'
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

async function probe(target) {
  let lastError = null;
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(target.url);
      const ok = response.status >= 200 && response.status < 500;
      const retryable = response.status === 429 || response.status >= 500;
      if (ok && !retryable) {
        return { ...target, ok: true, status: response.status, attempt };
      }
      lastError = `HTTP ${response.status}`;
      if (!retryable || attempt === RETRIES) {
        return { ...target, ok: false, status: response.status, attempt, error: lastError };
      }
    } catch (error) {
      lastError = error?.message || 'request failed';
      if (attempt === RETRIES) {
        return { ...target, ok: false, status: 0, attempt, error: lastError };
      }
    }
    await wait(jitter() * attempt);
  }
  return { ...target, ok: false, status: 0, attempt: RETRIES, error: lastError || 'unknown failure' };
}

async function main() {
  const startedAt = new Date().toISOString();
  const results = [];

  for (const target of DEFAULT_TARGETS) {
    await wait(jitter());
    const result = await probe(target);
    results.push(result);
    const marker = result.ok ? 'PASS' : 'FAIL';
    console.log(`${marker} ${result.name} ${result.status} ${result.url} attempt=${result.attempt}${result.error ? ` error=${result.error}` : ''}`);
  }

  const failed = results.filter((result) => !result.ok);
  const report = {
    service: 'qrv-live-acceptance',
    startedAt,
    finishedAt: new Date().toISOString(),
    userAgent: USER_AGENT,
    minDelayMs: MIN_DELAY_MS,
    maxDelayMs: MAX_DELAY_MS,
    retries: RETRIES,
    results
  };

  console.log(JSON.stringify(report, null, 2));

  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
