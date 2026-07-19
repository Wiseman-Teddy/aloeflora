const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'const FAQPage = lazy(() => import("./components/FAQPage"));',
  'const FAQPage = lazy(() => import("./components/FAQPage"));\nconst PoliciesPage = lazy(() => import("./components/PoliciesPage"));'
);

code = code.replace(
  '<Route path="/faqs" element={<FAQPage cmsPosts={cmsPosts} />} />',
  '<Route path="/faqs" element={<FAQPage cmsPosts={cmsPosts} />} />\n            <Route path="/policies/:policyId" element={<PoliciesPage />} />'
);

code = code.replace(
  '<li><Link to="/store" className="hover:text-emerald-600 transition">Shop Products</Link></li>',
  '<li><Link to="/store#organic-formulations" className="hover:text-emerald-600 transition">Shop Products</Link></li>'
);

code = code.replace(
  '<li><a href="#events-marketing-section" className="hover:text-emerald-600 transition">Events & Workshops</a></li>',
  '<li><Link to="/store#events-marketing-section" className="hover:text-emerald-600 transition">Events & Workshops</Link></li>'
);

code = code.replace(
  '<li><button onClick={() => toast.success(\'Return Policy documentation is being updated.\')} className="hover:text-emerald-600 transition cursor-pointer">Return Policy</button></li>',
  '<li><Link to="/policies/returns" className="hover:text-emerald-600 transition cursor-pointer">Return Policy</Link></li>'
);

code = code.replace(
  '<span>© {new Date().getFullYear()} ALOEFLORA PRODUCTS Kenya. All rights reserved.</span>',
  '<span>&copy; {new Date().getFullYear()} ALOEFLORA PRODUCTS Kenya. All rights reserved.</span>\n            <div className="flex gap-4 mt-4 md:mt-0">\n              <Link to="/policies/terms" className="hover:text-white transition">Terms of Service</Link>\n              <Link to="/policies/privacy" className="hover:text-white transition">Privacy Policy</Link>\n            </div>'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Done!');
