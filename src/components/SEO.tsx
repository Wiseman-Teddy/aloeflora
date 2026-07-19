import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  robots?: string;
  type?: string;
  url?: string;
  image?: string;
  schema?: Record<string, any>;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'ALOEFLORA PRODUCTS | Best Natural Hair, Skin, & Home Care',
  description = 'Shop the best natural hair products, best coffee products, and best home care & natural body care products. Quality, affordable organic formulations locally sourced in Nairobi, Kenya.',
  keywords = 'Best Natural hair product, best coffee products, best Home care and natural products, best natural and body care, Best skin hair home products, aloe vera, organic formulations, Nairobi, Kenya',
  robots = 'index, follow',
  type = 'website',
  url = 'https://aloefloraproducts.com/',
  image = 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&q=80&w=600',
  schema
}) => {
  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robots} />

      {/* Open Graph (Facebook/WhatsApp) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Schema.org Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};
