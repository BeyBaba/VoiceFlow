#!/usr/bin/env node
/**
 * VoiceFlow - LemonSqueezy Otomatik Setup
 *
 * Bu script Dashboard'da oluşturulan ürünlerin variant ID'lerini
 * otomatik bulup .env.local'a yazar.
 *
 * Kullanım: node scripts/setup-lemonsqueezy.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

// .env.local'dan API key ve Store ID oku
const envContent = fs.readFileSync(envPath, "utf-8");
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, "m"));
  return match ? match[1].trim() : null;
};

const API_KEY = getEnv("LEMONSQUEEZY_API_KEY");
const STORE_ID = getEnv("LEMONSQUEEZY_STORE_ID");

if (!API_KEY || API_KEY === "BURAYA_KOY") {
  console.error("❌ LEMONSQUEEZY_API_KEY .env.local'da bulunamadı!");
  process.exit(1);
}

const headers = {
  Accept: "application/vnd.api+json",
  "Content-Type": "application/vnd.api+json",
  Authorization: `Bearer ${API_KEY}`,
};

async function fetchAPI(endpoint) {
  const res = await fetch(`https://api.lemonsqueezy.com/v1${endpoint}`, { headers });
  return res.json();
}

async function main() {
  console.log("\n🍋 VoiceFlow LemonSqueezy Setup");
  console.log("================================\n");

  // 1. Store bilgisi
  console.log(`📦 Store ID: ${STORE_ID}`);

  // 2. Ürünleri listele
  const products = await fetchAPI(`/stores/${STORE_ID}/products`);

  if (!products.data || products.data.length === 0) {
    console.log("\n⚠️  Henüz ürün oluşturulmamış!");
    console.log("\n📋 Yapman gerekenler:");
    console.log("   1. https://app.lemonsqueezy.com → Products → + New Product");
    console.log('   2. Ürün 1: "VoiceFlow Pro" (Subscription)');
    console.log('      - Variant A: "Aylık" → ₺275/ay, tekrar: 1 ay');
    console.log('      - Variant B: "Yıllık" → ₺2.050/yıl, tekrar: 1 yıl');
    console.log('      - ✅ "Generate license keys" aç');
    console.log('   3. Ürün 2: "VoiceFlow Lifetime" (Single payment)');
    console.log("      - Fiyat: ₺5.100 tek sefer");
    console.log('      - ✅ "Generate license keys" aç');
    console.log("\n   Oluşturduktan sonra bu scripti tekrar çalıştır:");
    console.log("   node scripts/setup-lemonsqueezy.mjs\n");
    process.exit(0);
  }

  console.log(`\n✅ ${products.data.length} ürün bulundu:\n`);

  // 3. Her ürünün variant'larını bul
  let proMonthlyId = null;
  let proYearlyId = null;
  let lifetimeId = null;

  for (const product of products.data) {
    const name = product.attributes.name;
    const productId = product.id;
    console.log(`  📦 ${name} (ID: ${productId})`);

    // Variant'ları çek
    const variants = await fetchAPI(`/variants?filter[product_id]=${productId}`);

    for (const variant of variants.data || []) {
      const vName = variant.attributes.name;
      const vId = variant.id;
      const price = variant.attributes.price;
      const isSubscription = variant.attributes.is_subscription;
      const interval = variant.attributes.interval;

      console.log(`     └─ Variant: "${vName}" (ID: ${vId}) - ${price / 100} ${isSubscription ? `(${interval})` : "(tek sefer)"}`);

      // Otomatik eşleştir
      const nameLower = (name + " " + vName).toLowerCase();

      if (isSubscription && (nameLower.includes("aylık") || nameLower.includes("month") || interval === "month")) {
        proMonthlyId = vId;
      } else if (isSubscription && (nameLower.includes("yıllık") || nameLower.includes("year") || interval === "year")) {
        proYearlyId = vId;
      } else if (!isSubscription && (nameLower.includes("lifetime") || nameLower.includes("ömür"))) {
        lifetimeId = vId;
      }
    }
  }

  // Eşleşmemiş olanlar için ilk uygun variant'ı al
  if (!proMonthlyId || !proYearlyId || !lifetimeId) {
    console.log("\n⚠️  Bazı variant'lar otomatik eşleştirilemedi.");
    console.log("   Lütfen .env.local'daki ID'leri elle kontrol et.\n");
  }

  // 4. .env.local'ı güncelle
  let newEnv = envContent;

  if (proMonthlyId) {
    newEnv = newEnv.replace(/LEMONSQUEEZY_VARIANT_PRO_MONTHLY=.*/, `LEMONSQUEEZY_VARIANT_PRO_MONTHLY=${proMonthlyId}`);
    console.log(`\n  ✅ Pro Aylık: ${proMonthlyId}`);
  }
  if (proYearlyId) {
    newEnv = newEnv.replace(/LEMONSQUEEZY_VARIANT_PRO_YEARLY=.*/, `LEMONSQUEEZY_VARIANT_PRO_YEARLY=${proYearlyId}`);
    console.log(`  ✅ Pro Yıllık: ${proYearlyId}`);
  }
  if (lifetimeId) {
    newEnv = newEnv.replace(/LEMONSQUEEZY_VARIANT_LIFETIME=.*/, `LEMONSQUEEZY_VARIANT_LIFETIME=${lifetimeId}`);
    console.log(`  ✅ Lifetime: ${lifetimeId}`);
  }

  if (newEnv !== envContent) {
    fs.writeFileSync(envPath, newEnv, "utf-8");
    console.log("\n🎉 .env.local güncellendi! Dev server'ı yeniden başlat.\n");
  } else {
    console.log("\n📝 Değişiklik yapılmadı.\n");
  }
}

main().catch(console.error);
