import puppeteer from 'puppeteer';
import Product from '../models/Product.js';
import commonProducts from '../utils/commonProducts.js';

// Common name normalization
const normalizeCommonName = (productName) => {
  const lowerName = productName.toLowerCase();
  for (const group of commonProducts) {
    if (group.matchKeywords.some((kw) => lowerName.includes(kw))) {
      return group.key;
    }
  }
  return lowerName.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

// 🛒 SWIGGY
export const scrapeSwiggy = async () => {
const browser = await puppeteer.launch({
  headless: false, // 👈 show the browser
  slowMo: 50,       // 👈 slow down for human visibility
  defaultViewport: null,
  args: ['--no-sandbox', '--start-maximized']
});  const page = await browser.newPage();

  await page.goto('https://www.swiggy.com/instamart?entryId=1234&entryName=mainTileEntry4&v=1/', { waitUntil: 'networkidle2', timeout: 60000 });

  try {
    await page.waitForSelector('[placeholder="Enter your delivery pincode"]', { timeout: 10000 });
    await page.type('[placeholder="Enter your delivery pincode"]', '110001');
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
  } catch (err) {
    console.warn('⚠️ Swiggy pincode entry skipped:', err.message);
  }

  await page.goto('https://www.swiggy.com/instamart', { waitUntil: 'networkidle2' });

  await page.waitForSelector('a[href*="/instamart/product/"]', { timeout: 20000 });

  const products = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('a[href*="/instamart/product/"]'));
    return items.map((item) => {
      const name = item.querySelector('div')?.innerText?.trim();
      const priceMatch = item.innerText.match(/₹\s?[\d.]+/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/[^\d.]/g, '')) : 0;
      const image = item.querySelector('img')?.src;
      return { name, price, image, stock: 'Available' };
    });
  });

  for (const [index, product] of products.entries()) {
    if (!product.name || isNaN(product.price)) continue;
    const commonName = normalizeCommonName(product.name);
    const id = `swiggy-${commonName}-${index}`;
    await Product.updateOne(
      { id },
      { ...product, id, source: 'swiggy', category: 'General', commonName },
      { upsert: true }
    );
  }

  await browser.close();
  console.log(`✅ Swiggy scrape done. ${products.length} items`);
};

// 🛒 BLINKIT
export const scrapeBlinkit = async () => {
const browser = await puppeteer.launch({
  headless: false, // 👈 show the browser
  slowMo: 50,       // 👈 slow down for human visibility
  defaultViewport: null,
  args: ['--no-sandbox', '--start-maximized']
});  const page = await browser.newPage();

  await page.goto('https://blinkit.com/', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('div[class*=ProductCard]', { timeout: 20000 });

  const products = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div[class*=ProductCard]'));
    return items.map((item) => {
      const name = item.querySelector('div[class*=ProductName]')?.innerText?.trim();
      const priceText = item.querySelector('div[class*=ProductPrice]')?.innerText?.trim();
      const price = parseFloat(priceText?.replace(/[^0-9.]/g, ''));
      const image = item.querySelector('img')?.src;
      return { name, price, image, stock: 'Available' };
    });
  });

  for (const [index, product] of products.entries()) {
    if (!product.name || isNaN(product.price)) continue;
    const commonName = normalizeCommonName(product.name);
    const id = `blinkit-${commonName}-${index}`;
    await Product.updateOne(
      { id },
      { ...product, id, source: 'blinkit', category: 'General', commonName },
      { upsert: true }
    );
  }

  await browser.close();
  console.log(`✅ Blinkit scrape done. ${products.length} items`);
};

// 🛒 ZEPTO
export const scrapeZepto = async () => {
const browser = await puppeteer.launch({
  headless: false, // 👈 show the browser
  slowMo: 50,       // 👈 slow down for human visibility
  defaultViewport: null,
  args: ['--no-sandbox', '--start-maximized']
});  const page = await browser.newPage();

  await page.goto('https://www.zeptonow.com/', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('div[class*=productCard]', { timeout: 20000 });

  const products = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div[class*=productCard]'));
    return items.map((item) => {
      const name = item.querySelector('h2')?.innerText?.trim();
      const priceText = item.querySelector('span[class*=price]')?.innerText?.trim();
      const price = parseFloat(priceText?.replace(/[^0-9.]/g, ''));
      const image = item.querySelector('img')?.src;
      return { name, price, image, stock: 'Available' };
    });
  });

  for (const [index, product] of products.entries()) {
    if (!product.name || isNaN(product.price)) continue;
    const commonName = normalizeCommonName(product.name);
    const id = `zepto-${commonName}-${index}`;
    await Product.updateOne(
      { id },
      { ...product, id, source: 'zepto', category: 'General', commonName },
      { upsert: true }
    );
  }

  await browser.close();
  console.log(`✅ Zepto scrape done. ${products.length} items`);
};

// 🛒 BIGBASKET
export const scrapeBigBasket = async () => {
const browser = await puppeteer.launch({
  headless: false, // 👈 show the browser
  slowMo: 50,       // 👈 slow down for human visibility
  defaultViewport: null,
  args: ['--no-sandbox', '--start-maximized']
});  const page = await browser.newPage();

  await page.goto('https://www.bigbasket.com/', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('div[class*=product], div[class*=ProductCard]', { timeout: 20000 });

  const products = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div[class*=product], div[class*=ProductCard]'));
    return items.map((item) => {
      const name = item.querySelector('h3, .product-title')?.innerText?.trim();
      const priceText = item.querySelector('.discnt-price, .price')?.innerText?.trim();
      const price = parseFloat(priceText?.replace(/[^0-9.]/g, ''));
      const image = item.querySelector('img')?.src;
      return { name, price, image, stock: 'Available' };
    });
  });

  for (const [index, product] of products.entries()) {
    if (!product.name || isNaN(product.price)) continue;
    const commonName = normalizeCommonName(product.name);
    const id = `bigbasket-${commonName}-${index}`;
    await Product.updateOne(
      { id },
      { ...product, id, source: 'bigbasket', category: 'General', commonName },
      { upsert: true }
    );
  }

  await browser.close();
  console.log(`✅ BigBasket scrape done. ${products.length} items`);
};
