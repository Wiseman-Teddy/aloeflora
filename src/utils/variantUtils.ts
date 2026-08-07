import { Product, ProductVariant } from '../types';

/**
 * Normalizes product variants into structured ProductVariant objects.
 * Handles both legacy string variants (e.g. "400ml") and structured ProductVariant objects.
 */
export function normalizeVariants(product: Product): ProductVariant[] {
  if (!product.variants || product.variants.length === 0) {
    return [{
      id: `v-default-${product.id}`,
      name: 'Standard',
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      imageUrl: product.imageUrl?.split(',')[0]
    }];
  }

  return product.variants.map((v, idx) => {
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
  const prices = variants.map(v => v.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  return {
    minPrice,
    maxPrice,
    hasMultiplePrices: minPrice !== maxPrice
  };
}
