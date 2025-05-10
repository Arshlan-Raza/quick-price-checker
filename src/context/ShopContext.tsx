import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useContext,
} from "react";

const normalize = (str: string) =>
  str?.trim().toLowerCase().replace(/\s+/g, "-");

// Type Definitions
export interface PriceInfo {
  originalName: string;
  commonName: string;
  platform: string;
  price: number;
  available: boolean;
  deliveryTime: string;
  image: string;
}

export interface Product {
  key?: string;
  commonName: string;
  name: string;
  description: string;
  category: string[];
  image: string;
  prices: PriceInfo[];
}

export interface PlatformInfo {
  id: string;
  name: string;
  image: string;
}

export interface CartItem {
  commonName: string;
  platform: string;
  quantity: number;
  originalName: string;
}

export interface ShopContextType {
  products: Product[];
  groupedProducts: Product[];
  filteredProducts: Product[];
  categories: string[];
  platforms: PlatformInfo[];
  cart: CartItem[];
  selectedPlatform: string | null;
  selectedCategory: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSelectedPlatform: (platform: string | null) => void;
  setSelectedCategory: (category: string) => void;
  addToCart: (
    commonName: string,
    platform: string,
    originalName: string
  ) => void;

  removeFromCart: (
    commonName: string,
    platform: string,
    originalName: string
  ) => void;

  updateCartItemQuantity: (
    commonName: string,
    platform: string,
    originalName: string,
    quantity: number
  ) => void;

  getCartTotal: (platformFilter?: string | null) => number;
  getCartItemCount: () => number;
  getBestPlatformForCart: () => string;
  clearCart: () => void;
  getProductByCommonName: (commonName: string) => Product | undefined;
  getProductByOriginalName: (originalName: string) => Product | undefined;
}

// Create context
export const ShopContext = createContext<ShopContextType>(
  {} as ShopContextType
);
export type Platform = string;

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [groupedProducts, setGroupedProducts] = useState<Product[]>([]);
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeProducts = (data: any[]): Product[] =>
    data.map((p) => ({
      ...p,
      commonName: normalize(p.name),
      description: p.description || "",
      category: Array.isArray(p.category) ? p.category : [p.category],
      prices: [
        {
          platform: p.source,
          price: p.price,
          available: true,
          deliveryTime: "10 mins",
          image: p.image,
          originalName: p.name,
          commonName: normalize(p.name),
        },
      ],
    }));

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const rawData = await res.json();
        const normalized = normalizeProducts(rawData);
        setProducts(normalized);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchGroupedProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/grouped-products");
        if (!res.ok) throw new Error("Failed to fetch grouped products");
        const data: Product[] = await res.json();
        setGroupedProducts(data);

        const platformMap = new Map<string, string>();
        data.forEach((product) => {
          product.prices.forEach((p) => {
            if (!platformMap.has(p.platform)) {
              platformMap.set(p.platform, p.image);
            }
          });
        });

        const platformList: PlatformInfo[] = Array.from(
          platformMap.entries()
        ).map(([id, image]) => ({
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          image,
        }));
        setPlatforms(platformList);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchGroupedProducts();
  }, []);

  const getProductByCommonName = (commonName: string): Product | undefined => {
    const key = normalize(commonName);
    return groupedProducts.find(
      (p) =>
        normalize(p.commonName) === key ||
        p.prices.some((price) => normalize(price.originalName) === key)
    );
  };

  const getProductByOriginalName = (
    originalName: string
  ): Product | undefined => {
    const normalizedKey = normalize(originalName);
    return groupedProducts.find((group) =>
      group.prices.some(
        (price) => normalize(price.originalName) === normalizedKey
      )
    );
  };

  const categories = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((p) => {
      p.category.forEach((c) => unique.add(c));
    });
    return ["All", ...Array.from(unique)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchPlatform =
        selectedPlatform === "All" ||
        selectedPlatform === null ||
        p.prices?.some((pr) => pr.platform === selectedPlatform);
      const matchCategory =
        selectedCategory === "All" || p.category.includes(selectedCategory);
      const matchSearch = p.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchPlatform && matchCategory && matchSearch;
    });
  }, [products, selectedPlatform, selectedCategory, searchQuery]);

  const addToCart = (
    commonName: string,
    platform: string,
    originalName: string
  ) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) =>
          i.commonName === commonName &&
          i.platform === platform &&
          i.originalName === originalName
      );
      if (existing) {
        return prev.map((i) =>
          i.commonName === commonName &&
          i.platform === platform &&
          i.originalName === originalName
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { commonName, platform, originalName, quantity: 1 }];
    });
  };

  const removeFromCart = (
    commonName: string,
    platform: string,
    originalName: string
  ) => {
    setCart((prev) =>
      prev.filter(
        (i) =>
          !(
            i.commonName === commonName &&
            i.platform === platform &&
            i.originalName === originalName
          )
      )
    );
  };

  const updateCartItemQuantity = (
    commonName: string,
    platform: string,
    originalName: string,
    quantity: number
  ) => {
    setCart((prev) =>
      prev.map((i) =>
        i.commonName === commonName &&
        i.platform === platform &&
        i.originalName === originalName
          ? { ...i, quantity }
          : i
      )
    );
  };

  const getCartTotal = (platformFilter?: string | null) => {
    return cart.reduce((total, item) => {
      const product = getProductByCommonName(item.commonName);
      if (!product || !product.prices) return total;

      const matched = product.prices.find((p) =>
        platformFilter
          ? p.platform === platformFilter
          : p.platform === item.platform
      );

      return total + (matched?.price || 0) * item.quantity;
    }, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const getBestPlatformForCart = () => {
    const totals: { [platform: string]: number } = {};
    cart.forEach((item) => {
      const product = getProductByCommonName(item.commonName);
      product?.prices.forEach((p) => {
        if (!p.available) return;
        totals[p.platform] =
          (totals[p.platform] || 0) + p.price * item.quantity;
      });
    });
    const best = Object.entries(totals).reduce(
      (a, b) => (b[1] < a[1] ? b : a),
      [null, Infinity]
    )[0];
    return best || "Unavailable";
  };

  const clearCart = () => setCart([]);

  const contextValue: ShopContextType = {
    products,
    groupedProducts,
    filteredProducts,
    categories,
    platforms,
    cart,
    selectedPlatform,
    selectedCategory,
    searchQuery,
    setSearchQuery,
    setSelectedPlatform,
    setSelectedCategory,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    getCartTotal,
    getCartItemCount,
    getBestPlatformForCart,
    clearCart,
    getProductByCommonName,
    getProductByOriginalName,
  };

  return (
    <ShopContext.Provider value={contextValue}>{children}</ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
