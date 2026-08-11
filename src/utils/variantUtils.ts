import { Product, ProductVariant } from '../types';

/**
 * Checks if a product has user-configured size/attribute variants.
 */
export function hasVariants(product?: Product | null): boolean {
  if (!product || !product.variants || !Array.isArray(product.variants) || product.variants.length === 0) {
    return false;
  }
  const valid = product.variants.filter(v => {
    if (!v) return false;
    const name = typeof v === 'string' ? v : v.name;
    return name && name.trim() !== '' && name.trim().toLowerCase() !== 'standard';
  });
  return valid.length > 0;
}

/**
 * Normalizes product variants into structured ProductVariant objects.
 * Returns an EMPTY ARRAY [] for standalone products without variants.
 */
export function normalizeVariants(product: Product): ProductVariant[] {
  if (!hasVariants(product)) {
    return [];
  }

  return (product.variants || [])
    .filter(v => {
      if (!v) return false;
      const name = typeof v === 'string' ? v : v.name;
      return name && name.trim() !== '' && name.trim().toLowerCase() !== 'standard';
    })
    .map((v, idx) => {
      if (typeof v === 'string') {
        return {
          id: `v-${idx}-${product.id}`,
          name: v,
          price: product.price,
          costPrice: product.costPrice,
          stock: product.stock,
          imageUrl: product.imageUrl?.split(',')[0]
        };
      }
      return v;
    });
}

/**
 * Calculates the price range for a product with variants.
 */
export function getProductPriceRange(product: Product): { minPrice: number; maxPrice: number; hasMultiplePrices: boolean } {
  const variants = normalizeVariants(product);
  if (variants.length === 0) {
    return {
      minPrice: product.price,
      maxPrice: product.price,
      hasMultiplePrices: false
    };
  }
  const prices = variants.map(v => v.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  return {
    minPrice,
    maxPrice,
    hasMultiplePrices: minPrice !== maxPrice
  };
}

