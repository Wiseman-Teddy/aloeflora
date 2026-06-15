# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> has title and displays storefront
- Location: e2e\home.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('button:has-text("Customer Storefront")')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button:has-text("Customer Storefront")')
    13 × locator resolved to <button class="px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer select-none bg-emerald-800 text-white shadow-sm">…</button>
       - unexpected value "hidden"

```

```yaml
- banner:
  - text: A ALOEFLORA Quality, Affordable & Natural
  - button
  - button
- main:
  - text: Nairobi's Supreme Eco Formulations
  - heading "Quality, Affordable & Natural Products" [level=1]
  - paragraph: Locally sourced. Zero toxic components. Pure, intense hydration for Kenyan curl structures, skin cells, and healthy household surfaces.
  - link "Explore Products":
    - /url: "#store-catalog"
  - button "Consult Assistant"
  - text: Loyalty Tracker Gold Member Referral Tier 280 Ksh points bank ALOEFLORA Showcase (Products 1/10)
  - img "Aloeflora Pure Aloe Vera Gel Shampoo"
  - text: Ksh 850 Shampoos
  - heading "Aloeflora Pure Aloe Vera Gel Shampoo" [level=3]
  - paragraph: Formulated with 85% raw organic Aloe juice sourced from local Kenyan farms. Restores natural moisture, repairs damaged hair cuticles, and relieves dry, itchy scalp. Sulfate-free and color-safe.
  - button "Instant Add"
  - button "Full specs"
  - button
  - button
  - button
  - button
  - button
  - button
  - button
  - button
  - button
  - button
  - button
  - button
  - text: Organic Formulations
  - heading "Active Product Catalog" [level=2]
  - textbox "Search items..."
  - combobox:
    - option "Default Sort" [selected]
    - 'option "Price: Low to High"'
    - 'option "Price: High to Low"'
    - option "Top Rated"
  - button "All Items"
  - button "Hair Care"
  - button "Body Care"
  - button "Home Care"
  - button
  - img "Aloeflora Pure Aloe Vera Gel Shampoo"
  - text: Shampoos 4.8
  - heading "Aloeflora Pure Aloe Vera Gel Shampoo" [level=3]
  - paragraph: Formulated with 85% raw organic Aloe juice sourced from local Kenyan farms. Restores natural moisture, repairs damaged hair cuticles, and relieves dry, itchy scalp. Sulfate-free and color-safe.
  - text: Kenyan Price KES 850
  - button "Compare specifications"
  - button
  - button
  - img "Aloeflora Hydrating Aloe & Avocado Conditioner"
  - text: Conditioners 4.9
  - heading "Aloeflora Hydrating Aloe & Avocado Conditioner" [level=3]
  - paragraph: An ultra-creamy deep conditioning treatment blending fresh avocado oil with concentrated aloe pulp. Delivers intense slip for easy detangling, preventing hair breakage during wash days.
  - text: Kenyan Price KES 900
  - button "Compare specifications"
  - button
  - text: Low Stock
  - button
  - img "Aloeflora Aloe & Castor Growth Hair Oil"
  - text: Oils 4.7
  - heading "Aloeflora Aloe & Castor Growth Hair Oil" [level=3]
  - paragraph: A signature hair nutrient stimulant sealing ends, moisturizing roots, and stimulating rapid volume. Infused with black castor oil, herbal aloe peptides, and Kenyan peppermint oil.
  - text: Kenyan Price KES 1200
  - button "Compare specifications"
  - button
  - button
  - img "Aloeflora Nourishing Herbal Growth Cream"
  - text: Hair Creams 4.6
  - heading "Aloeflora Nourishing Herbal Growth Cream" [level=3]
  - paragraph: Daily leave-in hydration styling butter containing shea butter, wild aloe leaf infusion, and hibiscus extract. Holds moisture for up to 72 hours, excellent for twists, braids, and blowouts.
  - text: Kenyan Price KES 950
  - button "Compare specifications"
  - button
  - button
  - img "Aloeflora Aloe Calendula Moisturizing Soap"
  - text: Soaps 4.8
  - heading "Aloeflora Aloe Calendula Moisturizing Soap" [level=3]
  - paragraph: Handcrafted natural herbal bath bar blending anti-inflammatory Calendula flowers with cold-pressed olive oils and high-purity aloe soap base. Gently regenerates dry, sensitive, or eczema-prone skin.
  - text: Kenyan Price KES 350
  - button "Compare specifications"
  - button
  - button
  - img "Aloeflora Ultra-Shea Hydrating Body Lotion"
  - text: Lotions 4.7
  - heading "Aloeflora Ultra-Shea Hydrating Body Lotion" [level=3]
  - paragraph: Intense deep restoration body moisturizer infused with cold-pressed cocoa butter, multi-vitamin aloe concentrate, and Kenyan macadamia seed oils. Absorbs fast with a velvety premium finish.
  - text: Kenyan Price KES 750
  - button "Compare specifications"
  - button
  - button
  - img "Aloeflora Calming Lavender Aloe Body Oil"
  - text: Body Oils 4.9
  - heading "Aloeflora Calming Lavender Aloe Body Oil" [level=3]
  - paragraph: Luxurious dry body glow oil soothing muscles and locking in hydration after showers. Features organic aloe juice and french lavender buds, ideal for relaxing body therapies.
  - text: Kenyan Price KES 1100
  - button "Compare specifications"
  - button
  - button
  - img "Aloeflora Aloe Mint Refining Exfoliating Scrub"
  - text: Scrubs 4.5
  - heading "Aloeflora Aloe Mint Refining Exfoliating Scrub" [level=3]
  - paragraph: Revitalizing face and body micro-exfoliant made from crushed walnut shells, fine sugar crystals, concentrated aloe extract, and spearmint essential oil. Buffs dry skin to reveal polished radiance.
  - text: Kenyan Price KES 800
  - button "Compare specifications"
  - button
  - text: Low Stock
  - button
  - img "Aloeflora Aloe Vera Lavender Air Freshener"
  - text: Air Fresheners 4.6
  - heading "Aloeflora Aloe Vera Lavender Air Freshener" [level=3]
  - paragraph: Eco-friendly, water-based household room spray neutralizing heavy kitchen or bathroom odors instantly. Crafted with pure lavender hydrosol and organic aloe enzymes.
  - text: Kenyan Price KES 500
  - button "Compare specifications"
  - button
  - button
  - img "Aloeflora Bio-Degradable Pine Multi-Cleaner"
  - text: Cleaning Products 4.8
  - heading "Aloeflora Bio-Degradable Pine Multi-Cleaner" [level=3]
  - paragraph: A tough, concentrated natural surface disinfectant stripping kitchen grease and floor grime with the power of pine needles oil, citrus extracts, and natural saponified aloe. No harsh chemical gases.
  - text: Kenyan Price KES 650
  - button "Compare specifications"
  - button
  - text: Wellness Promotion
  - heading "Kenyan Organic Expos & Farm Walks" [level=3]
  - img "Aloeflora Natural Hair, Body & Wellness Expo 2026"
  - text: 2026-07-12
  - heading "Aloeflora Natural Hair, Body & Wellness Expo 2026" [level=4]
  - text: KICC Amphitheatre, Nairobi
  - paragraph: Join ALOEFLORA specialists for an immersive full-day skin analysis and curl textures workshop. Bring home absolute organic wellness formulations, enjoy free Kenya tea, organic foods, and product customisation booths.
  - text: "Remaining slots: 108"
  - button "Register Seat"
  - img "Kenyan Herb Harvest Farm Tour"
  - text: 2026-08-05
  - heading "Kenyan Herb Harvest Farm Tour" [level=4]
  - text: Aloeflora Botanical Plot, Limuru
  - paragraph: An exclusive educational morning walk through the high-density green fields of Limuru where we grow over 15 distinct natural sub-species of Aloe vera under absolute sustainable agroforestry.
  - text: "Remaining slots: 2"
  - button "Register Seat"
  - heading "Enterprise Contacts" [level=4]
  - paragraph: "For enquiries, custom partnerships & stock queries:"
  - text: Email Address
  - link "obondodoris@gmail.com":
    - /url: mailto:obondodoris@gmail.com
  - text: Hotline Phone
  - link "+254 702 283 637":
    - /url: tel:+254702283637
  - text: Social Accounts
  - link "Instagram":
    - /url: https://www.instagram.com/aloefloraproducts?igsh=YzljYTk1ODg3Zg==
  - text: "|"
  - link "Facebook":
    - /url: https://www.facebook.com/aloefloraproducts
  - heading "Customer FAQs" [level=4]
  - group: Which product matches 4C natural coils? +
  - button
- contentinfo:
  - text: A ALOEFLORA
  - paragraph: Quality, Affordable & Natural Products. Locally sourced. Zero toxic components. Pure, intense hydration for Kenyan curls and skin.
  - heading "Quick Links" [level=4]
  - list:
    - listitem:
      - button "Shop Products"
    - listitem:
      - link "Events & Workshops":
        - /url: "#events-marketing-section"
    - listitem:
      - button "Track Order"
    - listitem:
      - button "Return Policy"
  - heading "Contact Info" [level=4]
  - list:
    - listitem: Nairobi CBD Depot, Kenya
    - listitem:
      - link "+254 702 283 637":
        - /url: tel:+254702283637
    - listitem:
      - link "obondodoris@gmail.com":
        - /url: mailto:obondodoris@gmail.com
  - heading "Social Media" [level=4]
  - link "IG":
    - /url: https://www.instagram.com/aloefloraproducts?igsh=YzljYTk1ODg3Zg==
  - link "FB":
    - /url: https://www.facebook.com/aloefloraproducts
  - link "WA":
    - /url: https://wa.me/254702283637
  - text: "© 2026 ALOEFLORA Kenya. All rights reserved. DB ENGINE: PostgreSQL RLS • SSL TRG: AES_256_GCM"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('has title and displays storefront', async ({ page }) => {
  4  |   await page.goto('/');
  5  |   
  6  |   // Wait for the app to load
  7  |   await expect(page.locator('text=ALOEFLORA').first()).toBeVisible();
  8  |   
  9  |   // Verify storefront tab is active by default
  10 |   const storeTab = page.locator('button:has-text("Customer Storefront")');
> 11 |   await expect(storeTab).toBeVisible();
     |                          ^ Error: expect(locator).toBeVisible() failed
  12 | });
  13 | 
  14 | test('can navigate to admin console', async ({ page }) => {
  15 |   await page.goto('/');
  16 |   
  17 |   // Click admin console tab
  18 |   const adminTab = page.locator('button:has-text("Consolidated Admin Console")');
  19 |   await adminTab.click();
  20 |   
  21 |   // Check role indicator
  22 |   await expect(page.locator('text=Role: Admin')).toBeVisible();
  23 | });
  24 | 
```