"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { STATUS, pickVehicle } from "@/lib/vehicle";

export default function Taleplerim() {
  const router = useRouter();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return router.replace("/giris");
      const { data } = await supabase.from("transfer_requests").select("*").order("created_at", { ascending: false });
      setRows(data || []);
    })();
  }, [router]);

  if (!rows) return <p className="p-10 text-center text-slate-500">Yükleniyor...</p>;
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-display text-3xl font-bold">Taleplerim</h1>
      {rows.length === 0 && (
        <div className="mt-8 rounded-3xl bg-white p-8 text-center ring-1 ring-slate-200">
          <p>Henüz talebiniz yok.</p>
          <Link href="/talep" className="btn mt-4 inline-block">İlk transferini talep et</Link>
        </div>
      )}
      <div className="mt-8 space-y-4">
        {rows.map((r) => {
          const [label, cls] = STATUS[r.status] || [r.status, "bg-slate-200"];
          const v = pickVehicle(r.passenger_count);
          return (
            <article key={r.id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-semibold">{r.pickup} → {r.dropoff}</h2>
                <span className={"shrink-0 rounded-full px-3 py-1 text-xs font-semibold " + cls}>{label}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {new Date(r.pickup_at).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })} · {r.passenger_count} yolcu · {r.luggage_count} bavul
              </p>
              {v && <p className="mt-1 text-sm text-slate-600">{v.label}</p>}
              {r.driver_name && (
                <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">Şoför: {r.driver_name} · {r.driver_phone}</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
