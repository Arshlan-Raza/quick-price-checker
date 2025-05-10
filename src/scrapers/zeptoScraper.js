import puppeteer from "puppeteer";
import Product from "../models/Product.js";

const categories = [
  {
    name: "Fruits",
    url: "https://www.zepto.com/cn/fruits-vegetables/fresh-fruits/cid/64374cfe-d06f-4a01-898e-c07c46462c36/scid/09e63c15-e5f7-4712-9ff8-513250b79942"
  },
  {
    name: "Vegetables",
    url: "https://www.zepto.com/cn/fruits-vegetables/fresh-vegetables/cid/64374cfe-d06f-4a01-898e-c07c46462c36/scid/b4827798-fcb6-4520-ba5b-0f2bd9bd7208"
  },
  {
    name: "Dairy & Milk",
    urls: [
      "https://www.zepto.com/cn/dairy-bread-eggs/cheese/cid/4b938e02-7bde-4479-bc0a-2b54cb6bd5f5/scid/f594b28a-4775-48ac-8840-b9030229ff87",
      "https://www.zepto.com/cn/dairy-bread-eggs/curd-probiotic-drink/cid/4b938e02-7bde-4479-bc0a-2b54cb6bd5f5/scid/5418d83c-4c50-4914-a768-b02c2aac2fea",
      "https://www.zepto.com/cn/dairy-bread-eggs/milk/cid/4b938e02-7bde-4479-bc0a-2b54cb6bd5f5/scid/22964a2b-0439-4236-9950-0d71b532b243",

    ]
  },
  {
    name: "Meat",
    url: "https://www.zepto.com/cn/meats-fish-eggs/meats-fish-eggs/cid/4654bd8a/scid/b6fbf886"
  },
  {
    name: "Beverages",
    url: "https://www.zepto.com/cn/meats-fish-eggs/top-picks/cid/4654bd8a-fb30-4ee1-ab30-4bf581b6c6e3/scid/b6fbf886-79f1-4a34-84bf-4aed50175418"
  }
];

async function scrollToBottom(page) {
  await page.evaluate(async () => {
    const distance = 100;
    const delay = 300;
    while (true) {
      const { scrollHeight, scrollTop, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight) break;
      window.scrollBy(0, distance);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  });
}

async function scrapeCategory(category) {
  console.log(`🔍 Scraping: ${category.name}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1920,1080"
    ],
    defaultViewport: null
  });

  const page = await browser.newPage();
  const urls = Array.isArray(category.urls) ? category.urls : [category.url];
  let products = [];

  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
      await page.waitForSelector('[data-testid="product-card"]', { timeout: 20000 });
      await scrollToBottom(page);

      const categoryProducts = await page.evaluate((categoryName) => {
        return Array.from(document.querySelectorAll('[data-testid="product-card"]')).map((productCard, index) => {
          const nameElement = productCard.querySelector('[data-testid="product-card-name"]');
          const priceElement = productCard.querySelector('[data-testid="product-card-price"]');
          const imageElement = productCard.querySelector('[data-testid="product-card-image"]');
          const stockElement = productCard.querySelector('span[data-testid="product-card-quantity"] h5');

          return {
            id: `zepto-${categoryName.replace(/\s/g, "")}-${index + 1}`,
            name: nameElement?.innerText.trim() || "Unnamed Product",
            price: parseFloat(priceElement?.innerText.replace(/₹|,/g, "")) || 0,
            image: imageElement?.src || "",
            stock: stockElement?.innerText.trim() || "Available",
            category: categoryName,
            source: "zepto"
          };
        });
      }, category.name);

      console.log(`✅ Scraped ${categoryProducts.length} products from ${category.name}`);
      products.push(...categoryProducts);
    } catch (error) {
      console.error(`❌ Error scraping ${category.name} URL:`, url);
      console.error("Reason:", error.message);
    }
  }

  for (const product of products) {
    if (!product.name || isNaN(product.price) || !product.image) continue;
    await Product.updateOne({ id: product.id }, product, { upsert: true });
  }

  await browser.close();
  console.log(`✅ Zepto → ${category.name} saved to DB`);
}

export default async function scrapeZepto() {
  for (const category of categories) {
    try {
      await scrapeCategory(category);
    } catch (err) {
      console.error(`❌ Critical failure in category: ${category.name}`, err.message);
    }
  }
}
