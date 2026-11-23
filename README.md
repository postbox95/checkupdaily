# PriceScan BD

## PROJECT TITLE
Niramoy Prices (Working Title) — Diagnostic Test Price Aggregator & Multi-Lab Cart Comparison Engine for Bangladesh.

---

## 1. PRODUCT VISION & EXECUTIVE DIRECTIVE
Build a high-performance, ultra-responsive medical test price comparison engine designed specifically for Bangladeshi healthcare consumers. 

Doctors in Bangladesh frequently prescribe multiple tests simultaneously (e.g., CBC + Lipid Profile + HbA1c + USG). Patients face opaque, fragmented pricing across chains (e.g., Popular, Labaid, Ibn Sina, Praava, Medinova). 

Your goal is to build:
1. **Phase 1 (MVP):** A fast, localized search engine to compare single and multi-test pricing across diagnostic centers in Dhaka.
2. **Phase 2 (Selected Feature):** A "Prescription Cart" calculation engine that dynamically aggregates and compares the total bill across different labs, accounting for mandatory fees (needle/tube charges) and distance metrics.

---

## 2. BANGLADESHI MARKET LOCALIZATION & DOMAIN-SPECIFIC LOGIC

The system must handle domain nuances unique to the Bangladeshi medical ecosystem:

### A. Dual-Language & Medical Vocabulary Standard (Banglish / Medical Synonyms)
*   **Medical vs. Common Search Terms:** Patients search using casual terms, abbreviated doctor shorthand, or Bengali phonetic English ("Banglish").
    *   *Examples:* `Thrust` or `Sardi` -> Suggest `CBC` or `CRP`.
    *   *Abbreviation Synonyms:* `RBS` / `FBS` / `2hrs ABF` -> Sugar tests. `ECHO` -> `Echocardiogram`. `USG` -> `Ultrasonography`.
    *   *Bilingual Engine:* Support simultaneous Bangla script (যেমন: "রক্ত পরীক্ষা", "আল্ট্রাসোনোগ্রাফি") and English / Medical shorthand indexing.

### B. Bangladesh Price Structure Realities
*   **Hidden Fees (Crucial Rule):** In BD, diagnostic centers add ancillary fees per visit.
    *   *Needle / Sample Tube / Syringe Fee:* ৳50 - ৳150 (Popular adds ৳110-৳230 as 'Needle, Tube & Reg. Charges').
    *   *Contrast / Agent Charge:* Radiology (CT/MRI) often lists base test costs, excluding contrast medium.
    *   *Data Schema Requirement:* The database MUST distinguish `base_price` from `mandatory_incidental_fee` (needle/reg charges) so the cart calculation displays the *true total out-of-pocket cost*.

### C. Hyper-Local Geographic Hierarchy
*   Structure location data strictly around BD urban geography:
    *   `City` (e.g., Dhaka) -> `Thana / Zone` (e.g., Dhanmondi, Panthapath, Mirpur-10, Uttara Sector 3, Chawkbazar) -> `Cluster/Road` (e.g., Green Road Medical Hub).
    *   Many labs (e.g., Popular Dhanmondi) have multiple units (Unit 1, Unit 2) on the same street. Store exact latitude/longitude coordinates to measure true user distance.

---

## 3. UI/UX REQUIREMENTS: MODERN, EMPOWERING & COOPERATIVE

### A. Visual Aesthetics & Theme
*   **Vibe:** Modern "Health-Tech Meets Clean Fintech." Clean, authoritative, reassuring, non-intimidating.
*   **Palette:**
    *   Primary: Deep Clinical Teal (`#0D9488` or `#0F766E`) — conveys trust.
    *   Secondary/Accents: Energetic Emerald (`#10B981`) for savings/discounts; Warm Amber/Coral (`#F59E0B`) for warnings/notes.
    *   Background: Crisp Soft Off-White (`#F8FAFC`).
*   **Typography:** Inter or Plus Jakarta Sans for English; Hind Siliguri or Noto Sans Bengali for Bangla text. Ensure zero layout shift when toggling languages.

### B. Modern & Cooperative UX Patterns
1.  **Zero-Latency Instant Search (Command-K Style):**
    *   Search input on the hero section must act as a global command palette with instant debounced suggestions (<100ms response).
    *   Highlight key test metadata in auto-complete (e.g., *"Fasting Required: 8-12 hrs"* or *"Report Delivery: Same Day"*).
2.  **Mobile-First Bottom Sheets:**
    *   Over 80% of BD traffic will be mobile (smartphones). Use bottom sheets for filters, location selection, and prescription cart summaries instead of jarring full-screen modals.
3.  **Cooperative Guidance Micro-Copy:**
    *   If a user adds mutually redundant tests (e.g., adding both `RBS` and `Random Blood Sugar`), render a helpful inline toast: *"Note: These appear to be the same test. Did you mean Fasting Blood Sugar?"*

---

## 4. TECHNICAL ARCHITECTURE & DATA SCHEMAS

### Recommended Stack
*   **Frontend:** Next.js (App Router, React 19), Tailwind CSS, Shadcn UI, Framer Motion (for smooth micro-interactions), Lucide Icons.
*   **State Management:** Zustand (for persistent cart, localized location, and filter state).
*   **Backend / DB:** PostgreSQL (via Supabase or Prisma) with `pgvector` or Algolia/Meilisearch for fuzzy medical search.

### Database Schema (PostgreSQL Prisma Model Syntax)

```prisma
enum TestCategory {
  PATHOLOGY
  RADIOLOGY
  CARDIOLOGY
  ENDOSCOPY
  OTHER
}

model DiagnosticCenter {
  id               String      @id @default(uuid())
  name             String      // e.g. "Popular Diagnostic Centre"
  branchName       String      // e.g. "Dhanmondi Branch (Unit 1)"
  thana            String      // e.g. "Dhanmondi"
  city             String      @default("Dhaka")
  address          String
  latitude         Float
  longitude        Float
  contactPhone     String?
  sampleCollectionFee Float    @default(0.0) // Needle/Tube/Registration Charge
  homeSampleAvailable Boolean  @default(false)
  updatedAt        DateTime    @updatedAt

  prices           TestPrice[]
}

model MedicalTest {
  id               String       @id @default(uuid())
  canonicalName    String       // e.g. "Complete Blood Count (CBC)"
  banglaName       String?      // e.g. "কমপ্লিট ব্লাড কাউন্ট"
  code             String       @unique // e.g. "TEST-CBC"
  category         TestCategory
  synonyms         String[]     // ["CBC", "Hemoglobin", "TC DC ES", "রক্ত পরীক্ষা"]
  fastingRequired  Boolean      @default(false)
  fastingHours     Int?         // e.g. 8
  reportDeliveryHrs Int         @default(24)

  prices           TestPrice[]
}

model TestPrice {
  id                 String           @id @default(uuid())
  medicalTestId     String
  diagnosticCenterId String
  price              Float            // Base test price in BDT
  discountedPrice    Float?           // Promotional price if applicable
  notes              String?          // e.g. "Excludes Contrast Charge"
  isAvailable        Boolean          @default(true)
  
  medicalTest        MedicalTest      @relation(fields: [medicalTestId], references: [id])
  diagnosticCenter   DiagnosticCenter @relation(fields: [diagnosticCenterId], references: [id])

  @@unique([medicalTestId, diagnosticCenterId])
}
5. FEATURE BREAKDOWN & IMPLEMENTATION STEPS
PHASE 1: MVP (SEARCH, DISCOVERY & COMPARISON)
Step 1: Global Header & Hyper-Local Context Selector
UI Component: Sticky Header with Brand Logo, Language Toggle (EN | বাং), and Location Selector (Dhaka > Dhanmondi).

Behavior: Clicking location opens a bottom sheet/modal listing popular medical hubs in Dhaka (e.g., Dhanmondi, Panthapath, Green Road, Uttara, Mirpur, Mogbazar).

Store: Save selected area in LocalStorage/Zustand.

Step 2: High-Conversion Search Hero
UI: Prominent central search input with live typeahead.

Smart Auto-complete Engine:

Query matching must look through canonicalName, banglaName, and synonyms array.

Display matching category tags next to test names (e.g., CBC -> [Pathology], X-Ray Chest -> [Radiology]).

Action: Clicking a test redirects to /test/[code] OR adds directly to the Prescription Cart via a Quick-Add + button.

Step 3: Single Test Comparison Page (/test/[code])
Layout:

Header Section: Test Name, Bangla translation, Preparation Badge (e.g., ⚠️ 8-12 Hours Fasting Required), Typical Report Turnaround (⚡ Report in 12 hrs).

Filter Bar: Filter labs by Sub-area/Thana, Price: Low to High, Home Collection Available.

Comparison Cards/Table List:

Lab Name + Branch Location + Distance from selected area.

Base Price (৳) strike-through if discount active.

Mandatory Reg/Needle Charge breakdown tooltip.

Final Total Price highlighted in bold.

CTA: [ + Add to Prescription Cart ] and [ 📞 Call Lab ].

PHASE 2 (SELECTED FEATURE): THE "PRESCRIPTION CART" ENGINE
The "Prescription Cart" is the core differentiator. In BD, patients rarely get 1 test; they carry a physical prescription listing 3–8 tests.

Step 1: Multi-Test Cart Floating Bar & Drawer
UI Component: Persistent floating bar at the bottom right of the viewport: 🛒 Prescription Cart (X Tests) | View Savings ->.

Drawer Structure:

List of added tests with individual delete icons.

Cooperative UX Smart Warnings:

If cart contains a test requiring fasting (e.g., FBS, Lipid Profile), show a banner: "Includes fasting tests. Plan your morning visit accordingly."

CTA: [ Compare Multi-Lab Prices ].

Step 2: Multi-Lab Price Calculation Algorithm
When the user clicks "Compare Multi-Lab Prices", execute the multi-lab math algorithm on the client/server:

FOR EACH DiagnosticCenter (filtered by location/city):
  1. Initialize CenterTotal = Center.sampleCollectionFee (Add mandatory needle/reg fee once per lab visit)
  2. MissingTestsArray = []
  
  FOR EACH Test IN UserCart:
    IF Center offers Test AND Test.isAvailable:
      CenterTotal += TestPrice.discountedPrice OR TestPrice.price
    ELSE:
      Mark Test as Missing in MissingTestsArray
      
  OUTPUT CenterResult:
    - Center Name & Location
    - Total Cost (BDT)
    - Tests Covered Count (e.g., "5 of 5 tests available" or "4 of 5 tests available")
    - Missing Tests List (if any)
Step 3: Comparison View Presentation
Present cart calculation results using a modern grid/list view sorted by Lowest Combined Price:

Best Value Card (Highlighted Top Result):

Badge: 🏆 Lowest Total Bill

Lab Name + Address.

Itemized Price Breakdown Accordion:

Test 1 Cost: ৳400

Test 2 Cost: ৳1,400

Test 3 Cost: ৳600

Mandatory Needle/Registration Charge: ৳110

Total Out-of-Pocket Bill: ৳2,510

CTA: [ Print / Save Summary as PDF ] or [ Send to WhatsApp ].

Partial Availability Warning UI:

If Lab B has 4 out of 5 tests, display: "Lab B offers 4/5 tests for ৳2,100 (Missing: MRI Brain). Requires visiting a second lab for missing test."

Share / Print Utilities (High BD Utility):

Allow generating a clean, printable PDF / WhatsApp share link containing the user's test list and the lowest price comparison summary so they can show family members or decision-makers.

6. DELIVERABLES & EXPECTED CODE QUALITY
Clean Architecture: Strict TypeScript interfaces for all data structures.

Accessibility: ARIA labels on all interactive controls; smooth keyboard navigation for search dropdowns.

Performance Metrics: Lighthouse score > 90 on Mobile; Search query response < 100ms.

Data Seed File: Provide a mock JSON seed file containing at least 15 common medical tests (CBC, Lipid Profile, USG, ECG, Serum Creatinine, HbA1c) mapped across 5 major BD diagnostic chains (Popular, Labaid, Ibn Sina, Praava, Medinova) with realistic BDT pricing.

Execute Phase 1 and the Prescription Cart engine step-by-step according to this specification.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1deb2024-6a0e-4ada-ba58-9bf696be0a74).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
