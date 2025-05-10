import fuzzysort from 'fuzzysort';
import { Product } from '@/context/ShopContext';

const mapNameToCommonName = (name: string, groupedProducts: Product[]): string | null => {
  const candidates: { originalName: string; commonName: string }[] = [];

  for (const product of groupedProducts) {
    for (const price of product.prices) {
      candidates.push({
        originalName: price.originalName,
        commonName: product.commonName,
      });
    }
  }

  const result = fuzzysort.go(name, candidates, {
    key: 'originalName',
    threshold: -1000, // skip extremely poor matches
  });

  if (result.total > 0 && result[0].score !== undefined) {
    return result[0].obj.commonName;
  }

  return null;
};

export default mapNameToCommonName;
