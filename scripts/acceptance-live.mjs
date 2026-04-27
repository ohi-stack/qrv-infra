const INCLUDE_DEMO = process.env.QRV_ACCEPTANCE_INCLUDE_DEMO === '1';
const DEMO_QRVID = process.env.QRV_DEMO_QRVID || 'QRV-PROD-CERT-000001';

const DEFAULT_TARGETS = [
  { name: 'issuer-health', url: process.env.QRV_ISSUER_URL || 'https://issuer.qrv.network/health', critical: true },
  { name: 'api-health', url: process.env.QRV_API_URL || 'https://api.qrv.network/health', critical: true },
  { name: 'verify-health', url: process.env.QRV_VERIFY_URL || 'https://verify.qrv.network/healthz', critical: true },
  { name: 'registry-health', url: process.env.QRV_REGISTRY_URL || 'https://registry.qrv.network/health', critical: true },
  ...(INCLUDE_DEMO
    ? [
        {
          name: 'verify-demo-json',
          url: process.env.QRV_VERIFY_DEMO_URL || `https://verify.qrv.network/api/v1/verify/${encodeURIComponent(DEMO_QRVID)}`,
          critical: true,
          expectVerified: true
        }
      ]
    : [])
];

const USER_AGENT = process.env.QRV_ACCEPTANCE_USER_AGENT || 'QRV-Monitor/1.0 (+https://qrv.network; ops@qrv.network)';
const MIN_DELAY_MS = Number(process.env.QRV_ACCEPTANCE_MIN_DELAY_MS || 1500);
const MAX_DELAY_MS = Number(process.env.QRV_ACCEPTANCE_MAX_DELAY_MS || 3000);
const RETRIES = Number(process.env.QRV_ACCEPTANCE_RETRIES || 3);
const TIMEOUT_MS = Number(process.env.QRV_ACCEPTANCE_TIMEOUT_MS || 10_000);
const RATE_LIMIT_COOLDOWN_MS = Number(process.env.QRV_ACCEPTANCE_RATE_LIMIT_COOLDOWN_MS || 30_000);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(multiplier = 1) {
  const spread = Math.max(0, MAX_DELAY_MS - MIN_DELAY_MS);
  return (MIN_DELAY_MS + Math.floor(Math.random() * (spread + 1))) * multiplier;
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
        'cache-control': 'no-cache',
        pragma: 'no-cache'
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

async function readBody(response) {
  try {
    return await response.text();
  } catch (_error) {
    return '';
  }
}

function parseRetryAfter(response) {
  const retryAfter = response.headers.get('retry-after');
  if (!retryAfter) return RATE_LIMIT_COOLDOWN_MS;
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) return Math.max(seconds * 1000, RATE_LIMIT_COOLDOWN_MS);
  const date = Date.parse(retryAfter);
  if (Number.isFinite(date)) return Math.max(date - Date.now(), RATE_LIMIT_COOLDOWN_MS);
  return RATE_LIMIT_COOLDOWN_MS;
}

function bodyMatchesTarget(target, body) {
  if (!target.expectVerified) return true;
  return /"state"\s*:\s*"VERIFIED"|"status"\s*:\s*"VERIFIED"/i.test(body);
}

async function probe(target) {
  let lastError = null;

  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(target.url);
      const body = await readBody(response);
      const retryable = response.status === 429 || response.status >= 500;
      const okStatus = response.status >= 200 && response.status < 400;
      const bodyOk = bodyMatchesTarget(target, body);

      if (okStatus && bodyOk) {
        return { ...target, ok: true, status: response.status, attempt };
      }

      lastError = bodyOk ? `HTTP ${response.status}` : 'Expected VERIFIED demo response';

      if (response.status === 429) {
        const cooldownMs = parseRetryAfter(response);
        console.warn(`RATE_LIMIT ${target.name} ${response.status}; waiting ${cooldownMs}ms before retry`);
        await wait(cooldownMs);
      } else if (retryable && attempt < RETRIES) {
        await wait(jitter(attempt));
      } else {
        return { ...target, ok: false, status: response.status, attempt, error: lastError };
      }
    } catch (error) {
      lastError = error?.message || 'request failed';
      if (attempt === RETRIES) {
        return { ...target, ok: false, status: 0, attempt, error: lastError };
      }
      await wait(jitter(attempt));
    }
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

  const failed = results.filter((result) => !result.ok && result.critical !== false);
  const rateLimited = results.filter((result) => result.status === 429);
  const report = {
    service: 'qrv-live-acceptance',
    startedAt,
    finishedAt: new Date().toISOString(),
    userAgent: USER_AGENT,
    minDelayMs: MIN_DELAY_MS,
    maxDelayMs: MAX_DELAY_MS,
    retries: RETRIES,
    rateLimitCooldownMs: RATE_LIMIT_COOLDOWN_MS,
    includeDemo: INCLUDE_DEMO,
    results,
    blockers: rateLimited.length ? ['HTTP 429 rate limiting observed. Whitelist monitor or reduce probe frequency.'] : []
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
