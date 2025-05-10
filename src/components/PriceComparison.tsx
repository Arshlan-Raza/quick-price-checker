import React from "react";
import { useShop, Platform } from "@/context/ShopContext";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import fuzzysort from "fuzzysort";

interface PriceComparisonProps {
  selectedPlatform: Platform | null;
  onSelectPlatform: (platform: Platform) => void;
}

const resolveCommonNameFuzzy = (originalName: string, groupedProducts: any[]) => {
  const normalized = originalName.trim().toLowerCase();

  for (const group of groupedProducts) {
    const match = fuzzysort.go(normalized, group.prices.map(p => p.originalName.toLowerCase()));
    if (match.length > 0 && match[0].score > -50) {
      return group.commonName;
    }
  }
  return null;
};

const PriceComparison: React.FC<PriceComparisonProps> = ({
  selectedPlatform,
  onSelectPlatform,
}) => {
  const { platforms, cart, groupedProducts } = useShop();

  const platformStats = React.useMemo(() => {
    return platforms
      .map((platform) => {
        let total = 0;
        let allAvailable = true;

        for (const item of cart) {
          const commonName = resolveCommonNameFuzzy(item.originalName, groupedProducts);
          if (!commonName) {
            allAvailable = false;
            break;
          }

          const product = groupedProducts.find(
            (group) => group.commonName === commonName
          );

          if (!product) {
            allAvailable = false;
            break;
          }

          const priceEntry = product.prices.find(
            (p) => p.platform === platform.id
          );
          if (!priceEntry || !priceEntry.available) {
            allAvailable = false;
            break;
          }

          total += priceEntry.price * item.quantity;
        }

        return {
          ...platform,
          available: allAvailable,
          total: allAvailable ? total : -1,
        };
      })
      .sort((a, b) => {
        if (a.available && !b.available) return -1;
        if (!a.available && b.available) return 1;
        return a.total - b.total;
      });
  }, [platforms, cart, groupedProducts]);

  const bestPlatform = platformStats.find((p) => p.available);

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden animate-scale-in">
      <div className="bg-secondary/50 px-4 py-3 border-b border-border/60">
        <h3 className="font-medium">Platform Price Comparison</h3>
      </div>

      <div className="divide-y divide-border/60">
        {platformStats.map((platform) => (
          <div
            key={platform.id}
            className={`flex items-center justify-between p-4 transition-all ${
              platform.id === selectedPlatform ? "bg-primary/5" : ""
            } ${
              platform.id === bestPlatform?.id
                ? `bg-platform-${platform.id}/5`
                : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`font-medium platform-${platform.id}`}>
                {platform.name}
              </span>
              {platform.id === bestPlatform?.id && (
                <span
                  className={`text-xs bg-platform-${platform.id}/10 platform-${platform.id} px-2 py-0.5 rounded-full`}
                >
                  Best Deal
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {platform.available ? (
                <>
                  <span className="font-semibold">₹{platform.total}</span>
                  <Button
                    variant={
                      platform.id === selectedPlatform ? "default" : "outline"
                    }
                    size="sm"
                    className={
                      platform.id === selectedPlatform
                        ? `bg-platform-${platform.id} hover:bg-platform-${platform.id}/90`
                        : `border-platform-${platform.id} platform-${platform.id} hover:bg-platform-${platform.id}/10`
                    }
                    onClick={() => onSelectPlatform(platform.id)}
                  >
                    {platform.id === selectedPlatform && (
                      <Check size={14} className="mr-1" />
                    )}
                    {platform.id === selectedPlatform ? "Selected" : "Select"}
                  </Button>
                </>
              ) : (
                <div className="flex items-center text-muted-foreground">
                  <X size={14} className="mr-1" />
                  <span>Some items unavailable</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceComparison;
