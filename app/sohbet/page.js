"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { pickVehicle } from "@/lib/vehicle";

const EXTRAS = [["child_seat", "Çocuk koltuğu"], ["greeting", "Tabelayla karşılama"], ["wifi", "Araçta Wi-Fi"]];
const STEPS = ["Transfer detayı", "Araç arama", "Yolcu ve ödeme"];
const bad = (people) => people.some((p) => p.name.trim().length < 3 || !/^\d{11}$/.test(p.tc));

export default function Sohbet() {
  const router = useRouter();
  const end = useRef(null);
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("pickup");
  const [log, setLog] = useState([{ b: 1, t: "Merhaba, ben Turista asistanı. Transfer için nereden hareket edeceksiniz?" }]);
  const [d, setD] = useState({ pickup: "", dropoff: "", when: "", pax: 4, lug: 2 });
  const [extras, setExtras] = useState({});
  const [val, setVal] = useState("");
  const [people, setPeople] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const vehicle = pickVehicle(Number(d.pax));
  const phase = ["pickup", "dropoff", "when", "pax", "lug", "extras", "confirm"].includes(step) ? 0 : ["searching", "found"].includes(step) ? 1 : 2;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return router.replace("/giris");
      setUser(data.session.user);
      const to = new URLSearchParams(window.location.search).get("to");
      if (to) {
        setD((x) => ({ ...x, dropoff: to }));
        setLog((l) => [...l, { t: "Gideceğim yer: " + to }, { b: 1, t: "Harika seçim. Peki nereden hareket edeceksiniz?" }]);
      }
    });
  }, [router]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [log, step]);
  useEffect(() => {
    if (step !== "searching") return;
    const t = setTimeout(() => {
      setLog((l) => [...l, { b: 1, t: "Aracınız bulundu: " + vehicle.label + ". Kabul ediyor musunuz?" }]);
      setStep("found");
    }, 3500);
    return () => clearTimeout(t);
  }, [step]);

  const say = (me, bot, nx) => { setLog((l) => [...l, { t: me }, ...(bot ? [{ b: 1, t: bot }] : [])]); setStep(nx); setVal(""); setErr(""); };
  const when = d.when ? new Date(d.when).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" }) : "";

  function next(e) {
    e.preventDefault();
    if (step === "pickup") { setD({ ...d, pickup: val }); say(val, d.dropoff ? "Hangi tarih ve saatte alınacaksınız?" : "Nereye gideceksiniz?", d.dropoff ? "when" : "dropoff"); }
    else if (step === "dropoff") { setD({ ...d, dropoff: val }); say(val, "Hangi tarih ve saatte alınacaksınız?", "when"); }
    else if (step === "when") say(when, "Kaç kişi yolculuk edeceksiniz?", "pax");
    else if (step === "pax") {
      if (!vehicle) return setErr("25 kişiden büyük gruplar için birden fazla araç gerekir. Lütfen sayıyı azaltın.");
      say(d.pax + " kişi", "Kaç bavulunuz var?", "lug");
    }
    else if (step === "lug") say(d.lug + " bavul", "İstediğiniz ekstralar var mı?", "extras");
    else if (step === "extras") {
      const sel = EXTRAS.filter(([k]) => extras[k]).map(([, l]) => l).join(", ") || "Ekstra istemiyorum";
      say(sel, "Özet hazır. Size uygun araç: " + vehicle.label + " (" + vehicle.seats + ").", "confirm");
    }
  }
  function startSearch() {
    setPeople(Array.from({ length: Number(d.pax) }, () => ({ name: "", tc: "" })));
    say("Araç ara", "Size uygun araç aranıyor...", "searching");
  }
  function toPay() {
    if (bad(people)) return setErr("Her yolcu için ad soyad ve 11 haneli TC kimlik numarası girin.");
    say("Yolcu bilgileri girildi", "Son adım: ödeme. Ödeme sistemi şimdilik demo olarak çalışıyor, gerçek tahsilat yapılmaz.", "pay");
  }
  async function finish() {
    setBusy(true); setErr("");
    const { data: r, error } = await supabase.from("transfer_requests").insert({
      user_id: user.id, pickup: d.pickup, dropoff: d.dropoff, pickup_at: new Date(d.when).toISOString(),
      passenger_count: Number(d.pax), luggage_count: Number(d.lug), extras, vehicle_category: vehicle.category, status: "confirmed",
    }).select().single();
    if (error) { setBusy(false); return setErr("Kayıt yapılamadı: " + error.message); }
    const { error: e2 } = await supabase.from("passengers").insert(people.map((p) => ({ request_id: r.id, full_name: p.name.trim(), tc_no: p.tc })));
    setBusy(false);
    if (e2) return setErr("Yolcular kaydedilemedi: " + e2.message);
    setStep("done");
  }
  const upd = (i, k, v) => setPeople(people.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  if (!user) return <p className="p-10 text-center text-slate-500">Yükleniyor...</p>;
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-5 grid grid-cols-3 gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className={"rounded-2xl px-3 py-2 text-center text-xs font-semibold " + (i <= phase ? "bg-navy text-gold" : "bg-slate-200 text-slate-500")}>{i + 1}. {s}</div>
        ))}
      </div>
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="space-y-3">
          {log.map((m, i) => (
            <div key={i} className={"flex " + (m.b ? "justify-start" : "justify-end")}>
              <p className={"max-w-[85%] rounded-2xl px-4 py-2.5 text-sm " + (m.b ? "bg-slate-100" : "bg-navy text-white")}>{m.t}</p>
            </div>
          ))}
          {step === "searching" && (
            <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-sm"><span className="h-3 w-3 animate-ping rounded-full bg-gold" />Uygun araçlar kontrol ediliyor...</div>
          )}
          {step === "done" && (
            <div className="rounded-2xl bg-emerald-50 p-6 text-center">
              <div className="mx-auto flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-emerald-500 text-3xl text-white">✓</div>
              <p className="mt-3 font-semibold text-emerald-900">Transferiniz onaylandı</p>
              <p className="mt-1 text-sm text-emerald-800">Şoför bilgileri SMS olarak tarafınıza yönlendirilecektir.</p>
              <button onClick={() => router.push("/taleplerim")} className="btn mt-4">Taleplerime git</button>
            </div>
          )}
          <div ref={end} />
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          {err && <p className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{err}</p>}
          {["pickup", "dropoff"].includes(step) && (
            <form onSubmit={next} className="flex gap-2">
              <input className="field" required autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder={step === "pickup" ? "Örn. İstanbul Havalimanı" : "Örn. Sultanahmet, otel adı"} />
              <button className="btn">Gönder</button>
            </form>
          )}
          {step === "when" && (
            <form onSubmit={next} className="flex gap-2">
              <input className="field" type="datetime-local" required value={d.when} onChange={(e) => setD({ ...d, when: e.target.value })} />
              <button className="btn">Gönder</button>
            </form>
          )}
          {(step === "pax" || step === "lug") && (
            <form onSubmit={next} className="flex gap-2">
              <input className="field" type="number" min={step === "pax" ? 1 : 0} max="60" required value={d[step]} onChange={(e) => setD({ ...d, [step]: e.target.value })} />
              <button className="btn">Gönder</button>
            </form>
          )}
          {step === "extras" && (
            <form onSubmit={next}>
              <div className="flex flex-wrap gap-2">
                {EXTRAS.map(([k, l]) => (
                  <button type="button" key={k} onClick={() => setExtras({ ...extras, [k]: !extras[k] })} className={"rounded-full border px-4 py-2 text-sm " + (extras[k] ? "border-gold bg-gold/20 font-semibold" : "border-slate-300")}>{l}</button>
                ))}
              </div>
              <button className="btn mt-3 w-full">Devam</button>
            </form>
          )}
          {step === "confirm" && (
            <div>
              <div className="rounded-2xl bg-navy p-4 text-sm text-white">
                <p className="font-semibold text-gold">{vehicle.label}</p>
                <p className="mt-1 text-white/80">{d.pickup} → {d.dropoff}</p>
                <p className="text-white/80">{when} · {d.pax} yolcu · {d.lug} bavul</p>
              </div>
              <button onClick={startSearch} className="btn mt-3 w-full">Araç ara</button>
            </div>
          )}
          {step === "found" && <button onClick={() => say("Kabul ediyorum", "Şimdi yolcu bilgilerini girin. Her yolcu için ad soyad ve TC kimlik numarası gerekli.", "passengers")} className="btn w-full">Aracı kabul et</button>}
          {step === "passengers" && (
            <div className="space-y-3">
              {people.map((p, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-2">
                  <input className="field" placeholder={"Yolcu " + (i + 1) + " ad soyad"} value={p.name} onChange={(e) => upd(i, "name", e.target.value)} />
                  <input className="field" inputMode="numeric" maxLength={11} placeholder="TC kimlik no" value={p.tc} onChange={(e) => upd(i, "tc", e.target.value.replace(/\D/g, ""))} />
                </div>
              ))}
              <button onClick={toPay} className="btn w-full">Devam</button>
            </div>
          )}
          {step === "pay" && <button onClick={finish} disabled={busy} className="btn w-full">{busy ? "Kaydediliyor..." : "Ödemeyi tamamla (demo)"}</button>}
        </div>
      </div>
    </div>
  );
}
