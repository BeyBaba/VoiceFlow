"use client";

import { useI18n } from "@/i18n/context";
import Link from "next/link";

export default function PrivacyPage() {
  const { t } = useI18n();
  const p = t.privacy;

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200">
      {/* Header */}
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            VoiceFlow
          </Link>
          <Link href="/" className="text-sm text-teal-600 hover:underline">
            {p?.backHome || "Ana Sayfa"}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">{p?.title || "Gizlilik Politikasi"}</h1>
        <p className="text-sm text-stone-500 mb-10">{p?.lastUpdated || "Son guncelleme: 31 Mart 2026"}</p>

        <div className="space-y-8 text-stone-600 dark:text-stone-300 leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{p?.s1Title || "1. Genel Bakis"}</h2>
            <p>{p?.s1Text || "VoiceFlow, kullanicilarinin gizliligine buyuk onem verir. Bu politika, hangi verilerin toplandigini, nasil kullanildigini ve nasil korundugun aciklar."}</p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{p?.s2Title || "2. Toplanan Veriler"}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{p?.s2Item1 || "Hesap bilgileri (e-posta, kullanici adi)"}</li>
              <li>{p?.s2Item2 || "Ses verileri: Yalnizca metne donusturme islemi icin kullanilir, sunucularda saklanmaz"}</li>
              <li>{p?.s2Item3 || "Kullanim istatistikleri (anonim)"}</li>
              <li>{p?.s2Item4 || "Cihaz bilgileri (isletim sistemi, tarayici versiyonu)"}</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{p?.s3Title || "3. Verilerin Kullanimi"}</h2>
            <p>{p?.s3Text || "Toplanan veriler yalnizca hizmet kalitesini artirmak, kullanici deneyimini iyilestirmek ve teknik sorunlari gidermek icin kullanilir. Verileriniz ucuncu taraflarla paylasik veya satilmaz."}</p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{p?.s4Title || "4. Ses Verisi Guvenligi"}</h2>
            <p>{p?.s4Text || "Ses kayitlariniz yalnizca metne donusturme islemi sirasinda islenir. Islem tamamlandiktan sonra ses verisi otomatik olarak silinir. Sunucularimizda ses kaydı saklanmaz."}</p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{p?.s5Title || "5. Veri Saklama ve Guvenlik"}</h2>
            <p>{p?.s5Text || "Verileriniz sifrelenmis baglanti (SSL/TLS) uzerinden iletilir ve guvenli sunucularda saklanir. Erisim yetkilendirme ile kontrol edilir."}</p>
          </section>

          {/* Section 6 - KVKK */}
          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{p?.s6Title || "6. KVKK Haklariniz"}</h2>
            <p className="mb-3">{p?.s6Text || "6698 sayili Kisisel Verilerin Korunmasi Kanunu kapsaminda asagidaki haklara sahipsiniz:"}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{p?.s6Item1 || "Kisisel verilerinizin islenip islenmedigini ogrenme"}</li>
              <li>{p?.s6Item2 || "Kisisel verileriniz islenmisse buna iliskin bilgi talep etme"}</li>
              <li>{p?.s6Item3 || "Kisisel verilerinizin isleme amacini ve bunlarin amacina uygun kullanilip kullanilmadigini ogrenme"}</li>
              <li>{p?.s6Item4 || "Kisisel verilerinizin duzeltilmesini veya silinmesini isteme"}</li>
              <li>{p?.s6Item5 || "Hesabinizi ve tum verilerinizi kalici olarak silme (hesap silme hakki)"}</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{p?.s7Title || "7. Cerezler"}</h2>
            <p>{p?.s7Text || "VoiceFlow, oturum yonetimi ve dil tercihi gibi temel islevler icin cerez kullanir. Analitik cerezleri yalnizca izninizle etkinlestirilir."}</p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{p?.s8Title || "8. Iletisim"}</h2>
            <p>{p?.s8Text || "Gizlilik politikamizla ilgili sorulariniz icin bize info@voiceflow.app adresinden ulasabilirsiniz."}</p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-stone-500">
          &copy; {new Date().getFullYear()} VoiceFlow. {p?.allRightsReserved || "Tum haklari saklidir."}
        </div>
      </footer>
    </div>
  );
}
