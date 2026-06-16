import React from 'react';
import { X, Scale, FileText } from 'lucide-react';

interface LegalPoliciesProps {
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms';
}

export default function LegalPolicies({ onClose, defaultTab = 'privacy' }: LegalPoliciesProps) {
  const [activeTab, setActiveTab] = React.useState<'privacy' | 'terms'>(defaultTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 p-2 pl-4">
          <div className="flex gap-2 flex-1 pt-2">
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2 text-sm font-bold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'privacy' 
                  ? 'bg-white text-emerald-800 border-t border-x border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ShieldIcon /> Privacy Policy (DPA 2019)
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-2 text-sm font-bold rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'terms' 
                  ? 'bg-white text-emerald-800 border-t border-x border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Scale className="w-4 h-4" /> Terms of Service
            </button>
          </div>
          <button 
            onClick={onClose}
            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          {activeTab === 'privacy' ? <PrivacyContent /> : <TermsContent />}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
          Last Updated: June 15, 2026. ALOEFLORA PRODUCTS operates securely from Nairobi, Kenya.
        </div>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-950 mb-2">Privacy Policy</h2>
        <p className="text-gray-500 italic">Compliance Framework: Kenya Data Protection Act (2019) & GDPR</p>
      </div>

      <section>
        <h3 className="font-bold text-gray-900 text-base mb-2">1. Introduction & Scope</h3>
        <p>Welcome to ALOEFLORA PRODUCTS. We are deeply committed to protecting your personal data and respecting your privacy. This policy outlines how we collect, use, process, and safeguard your information when you interact with our e-commerce platform.</p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 text-base mb-2">2. Data Collection (Section 25 of DPA)</h3>
        <p>We strictly collect data necessary to fulfill commercial transactions and improve operational delivery. This includes:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><span className="font-semibold">Identity Data:</span> First name, Last name.</li>
          <li><span className="font-semibold">Contact Data:</span> Email address, Mobile number (for M-Pesa).</li>
          <li><span className="font-semibold">Logistical Data:</span> County, Sub-County, Estate, Building/House Number.</li>
          <li><span className="font-semibold">Financial Data:</span> Transaction IDs (M-Pesa receipts). We <span className="font-bold underline text-red-600">do not</span> store your PINs or banking credentials.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 text-base mb-2">3. Purpose of Processing</h3>
        <p>Your data is processed explicitly for:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Executing purchase agreements and authorizing M-Pesa payments (Lipa Na M-Pesa).</li>
          <li>Coordinating dispatch riders to complete physical delivery of goods.</li>
          <li>Providing historical receipts and access to the customer dashboard.</li>
          <li>Legal compliance and fraud prevention.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 text-base mb-2">4. Your Data Subject Rights (Section 26 of DPA)</h3>
        <p>Under the Kenya Data Protection Act (2019), you hold absolute rights to:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><span className="font-semibold">Right to Access:</span> Request a copy of all personal data ALOEFLORA PRODUCTS holds.</li>
          <li><span className="font-semibold">Right to Erasure (Right to be Forgotten):</span> Request complete deletion of your account and records from our databases.</li>
          <li><span className="font-semibold">Right to Rectification:</span> Correct any inaccurate or incomplete data.</li>
          <li><span className="font-semibold">Right to Object:</span> Opt-out of any direct marketing or AI-driven profiling.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 text-base mb-2">5. Data Security</h3>
        <p>All data is encrypted in transit via TLS 1.3. Application databases strictly utilize Row Level Security (RLS) provided by Supabase to guarantee isolated access where customers can only view their own respective data.</p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 text-base mb-2">6. Privacy Contact (DSARs)</h3>
        <p>To exercise any of your data protection rights (Data Subject Access Requests) or to contact our Data Protection Officer, please email us directly at: <a href="mailto:obondodoris@gmail.com" className="font-bold text-emerald-600 hover:underline">obondodoris@gmail.com</a>.</p>
      </section>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-950 mb-2">Terms of Service</h2>
        <p className="text-gray-500 italic">Effective Date: June 2026</p>
      </div>

      <section>
        <h3 className="font-bold text-gray-900 text-base mb-2">1. Agreement to Terms</h3>
        <p>By interacting with, browsing, or purchasing from ALOEFLORA PRODUCTS ("Platform"), you agree to abide by these Terms of Service. If you do not agree, you are prohibited from using this platform.</p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 text-base mb-2">2. Products & Healthcare Disclaimer</h3>
        <p>All products listed on ALOEFLORA PRODUCTS are organic and naturally formulated. However, they are <span className="font-bold text-red-600 underline">not intended to diagnose, treat, cure, or prevent any medical condition</span>. Patch testing is strictly advised. If an allergic reaction occurs, cease use immediately.</p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 text-base mb-2">3. Payment & Pricing</h3>
        <p>All prices are listed in Kenyan Shillings (KES). Payments are processed primarily through Safaricom M-Pesa. ALOEFLORA PRODUCTS reserves the right to adjust product Cost Prices and Retail Prices at its sole discretion based on market fluctuations without prior notice. Past orders will not be affected.</p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 text-base mb-2">4. Delivery & Logistics</h3>
        <p>Delivery timeframes are estimates. Dispatch riders operate within the Nairobi Metropolitan region and selected counties. You are responsible for providing accurate and accessible delivery instructions (Building, House Number, Estate). Failed deliveries due to customer unavailability may incur a re-delivery fee.</p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 text-base mb-2">5. Returns & Refunds</h3>
        <p>ALOEFLORA PRODUCTS ensures 100% satisfaction. Customers are entitled to full exchanges or an immediate refund in cases of physical damage, product leaks, or severe component sensitivities, provided the claim is filed within 7 calendar days of receipt.</p>
      </section>
    </div>
  );
}
