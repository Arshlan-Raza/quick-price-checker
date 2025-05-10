import puppeteer from "puppeteer";
import Product from "../models/Product.js";

const categories = [
  {
    name: "Dairy & Milk",
    url: "https://www.swiggy.com/instamart/category-listing?categoryName=Dairy%2C+Bread+and+Eggs&custom_back=true&taxonomyType=Speciality+taxonomy+1"
  },
  {
    name: "Fruits",
    url: "https://www.swiggy.com/instamart/category-listing?categoryName=Fresh+Fruits&custom_back=true&taxonomyType=Speciality+taxonomy+1"
  },
  {
    name: "Vegetables",
    url: "https://www.swiggy.com/instamart/category-listing?categoryName=Fresh+Vegetables&custom_back=true&taxonomyType=Speciality+taxonomy+1"
  },
  {
    name: "Meat",
    url: "https://www.swiggy.com/instamart/category-listing?categoryName=Meat+and+Seafood&custom_back=true&taxonomyType=Speciality+taxonomy+1"
  },
  {
    name: "Beverages",
    url: "https://www.swiggy.com/instamart/category-listing?categoryName=Cold+Drinks+and+Juices&custom_back=true&taxonomyType=Speciality+taxonomy+3"
  }
];

// Helper to scroll through entire product list
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

export default async function scrapeSwiggy() {
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

  for (const category of categories) {
    console.log(`Scraping: ${category.name}`);
    await page.goto(category.url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector('[data-testid="ItemWidgetContainer"]');

    await scrollToBottom(page);

    const products = await page.evaluate((categoryName) => {
      return Array.from(document.querySelectorAll('[data-testid="ItemWidgetContainer"]')).map((el, index) => {
        const nameElement = el.querySelector(".novMV");
        const priceElement = el.querySelector("._20EAu div");
        const imageElement = el.querySelector('[data-testid="item-image-default"]');
        const stockElement = el.querySelector("._3--Rr sjQej _1vyq6 div");

        const price = priceElement
          ? parseFloat(priceElement.innerText.replace(/₹|,/g, "").trim())
          : 0;

        return {
          id: `swiggy-${categoryName.toLowerCase().replace(/\s/g, "-")}-${index + 1}`,
          name: nameElement?.innerText.trim() || "Unnamed Product",
          price,
          image: imageElement?.src || "",
          stock: stockElement?.innerText.trim() || "Available",
          category: categoryName,
          source: "swiggy"
        };
      });
    }, category.name);

    console.log(`Scraped ${products.length} products from ${category.name}`);

    for (const product of products) {
      if (!product.name || isNaN(product.price) || !product.image) continue;
      await Product.updateOne({ id: product.id }, product, { upsert: true });
    }
  }

  await browser.close();
  console.log("✅ Swiggy scraping complete");
}
