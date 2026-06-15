# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> can navigate to admin console
- Location: e2e\home.spec.ts:14:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Consolidated Admin Console")')
    - locator resolved to <button class="px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer select-none text-gray-600 dark:text-gray-300 hover:text-gray-950">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
    53 × waiting for element to be visible, enabled and stable
       - element is not visible
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e8]: A
        - generic [ref=e9]:
          - generic [ref=e10]: ALOEFLORA
          - generic [ref=e11]: Quality, Affordable & Natural
      - generic [ref=e12]:
        - button [ref=e13] [cursor=pointer]:
          - img [ref=e14]
        - button [ref=e16] [cursor=pointer]:
          - img [ref=e17]
  - main [ref=e18]:
    - generic [ref=e19]:
      - generic [ref=e24]:
        - generic [ref=e25]:
          - generic [ref=e26]:
            - img [ref=e27]
            - text: Nairobi's Supreme Eco Formulations
          - heading "Quality, Affordable & Natural Products" [level=1] [ref=e30]:
            - text: Quality, Affordable &
            - text: Natural Products
          - paragraph [ref=e31]: Locally sourced. Zero toxic components. Pure, intense hydration for Kenyan curl structures, skin cells, and healthy household surfaces.
          - generic [ref=e32]:
            - link "Explore Products" [ref=e33] [cursor=pointer]:
              - /url: "#store-catalog"
            - button "Consult Assistant" [ref=e34]
          - generic [ref=e35]:
            - generic [ref=e36]:
              - img [ref=e38]
              - generic [ref=e41]:
                - generic [ref=e42]: Loyalty Tracker
                - generic [ref=e43]: Gold Member Referral Tier
            - generic [ref=e44]:
              - generic [ref=e45]: "280"
              - generic [ref=e46]: Ksh points bank
        - generic [ref=e47]:
          - generic [ref=e48]: ALOEFLORA Showcase (Products 5/10)
          - generic [ref=e49]:
            - generic [ref=e50]:
              - generic [ref=e51]:
                - img "Aloeflora Aloe Calendula Moisturizing Soap" [ref=e52]
                - generic [ref=e53]: Ksh 350
              - generic [ref=e54]:
                - generic [ref=e55]: Soaps
                - heading "Aloeflora Aloe Calendula Moisturizing Soap" [level=3] [ref=e56]
                - paragraph [ref=e57]: Handcrafted natural herbal bath bar blending anti-inflammatory Calendula flowers with cold-pressed olive oils and high-purity aloe soap base. Gently regenerates dry, sensitive, or eczema-prone skin.
                - generic [ref=e58]:
                  - button "Instant Add" [ref=e59] [cursor=pointer]:
                    - img [ref=e60]
                    - text: Instant Add
                  - button "Full specs" [ref=e64] [cursor=pointer]:
                    - text: Full specs
                    - img [ref=e65]
            - button [ref=e67] [cursor=pointer]:
              - img [ref=e68]
            - button [ref=e70] [cursor=pointer]:
              - img [ref=e71]
          - generic [ref=e73]:
            - button [ref=e74] [cursor=pointer]
            - button [ref=e75] [cursor=pointer]
            - button [ref=e76] [cursor=pointer]
            - button [ref=e77] [cursor=pointer]
            - button [ref=e78] [cursor=pointer]
            - button [ref=e79] [cursor=pointer]
            - button [ref=e80] [cursor=pointer]
            - button [ref=e81] [cursor=pointer]
            - button [ref=e82] [cursor=pointer]
            - button [ref=e83] [cursor=pointer]
      - generic [ref=e84]:
        - generic [ref=e85]:
          - generic [ref=e86]:
            - text: Organic Formulations
            - heading "Active Product Catalog" [level=2] [ref=e87]
          - generic [ref=e88]:
            - generic [ref=e89]:
              - img [ref=e90]
              - textbox "Search items..." [ref=e93]
            - combobox [ref=e94]:
              - option "Default Sort" [selected]
              - 'option "Price: Low to High"'
              - 'option "Price: High to Low"'
              - option "Top Rated"
        - generic [ref=e95]:
          - button "All Items" [ref=e96] [cursor=pointer]
          - button "Hair Care" [ref=e97] [cursor=pointer]
          - button "Body Care" [ref=e98] [cursor=pointer]
          - button "Home Care" [ref=e99] [cursor=pointer]
        - generic [ref=e100]:
          - generic [ref=e101]:
            - button [ref=e102] [cursor=pointer]:
              - img [ref=e103]
            - img "Aloeflora Pure Aloe Vera Gel Shampoo" [ref=e106] [cursor=pointer]
            - generic [ref=e107]:
              - generic [ref=e108]:
                - generic [ref=e109]:
                  - generic [ref=e110]: Shampoos
                  - generic [ref=e111]:
                    - img [ref=e112]
                    - text: "4.8"
                - heading "Aloeflora Pure Aloe Vera Gel Shampoo" [level=3] [ref=e114] [cursor=pointer]
                - paragraph [ref=e115]: Formulated with 85% raw organic Aloe juice sourced from local Kenyan farms. Restores natural moisture, repairs damaged hair cuticles, and relieves dry, itchy scalp. Sulfate-free and color-safe.
              - generic [ref=e117]:
                - generic [ref=e118]:
                  - generic [ref=e119]: Kenyan Price
                  - generic [ref=e120]: KES 850
                - generic [ref=e121]:
                  - button "Compare specifications" [ref=e122] [cursor=pointer]:
                    - img [ref=e123]
                  - button [ref=e127] [cursor=pointer]:
                    - img [ref=e128]
          - generic [ref=e132]:
            - button [ref=e133] [cursor=pointer]:
              - img [ref=e134]
            - img "Aloeflora Hydrating Aloe & Avocado Conditioner" [ref=e137] [cursor=pointer]
            - generic [ref=e138]:
              - generic [ref=e139]:
                - generic [ref=e140]:
                  - generic [ref=e141]: Conditioners
                  - generic [ref=e142]:
                    - img [ref=e143]
                    - text: "4.9"
                - heading "Aloeflora Hydrating Aloe & Avocado Conditioner" [level=3] [ref=e145] [cursor=pointer]
                - paragraph [ref=e146]: An ultra-creamy deep conditioning treatment blending fresh avocado oil with concentrated aloe pulp. Delivers intense slip for easy detangling, preventing hair breakage during wash days.
              - generic [ref=e148]:
                - generic [ref=e149]:
                  - generic [ref=e150]: Kenyan Price
                  - generic [ref=e151]: KES 900
                - generic [ref=e152]:
                  - button "Compare specifications" [ref=e153] [cursor=pointer]:
                    - img [ref=e154]
                  - button [ref=e158] [cursor=pointer]:
                    - img [ref=e159]
          - generic [ref=e163]:
            - generic [ref=e165]: Low Stock
            - button [ref=e166] [cursor=pointer]:
              - img [ref=e167]
            - img "Aloeflora Aloe & Castor Growth Hair Oil" [ref=e170] [cursor=pointer]
            - generic [ref=e171]:
              - generic [ref=e172]:
                - generic [ref=e173]:
                  - generic [ref=e174]: Oils
                  - generic [ref=e175]:
                    - img [ref=e176]
                    - text: "4.7"
                - heading "Aloeflora Aloe & Castor Growth Hair Oil" [level=3] [ref=e178] [cursor=pointer]
                - paragraph [ref=e179]: A signature hair nutrient stimulant sealing ends, moisturizing roots, and stimulating rapid volume. Infused with black castor oil, herbal aloe peptides, and Kenyan peppermint oil.
              - generic [ref=e181]:
                - generic [ref=e182]:
                  - generic [ref=e183]: Kenyan Price
                  - generic [ref=e184]: KES 1200
                - generic [ref=e185]:
                  - button "Compare specifications" [ref=e186] [cursor=pointer]:
                    - img [ref=e187]
                  - button [ref=e191] [cursor=pointer]:
                    - img [ref=e192]
          - generic [ref=e196]:
            - button [ref=e197] [cursor=pointer]:
              - img [ref=e198]
            - img "Aloeflora Nourishing Herbal Growth Cream" [ref=e201] [cursor=pointer]
            - generic [ref=e202]:
              - generic [ref=e203]:
                - generic [ref=e204]:
                  - generic [ref=e205]: Hair Creams
                  - generic [ref=e206]:
                    - img [ref=e207]
                    - text: "4.6"
                - heading "Aloeflora Nourishing Herbal Growth Cream" [level=3] [ref=e209] [cursor=pointer]
                - paragraph [ref=e210]: Daily leave-in hydration styling butter containing shea butter, wild aloe leaf infusion, and hibiscus extract. Holds moisture for up to 72 hours, excellent for twists, braids, and blowouts.
              - generic [ref=e212]:
                - generic [ref=e213]:
                  - generic [ref=e214]: Kenyan Price
                  - generic [ref=e215]: KES 950
                - generic [ref=e216]:
                  - button "Compare specifications" [ref=e217] [cursor=pointer]:
                    - img [ref=e218]
                  - button [ref=e222] [cursor=pointer]:
                    - img [ref=e223]
          - generic [ref=e227]:
            - button [ref=e228] [cursor=pointer]:
              - img [ref=e229]
            - img "Aloeflora Aloe Calendula Moisturizing Soap" [ref=e232] [cursor=pointer]
            - generic [ref=e233]:
              - generic [ref=e234]:
                - generic [ref=e235]:
                  - generic [ref=e236]: Soaps
                  - generic [ref=e237]:
                    - img [ref=e238]
                    - text: "4.8"
                - heading "Aloeflora Aloe Calendula Moisturizing Soap" [level=3] [ref=e240] [cursor=pointer]
                - paragraph [ref=e241]: Handcrafted natural herbal bath bar blending anti-inflammatory Calendula flowers with cold-pressed olive oils and high-purity aloe soap base. Gently regenerates dry, sensitive, or eczema-prone skin.
              - generic [ref=e243]:
                - generic [ref=e244]:
                  - generic [ref=e245]: Kenyan Price
                  - generic [ref=e246]: KES 350
                - generic [ref=e247]:
                  - button "Compare specifications" [ref=e248] [cursor=pointer]:
                    - img [ref=e249]
                  - button [ref=e253] [cursor=pointer]:
                    - img [ref=e254]
          - generic [ref=e258]:
            - button [ref=e259] [cursor=pointer]:
              - img [ref=e260]
            - img "Aloeflora Ultra-Shea Hydrating Body Lotion" [ref=e263] [cursor=pointer]
            - generic [ref=e264]:
              - generic [ref=e265]:
                - generic [ref=e266]:
                  - generic [ref=e267]: Lotions
                  - generic [ref=e268]:
                    - img [ref=e269]
                    - text: "4.7"
                - heading "Aloeflora Ultra-Shea Hydrating Body Lotion" [level=3] [ref=e271] [cursor=pointer]
                - paragraph [ref=e272]: Intense deep restoration body moisturizer infused with cold-pressed cocoa butter, multi-vitamin aloe concentrate, and Kenyan macadamia seed oils. Absorbs fast with a velvety premium finish.
              - generic [ref=e274]:
                - generic [ref=e275]:
                  - generic [ref=e276]: Kenyan Price
                  - generic [ref=e277]: KES 750
                - generic [ref=e278]:
                  - button "Compare specifications" [ref=e279] [cursor=pointer]:
                    - img [ref=e280]
                  - button [ref=e284] [cursor=pointer]:
                    - img [ref=e285]
          - generic [ref=e289]:
            - button [ref=e290] [cursor=pointer]:
              - img [ref=e291]
            - img "Aloeflora Calming Lavender Aloe Body Oil" [ref=e294] [cursor=pointer]
            - generic [ref=e295]:
              - generic [ref=e296]:
                - generic [ref=e297]:
                  - generic [ref=e298]: Body Oils
                  - generic [ref=e299]:
                    - img [ref=e300]
                    - text: "4.9"
                - heading "Aloeflora Calming Lavender Aloe Body Oil" [level=3] [ref=e302] [cursor=pointer]
                - paragraph [ref=e303]: Luxurious dry body glow oil soothing muscles and locking in hydration after showers. Features organic aloe juice and french lavender buds, ideal for relaxing body therapies.
              - generic [ref=e305]:
                - generic [ref=e306]:
                  - generic [ref=e307]: Kenyan Price
                  - generic [ref=e308]: KES 1100
                - generic [ref=e309]:
                  - button "Compare specifications" [ref=e310] [cursor=pointer]:
                    - img [ref=e311]
                  - button [ref=e315] [cursor=pointer]:
                    - img [ref=e316]
          - generic [ref=e320]:
            - button [ref=e321] [cursor=pointer]:
              - img [ref=e322]
            - img "Aloeflora Aloe Mint Refining Exfoliating Scrub" [ref=e325] [cursor=pointer]
            - generic [ref=e326]:
              - generic [ref=e327]:
                - generic [ref=e328]:
                  - generic [ref=e329]: Scrubs
                  - generic [ref=e330]:
                    - img [ref=e331]
                    - text: "4.5"
                - heading "Aloeflora Aloe Mint Refining Exfoliating Scrub" [level=3] [ref=e333] [cursor=pointer]
                - paragraph [ref=e334]: Revitalizing face and body micro-exfoliant made from crushed walnut shells, fine sugar crystals, concentrated aloe extract, and spearmint essential oil. Buffs dry skin to reveal polished radiance.
              - generic [ref=e336]:
                - generic [ref=e337]:
                  - generic [ref=e338]: Kenyan Price
                  - generic [ref=e339]: KES 800
                - generic [ref=e340]:
                  - button "Compare specifications" [ref=e341] [cursor=pointer]:
                    - img [ref=e342]
                  - button [ref=e346] [cursor=pointer]:
                    - img [ref=e347]
          - generic [ref=e351]:
            - generic [ref=e353]: Low Stock
            - button [ref=e354] [cursor=pointer]:
              - img [ref=e355]
            - img "Aloeflora Aloe Vera Lavender Air Freshener" [ref=e358] [cursor=pointer]
            - generic [ref=e359]:
              - generic [ref=e360]:
                - generic [ref=e361]:
                  - generic [ref=e362]: Air Fresheners
                  - generic [ref=e363]:
                    - img [ref=e364]
                    - text: "4.6"
                - heading "Aloeflora Aloe Vera Lavender Air Freshener" [level=3] [ref=e366] [cursor=pointer]
                - paragraph [ref=e367]: Eco-friendly, water-based household room spray neutralizing heavy kitchen or bathroom odors instantly. Crafted with pure lavender hydrosol and organic aloe enzymes.
              - generic [ref=e369]:
                - generic [ref=e370]:
                  - generic [ref=e371]: Kenyan Price
                  - generic [ref=e372]: KES 500
                - generic [ref=e373]:
                  - button "Compare specifications" [ref=e374] [cursor=pointer]:
                    - img [ref=e375]
                  - button [ref=e379] [cursor=pointer]:
                    - img [ref=e380]
          - generic [ref=e384]:
            - button [ref=e385] [cursor=pointer]:
              - img [ref=e386]
            - img "Aloeflora Bio-Degradable Pine Multi-Cleaner" [ref=e389] [cursor=pointer]
            - generic [ref=e390]:
              - generic [ref=e391]:
                - generic [ref=e392]:
                  - generic [ref=e393]: Cleaning Products
                  - generic [ref=e394]:
                    - img [ref=e395]
                    - text: "4.8"
                - heading "Aloeflora Bio-Degradable Pine Multi-Cleaner" [level=3] [ref=e397] [cursor=pointer]
                - paragraph [ref=e398]: A tough, concentrated natural surface disinfectant stripping kitchen grease and floor grime with the power of pine needles oil, citrus extracts, and natural saponified aloe. No harsh chemical gases.
              - generic [ref=e400]:
                - generic [ref=e401]:
                  - generic [ref=e402]: Kenyan Price
                  - generic [ref=e403]: KES 650
                - generic [ref=e404]:
                  - button "Compare specifications" [ref=e405] [cursor=pointer]:
                    - img [ref=e406]
                  - button [ref=e410] [cursor=pointer]:
                    - img [ref=e411]
      - generic [ref=e415]:
        - generic [ref=e416]:
          - generic [ref=e417]:
            - generic [ref=e418]:
              - text: Wellness Promotion
              - heading "Kenyan Organic Expos & Farm Walks" [level=3] [ref=e419]
            - img [ref=e420]
          - generic [ref=e422]:
            - generic [ref=e423]:
              - generic [ref=e424]:
                - generic [ref=e425]:
                  - img "Aloeflora Natural Hair, Body & Wellness Expo 2026" [ref=e426]
                  - generic [ref=e427]: 2026-07-12
                - generic [ref=e428]:
                  - heading "Aloeflora Natural Hair, Body & Wellness Expo 2026" [level=4] [ref=e429]
                  - generic [ref=e430]:
                    - img [ref=e431]
                    - text: KICC Amphitheatre, Nairobi
                  - paragraph [ref=e434]: Join ALOEFLORA specialists for an immersive full-day skin analysis and curl textures workshop. Bring home absolute organic wellness formulations, enjoy free Kenya tea, organic foods, and product customisation booths.
              - generic [ref=e435]:
                - generic [ref=e436]: "Remaining slots: 108"
                - button "Register Seat" [ref=e437] [cursor=pointer]
            - generic [ref=e438]:
              - generic [ref=e439]:
                - generic [ref=e440]:
                  - img "Kenyan Herb Harvest Farm Tour" [ref=e441]
                  - generic [ref=e442]: 2026-08-05
                - generic [ref=e443]:
                  - heading "Kenyan Herb Harvest Farm Tour" [level=4] [ref=e444]
                  - generic [ref=e445]:
                    - img [ref=e446]
                    - text: Aloeflora Botanical Plot, Limuru
                  - paragraph [ref=e449]: An exclusive educational morning walk through the high-density green fields of Limuru where we grow over 15 distinct natural sub-species of Aloe vera under absolute sustainable agroforestry.
              - generic [ref=e450]:
                - generic [ref=e451]: "Remaining slots: 2"
                - button "Register Seat" [ref=e452] [cursor=pointer]
        - generic [ref=e453]:
          - generic [ref=e454]:
            - heading "Enterprise Contacts" [level=4] [ref=e456]
            - paragraph [ref=e457]: "For enquiries, custom partnerships & stock queries:"
            - generic [ref=e458]:
              - generic [ref=e459]:
                - img [ref=e461]
                - generic [ref=e464]:
                  - generic [ref=e465]: Email Address
                  - link "obondodoris@gmail.com" [ref=e466] [cursor=pointer]:
                    - /url: mailto:obondodoris@gmail.com
              - generic [ref=e467]:
                - img [ref=e469]
                - generic [ref=e471]:
                  - generic [ref=e472]: Hotline Phone
                  - link "+254 702 283 637" [ref=e473] [cursor=pointer]:
                    - /url: tel:+254702283637
              - generic [ref=e474]:
                - img [ref=e476]
                - generic [ref=e479]:
                  - generic [ref=e480]: Social Accounts
                  - generic [ref=e481]:
                    - link "Instagram" [ref=e482] [cursor=pointer]:
                      - /url: https://www.instagram.com/aloefloraproducts?igsh=YzljYTk1ODg3Zg==
                    - generic [ref=e483]: "|"
                    - link "Facebook" [ref=e484] [cursor=pointer]:
                      - /url: https://www.facebook.com/aloefloraproducts
          - generic [ref=e485]:
            - heading "Customer FAQs" [level=4] [ref=e486]
            - group [ref=e488]:
              - generic "Which product matches 4C natural coils? +" [ref=e489] [cursor=pointer]:
                - generic [ref=e490]: Which product matches 4C natural coils?
                - generic [ref=e491]: +
      - button [ref=e493] [cursor=pointer]:
        - img [ref=e494]
  - contentinfo [ref=e497]:
    - generic [ref=e498]:
      - generic [ref=e499]:
        - generic [ref=e500]:
          - generic [ref=e501]:
            - generic [ref=e502]: A
            - generic [ref=e503]: ALOEFLORA
          - paragraph [ref=e504]:
            - text: Quality, Affordable & Natural Products.
            - text: Locally sourced. Zero toxic components. Pure, intense hydration for Kenyan curls and skin.
        - generic [ref=e505]:
          - heading "Quick Links" [level=4] [ref=e506]
          - list [ref=e507]:
            - listitem [ref=e508]:
              - button "Shop Products" [ref=e509]
            - listitem [ref=e510]:
              - link "Events & Workshops" [ref=e511] [cursor=pointer]:
                - /url: "#events-marketing-section"
            - listitem [ref=e512]:
              - button "Track Order" [ref=e513]
            - listitem [ref=e514]:
              - button "Return Policy" [ref=e515]
        - generic [ref=e516]:
          - heading "Contact Info" [level=4] [ref=e517]
          - list [ref=e518]:
            - listitem [ref=e519]:
              - img [ref=e520]
              - generic [ref=e523]: Nairobi CBD Depot, Kenya
            - listitem [ref=e524]:
              - img [ref=e525]
              - link "+254 702 283 637" [ref=e527] [cursor=pointer]:
                - /url: tel:+254702283637
            - listitem [ref=e528]:
              - img [ref=e529]
              - link "obondodoris@gmail.com" [ref=e532] [cursor=pointer]:
                - /url: mailto:obondodoris@gmail.com
        - generic [ref=e533]:
          - heading "Social Media" [level=4] [ref=e534]
          - generic [ref=e535]:
            - link "IG" [ref=e536] [cursor=pointer]:
              - /url: https://www.instagram.com/aloefloraproducts?igsh=YzljYTk1ODg3Zg==
              - generic [ref=e537]: IG
            - link "FB" [ref=e538] [cursor=pointer]:
              - /url: https://www.facebook.com/aloefloraproducts
              - generic [ref=e539]: FB
            - link "WA" [ref=e540] [cursor=pointer]:
              - /url: https://wa.me/254702283637
              - generic [ref=e541]: WA
      - generic [ref=e542]:
        - generic [ref=e543]: © 2026 ALOEFLORA Kenya. All rights reserved.
        - generic [ref=e544]:
          - generic [ref=e545]: "DB ENGINE: PostgreSQL RLS"
          - generic [ref=e546]: •
          - generic [ref=e547]: "SSL TRG: AES_256_GCM"
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
  11 |   await expect(storeTab).toBeVisible();
  12 | });
  13 | 
  14 | test('can navigate to admin console', async ({ page }) => {
  15 |   await page.goto('/');
  16 |   
  17 |   // Click admin console tab
  18 |   const adminTab = page.locator('button:has-text("Consolidated Admin Console")');
> 19 |   await adminTab.click();
     |                  ^ Error: locator.click: Test timeout of 30000ms exceeded.
  20 |   
  21 |   // Check role indicator
  22 |   await expect(page.locator('text=Role: Admin')).toBeVisible();
  23 | });
  24 | 
```