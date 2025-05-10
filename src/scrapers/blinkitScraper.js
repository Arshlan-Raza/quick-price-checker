import puppeteer from "puppeteer";
import Product from "../models/Product.js";

const categories = [
  { name: "Vegetables", url: "https://blinkit.com/cn/fresh-vegetables/cid/1487/1489" },
  { name: "Fruits", url: "https://blinkit.com/cn/vegetables-fruits/fresh-fruits/cid/1487/1503" },
  { name: "Milk", url: "https://blinkit.com/cn/milk/cid/14/922" },
  { name: "Meat", url: "https://blinkit.com/cn/fresh-meat/cid/4/1201" },
  { name: "Beverages", url: "https://blinkit.com/cn/cold-drinks-juices/soft-drinks/cid/332/1102" },
  { name: "Beverages", url: "https://blinkit.com/cn/cold-drinks-juices/fruit-juices/cid/332/955" }
];

async function scrollToBottom(page) {
  await page.evaluate(async () => {
    const distance = 100;
    const delay = 300;
    while (true) {
      const scrollHeight = document.documentElement.scrollHeight;
      const currentScroll = window.scrollY + window.innerHeight;
      if (currentScroll >= scrollHeight) break;
      window.scrollBy(0, distance);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  });
}

export default async function scrapeBlinkit() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=1920,1080",
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    ],
    defaultViewport: null
  });

  const page = await browser.newPage();

  // Handle popups and location
  await page.goto("https://www.blinkit.com/", { waitUntil: "networkidle2" });

  try {
    await page.waitForSelector(".DownloadAppModal__ContinueLink-sc-1wef47t-12", { timeout: 5000 });
    await page.click(".DownloadAppModal__ContinueLink-sc-1wef47t-12");
  } catch {}

  try {
    await page.waitForSelector(".GetLocationModal__SelectManually-sc-jc7b49-7", { timeout: 5000 });
    await page.click(".GetLocationModal__SelectManually-sc-jc7b49-7");
    await page.waitForSelector('.LocationSearchBox__InputSelect-sc-1k8u6a6-0', { timeout: 5000 });
    await page.type('.LocationSearchBox__InputSelect-sc-1k8u6a6-0', "Bengaluru");
    await page.waitForTimeout(1000);
    await page.waitForSelector('.LocationSearchList__LocationLabel-sc-93rfr7-2');
    await page.click('.LocationSearchList__LocationLabel-sc-93rfr7-2');
  } catch {}

  for (const category of categories) {
    console.log(`🔄 Scraping: ${category.name}`);
    await page.goto(category.url, { waitUntil: "networkidle2", timeout: 60000 });

    await scrollToBottom(page);

    const products = await page.evaluate((categoryName) => {
      const items = document.querySelectorAll('[role="button"].tw-relative');
      return Array.from(items).map((el, index) => {
        const nameElement = el.querySelector("div.tw-text-300");
        const priceElement = el.querySelector("div.tw-text-200.tw-font-semibold");
        const imageElement = el.querySelector("img");
        const quantityElement = el.querySelector(".tw-text-200.tw-font-medium.tw-line-clamp-1");

        const name = nameElement?.innerText.trim() || `Unnamed-${index + 1}`;
        const price = priceElement
          ? parseFloat(priceElement.innerText.replace(/₹|,/g, "").trim())
          : 0;
        const image = imageElement?.src || `No Image - ${name}`;
        const quantity = quantityElement?.innerText.trim() || "No Quantity";

        return {
          id: `blinkit-${categoryName.toLowerCase().replace(/\s/g, "-")}-${name.toLowerCase().replace(/\s/g, "-") || "unnamed"}-${index + 1}`,
          name,
          price,
          image,
          quantity,
          category: categoryName,
          source: "Blinkit"
        };
      });
    }, category.name);

    console.log(`✅ Scraped ${products.length} products from ${category.name}`);

    for (const product of products) {
      await Product.updateOne({ id: product.id }, product, { upsert: true });
    }
  }

  await browser.close();
  console.log("✅ Blinkit scraping complete");
}
