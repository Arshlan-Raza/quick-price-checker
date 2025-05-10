import puppeteer from "puppeteer";
import Product from "../models/Product.js";

const categories = [
  { name: "Vegetables", url: "https://www.bigbasket.com/pc/fruits-vegetables/fresh-vegetables/?nc=ct-fa" },
  { name: "Fruits", url: "https://www.bigbasket.com/pc/fruits-vegetables/fresh-fruits/?nc=ct-fa" },
  { name: "Dairy & Milk", url: "https://www.bigbasket.com/cl/eggs-meat-fish/?nc=nb" },
  { name: "Beverages", url: "https://www.bigbasket.com/cl/beverages/?nc=nb" },
  { name: "Snacks", url: "https://www.bigbasket.com/cl/snacks-branded-foods/?nc=nb" }
];

async function scrollToBottom(page) {
  await page.evaluate(async () => {
    const distance = 100;
    const delay = 200;
    while (true) {
      const { scrollHeight, scrollTop, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight) break;
      window.scrollBy(0, distance);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  });
}

export default async function scrapeBigBasket() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1920,1080"
    ],
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });

  const page = await browser.newPage();

  for (const category of categories) {
    try {
      console.log(`🔄 Scraping: ${category.name}`);
      await page.goto(category.url, { waitUntil: "networkidle2", timeout: 60000 });

      await page.mouse.move(300, 300);
      await scrollToBottom(page);
      await new Promise(resolve => setTimeout(resolve, 5000)); // wait for lazy-loaded content

      const imageXPath = "//div[contains(@class, 'DeckImage___StyledDiv-sc-1mdvxwk-1')]//a//img";

      try {
        await page.waitForXPath(imageXPath, { timeout: 20000 });
      } catch {
        console.warn(`⚠️ Skipping ${category.name} — image XPath not found`);
        continue;
      }

      const products = await page.evaluate((category, imageXPath) => {
        const items = Array.from(document.querySelectorAll("div.break-words.h-10.w-full"));

        const xpathResult = document.evaluate(
          imageXPath,
          document,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );

        return items.map((el, index) => {
          const name = el.querySelector("h3")?.innerText?.trim();
          const root = el.closest("div[data-testid]");
          const priceText = root?.querySelector("span.Label-sc-15v1nk5-0.Pricing___StyledLabel-sc-pldi2d-1")?.innerText?.trim();
          const quantityText = root?.querySelector("span.Label-sc-15v1nk5-0.PackSelector___StyledLabel-sc-1lmu4hv-0 span")?.innerText?.trim();

          const fallbackName = name || `Unnamed-${index + 1}`;
          const image = xpathResult.snapshotItem(index)?.src || `No Image - ${fallbackName}`;
          const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, "")) : 0;

          return {
            id: `bigbasket-${category.name.toLowerCase().replace(/\s/g, "-")}-${index + 1}`,
            name: fallbackName,
            price,
            image,
            quantity: quantityText || "No Quantity",
            stock: "Available",
            category: category.name,
            source: "bigbasket"
          };
        });
      }, category, imageXPath);

      console.log(`✅ Scraped ${products.length} products from ${category.name}`);

      for (const product of products) {
        if (!product.name || isNaN(product.price)) continue;
        await Product.updateOne({ id: product.id }, product, { upsert: true });
      }

    } catch (err) {
      console.error(`❌ Error scraping ${category.name}:`, err.message);
    }
  }

  await browser.close();
  console.log("✅ BigBasket scraping complete");
}
