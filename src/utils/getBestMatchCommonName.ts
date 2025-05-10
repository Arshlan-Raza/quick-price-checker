import fuzzysort from 'fuzzysort';
import { Product } from '@/context/ShopContext';

const getBestMatchCommonName = (input: string, groupedProducts: Product[]): string | null => {
  const allEntries = groupedProducts.flatMap(group =>
    group.prices.map(p => ({
      originalName: p.originalName.toLowerCase().trim(),
      commonName: group.commonName,
    }))
  );

  const results = fuzzysort.go(input.toLowerCase().trim(), allEntries, {
    key: 'originalName',
    threshold: -1000,
  });

  if (results.length > 0) {
    return results[0].obj.commonName;
  }

  return null;
};

export default getBestMatchCommonName;
