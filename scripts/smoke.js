const base = (process.env.SMOKE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');
const token = process.env.SMOKE_AUTH_TOKEN;
const requireDatabase = process.env.SMOKE_REQUIRE_DATABASE === 'true';
const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForHealth(retries = 30, delay = 500) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) {
        return response;
      }
    } catch {
      // Retry until the server is ready.
    }
    await timeout(delay);
  }

  throw new Error(`API did not become healthy at ${base} in time.`);
}

async function readJson(response, endpoint) {
  const body = await response.text();
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`${endpoint} returned a non-JSON response (${response.status}).`);
  }
}

async function main() {
  const healthResponse = await waitForHealth();
  const health = await readJson(healthResponse, '/api/health');
  if (health.status !== 'ok' && health.status !== 'degraded') {
    throw new Error(`Unexpected API health response: ${JSON.stringify(health)}`);
  }
  if (requireDatabase && health.database !== 'connected') {
    throw new Error(`PostgreSQL is required for this smoke run; API reports ${health.database}.`);
  }
  console.log(`API health: ${health.status} (${health.database}).`);

  if (!token) {
    const response = await fetch(`${base}/api/academic/schools`);
    if (response.status !== 401) {
      throw new Error(`Expected unauthenticated request to return 401, received ${response.status}.`);
    }
    console.log('Authentication gate: passed (401 without a token).');
    console.log('Authenticated endpoint checks skipped; set SMOKE_AUTH_TOKEN to exercise them.');
    return;
  }

  const endpoints = [
    ['/api/academic/schools', 'schools'],
    ['/api/academic/programs', 'programs'],
    ['/api/academic/courses', 'courses'],
  ];

  for (const [endpoint, resultKey] of endpoints) {
    const response = await fetch(`${base}${endpoint}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = await readJson(response, endpoint);
    if (!response.ok) {
      throw new Error(`${endpoint} failed (${response.status}): ${payload.message || 'No error message returned.'}`);
    }
    if (!Array.isArray(payload[resultKey])) {
      throw new Error(`${endpoint} did not return the expected "${resultKey}" array.`);
    }
    console.log(`${endpoint}: passed (${payload[resultKey].length} ${resultKey}).`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
