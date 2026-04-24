import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const SCREENS_DIR = path.join(process.cwd(), 'admin_screenshots');
if (!fs.existsSync(SCREENS_DIR)) {
  fs.mkdirSync(SCREENS_DIR);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Navigating to login page...');
  await page.goto('http://localhost:3000/admin/login');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENS_DIR, '01_login.png') });

  console.log('Logging in...');
  await page.fill('input[name="email"]', 'alexplum405@gmail.com');
  await page.fill('input[name="password"]', '123abcABC');
  await page.click('button[type="submit"]');

  await page.waitForURL('http://localhost:3000/admin');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENS_DIR, '02_dashboard.png'), fullPage: true });

  const pages = [
    { url: 'http://localhost:3000/admin/articles', name: '03_articles.png' },
    { url: 'http://localhost:3000/admin/categories', name: '04_categories.png' },
    { url: 'http://localhost:3000/admin/tokens', name: '05_tokens.png' },
    { url: 'http://localhost:3000/admin/storage', name: '06_storage.png' },
    { url: 'http://localhost:3000/admin/articles/new', name: '07_article_new.png' }
  ];

  for (const p of pages) {
    console.log(`Navigating to ${p.url}...`);
    await page.goto(p.url);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENS_DIR, p.name), fullPage: true });
  }

  await browser.close();
  console.log('Screenshots saved to', SCREENS_DIR);
}

main().catch(console.error);
