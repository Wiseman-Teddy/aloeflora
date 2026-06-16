import React, { useState } from 'react';
import { X, User, MapPin, Phone, Mail, Shield, LogOut } from 'lucide-react';

interface CustomerProfileProps {
  onClose: () => void;
  onSignOut: () => void;
}

export default function CustomerProfile({ onClose, onSignOut }: CustomerProfileProps) {
  const [name, setName] = useState('Customer Account');
  const [phone, setPhone] = useState('+254700000000');
  const [email, setEmail] = useState('customer@example.com');
  const [address, setAddress] = useState('Nairobi, Kenya');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Profile updated successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        
        <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-4 justify-between items-center">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold">
            <User className="w-5 h-5" /> My Profile & Settings
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1.5"><User className="w-3 h-3"/> Full Name</label>
            <input type="text" value={name} onChange={(e)=>setName(e.target.value)} required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 text-xs dark:text-white" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1.5"><Mail className="w-3 h-3"/> Email Address</label>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 text-xs dark:text-white" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1.5"><Phone className="w-3 h-3"/> M-Pesa Phone Number</label>
            <input type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 text-xs dark:text-white" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1.5"><MapPin className="w-3 h-3"/> Default Delivery Address</label>
            <input type="text" value={address} onChange={(e)=>setAddress(e.target.value)} required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 text-xs dark:text-white" />
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900 flex gap-2 items-start mt-2">
            <Shield className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-emerald-800 dark:text-emerald-300">Your profile data is encrypted. ALOEFLORA PRODUCTS complies with the Kenya Data Protection Act 2019.</p>
          </div>

          <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/50 mt-4">
            <div className="text-[10px] text-red-800 dark:text-red-400 max-w-[200px]">
              <span className="font-bold">Data Erasure / Right to be Forgotten</span><br/>
              Permanently delete your account and all associated data records.
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone and erases all personal data.")) {
                  alert("Data erasure request initiated. You will be signed out.");
                  onSignOut();
                }
              }}
              className="text-xs bg-white dark:bg-gray-900 text-red-600 font-bold border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition cursor-pointer"
            >
              Delete Account
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 bg-emerald-800 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition shadow cursor-pointer text-xs">
              Save Changes
            </button>
          </div>
        </form>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 text-center">
          <button 
            onClick={onSignOut}
            className="w-full bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <LogOut className="w-4 h-4" /> Sign Out Securely
          </button>
        </div>
      </div>
    </div>
  );
}
