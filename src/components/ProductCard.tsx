import React from 'react';
import { useShop, Product } from '@/context/ShopContext';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBestPricesPerPlatform } from '@/utils/getBestPricesPerPlatform';
import mapNameToCommonName from '@/utils/mapNameToCommonName';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, selectedPlatform, groupedProducts } = useShop();

  if (!product.name || product.name.toLowerCase().startsWith('unnamed')) {
    return null;
  }

  const getBestPrice = () => {
    const available = product.prices?.filter(p => p.available) || [];
    return available.reduce((best, p) => (p.price < best.price ? p : best), available[0]);
  };

  const getPriceToDisplay = () => {
    if (!Array.isArray(product.prices)) return null;
    if (selectedPlatform) {
      const match = product.prices.find(p => p.platform === selectedPlatform && p.available);
      return match || null;
    }
    return getBestPrice();
  };

  const priceToDisplay = getPriceToDisplay();

  const handleAddToCart = () => {
    if (!priceToDisplay) return;

    const originalName = priceToDisplay.originalName;
    const commonName = mapNameToCommonName(originalName, groupedProducts);

    if (!commonName) {
      console.warn('❌ Could not resolve commonName for', originalName);
      return;
    }

    addToCart(commonName, priceToDisplay.platform, originalName);

    const grouped = groupedProducts.find(
      g => g.commonName === commonName
    );
    if (grouped) {
      const bestDeals = getBestPricesPerPlatform(grouped);
      console.log('Best Deals:', bestDeals);
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm">
      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-lg line-clamp-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-2">
          {product.description || 'Available now'}
        </p>

        {priceToDisplay ? (
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="font-bold text-lg">₹{priceToDisplay.price}</div>
              <div className={`text-sm platform-${priceToDisplay.platform}`}>
                {priceToDisplay.platform.charAt(0).toUpperCase() +
                  priceToDisplay.platform.slice(1)}
              </div>
            </div>
            <div className="flex items-center text-gray-500">
              <Clock size={14} className="mr-1" />
              <span className="text-sm">{priceToDisplay.deliveryTime}</span>
            </div>
          </div>
        ) : (
          <div className="text-destructive text-sm mb-3">Not Available</div>
        )}

        {priceToDisplay && (
          <Button
            className="w-full bg-black hover:bg-black/80 text-white"
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
