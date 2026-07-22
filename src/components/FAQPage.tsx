import React, { useEffect, useState } from 'react';
import { Search, ChevronDown, MessageSquare, Mail, HelpCircle, Phone } from 'lucide-react';
import { CMSPost } from '../types';

interface FAQPageProps {
  cmsPosts: CMSPost[];
}

const FAQ_CATEGORIES = [
  "Getting Started",
  "Products",
  "Orders",
  "Payments",
  "Shipping & Delivery",
  "Returns & Refunds",
  "Discounts & Promotions"
];



export default function FAQPage({ cmsPosts }: FAQPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Getting Started");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Map cmsPosts to the local format
  const dynamicFAQs = cmsPosts
    .filter(p => p.type === 'faq')
    .map(p => ({
      category: p.seoTitle || "Getting Started",
      question: p.title,
      answer: p.content
    }));

  // Filter FAQs based on search and category
  const filteredFAQs = dynamicFAQs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (searchQuery.trim() !== "") {
      return matchesSearch; // If searching, ignore category filter and show all matches
    }
    
    return faq.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pt-24 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6 border border-emerald-100 dark:border-emerald-800/50">
            <HelpCircle className="w-3.5 h-3.5" /> Support Center
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">How can we help you?</h1>
          
          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-0 transition-colors shadow-sm"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar - Categories */}
          <div className={`lg:w-1/4 ${searchQuery.trim() !== "" ? "hidden lg:block opacity-50 pointer-events-none" : ""}`}>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 px-4">Categories</h3>
            <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 gap-2 lg:gap-1 hide-scrollbar">
              {FAQ_CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveCategory(category);
                    setExpandedIndex(0);
                  }}
                  className={`flex-shrink-0 lg:w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeCategory === category && searchQuery.trim() === ""
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {category}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Panel - FAQ Accordion */}
          <div className="lg:w-3/4">
            {searchQuery.trim() !== "" && (
              <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Search results for "{searchQuery}"
                </h3>
                <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-md">
                  {filteredFAQs.length} found
                </span>
              </div>
            )}

            {filteredFAQs.length > 0 ? (
              <div className="space-y-4">
                {filteredFAQs.map((faq, index) => {
                  const isExpanded = expandedIndex === index;
                  return (
                    <div 
                      key={index} 
                      className={`bg-white dark:bg-gray-900 border transition-all duration-300 rounded-2xl overflow-hidden ${isExpanded ? 'border-emerald-200 dark:border-emerald-900 shadow-md' : 'border-gray-100 dark:border-gray-800 shadow-sm hover:border-gray-200 dark:hover:border-gray-700'}`}
                    >
                      <button
                        className="w-full px-6 py-5 flex items-center justify-between focus:outline-none"
                        onClick={() => setExpandedIndex(isExpanded ? null : index)}
                      >
                        <span className={`text-left font-bold ${isExpanded ? 'text-emerald-800 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                          {faq.question}
                        </span>
                        <div className={`flex-shrink-0 ml-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-emerald-600' : 'text-gray-400'}`}>
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </button>
                      <div 
                        className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                      >
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-gray-50 dark:border-gray-800 pt-4">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No results found</h3>
                <p className="text-gray-500 dark:text-gray-400">We couldn't find any FAQs matching your search.</p>
                <button 
                  onClick={() => setSearchQuery("")}
                  className="mt-6 text-sm font-bold text-emerald-600 hover:text-emerald-700 underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Still Need Help Section */}
        <div className="mt-20 pt-12 border-t border-gray-100 dark:border-gray-800">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Still Need Help?</h2>
            <p className="text-gray-500 dark:text-gray-400">Our customer support team is available Mon-Sat, 8am - 6pm.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <a href="https://wa.me/254116794448" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl hover:border-emerald-500 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Live Chat</h4>
                <p className="text-xs text-gray-500 mt-1">Chat on WhatsApp</p>
              </div>
            </a>
            
            <a href="mailto:info@aloefloraproducts.com" className="flex items-center gap-4 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl hover:border-blue-500 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Email Support</h4>
                <p className="text-xs text-gray-500 mt-1">info@aloefloraproducts.com</p>
              </div>
            </a>

            <a href="tel:+254116794448" className="flex items-center gap-4 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl hover:border-purple-500 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                <Phone className="w-6 h-6 text-purple-600 dark:text-purple-400 group-hover:text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Call Us</h4>
                <p className="text-xs text-gray-500 mt-1">+254 116 794 448</p>
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
