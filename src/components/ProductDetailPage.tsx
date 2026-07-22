import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Info, Star, MessageSquare } from "lucide-react";
import { Product } from "../types";

const CUSTOMER_RATING_ACCENTS = ["Amazing!", "Loved it.", "Smells great.", "Good texture.", "Highly recommended!", "Will buy again."];

export function Stars({ rating }: { rating: number }) {
  return (
    <>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"}`}
        />
      ))}
    </>
  );
}

interface ProductDetailPageProps {
  products: Product[];
  onAddToCart: (product: Product, selectedVariant?: string) => void;
}

export default function ProductDetailPage({ products, onAddToCart }: ProductDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link to="/store" className="bg-emerald-800 text-white px-6 py-2 rounded-xl font-bold">Back to Store</Link>
      </div>
    );
  }

  const mediaUrls = product.mediaUrls && product.mediaUrls.length > 0 
    ? product.mediaUrls 
    : (product.imageUrl ? product.imageUrl.split(',') : []);

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id && p.status === 'active')
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-8">
        <Link to="/store" className="hover:text-emerald-700 flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Home</Link>
        <span>/</span>
        <span className="capitalize">{product.category}</span>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-200">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start bg-white dark:bg-gray-900 p-6 md:p-10 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800">
            {mediaUrls.length > 0 ? (
              <img src={mediaUrls[selectedImageIdx]} alt={product.name} className="w-full h-full object-cover transition duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
            )}
          </div>
          {mediaUrls.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {mediaUrls.map((url, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition ${selectedImageIdx === idx ? 'border-emerald-600' : 'border-transparent hover:border-emerald-300'}`}
                >
                  <img src={url} alt={`${product.name} thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            {product.features?.map((fit, idx) => (
              <span key={idx} className="bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-bold text-emerald-800 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                ✓ {fit}
              </span>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{product.subCategory || product.category}</span>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">{product.name}</h1>
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400"><Stars rating={product.rating} /></div>
              <span className="text-sm text-gray-500 font-medium">({product.reviewsCount} verified reviews)</span>
            </div>
          </div>

          <div className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
            KES {product.price}
            {product.stock < 5 && product.stock > 0 && <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-full">Only {product.stock} left</span>}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{product.description}</p>
          
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs uppercase font-bold text-gray-500">Available Sizes / Configurations</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <span key={v} className="border border-gray-200 dark:border-gray-700 text-sm px-4 py-2 rounded-xl text-gray-700 dark:text-gray-300 font-medium bg-gray-50 dark:bg-gray-800">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.specifications && product.specifications.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs uppercase font-bold text-gray-500">Specifications</span>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-2">
                {product.specifications.map((spec, idx) => (
                  <li key={idx}>{spec}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => {
                onAddToCart(product);
                toast?.success(`${product.name} added to cart`);
              }}
              disabled={product.stock === 0}
              className="w-full bg-emerald-800 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" /> {product.stock === 0 ? "Out of Stock" : "Add To Shopping Basket"}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-10 border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-600" /> Customer Feedbacks ({product.reviews.length})
        </h3>
        
        {product.reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500">
            <Info className="w-8 h-8 text-emerald-700 mb-3 opacity-50" />
            <p className="font-medium">No reviews logged yet.</p>
            <p className="text-xs mt-1">Accents for this batch: <strong>"{CUSTOMER_RATING_ACCENTS[Math.floor(Math.random() * CUSTOMER_RATING_ACCENTS.length)]}"</strong>.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {product.reviews.map((rev) => (
              <div key={rev.id} className="bg-zinc-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-zinc-100 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">{rev.author}</span>
                  <span className="text-xs text-gray-400 font-medium">{rev.date}</span>
                </div>
                <div className="flex text-amber-400"><Stars rating={rev.rating} /></div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed italic">"{rev.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Related Products</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map(rp => (
              <Link to={`/product/${rp.id}`} key={rp.id} className="bg-white dark:bg-gray-900 rounded-3xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition group">
                <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-4">
                  <img src={rp.imageUrl?.split(',')[0]} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{rp.subCategory}</span>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 mt-1">{rp.name}</h4>
                <div className="font-extrabold text-emerald-800 mt-2">KES {rp.price}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
// Add import for MessageSquare that was missed above. I'll add it to the import list in the replace pass.
