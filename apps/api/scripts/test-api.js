import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const apiDirectory = path.resolve(scriptDirectory, '..');
const serverPath = path.join(apiDirectory, 'backend', 'server.js');
const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'studylink-api-test-'));
const authSecret = 'studylink-api-test-secret-not-for-production';
process.env.AUTH_SECRET = authSecret;
const { hashPassword } = await import('../backend/lib/auth.js');

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not determine an available test port.'));
        return;
      }
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

async function request(baseUrl, endpoint, { token, method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(`${method} ${endpoint} returned non-JSON (${response.status}).`);
    }
  }
  return { response, payload };
}

async function expectStatus(baseUrl, endpoint, expectedStatus, options) {
  const result = await request(baseUrl, endpoint, options);
  assert.equal(
    result.response.status,
    expectedStatus,
    `${options?.method || 'GET'} ${endpoint}: expected ${expectedStatus}, received ${result.response.status}: ${result.payload.message || ''}`,
  );
  return result.payload;
}

async function waitForServer(baseUrl, child, getOutput) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`API test server exited early.\n${getOutput()}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error(`API test server did not become ready.\n${getOutput()}`);
}

async function main() {
  const statePath = path.join(testDirectory, 'data.json');
  const uploadPath = path.join(testDirectory, 'uploads');
  const adminPassword = 'LocalTestAdmin!123';
  fs.writeFileSync(statePath, JSON.stringify({
    users: [{
      id: 1,
      email: 'admin@test.studylink.local',
      full_name: 'StudyLink Test Admin',
      password_hash: hashPassword(adminPassword),
      role: 'admin',
      is_suspended: false,
      profile_visibility: 'members',
      notification_preferences: { groups: true, sessions: true, moderation: true },
    }],
    groups: [],
    sessions: [],
    resources: [],
  }));

  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  let output = '';
  const child = spawn(process.execPath, [serverPath], {
    cwd: apiDirectory,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'test',
      AUTH_SECRET: authSecret,
      DATABASE_URL: '',
      STUDYLINK_DATA_PATH: statePath,
      STUDYLINK_UPLOADS_PATH: uploadPath,
      CORS_ORIGIN: baseUrl,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.setEncoding('utf8').on('data', (chunk) => { output += chunk; });
  child.stderr.setEncoding('utf8').on('data', (chunk) => { output += chunk; });

  try {
    await waitForServer(baseUrl, child, () => output);
    await expectStatus(baseUrl, '/api/groups', 401);

    const adminLogin = await expectStatus(baseUrl, '/api/auth/login', 200, {
      method: 'POST',
      body: { email: 'admin@test.studylink.local', password: adminPassword },
    });
    const adminToken = adminLogin.token;
    const adminUsers = (await expectStatus(baseUrl, '/api/admin/users', 200, { token: adminToken })).users;
    assert.equal(adminUsers.length, 1);
    const auditEvents = (await expectStatus(baseUrl, '/api/admin/audit', 200, { token: adminToken })).events;
    assert.ok(Array.isArray(auditEvents));
    const providerStatus = (await expectStatus(baseUrl, '/api/admin/ai-provider', 200, { token: adminToken })).provider;
    assert.equal(providerStatus.connected, false);
    assert.equal(providerStatus.mode, 'curated-prototype');
    assert.ok(Number.isInteger(providerStatus.curatedLinks));
    assert.ok(Array.isArray(providerStatus.recentLinks));

    const student1Signup = await expectStatus(baseUrl, '/api/auth/signup', 201, {
      method: 'POST',
      body: {
        fullName: 'Test Student One',
        email: 'student1@test.studylink.local',
        password: 'LocalTestStudent!123',
        university: 'Test University',
        program: 'Computing',
      },
    });
    const student1Token = student1Signup.token;
    await expectStatus(baseUrl, '/api/admin/audit', 403, { token: student1Token });
    await expectStatus(baseUrl, '/api/admin/ai-provider', 403, { token: student1Token });
    const aiResponseReport = await expectStatus(baseUrl, '/api/ai/report', 201, {
      token: student1Token,
      method: 'POST',
      body: {
        courseCode: 'APT3060',
        responseHeadline: 'Revision guidance',
        reason: 'inaccurate',
        details: 'One item needs a correction.',
      },
    });
    assert.ok(aiResponseReport.report.id);
    const auditAfterAiReport = (await expectStatus(baseUrl, '/api/admin/audit', 200, { token: adminToken })).events;
    assert.ok(auditAfterAiReport.some((event) => event.action === 'ai_response_reported'));
    await expectStatus(baseUrl, '/api/ai/report', 400, {
      token: student1Token,
      method: 'POST',
      body: {
        courseCode: 'APT3060',
        responseHeadline: 'Revision guidance',
        reason: 'invalid',
      },
    });
    const student2Signup = await expectStatus(baseUrl, '/api/auth/signup', 201, {
      method: 'POST',
      body: {
        fullName: 'Test Student Two',
        email: 'student2@test.studylink.local',
        password: 'LocalTestStudent!456',
        university: 'Test University',
        program: 'Computing',
      },
    });
    const student2Token = student2Signup.token;

    const profile = await expectStatus(baseUrl, '/api/profile', 200, { token: student1Token });
    assert.equal(profile.user.program, 'Computing');
    await expectStatus(baseUrl, '/api/profile', 200, {
      token: student1Token,
      method: 'PATCH',
      body: {
        profileVisibility: 'private',
        notificationPreferences: { groups: false, sessions: true, moderation: true },
      },
    });

    const courses = (await expectStatus(baseUrl, '/api/courses', 200, { token: student1Token })).courses;
    assert.ok(courses.length > 0, 'default local courses should be available');
    const courseId = courses[0].id;
    assert.equal((await expectStatus(baseUrl, `/api/courses/${courseId}/enroll`, 200, { token: student1Token, method: 'POST' })).course.isEnrolled, true);
    assert.equal((await expectStatus(baseUrl, `/api/courses/${courseId}/enroll`, 200, { token: student1Token, method: 'DELETE' })).course.isEnrolled, false);

    const group = (await expectStatus(baseUrl, '/api/groups', 201, {
      token: adminToken,
      method: 'POST',
      body: {
        name: 'Test Study Group',
        courseName: 'Test Course',
        courseCode: 'TST101',
        joinRequirements: ['Confirm you meet the group requirements.'],
        capacity: 2,
      },
    })).group;
    await expectStatus(baseUrl, `/api/groups/${group.id}`, 200, { token: student1Signup.token });
    await expectStatus(baseUrl, `/api/groups/${group.id}/enroll`, 400, { token: student1Token, method: 'POST', body: {} });
    await expectStatus(baseUrl, `/api/groups/${group.id}/enroll`, 200, { token: student1Token, method: 'POST', body: { acceptedRequirements: true } });
    await expectStatus(baseUrl, `/api/groups/${group.id}/enroll`, 409, { token: student2Token, method: 'POST', body: { acceptedRequirements: true } });

    const session = (await expectStatus(baseUrl, '/api/sessions', 201, {
      token: adminToken,
      method: 'POST',
      body: { groupId: group.id, title: 'Test Session', startsAt: '2030-01-01T12:00:00Z', location: 'Online' },
    })).session;
    assert.equal((await expectStatus(baseUrl, `/api/sessions/${session.id}/enroll`, 200, { token: student1Token, method: 'POST' })).session.isEnrolled, true);
    await expectStatus(baseUrl, `/api/sessions/${session.id}/enroll`, 403, { token: student2Token, method: 'POST' });
    assert.equal((await expectStatus(baseUrl, `/api/sessions/${session.id}/enroll`, 200, { token: student1Token, method: 'DELETE' })).session.isEnrolled, false);
    assert.equal((await expectStatus(baseUrl, `/api/sessions/${session.id}`, 200, { token: student1Token })).session.isEnrolled, false);
    await expectStatus(baseUrl, `/api/groups/${group.id}/enroll`, 409, { token: adminToken, method: 'DELETE' });
    await expectStatus(baseUrl, `/api/groups/${group.id}/enroll`, 200, { token: student1Token, method: 'DELETE' });

    const report = (await expectStatus(baseUrl, '/api/reports', 201, {
      token: student1Token,
      method: 'POST',
      body: { contentType: 'group', contentId: group.id, reason: 'Inappropriate content', details: 'Test report' },
    })).report;
    await expectStatus(baseUrl, '/api/admin/reports', 200, { token: adminToken });
    await expectStatus(baseUrl, `/api/admin/reports/${report.id}`, 200, {
      token: adminToken,
      method: 'PATCH',
      body: { action: 'dismiss' },
    });
    const studentNotifications = (await expectStatus(baseUrl, '/api/notifications', 200, { token: student1Token })).notifications;
    const moderationNotification = studentNotifications.find((notification) => notification.type === 'moderation');
    assert.ok(moderationNotification);
    await expectStatus(baseUrl, `/api/notifications/${moderationNotification.id}/read`, 200, { token: student1Token, method: 'PATCH' });
    assert.ok((await expectStatus(baseUrl, '/api/notifications', 200, { token: student1Token })).notifications.find((notification) => notification.id === moderationNotification.id)?.read_at);

    const resource = (await expectStatus(baseUrl, '/api/resources', 201, {
      token: student1Token,
      method: 'POST',
      body: {
        title: 'Test resource',
        resourceType: 'Guide',
        url: 'https://example.test/study-guide',
        sourceNote: 'Created for integration testing.',
        courseCode: 'TST101',
      },
    })).resource;
    const resourceDetails = (await expectStatus(baseUrl, `/api/resources/${resource.id}`, 200, { token: student1Token })).resource;
    assert.equal(resourceDetails.sourceNote, 'Created for integration testing.');
    assert.equal(resourceDetails.courseCode, 'TST101');

    await expectStatus(baseUrl, '/api/notifications', 204, { token: student1Token, method: 'DELETE' });
    assert.equal((await expectStatus(baseUrl, '/api/notifications', 200, { token: student1Token })).notifications.length, 0);

    const unsupportedUpload = await request(baseUrl, '/api/uploads', {
      token: student1Token,
      method: 'POST',
      body: { filename: 'unsafe.exe', data: Buffer.from('test').toString('base64') },
    });
    assert.equal(unsupportedUpload.response.status, 400, 'disallowed uploads must be rejected');
    const oversizedUpload = await request(baseUrl, '/api/uploads', {
      token: student1Token,
      method: 'POST',
      body: {
        filename: 'oversized.pdf',
        data: Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64'),
      },
    });
    assert.equal(
      oversizedUpload.response.status,
      400,
      `uploads over 5 MiB must be rejected: ${oversizedUpload.payload.message || 'no API error message returned'}\n${output}`,
    );

    await expectStatus(baseUrl, '/api/admin/users', 403, { token: student1Token });
    await expectStatus(baseUrl, `/api/admin/users/${student2Signup.user.id}/suspension`, 200, {
      token: adminToken,
      method: 'PATCH',
      body: { suspended: true },
    });
    await expectStatus(baseUrl, '/api/auth/login', 403, {
      method: 'POST',
      body: { email: 'student2@test.studylink.local', password: 'LocalTestStudent!456' },
    });

    console.log('API integration tests passed: auth, profile preferences, course enrollment, group capacity/requirements/leave, session RSVP, moderation notifications, uploads, and suspension.');
  } finally {
    if (child.exitCode === null) {
      const stopped = new Promise((resolve) => child.once('exit', resolve));
      child.kill();
      await stopped;
    }
    fs.rmSync(testDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
