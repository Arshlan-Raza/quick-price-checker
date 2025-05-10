import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useShop } from "@/context/ShopContext";
import Header from "@/components/Header";
import CartItem from "@/components/CartItem";
import PriceComparison from "@/components/PriceComparison";
import { ArrowLeft, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const CartPage = () => {
  const { cart, getCartTotal, groupedProducts, platforms } = useShop();

  const [checkoutPlatform, setCheckoutPlatform] = useState<string | null>(null);
  const { toast } = useToast();

  const groupedCartItems = React.useMemo(() => {
    const grouped: Record<string, typeof cart> = {};
    cart.forEach((item) => {
      const platformKey = item.platform || "generic";
      if (!grouped[platformKey]) grouped[platformKey] = [];
      grouped[platformKey].push(item);
    });
    return grouped;
  }, [cart]);

  const handleCheckout = () => {
    if (!checkoutPlatform) {
      toast({
        title: "Select a platform",
        description: "Choose a platform to proceed with checkout.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Checkout Started",
      description: `You selected ${checkoutPlatform}`,
    });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingCart
            size={48}
            className="mx-auto mb-4 text-muted-foreground"
          />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Looks like you haven't added anything yet.
          </p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft size={16} className="mr-1.5" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Cart</h1>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft size={16} className="mr-1.5" />
              Continue Shopping
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-medium">
                  Cart Items ({cart.reduce((sum, i) => sum + i.quantity, 0)})
                </h3>
              </div>

              {Object.entries(groupedCartItems).map(([platform, items]) => {
                if (items.length === 0) return null;

                const platformInfo = platforms.find((p) => p.id === platform);
                const platformName =
                  platform === "generic"
                    ? "Unspecified Platform"
                    : platformInfo?.name || platform;

                return (
                  <div
                    key={platform}
                    className="border-b border-gray-200 last:border-0"
                  >
                    {platform !== "generic" && (
                      <div className={`px-4 py-2 bg-platform-${platform}/10`}>
                        <h4 className={`font-medium platform-${platform}`}>
                          {platformName}
                        </h4>
                      </div>
                    )}

                    <div className="divide-y divide-gray-200">
                      {items.map((item) => {
                        const product = groupedProducts.find(
                          (group) => group.commonName === item.commonName
                        );

                        if (!product) {
                          console.warn("❌ No match for:", item.commonName);
                          return null;
                        }

                        return (
                          <CartItem
                            key={`${item.commonName}-${item.platform}-${item.originalName}`}
                            item={item}
                            product={groupedProducts.find(
                              (p) => p.commonName === item.commonName
                            )}
                            platformFilter={checkoutPlatform}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg">
                    ₹
                    {checkoutPlatform
                      ? getCartTotal(checkoutPlatform)
                      : getCartTotal()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <PriceComparison
              selectedPlatform={checkoutPlatform}
              onSelectPlatform={setCheckoutPlatform}
            />

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-medium">Checkout</h3>
              </div>
              <div className="p-4 bg-white">
                {checkoutPlatform ? (
                  <div className="text-sm mb-4">
                    <p>Selected platform:</p>
                    <p
                      className={`font-medium text-base platform-${checkoutPlatform} mt-1`}
                    >
                      {checkoutPlatform.charAt(0).toUpperCase() +
                        checkoutPlatform.slice(1)}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground mb-4">
                    Select a platform to proceed.
                  </div>
                )}
                <Button
                  className="w-full bg-black hover:bg-black/80 text-white"
                  disabled={!checkoutPlatform}
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                  <ArrowRight size={16} className="ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CartPage;
