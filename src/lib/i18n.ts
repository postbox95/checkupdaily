import type { Lang } from "./store";

type Dict = Record<string, { en: string; bn: string }>;

const dict: Dict = {
  brand: { en: "CheckUp Daily", bn: "চেকআপ ডেইলি" },
  tagline: {
    en: "Compare diagnostic test prices across Dhaka",
    bn: "ঢাকার ডায়াগনস্টিক টেস্টের দাম তুলনা করুন",
  },
  heroTitle: {
    en: "Know the real price before you go",
    bn: "যাওয়ার আগেই আসল দাম জেনে নিন",
  },
  heroSub: {
    en: "Search any test in English, Bangla or doctor's shorthand. We show base price plus the needle, tube & registration charges — the true out-of-pocket bill.",
    bn: "ইংরেজি, বাংলা বা ডাক্তারের সংক্ষিপ্ত নামে যেকোনো টেস্ট খুঁজুন। বেস প্রাইসের সাথে নিডল, টিউব ও রেজিস্ট্রেশন চার্জসহ প্রকৃত খরচ দেখাই।",
  },
  searchPlaceholder: {
    en: "Try CBC, USG, লিপিড, RBS, echo…",
    bn: "লিখুন: সিবিসি, আল্ট্রাসনোগ্রাফি, সুগার…",
  },
  cart: { en: "Prescription Cart", bn: "প্রেসক্রিপশন কার্ট" },
  compare: { en: "Compare Multi-Lab Prices", bn: "সব ল্যাবের দাম তুলনা করুন" },
  addToCart: { en: "Add to Prescription Cart", bn: "কার্টে যোগ করুন" },
  callLab: { en: "Call Lab", bn: "ল্যাবে কল করুন" },
  location: { en: "Location", bn: "এলাকা" },
  popularTests: { en: "Popular tests", bn: "জনপ্রিয় টেস্ট" },
  total: { en: "Total out-of-pocket bill", bn: "সর্বমোট খরচ" },
  fasting: { en: "Fasting required", bn: "খালি পেটে দিতে হবে" },
  noFasting: { en: "No fasting needed", bn: "খালি পেটের প্রয়োজন নেই" },
  regCharge: { en: "Needle, tube & registration", bn: "নিডল, টিউব ও রেজিস্ট্রেশন" },
  emptyCart: { en: "Your prescription cart is empty.", bn: "আপনার কার্ট খালি।" },
};

export const t = (key: keyof typeof dict, lang: Lang) => dict[key][lang];
export type TKey = keyof typeof dict;
