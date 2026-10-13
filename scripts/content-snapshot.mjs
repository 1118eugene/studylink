import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import ts from 'typescript';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = (process.env.SNAPSHOT_BASE_URL || 'http://127.0.0.1:5173').replace(/\/+$/, '');
const sourceRoot = path.resolve(process.env.SNAPSHOT_SOURCE_ROOT || projectRoot);
const outputRoot = path.resolve(process.env.SNAPSHOT_OUTPUT_DIR || path.join(projectRoot, 'docs', 'baseline'));
const screenshotsRoot = process.env.SNAPSHOT_SCREENSHOTS_DIR
  ? path.resolve(process.env.SNAPSHOT_SCREENSHOTS_DIR)
  : null;
const snapshotLabel = process.env.SNAPSHOT_LABEL || 'capture';
const routes = [
  '/', '/login', '/signup', '/about', '/contact', '/dashboard', '/schools',
  '/courses', '/courses/1', '/ask-ai', '/admin/academic',
  '/admin/reports', '/groups', '/groups/new', '/groups/1', '/sessions',
  '/learning?view=library', '/learning?view=resources', '/resources',
  '/library', '/resources/1', '/profile',
  ...(process.env.SNAPSHOT_EXTRA_ROUTES || '').split(',').map((route) => route.trim()).filter(Boolean),
];

function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function routeFileName(route) {
  if (route === '/') return 'home.json';
  return `${route.replace(/^\/+/, '').replace(/\//g, '__').replace(/[?&=]/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '_') || 'home'}.json`;
}

async function snapshotVisibleContent(page) {
  return page.evaluate(() => {
    const isVisible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };
    const label = (element) => (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
    const textStrings = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      const value = textNode.textContent.replace(/\s+/g, ' ').trim();
      if (value && isVisible(textNode.parentElement)) textStrings.add(value);
    }
    return {
      text: (document.body.innerText || '').split(/\n+/).map((value) => value.replace(/\s+/g, ' ').trim()).filter(Boolean),
      textStrings: [...textStrings],
      buttons: [...document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]')]
        .filter(isVisible)
        .map((element) => ({ label: label(element), disabled: element.matches(':disabled') })),
      links: [...document.querySelectorAll('a[href]')]
        .filter(isVisible)
        .map((element) => ({ label: label(element), href: element.getAttribute('href') || element.href })),
      images: [...document.querySelectorAll('img')]
        .filter(isVisible)
        .map((element) => ({ src: element.getAttribute('src') || element.currentSrc || element.src, alt: element.alt || '' })),
      cardHeights: [
        ...[...document.querySelectorAll('.course-showcase-card, .course-card')].map((element) => ({ kind: 'course', height: element.getBoundingClientRect().height })),
        ...[...document.querySelectorAll('.resource-library-card, .resource-card')].map((element) => ({ kind: 'resource', height: element.getBoundingClientRect().height })),
      ],
    };
  });
}

async function captureMobileSource() {
  const workspaceMobileRoot = path.join(sourceRoot, 'apps', 'mobile');
  const originalMobileRoot = path.join(sourceRoot, 'mobile');
  const mobileRoot = await fs.stat(workspaceMobileRoot).then(() => workspaceMobileRoot).catch(() => originalMobileRoot);
  const results = {};
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (['.expo', 'build', 'dist', 'node_modules'].includes(entry.name)) continue;
        await walk(absolutePath);
      } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
        const source = await fs.readFile(absolutePath, 'utf8');
        const parsed = ts.createSourceFile(absolutePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        const values = new Set();
        const add = (value) => {
          const normalized = normalize(value);
          if (normalized) values.add(normalized);
        };
        const visit = (node) => {
          if (ts.isJsxText(node)) add(node.text);
          if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name)
            && ['aria-label', 'alt', 'placeholder', 'title', 'value'].includes(node.name.text)) {
            if (node.initializer && ts.isStringLiteral(node.initializer)) add(node.initializer.text);
            if (node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression
              && ts.isStringLiteral(node.initializer.expression)) add(node.initializer.expression.text);
          }
          if (ts.isJsxExpression(node) && node.expression && ts.isJsxElement(node.parent)) {
            const addChildStrings = (child) => {
              if (ts.isStringLiteral(child) || ts.isNoSubstitutionTemplateLiteral(child)) add(child.text);
              ts.forEachChild(child, addChildStrings);
            };
            addChildStrings(node.expression);
          }
          ts.forEachChild(node, visit);
        };
        visit(parsed);
        const relativePath = path.relative(sourceRoot, absolutePath).replaceAll(path.sep, '/');
        results[relativePath] = [...values].sort((a, b) => a.localeCompare(b));
      }
    }
  }
  await walk(mobileRoot);
  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(path.join(outputRoot, 'mobile-source.json'), `${JSON.stringify(results, null, 2)}\n`);
  return results;
}

async function main() {
  await fs.mkdir(outputRoot, { recursive: true });
  if (screenshotsRoot) await fs.mkdir(screenshotsRoot, { recursive: true });
  const mobileSource = await captureMobileSource();
  if (process.env.SNAPSHOT_SOURCE_ONLY === '1') return;
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.SNAPSHOT_BROWSER_EXECUTABLE
      ? { executablePath: process.env.SNAPSHOT_BROWSER_EXECUTABLE }
      : {}),
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  let email = process.env.SNAPSHOT_EMAIL;
  let password = process.env.SNAPSHOT_PASSWORD;
  if (process.env.SNAPSHOT_CREATE_TEST_ACCOUNT === 'true') {
    email ||= `studylink-baseline-${Date.now()}@test.studylink.local`;
    password ||= `Snapshot-${randomUUID()}-A1!`;
  }
  const comparisonRoot = process.env.SNAPSHOT_COMPARE_DIR
    ? path.resolve(process.env.SNAPSHOT_COMPARE_DIR)
    : null;
  const comparison = [];
  const writeSnapshot = async (route, page, response) => {
    const snapshot = await snapshotVisibleContent(page);
    const output = {
      route,
      finalUrl: page.url(),
      status: response?.status() ?? null,
      capturedAt: new Date().toISOString(),
      ...snapshot,
    };
    const filename = routeFileName(route);
    await fs.writeFile(path.join(outputRoot, filename), `${JSON.stringify(output, null, 2)}\n`);
    if (screenshotsRoot && (route === '/courses' || route === '/learning?view=library')) {
      const pageName = route === '/courses' ? 'courses' : 'learning-hub';
      await page.screenshot({
        path: path.join(screenshotsRoot, `${snapshotLabel}-${pageName}-1280.png`),
        fullPage: true,
      });
    }

    if (comparisonRoot) {
      try {
        const before = JSON.parse(await fs.readFile(path.join(comparisonRoot, filename), 'utf8'));
        const missing = (field, key = null) => {
          const afterItems = snapshot[field].map((item) => key ? item[key] : item);
          return before[field]
            .map((item) => key ? item[key] : item)
            .filter((value) => !afterItems.includes(value));
        };
        comparison.push({
          route,
          missingText: missing('textStrings'),
          missingButtons: missing('buttons', 'label'),
          missingLinks: missing('links', 'href'),
          missingImages: missing('images', 'src'),
        });
      } catch (error) {
        comparison.push(error.code === 'ENOENT'
          ? { route, notInOriginalBaseline: true }
          : { route, error: `Baseline unavailable: ${error.message}` });
      }
    }
    console.log(`${route}: ${snapshot.text.length} visible text lines, ${snapshot.buttons.length} buttons, ${snapshot.links.length} links, ${snapshot.images.length} images`);
  };

  try {
    const publicRoutes = ['/', '/login', '/signup', '/about', '/contact'];
    const anonymousPage = await context.newPage();
    for (const route of publicRoutes) {
      const response = await anonymousPage.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
      await writeSnapshot(route, anonymousPage, response);
    }
    await anonymousPage.close();

    if (email && password && process.env.SNAPSHOT_CREATE_TEST_ACCOUNT !== 'true') {
      await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill(password);
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 15000 });
    } else if (email && password) {
      await page.goto(`${baseUrl}/signup`, { waitUntil: 'domcontentloaded' });
      await page.locator('input[name="fullName"]').fill('StudyLink Baseline');
      await page.locator('input[name="email"]').fill(email);
      await page.locator('input[name="university"]').fill('StudyLink Test University');
      const programInput = page.locator('input[name="program"]');
      if (await programInput.count()) await programInput.fill('Baseline Verification');
      await page.locator('input[name="password"]').fill(password);
      await page.locator('input[name="confirmPassword"]').fill(password);
      await page.getByRole('button', { name: /create account/i }).click();
      await page.waitForURL((url) => !url.pathname.endsWith('/signup'), { timeout: 15000 });
    }

    if (!email || !password) {
      console.warn('No snapshot login configured; protected routes will be captured at their login redirect.');
    }

    for (const route of routes.filter((item) => !publicRoutes.includes(item))) {
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(150);
      await writeSnapshot(route, page, response);
    }

    if (comparisonRoot) {
      const baselineMobile = JSON.parse(await fs.readFile(path.join(comparisonRoot, 'mobile-source.json'), 'utf8'));
      const originalMobileStrings = new Set(Object.values(baselineMobile).flat());
      const updatedMobileStrings = new Set(Object.values(mobileSource).flat());
      comparison.push({
        route: 'mobile-source',
        missingMobileStrings: [...originalMobileStrings].filter((value) => !updatedMobileStrings.has(value)),
      });
      const diffPath = path.join(outputRoot, 'content-diff.json');
      await fs.writeFile(diffPath, `${JSON.stringify(comparison, null, 2)}\n`);
      const missingCount = comparison.reduce((count, entry) => count
        + (entry.missingText?.length || 0)
        + (entry.missingButtons?.length || 0)
        + (entry.missingLinks?.length || 0)
        + (entry.missingImages?.length || 0)
        + (entry.missingMobileStrings?.length || 0)
        + (entry.error ? 1 : 0), 0);
      console.log(`Content comparison: ${missingCount} missing baseline items. Report: ${diffPath}`);
      if (missingCount > 0) process.exitCode = 2;
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
