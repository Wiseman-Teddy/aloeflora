import React from "react";
import { Info, User, ArrowLeft, Target, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { CMSPost } from "../types";

interface AboutUsPageProps {
  cmsPosts: CMSPost[];
}

export default function AboutUsPage({ cmsPosts }: AboutUsPageProps) {
  const aboutPosts = cmsPosts.filter(p => p.type === "about" && p.status === "published");
  const teamMembers = cmsPosts.filter(p => p.type === "team" && p.status === "published");

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <Link to="/store" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-bold text-sm mb-8 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>
        
        {/* MISSION & VISION SECTION */}
        <section id="mission-vision" className="mb-12 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mission Statement */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-3xl p-8 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-700 text-white rounded-2xl shadow-sm">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-emerald-800 dark:text-emerald-400 uppercase font-bold tracking-widest">Our Purpose</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mission Statement</h2>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                At Aloe Flora Product Limited, we are committed to manufacturing high-quality, eco-friendly cleaning detergents and hair care as well as body care products that enhance everyday hygiene and well-being. We aim to combine innovation with nature’s finest ingredients to deliver safe, effective, and sustainable solutions for homes and businesses.
              </p>
            </div>

            {/* Vision Statement */}
            <div className="bg-gradient-to-br from-lime-50 to-emerald-50 dark:from-lime-950/30 dark:to-emerald-950/20 border border-lime-100 dark:border-lime-900/40 rounded-3xl p-8 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-800 text-white rounded-2xl shadow-sm">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-emerald-800 dark:text-emerald-400 uppercase font-bold tracking-widest">Our Future</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vision Statement</h2>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                To be a leading manufacturer of premium, nature-inspired hygiene and personal care products, setting the standard for quality, sustainability, and customer satisfaction across the industry.
              </p>
            </div>
          </div>
        </section>

        <section id="about-us" className="mb-12 text-left">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-8">
            <div>
              <span className="text-xs text-emerald-800 dark:text-emerald-400 uppercase font-bold tracking-widest">Our Story</span>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">About Aloe Flora</h1>
            </div>
            <Info className="w-8 h-8 text-emerald-800 dark:text-emerald-500" />
          </div>
          
          {aboutPosts.length === 0 ? (
            <div className="text-gray-500 italic">No information available yet.</div>
          ) : (
            <div className={aboutPosts.length === 1 ? "grid grid-cols-1 gap-8" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
              {aboutPosts.map(post => (
                <div key={post.id} className={`bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm p-8 flex flex-col ${aboutPosts.length === 1 ? 'lg:flex-row' : 'xl:flex-row'} gap-8 items-center ${aboutPosts.length === 1 ? 'lg:items-start' : 'xl:items-start'} transition hover:shadow-md`}>
                  {post.imageUrl && (
                    <img src={post.imageUrl.split(',')[0]} alt={post.title} className={`w-full ${aboutPosts.length === 1 ? 'lg:w-1/3' : 'xl:w-64'} h-64 object-cover rounded-2xl border border-gray-200 dark:border-gray-700 shrink-0 shadow-sm`} />
                  )}
                  <div className="flex-grow">
                    <h2 className="font-bold text-xl text-gray-900 dark:text-white mb-4">{post.title}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* INTEGRATED TEAM SECTION */}
          {teamMembers.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-8">
                <div>
                  <span className="text-xs text-emerald-800 dark:text-emerald-400 uppercase font-bold tracking-widest">Leadership</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Our Team</h2>
                </div>
                <User className="w-6 h-6 text-emerald-800 dark:text-emerald-500" />
              </div>
              <div className={teamMembers.length === 1 ? "flex justify-center" : teamMembers.length === 2 ? "grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"}>
                {teamMembers.map(member => (
                  <div key={member.id} className={`bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm flex flex-col items-center text-center p-8 hover:shadow-md transition ${teamMembers.length === 1 ? 'w-full max-w-lg' : ''}`}>
                    {member.imageUrl && (
                      <img src={member.imageUrl.split(',')[0]} alt={member.title} className="w-32 h-32 object-cover rounded-full border-4 border-lime-200 dark:border-lime-900 mb-6 shadow-sm" />
                    )}
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{member.title}</h3>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-4 uppercase tracking-wider">{member.seoTitle || "Team Member"}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{member.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
