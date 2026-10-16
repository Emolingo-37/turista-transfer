import Link from "next/link";

const PLACES = [
  ["Ayasofya ve Sultanahmet", "İstanbul", "Tarih", "🕌", "from-amber-700 to-navy", "Bizans ve Osmanlı mirasının kalbi. Havalimanından otele tek transferle gelin."],
  ["Kapadokya", "Nevşehir", "Doğa", "🎈", "from-orange-500 to-navy2", "Peri bacaları, balon turları ve vadiler. Grup turları için ideal."],
  ["Pamukkale", "Denizli", "Doğa", "♨️", "from-sky-400 to-navy", "Beyaz travertenler ve antik Hierapolis termal havuzu."],
  ["Efes Antik Kenti", "İzmir", "Tarih", "🏛️", "from-stone-500 to-navy2", "Dünyanın en iyi korunmuş antik kentlerinden biri."],
  ["Sümela Manastırı", "Trabzon", "İnanç", "⛰️", "from-emerald-700 to-navy", "Karadeniz bölgesinde dik bir kayalığa kurulu tarihi manastır."],
  ["Nemrut Dağı", "Adıyaman", "Tarih", "🌄", "from-rose-500 to-navy2", "Dev heykeller ve unutulmaz gün doğumu manzarası."],
  ["Ölüdeniz", "Fethiye", "Deniz", "🏖️", "from-cyan-500 to-navy", "Turkuaz lagün ve yamaç paraşütü ile ünlü tatil bölgesi."],
  ["Mardin Eski Şehir", "Mardin", "Kültür", "🏘️", "from-yellow-600 to-navy2", "Taş evler, çarşılar ve Mezopotamya ovasına bakan teraslar."],
];

export const metadata = { title: "Turistik Yerler | Turista Transfer" };

export default function Yerler() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-display text-4xl font-bold">Seyahat edilecek turistik yerler</h1>
      <p className="mt-3 max-w-xl text-slate-600">Gitmek istediğiniz yeri seçin, asistanımız grubunuza uygun aracı ayarlasın.</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLACES.map(([name, city, tag, emoji, grad, desc]) => (
          <article key={name} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className={"flex h-40 items-center justify-center bg-gradient-to-br text-6xl " + grad}>{emoji}</div>
            <div className="p-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{city}</span>
                <span className="rounded-full bg-gold/20 px-2 py-0.5 font-semibold">{tag}</span>
              </div>
              <h2 className="mt-2 font-display text-lg font-bold">{name}</h2>
              <p className="mt-2 text-sm text-slate-600">{desc}</p>
              <Link href={"/sohbet?to=" + encodeURIComponent(name + ", " + city)} className="btn mt-4 block text-center text-sm">Buraya transfer ayarla</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
