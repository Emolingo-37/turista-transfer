"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { pickVehicle } from "@/lib/vehicle";

const EXTRAS = [["child_seat", "Çocuk koltuğu"], ["greeting", "Tabelayla karşılama"], ["wifi", "Araçta Wi-Fi"]];

export default function Talep() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [f, setF] = useState({ pickup: "", dropoff: "", pickup_at: "", passenger_count: 4, luggage_count: 2 });
  const [extras, setExtras] = useState({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/giris");
      else setUser(data.session.user);
    });
  }, [router]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const vehicle = pickVehicle(Number(f.passenger_count));

  async function submit(e) {
    e.preventDefault();
    if (!vehicle) return setErr("25 kişiden büyük gruplar için birden fazla araç gerekir. Lütfen bizimle iletişime geçin.");
    setBusy(true);
    setErr("");
    const { error } = await supabase.from("transfer_requests").insert({
      user_id: user.id,
      pickup: f.pickup,
      dropoff: f.dropoff,
      pickup_at: new Date(f.pickup_at).toISOString(),
      passenger_count: Number(f.passenger_count),
      luggage_count: Number(f.luggage_count),
      extras,
      vehicle_category: vehicle.category,
      status: "searching",
    });
    if (error) { setErr("Talep kaydedilemedi: " + error.message); setBusy(false); }
    else router.push("/taleplerim");
  }

  if (!user) return <p className="p-10 text-center text-slate-500">Yükleniyor...</p>;
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-5 py-12 md:grid-cols-[1fr_320px]">
      <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="font-display text-3xl font-bold">Transfer detayı</h1>
        <input className="field" required placeholder="Nereden? (ör. İstanbul Havalimanı)" value={f.pickup} onChange={set("pickup")} />
        <input className="field" required placeholder="Nereye? (ör. Sultanahmet, otel adı)" value={f.dropoff} onChange={set("dropoff")} />
        <label className="block text-sm text-slate-600">Alış tarihi ve saati
          <input className="field mt-1" type="datetime-local" required value={f.pickup_at} onChange={set("pickup_at")} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-slate-600">Yolcu sayısı
            <input className="field mt-1" type="number" min="1" max="60" required value={f.passenger_count} onChange={set("passenger_count")} />
          </label>
          <label className="text-sm text-slate-600">Bavul sayısı
            <input className="field mt-1" type="number" min="0" max="80" value={f.luggage_count} onChange={set("luggage_count")} />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXTRAS.map(([k, l]) => (
            <button type="button" key={k} onClick={() => setExtras({ ...extras, [k]: !extras[k] })}
              className={"rounded-full border px-4 py-2 text-sm " + (extras[k] ? "border-gold bg-gold/20 font-semibold" : "border-slate-300")}>
              {l}
            </button>
          ))}
        </div>
        {err && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{err}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? "Kaydediliyor..." : "Araç ara"}</button>
      </form>
      <aside className="h-fit rounded-3xl bg-navy p-6 text-white">
        <p className="text-sm text-white/60">Size uygun araç</p>
        {vehicle ? (
          <>
            <p className="mt-2 font-display text-2xl text-gold">{vehicle.label}</p>
            <p className="mt-1 text-white/75">{vehicle.seats}</p>
          </>
        ) : (
          <p className="mt-2 text-white/80">Bu grup için birden fazla araç gerekir.</p>
        )}
      </aside>
    </div>
  );
}
