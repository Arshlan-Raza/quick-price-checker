import React from "react";
import { Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShop } from "@/context/ShopContext";

const CartItem = ({ item, product, platformFilter }) => {
  const { updateCartItemQuantity, removeFromCart } = useShop();

  if (!item || !product) return null;

  const priceInfo = product.prices.find(
    (p) =>
      p.platform === item.platform &&
      p.originalName.trim().toLowerCase() ===
        item.originalName.trim().toLowerCase()
  );
  const unitPrice = priceInfo?.price ?? 0;
  const total = unitPrice * item.quantity;

  const handleQtyChange = (qty: number) => {
    if (qty <= 0) {
      removeFromCart(item.commonName, item.platform, item.originalName);
    } else {
      updateCartItemQuantity(
        item.commonName,
        item.platform,
        item.originalName,
        qty
      );
    }
  };

return (
  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
    <div className="flex items-center gap-5">
      {/* Image */}
      <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
        <img
          src={priceInfo?.image || "/placeholder.svg"}
          alt={priceInfo?.originalName || "Product"}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{item.originalName}</h3>
            <p className="text-sm text-muted-foreground mt-0.5 capitalize">
              {item.platform}
            </p>
          </div>

          {/* Remove */}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={() =>
              removeFromCart(item.commonName, item.platform, item.originalName)
            }
          >
            <Trash2 size={16} />
            <span className="sr-only">Remove</span>
          </Button>
        </div>

        {/* Price / Qty */}
        <div className="mt-3 flex items-center justify-between flex-wrap">
          <div className="text-sm text-gray-700">
            ₹{unitPrice} × {item.quantity} = <span className="font-bold">₹{total}</span>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden mt-2 sm:mt-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQtyChange(item.quantity - 1)}
            >
              <Minus size={14} />
            </Button>
            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQtyChange(item.quantity + 1)}
            >
              <Plus size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

};

export default CartItem;
