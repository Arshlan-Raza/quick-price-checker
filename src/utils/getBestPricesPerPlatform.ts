import { Product, PriceInfo } from '@/context/ShopContext';

export const getBestPricesPerPlatform = (groupedProduct: Product): PriceInfo[] => {
  const bestMap = new Map<string, PriceInfo>();

  for (const price of groupedProduct.prices) {
    if (!price.available) continue;

    if (!bestMap.has(price.platform) || bestMap.get(price.platform)!.price > price.price) {
      bestMap.set(price.platform, price);
    }
  }

  return Array.from(bestMap.values()).sort((a, b) => a.price - b.price); // Optional: sort by lowest
};
