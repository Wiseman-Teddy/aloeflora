import React, { useEffect } from 'react';
import { CMSPost } from '../types';

interface FAQPageProps {
  cmsPosts: CMSPost[];
}

export default function FAQPage({ cmsPosts }: FAQPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqs = cmsPosts.filter(p => p.type === "faq");

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto bg-zinc-50 dark:bg-gray-800/10 border border-zinc-100 dark:border-gray-800 p-8 rounded-3xl shadow-sm">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 dark:text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-500">Find answers to common questions about our organic products and services.</p>
        </div>
        
        {faqs.length > 0 ? (
          <div className="space-y-4 text-left">
            {faqs.map((faq, index) => (
              <details key={faq.id} open={index === 0} className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl transition hover:shadow-md">
                <summary className="text-base font-semibold text-gray-900 dark:text-white list-none flex items-center justify-between cursor-pointer">
                  <span>{faq.title}</span>
                  <span className="text-emerald-600 font-bold group-open:rotate-45 transition-transform duration-200">+</span>
                </summary>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 leading-relaxed border-t border-gray-50 dark:border-gray-800 pt-4">
                  {faq.content}
                </p>
              </details>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-10">
            No FAQs available at the moment. Please check back later.
          </div>
        )}
      </div>
    </div>
  );
}
