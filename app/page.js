import Link from "next/link";

const steps = [
  ["İhtiyacını anlat", "Kaç kişisiniz, kaç bavulunuz var, nereden nereye gidiyorsunuz? Biz uygun aracı belirleriz."],
  ["Aracınız aranır", "Talebiniz ulaşım firmalarına iletilir. Araç bulunduğunda size haber veririz."],
  ["Yolcuları girin", "Her yolcunun adını ve kimlik numarasını güvenle kaydedin."],
  ["Şoför bilgisi SMS ile gelir", "Onaydan sonra şoför ve araç bilgileri telefonunuza gönderilir."],
];

export default function Home() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2 md:py-28">
          <div>
            <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
              Grubunuz için doğru araç, güvenceli yolculuk.
            </h1>
            <p className="mt-6 max-w-md text-lg text-white/75">
              Havalimanı transferi, düğün, okul gezisi ve turizm grupları. Turista, siz ile ulaşım firması arasında güvence olur.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/talep" className="btn">Transfer talep et</Link>
              <Link href="/giris" className="rounded-[14px] border border-white/30 px-5 py-3 hover:border-gold">Hesap oluştur</Link>
            </div>
          </div>
          <div className="rounded-3xl bg-navy2 p-6 ring-1 ring-white/10">
            <p className="text-sm text-white/60">Araç seçim kuralımız</p>
            {[["1-8 kişi", "Mercedes Vito / Caravelle"], ["9-16 kişi", "Mercedes Sprinter"], ["17-25 kişi", "Midibüs, 21-25 koltuk"]].map(([k, v]) => (
              <div key={k} className="mt-4 flex items-center justify-between border-b border-white/10 pb-4">
                <span className="font-display text-2xl text-gold">{k}</span>
                <span className="text-right text-white/85">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-3xl font-bold">Nasıl çalışır?</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {steps.map(([t, d], i) => (
            <li key={t} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <span className="font-display text-2xl text-gold">{i + 1}</span>
              <h3 className="mt-2 font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-slate-600">{d}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
