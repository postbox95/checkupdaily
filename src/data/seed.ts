export type TestCategory =
  | "PATHOLOGY"
  | "RADIOLOGY"
  | "CARDIOLOGY"
  | "ENDOSCOPY"
  | "OTHER";

export interface DiagnosticCenter {
  id: string;
  name: string;
  branchName: string;
  thana: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  sampleCollectionFee: number;
  homeSampleAvailable: boolean;
}

export interface MedicalTest {
  id: string;
  canonicalName: string;
  banglaName: string;
  code: string;
  category: TestCategory;
  synonyms: string[];
  fastingRequired: boolean;
  fastingHours?: number;
  reportDeliveryHrs: number;
}

export interface TestPrice {
  id: string;
  medicalTestId: string;
  diagnosticCenterId: string;
  price: number;
  discountedPrice?: number;
  notes?: string;
  isAvailable: boolean;
}

export const THANAS = [
  "Dhanmondi",
  "Panthapath",
  "Green Road",
  "Mirpur-10",
  "Uttara Sector 3",
  "Mogbazar",
  "Shantinagar",
  "Bashundhara R/A",
] as const;

export const centers: DiagnosticCenter[] = [
  {
    id: "c1",
    name: "Popular Diagnostic Centre",
    branchName: "Dhanmondi Branch (Unit 1)",
    thana: "Dhanmondi",
    city: "Dhaka",
    address: "House 16, Road 2, Dhanmondi",
    latitude: 23.7461,
    longitude: 90.376,
    contactPhone: "+8809613787801",
    sampleCollectionFee: 110,
    homeSampleAvailable: true,
  },
  {
    id: "c2",
    name: "Popular Diagnostic Centre",
    branchName: "Shantinagar Branch (Unit 2)",
    thana: "Shantinagar",
    city: "Dhaka",
    address: "House 25, Chamelibagh, Shantinagar",
    latitude: 23.7396,
    longitude: 90.4111,
    contactPhone: "+8809613787802",
    sampleCollectionFee: 130,
    homeSampleAvailable: true,
  },
  {
    id: "c3",
    name: "Labaid Diagnostics",
    branchName: "Dhanmondi (Road 4)",
    thana: "Dhanmondi",
    city: "Dhaka",
    address: "House 6, Road 4, Dhanmondi",
    latitude: 23.7391,
    longitude: 90.3823,
    contactPhone: "+8801766662001",
    sampleCollectionFee: 150,
    homeSampleAvailable: true,
  },
  {
    id: "c4",
    name: "Labaid Diagnostics",
    branchName: "Uttara Branch",
    thana: "Uttara Sector 3",
    city: "Dhaka",
    address: "House 1, Road 7, Sector 3, Uttara",
    latitude: 23.8697,
    longitude: 90.3968,
    contactPhone: "+8801766662002",
    sampleCollectionFee: 150,
    homeSampleAvailable: false,
  },
  {
    id: "c5",
    name: "Ibn Sina Diagnostic Centre",
    branchName: "Green Road Unit",
    thana: "Green Road",
    city: "Dhaka",
    address: "House 68, Green Road, Dhanmondi",
    latitude: 23.7513,
    longitude: 90.3841,
    contactPhone: "+8801717351631",
    sampleCollectionFee: 100,
    homeSampleAvailable: true,
  },
  {
    id: "c6",
    name: "Ibn Sina Diagnostic Centre",
    branchName: "Mirpur-10 Unit",
    thana: "Mirpur-10",
    city: "Dhaka",
    address: "Plot 22, Block C, Mirpur-10",
    latitude: 23.8069,
    longitude: 90.3687,
    contactPhone: "+8801717351632",
    sampleCollectionFee: 90,
    homeSampleAvailable: true,
  },
  {
    id: "c7",
    name: "Praava Health",
    branchName: "Banani Family Health Centre",
    thana: "Bashundhara R/A",
    city: "Dhaka",
    address: "Block E, Bashundhara R/A",
    latitude: 23.8151,
    longitude: 90.4258,
    contactPhone: "+8801088888",
    sampleCollectionFee: 200,
    homeSampleAvailable: true,
  },
  {
    id: "c8",
    name: "Medinova Medical Services",
    branchName: "Panthapath Branch",
    thana: "Panthapath",
    city: "Dhaka",
    address: "House 71/A, Panthapath",
    latitude: 23.7514,
    longitude: 90.3899,
    contactPhone: "+8809666787801",
    sampleCollectionFee: 120,
    homeSampleAvailable: false,
  },
  {
    id: "c9",
    name: "Medinova Medical Services",
    branchName: "Mogbazar Branch",
    thana: "Mogbazar",
    city: "Dhaka",
    address: "Outer Circular Road, Mogbazar",
    latitude: 23.7477,
    longitude: 90.4062,
    contactPhone: "+8809666787802",
    sampleCollectionFee: 120,
    homeSampleAvailable: true,
  },
];

export const tests: MedicalTest[] = [
  {
    id: "t1",
    canonicalName: "Complete Blood Count (CBC)",
    banglaName: "সম্পূর্ণ রক্ত পরীক্ষা",
    code: "TEST-CBC",
    category: "PATHOLOGY",
    synonyms: ["CBC", "CBC with ESR", "TC DC ESR", "blood test", "rokto porikkha", "রক্ত পরীক্ষা", "sardi", "jor"],
    fastingRequired: false,
    reportDeliveryHrs: 6,
  },
  {
    id: "t2",
    canonicalName: "Lipid Profile",
    banglaName: "লিপিড প্রোফাইল",
    code: "TEST-LIPID",
    category: "PATHOLOGY",
    synonyms: ["lipid", "cholesterol", "TG HDL LDL", "cholesterol test", "চর্বি পরীক্ষা"],
    fastingRequired: true,
    fastingHours: 12,
    reportDeliveryHrs: 12,
  },
  {
    id: "t3",
    canonicalName: "HbA1c (Glycated Haemoglobin)",
    banglaName: "এইচবিএ১সি",
    code: "TEST-HBA1C",
    category: "PATHOLOGY",
    synonyms: ["HbA1c", "A1c", "3 months sugar", "diabetes test", "ডায়াবেটিস পরীক্ষা"],
    fastingRequired: false,
    reportDeliveryHrs: 24,
  },
  {
    id: "t4",
    canonicalName: "Fasting Blood Sugar (FBS)",
    banglaName: "খালি পেটে রক্তের সুগার",
    code: "TEST-FBS",
    category: "PATHOLOGY",
    synonyms: ["FBS", "fasting sugar", "khali pete sugar", "সুগার", "glucose fasting"],
    fastingRequired: true,
    fastingHours: 8,
    reportDeliveryHrs: 4,
  },
  {
    id: "t5",
    canonicalName: "Random Blood Sugar (RBS)",
    banglaName: "যেকোনো সময়ের রক্তের সুগার",
    code: "TEST-RBS",
    category: "PATHOLOGY",
    synonyms: ["RBS", "random sugar", "2hrs ABF", "sugar test", "সুগার টেস্ট"],
    fastingRequired: false,
    reportDeliveryHrs: 4,
  },
  {
    id: "t6",
    canonicalName: "Serum Creatinine",
    banglaName: "সিরাম ক্রিয়েটিনিন",
    code: "TEST-CREAT",
    category: "PATHOLOGY",
    synonyms: ["creatinine", "S. Creatinine", "kidney test", "কিডনি পরীক্ষা"],
    fastingRequired: false,
    reportDeliveryHrs: 6,
  },
  {
    id: "t7",
    canonicalName: "Serum TSH",
    banglaName: "সিরাম টিএসএইচ",
    code: "TEST-TSH",
    category: "PATHOLOGY",
    synonyms: ["TSH", "thyroid", "থাইরয়েড"],
    fastingRequired: false,
    reportDeliveryHrs: 24,
  },
  {
    id: "t8",
    canonicalName: "C-Reactive Protein (CRP)",
    banglaName: "সি-রিঅ্যাকটিভ প্রোটিন",
    code: "TEST-CRP",
    category: "PATHOLOGY",
    synonyms: ["CRP", "inflammation", "thrust", "sardi jor", "সর্দি জ্বর"],
    fastingRequired: false,
    reportDeliveryHrs: 8,
  },
  {
    id: "t9",
    canonicalName: "Urine R/M/E",
    banglaName: "প্রস্রাব পরীক্ষা",
    code: "TEST-URINE",
    category: "PATHOLOGY",
    synonyms: ["urine", "R/M/E", "urine test", "prosrab porikkha", "প্রস্রাব"],
    fastingRequired: false,
    reportDeliveryHrs: 6,
  },
  {
    id: "t10",
    canonicalName: "SGPT (ALT)",
    banglaName: "এসজিপিটি",
    code: "TEST-SGPT",
    category: "PATHOLOGY",
    synonyms: ["SGPT", "ALT", "liver test", "লিভার পরীক্ষা"],
    fastingRequired: false,
    reportDeliveryHrs: 8,
  },
  {
    id: "t11",
    canonicalName: "Ultrasonography of Whole Abdomen (USG)",
    banglaName: "আল্ট্রাসনোগ্রাফি (পুরো পেট)",
    code: "TEST-USG-ABD",
    category: "RADIOLOGY",
    synonyms: ["USG", "ultrasound", "ultrasonography", "আল্ট্রাসনোগ্রাফি", "pete ultrasound"],
    fastingRequired: true,
    fastingHours: 6,
    reportDeliveryHrs: 3,
  },
  {
    id: "t12",
    canonicalName: "X-Ray Chest P/A View",
    banglaName: "বুকের এক্স-রে",
    code: "TEST-XRAY-CHEST",
    category: "RADIOLOGY",
    synonyms: ["x-ray", "chest x ray", "CXR", "এক্স-রে"],
    fastingRequired: false,
    reportDeliveryHrs: 3,
  },
  {
    id: "t13",
    canonicalName: "ECG (Electrocardiogram)",
    banglaName: "ইসিজি",
    code: "TEST-ECG",
    category: "CARDIOLOGY",
    synonyms: ["ECG", "EKG", "heart test", "হৃদপিণ্ড পরীক্ষা"],
    fastingRequired: false,
    reportDeliveryHrs: 1,
  },
  {
    id: "t14",
    canonicalName: "Echocardiogram (Colour Doppler)",
    banglaName: "ইকোকার্ডিওগ্রাম",
    code: "TEST-ECHO",
    category: "CARDIOLOGY",
    synonyms: ["ECHO", "echocardiography", "heart echo", "ইকো"],
    fastingRequired: false,
    reportDeliveryHrs: 4,
  },
  {
    id: "t15",
    canonicalName: "CT Scan of Brain",
    banglaName: "ব্রেইন সিটি স্ক্যান",
    code: "TEST-CT-BRAIN",
    category: "RADIOLOGY",
    synonyms: ["CT", "CT scan", "brain CT", "সিটি স্ক্যান"],
    fastingRequired: false,
    reportDeliveryHrs: 12,
  },
  {
    id: "t16",
    canonicalName: "MRI of Brain",
    banglaName: "ব্রেইন এমআরআই",
    code: "TEST-MRI-BRAIN",
    category: "RADIOLOGY",
    synonyms: ["MRI", "brain MRI", "এমআরআই"],
    fastingRequired: false,
    reportDeliveryHrs: 24,
  },
  {
    id: "t17",
    canonicalName: "Upper GI Endoscopy",
    banglaName: "এন্ডোস্কপি",
    code: "TEST-ENDO",
    category: "ENDOSCOPY",
    synonyms: ["endoscopy", "UGI endoscopy", "এন্ডোস্কপি"],
    fastingRequired: true,
    fastingHours: 8,
    reportDeliveryHrs: 2,
  },
];

// Base BDT price per test, then a per-chain multiplier for realistic variance.
const basePrices: Record<string, number> = {
  "TEST-CBC": 400,
  "TEST-LIPID": 1200,
  "TEST-HBA1C": 1100,
  "TEST-FBS": 180,
  "TEST-RBS": 180,
  "TEST-CREAT": 500,
  "TEST-TSH": 900,
  "TEST-CRP": 900,
  "TEST-URINE": 300,
  "TEST-SGPT": 450,
  "TEST-USG-ABD": 1400,
  "TEST-XRAY-CHEST": 500,
  "TEST-ECG": 300,
  "TEST-ECHO": 2000,
  "TEST-CT-BRAIN": 5000,
  "TEST-MRI-BRAIN": 9000,
  "TEST-ENDO": 3500,
};

const chainFactor: Record<string, number> = {
  c1: 1.0,
  c2: 1.05,
  c3: 1.15,
  c4: 1.12,
  c5: 0.92,
  c6: 0.88,
  c7: 1.35,
  c8: 0.97,
  c9: 0.95,
};

// Tests that a given centre simply does not offer (realistic capability gaps).
const unavailable: Record<string, string[]> = {
  c6: ["TEST-MRI-BRAIN", "TEST-ENDO"],
  c8: ["TEST-MRI-BRAIN", "TEST-CT-BRAIN"],
  c9: ["TEST-ECHO", "TEST-MRI-BRAIN"],
  c7: ["TEST-ENDO"],
  c4: ["TEST-CT-BRAIN"],
  c2: ["TEST-MRI-BRAIN"],
};

const discounted: Record<string, string[]> = {
  c1: ["TEST-LIPID", "TEST-CBC"],
  c5: ["TEST-USG-ABD", "TEST-HBA1C"],
  c9: ["TEST-CBC"],
  c3: ["TEST-ECHO"],
};

const round = (n: number) => Math.round(n / 10) * 10;

export const prices: TestPrice[] = centers.flatMap((center) =>
  tests
    .filter((test) => !(unavailable[center.id] ?? []).includes(test.code))
    .map((test) => {
      const price = round(basePrices[test.code] * chainFactor[center.id]);
      const hasDiscount = (discounted[center.id] ?? []).includes(test.code);
      return {
        id: `${center.id}-${test.id}`,
        medicalTestId: test.id,
        diagnosticCenterId: center.id,
        price,
        discountedPrice: hasDiscount ? round(price * 0.85) : undefined,
        notes:
          test.code === "TEST-CT-BRAIN" || test.code === "TEST-MRI-BRAIN"
            ? "Excludes contrast medium charge"
            : undefined,
        isAvailable: true,
      } satisfies TestPrice;
    }),
);

export const testByCode = (code: string) => tests.find((t) => t.code === code);
export const testById = (id: string) => tests.find((t) => t.id === id);
export const centerById = (id: string) => centers.find((c) => c.id === id);

export const pricesForTest = (testId: string) =>
  prices.filter((p) => p.medicalTestId === testId && p.isAvailable);

export const effectivePrice = (p: TestPrice) => p.discountedPrice ?? p.price;

export const thanaCoords: Record<string, { lat: number; lng: number }> = {
  Dhanmondi: { lat: 23.7461, lng: 90.376 },
  Panthapath: { lat: 23.7514, lng: 90.3899 },
  "Green Road": { lat: 23.7513, lng: 90.3841 },
  "Mirpur-10": { lat: 23.8069, lng: 90.3687 },
  "Uttara Sector 3": { lat: 23.8697, lng: 90.3968 },
  Mogbazar: { lat: 23.7477, lng: 90.4062 },
  Shantinagar: { lat: 23.7396, lng: 90.4111 },
  "Bashundhara R/A": { lat: 23.8151, lng: 90.4258 },
};

export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
}
