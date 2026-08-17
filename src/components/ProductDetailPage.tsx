import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Info, 
  Star, 
  MessageSquare, 
  Zap, 
  Share2, 
  Check, 
  Copy, 
  Phone, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Plus, 
  Sparkles,
  Heart,
  ChevronRight
} from "lucide-react";
import { Product, ProductVariant, Promo } from "../types";
import { useShop } from "../contexts/ShopContext";
import { normalizeVariants } from "../utils/variantUtils";
import toast from "react-hot-toast";

const CUSTOMER_RATING_ACCENTS = ["Amazing!", "Loved it.", "Smells great.", "Good texture.", "Highly recommended!", "Will buy again."];

export function Stars({ rating, interactive = false, onSelect }: { rating: number; interactive?: boolean; onSelect?: (r: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          type="button"
          key={s}
          disabled={!interactive}
          onClick={() => interactive && onSelect && onSelect(s)}
          className={`${interactive ? "cursor-pointer transition hover:scale-125 focus:outline-none" : "cursor-default"}`}
        >
          <Star
            className={`w-4 h-4 ${
              s <= Math.round(rating) 
                ? "fill-amber-400 text-amber-400" 
                : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

interface ProductDetailPageProps {
  products: Product[];
  onAddReview?: (productId: string, review: { author: string; rating: number; comment: string }) => void;
  promos?: Promo[];
}

export default function ProductDetailPage({ products, onAddReview, promos = [] }: ProductDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const { addToCart, wishlist, toggleWishlist } = useShop();

  const product = products.find(p => p.id === id);

  const normalizedVars = product ? normalizeVariants(product) : [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(() => normalizedVars[0] || null);

  // Review Form State
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Track Recently Viewed Products
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  useEffect(() => {
    if (product) {
      try {
        const raw = localStorage.getItem("aloeflora_recently_viewed");
        const existing: string[] = raw ? JSON.parse(raw) : [];
        const updated = [product.id, ...existing.filter(i => i !== product.id)].slice(0, 8);
        localStorage.setItem("aloeflora_recently_viewed", JSON.stringify(updated));
        setRecentlyViewedIds(updated.filter(i => i !== product.id));
      } catch (e) {}
    }
  }, [product?.id]);

  // Inject JSON-LD Rich Snippet for SEO
  useEffect(() => {
    if (!product) return;
    const scriptId = "jsonld-product-schema";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    const schemaData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": product.imageUrl ? product.imageUrl.split(",") : [],
      "description": product.description,
      "brand": {
        "@type": "Brand",
        "name": "Aloeflora Kenya"
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "KES",
        "price": selectedVariant ? selectedVariant.price : product.price,
        "availability": (product.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating || 5.0,
        "reviewCount": product.reviewsCount || 1
      }
    };
    script.text = JSON.stringify(schemaData);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [product, selectedVariant]);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link to="/store" className="bg-[#348C21] text-white px-6 py-2 rounded-xl font-bold">Back to Store</Link>
      </div>
    );
  }

  const mediaUrls = product.mediaUrls && product.mediaUrls.length > 0 
    ? product.mediaUrls 
    : (product.imageUrl ? product.imageUrl.split(',') : []);

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Frequently Bought Together Complement
  const complementaryProduct = products.find(p => p.id !== product.id && (
    (product.category === 'hair' && p.category === 'body') ||
    (product.category === 'body' && (p.category === 'hair' || p.category === 'coffee')) ||
    (p.category === product.category)
  ));

  const currentDisplayImage = selectedVariant?.imageUrl || mediaUrls[selectedImageIdx] || product.imageUrl?.split(',')[0];
  const activePrice = selectedVariant ? selectedVariant.price : product.price;
  const activeStock = selectedVariant ? (selectedVariant.stock ?? product.stock) : product.stock;
  const isWished = wishlist.includes(product.id);

  // 1-Click Buy Now Flow
  const handleBuyNow = () => {
    if (selectedVariant) {
      addToCart(product, 1, selectedVariant.name, selectedVariant);
    } else {
      addToCart(product, 1);
    }
    navigate("/checkout");
  };

  // Add Frequently Bought Together Bundle to Cart
  const handleAddBundleToCart = () => {
    if (selectedVariant) {
      addToCart(product, 1, selectedVariant.name, selectedVariant);
    } else {
      addToCart(product, 1);
    }
    if (complementaryProduct) {
      addToCart(complementaryProduct, 1);
      toast.success(`Bundle added! You saved with 2 complementary Aloeflora items.`);
    }
  };

  // Submit Review Handler
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewComment.trim()) {
      toast.error("Please provide both your name and feedback.");
      return;
    }
    setIsSubmittingReview(true);
    if (onAddReview) {
      onAddReview(product.id, {
        author: reviewAuthor.trim(),
        rating: reviewRating,
        comment: reviewComment.trim()
      });
    }
    setIsSubmittingReview(false);
    setIsReviewFormOpen(false);
    setReviewComment("");
  };

  // Social Share Handlers
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out ${product.name} on Aloeflora Kenya (KES ${activePrice}): ${currentUrl}`;
  
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      toast.success("Product link copied to clipboard!");
    }
  };

  const recentlyViewedProducts = products.filter(p => recentlyViewedIds.includes(p.id)).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/store" className="hover:text-emerald-700 flex items-center gap-1 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <span>/</span>
        <span className="capitalize">{product.category}</span>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-200 font-bold truncate max-w-[200px] sm:max-w-none">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start bg-white dark:bg-gray-900 p-6 md:p-10 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        {/* Left Column: Image Gallery (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 relative group">
            {currentDisplayImage ? (
              <img 
                src={currentDisplayImage} 
                alt={product.name} 
                className="w-full h-full object-cover transition duration-500 group-hover:scale-105" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (product.name.toLowerCase().includes('butter')) {
                    target.src = '/main hero/body_butter.png';
                  } else {
                    target.src = '/logo_square.jpeg';
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
            )}
            
            {/* Size Badge */}
            {selectedVariant && selectedVariant.name && (
              <div className="absolute top-4 left-4 bg-[#152E15]/90 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full backdrop-blur-xs shadow">
                Size: {selectedVariant.name}
              </div>
            )}

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(product.id)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xs text-gray-700 dark:text-gray-200 hover:text-rose-500 shadow-md transition cursor-pointer"
              title={isWished ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`w-4 h-4 ${isWished ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>
          </div>

          {/* Image Thumbnails */}
          {mediaUrls.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {mediaUrls.map((url, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-18 h-18 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition cursor-pointer ${
                    selectedImageIdx === idx ? 'border-[#348C21] ring-2 ring-emerald-500/20' : 'border-transparent hover:border-emerald-300'
                  }`}
                >
                  <img 
                    src={url} 
                    alt={`${product.name} thumbnail ${idx}`} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (product.name.toLowerCase().includes('butter')) {
                        target.src = '/main hero/body_butter.png';
                      } else {
                        target.src = '/logo_square.jpeg';
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Key Features Badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {product.features?.map((fit, idx) => (
              <span key={idx} className="bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-bold text-emerald-800 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                ✓ {fit}
              </span>
            ))}
          </div>

          {/* Guarantee Signals */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-gray-800 dark:text-gray-200">100% Pure</div>
              <div className="text-[9px] text-gray-400">KEBS Certified</div>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
              <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-gray-800 dark:text-gray-200">Fast Delivery</div>
              <div className="text-[9px] text-gray-400">Across Kenya</div>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
              <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-gray-800 dark:text-gray-200">Fresh Stock</div>
              <div className="text-[9px] text-gray-400">Hand-Crafted</div>
            </div>
          </div>
        </div>

        {/* Right Column: Product Details & Purchase Actions (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#348C21] dark:text-emerald-400 uppercase tracking-widest">
                {product.subCategory || product.category}
              </span>
              {product.unitSize && (
                <span className="bg-emerald-100 dark:bg-emerald-950/80 text-[#348C21] dark:text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-md border border-emerald-300/50">
                  {product.unitSize}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Stars rating={product.rating} />
                <span className="text-xs font-black text-amber-500 dark:text-amber-400 ml-1">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">|</span>
              <a href="#reviews-section" className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
                {product.reviewsCount || product.reviews.length} Verified Reviews
              </a>
            </div>
          </div>

          {/* Pricing & Stock Status */}
          <div className="flex flex-wrap items-baseline gap-4 p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <div className="text-3xl font-black text-gray-950 dark:text-white">
              KES {activePrice.toLocaleString()}
            </div>
            {activeStock > 5 && (
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                <Check className="w-3.5 h-3.5" /> In Stock & Ready to Dispatch
              </span>
            )}
            {activeStock <= 5 && activeStock > 0 && (
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 animate-pulse">
                ⚡ Only {activeStock} left in stock - order soon!
              </span>
            )}
            {activeStock === 0 && (
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                Out of Stock
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
            {product.description}
          </p>
          
          {/* Variant Selector */}
          {normalizedVars.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold text-gray-500 tracking-wider">Select Package Size / Option</span>
                {selectedVariant && (
                  <span className="text-xs font-bold text-[#348C21] dark:text-emerald-400">Selected: {selectedVariant.name}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {normalizedVars.map((v) => {
                  const isSelected = selectedVariant?.id === v.id || selectedVariant?.name === v.name;
                  return (
                    <button
                      key={v.id || v.name}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(v);
                        if (v.imageUrl) {
                          const matchingIdx = mediaUrls.findIndex(u => u === v.imageUrl);
                          if (matchingIdx >= 0) setSelectedImageIdx(matchingIdx);
                        }
                      }}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? "bg-[#348C21] text-white border-[#348C21] shadow-md scale-[1.02]"
                          : "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-[#348C21] hover:text-[#348C21]"
                      }`}
                    >
                      <span>{v.name}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isSelected ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                      }`}>
                        KES {v.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs uppercase font-extrabold text-gray-500 tracking-wider">Specifications & Key Benefits</span>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1.5">
                {product.specifications.map((spec, idx) => (
                  <li key={idx}>{spec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Direct Purchase Actions (Dual CTA: Add to Basket + Instant Buy Now) */}
          <div className="pt-6 space-y-3 border-t border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (selectedVariant) {
                    addToCart(product, 1, selectedVariant.name, selectedVariant);
                  } else {
                    addToCart(product, 1);
                  }
                }}
                disabled={activeStock === 0}
                className="w-full bg-[#152E15] dark:bg-emerald-900 text-white font-extrabold py-4 px-6 rounded-2xl hover:bg-[#204520] shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" /> 
                {activeStock === 0 ? "Out of Stock" : "Add To Basket"}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={activeStock === 0}
                className="w-full bg-gradient-to-r from-[#348C21] to-[#50A63C] text-white font-black py-4 px-6 rounded-2xl hover:opacity-95 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-5 h-5 fill-white text-white" /> 
                Buy Now (1-Click)
              </button>
            </div>

            {/* Social Share & WhatsApp Direct Inquiry */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="font-bold flex items-center gap-1"><Share2 className="w-3.5 h-3.5 text-emerald-600" /> Share:</span>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold hover:bg-emerald-100 transition"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold hover:bg-blue-100 transition"
                >
                  Facebook
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 transition cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy Link
                </button>
              </div>

              <a
                href={`https://wa.me/254116794448?text=${encodeURIComponent(`Hi Aloeflora Kenya, I would like to inquire about ${product.name} (KES ${activePrice}).`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" /> Inquire via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Bought Together Bundle */}
      {complementaryProduct && (
        <div className="mt-12 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/70 dark:from-emerald-950/30 dark:via-gray-900 dark:to-emerald-950/30 rounded-3xl p-6 md:p-8 border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#348C21] dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-300/40">
                ✨ Frequently Bought Together
              </span>
              <h3 className="text-xl font-bold text-gray-950 dark:text-white">
                Get the Perfect Aloeflora Routine Bundle
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xl">
                Pair <strong className="text-gray-900 dark:text-white">{product.name}</strong> with <strong className="text-gray-900 dark:text-white">{complementaryProduct.name}</strong> for complete hair & skin hydration.
              </p>

              {/* Items Preview */}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white">
                  <img src={currentDisplayImage} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-lg font-black text-gray-400">+</span>
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white">
                  <img src={complementaryProduct.imageUrl?.split(',')[0]} alt={complementaryProduct.name} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end justify-center space-y-3 shrink-0">
              <div className="text-left md:text-right">
                <div className="text-xs text-gray-500 line-through">
                  Total: KES {(activePrice + complementaryProduct.price).toLocaleString()}
                </div>
                <div className="text-2xl font-black text-[#348C21] dark:text-emerald-400">
                  Bundle: KES {Math.floor((activePrice + complementaryProduct.price) * 0.95).toLocaleString()}
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full ml-2">
                    5% OFF
                  </span>
                </div>
              </div>

              <button
                onClick={handleAddBundleToCart}
                className="bg-[#348C21] hover:bg-[#2b751c] text-white font-extrabold px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Both to Basket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews & Feedback Section */}
      <div id="reviews-section" className="mt-12 bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-10 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-800 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" /> Customer Feedbacks ({product.reviews.length})
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Verified experiences and ratings from Aloeflora customers across Kenya.
            </p>
          </div>

          <button
            onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
            className="bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-extrabold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer self-start sm:self-auto"
          >
            {isReviewFormOpen ? "Cancel Review" : "✍️ Write a Review"}
          </button>
        </div>

        {/* Review Form Accordion */}
        {isReviewFormOpen && (
          <form onSubmit={handleSubmitReview} className="mt-6 p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-4 animate-in fade-in duration-300">
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Leave Your Verified Review for {product.name}</h4>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Your Star Rating</label>
              <Stars rating={reviewRating} interactive onSelect={setReviewRating} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  placeholder="e.g. Grace Wanjiru"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Your Honest Feedback</label>
              <textarea
                required
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="How did this product feel on your hair/skin? What were your results?"
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingReview}
              className="bg-[#348C21] hover:bg-[#2b751c] text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {isSubmittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}
        
        {/* Reviews Grid */}
        <div className="mt-6">
          {product.reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500">
              <Info className="w-8 h-8 text-emerald-700 mb-3 opacity-50" />
              <p className="font-medium">No reviews logged yet.</p>
              <p className="text-xs mt-1">Be the first to share your thoughts on <strong>{product.name}</strong>!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {product.reviews.map((rev) => (
                <div key={rev.id} className="bg-zinc-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-zinc-100 dark:border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{rev.author}</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">✓ Verified Purchase</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">{rev.date}</span>
                  </div>
                  <div className="flex text-amber-400"><Stars rating={rev.rating} /></div>
                  <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed italic">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recently Viewed Products Shelf */}
      {recentlyViewedProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#348C21] dark:text-emerald-400">
                Browsing History
              </span>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Recently Viewed</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {recentlyViewedProducts.map(rp => (
              <Link to={`/product/${rp.id}`} key={rp.id} className="bg-white dark:bg-gray-900 rounded-3xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition group">
                <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 mb-3">
                  <img src={rp.imageUrl?.split(',')[0]} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{rp.subCategory}</span>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 mt-1">{rp.name}</h4>
                <div className="font-extrabold text-emerald-800 dark:text-emerald-400 mt-2">KES {rp.price.toLocaleString()}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#348C21] dark:text-emerald-400">
                You May Also Like
              </span>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Related Products</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map(rp => (
              <Link to={`/product/${rp.id}`} key={rp.id} className="bg-white dark:bg-gray-900 rounded-3xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition group">
                <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 mb-3">
                  <img src={rp.imageUrl?.split(',')[0]} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{rp.subCategory}</span>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 mt-1">{rp.name}</h4>
                <div className="font-extrabold text-emerald-800 dark:text-emerald-400 mt-2">KES {rp.price.toLocaleString()}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
