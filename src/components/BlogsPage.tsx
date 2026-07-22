import React from "react";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { CMSPost } from "../types";

interface BlogsPageProps {
  cmsPosts: CMSPost[];
}

export default function BlogsPage({ cmsPosts }: BlogsPageProps) {
  const blogs = cmsPosts.filter(p => p.type === "blog" && p.status === "published");

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <Link to="/store" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-bold text-sm mb-8 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>
        
        <section id="scientific-blogs" className="mb-12 text-left">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-8">
            <div>
              <span className="text-xs text-emerald-800 dark:text-emerald-400 uppercase font-bold tracking-widest">Knowledge Base</span>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">Scientific Blog & Insights</h1>
            </div>
            <BookOpen className="w-8 h-8 text-emerald-800 dark:text-emerald-500" />
          </div>
          
          {blogs.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
              <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <div className="text-gray-500 font-medium">No blog posts available yet. Check back later!</div>
            </div>
          ) : (
            <div className={blogs.length === 1 ? "grid grid-cols-1 gap-8" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"}>
              {blogs.map(blog => (
                <article key={blog.id} className={`bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 flex ${blogs.length === 1 ? 'flex-col lg:flex-row' : 'flex-col'} h-full hover:shadow-lg transition duration-300 group gap-6 lg:gap-0`}>
                  {blog.imageUrl && (
                    <div className={`${blogs.length === 1 ? 'w-full lg:w-1/2 h-80 lg:mr-8' : 'w-full h-56 mb-6'} rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 shrink-0`}>
                      <img src={blog.imageUrl.split(',')[0]} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    </div>
                  )}
                  <div className={`flex flex-col flex-grow ${blogs.length === 1 ? 'justify-center' : ''}`}>
                    <h2 className="font-bold text-xl text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">{blog.title}</h2>
                    <p className={`text-sm text-gray-600 dark:text-gray-400 mb-6 ${blogs.length === 1 ? 'line-clamp-6' : 'line-clamp-4'} leading-relaxed flex-grow`}>{blog.content}</p>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center mt-auto">
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                        {new Date(blog.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <button className="text-emerald-700 dark:text-emerald-400 font-bold text-sm hover:underline cursor-pointer">
                        Read full article &rarr;
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
