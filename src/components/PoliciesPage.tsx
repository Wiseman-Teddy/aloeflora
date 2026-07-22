import React, { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Shield, Scale, ArrowLeft, RefreshCcw } from 'lucide-react';

export default function PoliciesPage() {
  const { policyId } = useParams<{ policyId: string }>();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [policyId]);

  if (!['returns', 'terms', 'privacy'].includes(policyId || '')) {
    return <Navigate to="/store" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/store" className="inline-flex items-center text-sm text-gray-500 hover:text-emerald-700 mb-8 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Store
        </Link>
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50 p-2">
            <Link
              to="/policies/returns"
              className={`px-4 py-3 text-sm font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
                policyId === 'returns' 
                  ? 'bg-white text-emerald-800 shadow-sm border border-gray-100' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <RefreshCcw className="w-4 h-4" /> Returns, Refund & Shipping
            </Link>
            <Link
              to="/policies/terms"
              className={`px-4 py-3 text-sm font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
                policyId === 'terms' 
                  ? 'bg-white text-emerald-800 shadow-sm border border-gray-100' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Scale className="w-4 h-4" /> Terms of Service
            </Link>
            <Link
              to="/policies/privacy"
              className={`px-4 py-3 text-sm font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${
                policyId === 'privacy' 
                  ? 'bg-white text-emerald-800 shadow-sm border border-gray-100' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Shield className="w-4 h-4" /> Privacy Policy
            </Link>
          </div>

          {/* Content Area */}
          <div className="p-6 sm:p-10">
            {policyId === 'returns' && <ReturnsContent />}
            {policyId === 'terms' && <TermsContent />}
            {policyId === 'privacy' && <PrivacyContent />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReturnsContent() {
  return (
    <div className="prose prose-emerald max-w-none text-gray-700 text-sm sm:text-base space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Aloeflora Return, Refund & Shipping Policy</h1>
        <p className="text-gray-500 italic">Last Updated: April 20, 2026</p>
      </div>

      <p>At Aloeflora we create fresh, natural home care, body care, hair care, and coffee. Because our products are made in small batches without harsh preservatives, please read this carefully.</p>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-2">1. ORDER PROCESSING</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>Order Confirmation</strong>: Sent to your email + dashboard immediately.</li>
          <li><strong>Processing Time</strong>: 1-2 business days. Coffee is roasted-to-order and may take 2-3 business days.</li>
          <li><strong>Order Cancellation</strong>: Cancel within <strong>12 hours</strong> via your dashboard or WhatsApp +254 116 794448. After this, your order enters production and cannot be cancelled.</li>
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-2">2. SHIPPING & DELIVERY - KENYA</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>Delivery Zones & Timelines</strong>:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Nairobi</strong>: 24-48 hours. Delivery fee from KSh 250</li>
              <li><strong>Major Towns</strong>: Mombasa, Kisumu, Nakuru, Eldoret: 2-3 business days. From KSh 400</li>
              <li><strong>Other Counties</strong>: 3-5 business days. From KSh 500</li>
            </ul>
          </li>
          <li><strong>Shipping Partner</strong>: Fargo, G4S, or Rider. Tracking link sent to your dashboard.</li>
          <li><strong>Failed Delivery</strong>: We'll call you 2x. If unclaimed in 7 days, order is cancelled. Refund issued minus original shipping fee. Re-delivery fee: KSh 500.</li>
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-2">3. RETURNS, EXCHANGES & SPOILED GOODS</h2>
        <p>For hygiene + safety, we <strong>cannot accept returns on opened</strong> body care, hair care, or home care.</p>
        <p><strong>We WILL replace or refund within 7 days for:</strong></p>
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>Spoiled/Expired</strong>: Product arrived bad. Send photos + batch # from dashboard within 48 hours.</li>
          <li><strong>Damaged in Transit</strong>: Broken bottle, crushed coffee. Send photos of box + product within 24 hours.</li>
          <li><strong>Wrong Item</strong>: We sent the wrong thing.</li>
        </ol>
        <p className="mt-4">
          <strong>How to claim</strong>: Dashboard → Orders → "Report Issue" → Upload photos.<br />
          <strong>Resolution</strong>: Free replacement, Aloeflora Wallet credit + 5% bonus, or refund to M-Pesa/Bank in 5-7 business days. Return pickup is free.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-2">4. REFUNDS & ALOEFLORA WALLET</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>M-Pesa/Bank Refund</strong>: 5-7 business days</li>
          <li><strong>Aloeflora Wallet</strong>: Instant credit to your dashboard. Use on next order. Never expires.</li>
          <li><strong>Overcharges</strong>: We refund the difference + KSh 200 credit.</li>
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-2">5. INQUIRIES</h2>
        <p>
          Response within 24 hours Mon-Sat 8am-6pm.<br />
          Email: info@aloefloraproducts.com | WhatsApp: +254 116 794448 | Dashboard Chat
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-2">6. NATURAL PRODUCT NOTE</h2>
        <p>Natural products vary in color/scent by harvest. This is normal. Check "Best Before" in your dashboard. Coffee is best within 30 days of roast date.</p>
      </section>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="prose prose-emerald max-w-none text-gray-700 text-sm sm:text-base space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Aloeflora Terms of Service</h1>
        <p className="text-gray-500">By using aloeflora.com and your customer dashboard, you agree to:</p>
      </div>

      <ol className="list-decimal pl-5 space-y-3">
        <li><strong>Accounts</strong>: You are responsible for your login. You must be 18+ to purchase. Keep details updated.</li>
        <li><strong>Orders</strong>: Prices in KSh and include VAT. We reserve the right to refuse orders.</li>
        <li><strong>Products</strong>: Descriptions are accurate. Natural variation may occur. Not medical advice.</li>
        <li><strong>Intellectual Property</strong>: Aloeflora logo, site, content are ours. Don't copy.</li>
        <li><strong>Liability</strong>: We're not liable for misuse. Do a patch test for skincare.</li>
        <li><strong>Changes</strong>: We may update these terms. You'll be notified in your dashboard.</li>
      </ol>

      <p className="pt-4 border-t border-gray-100"><strong>Governing Law</strong>: Laws of Kenya. Disputes handled in Nairobi courts.</p>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="prose prose-emerald max-w-none text-gray-700 text-sm sm:text-base space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Aloeflora Privacy Policy</h1>
        <p className="text-gray-500">We respect your data.</p>
      </div>

      <ol className="list-decimal pl-5 space-y-3">
        <li><strong>What we collect</strong>: Name, phone, email, delivery address, M-Pesa/Bank details for refunds, order history, dashboard activity.</li>
        <li><strong>Why</strong>: To process orders, deliver, support you, and improve Aloeflora products.</li>
        <li><strong>Sharing</strong>: Only with delivery partners and payment providers. We never sell your data.</li>
        <li><strong>Your Dashboard</strong>: You can view, edit, and delete your address and data anytime.</li>
        <li><strong>Cookies</strong>: Used to keep you logged in and improve site.</li>
        <li><strong>Data Storage</strong>: Stored securely in Kenya/EU servers. Kept for 3 years for warranty.</li>
        <li><strong>Contact DPO</strong>: <a href="mailto:info@aloefloraproducts.com" className="text-emerald-700 hover:underline">info@aloefloraproducts.com</a> to request data deletion.</li>
      </ol>

      <p className="pt-4 border-t border-gray-100 font-medium">We comply with Kenya's Data Protection Act 2019.</p>
    </div>
  );
}
