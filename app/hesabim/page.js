"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Hesabim() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [f, setF] = useState({ full_name: "", phone: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return router.replace("/giris");
      setUser(data.session.user);
      const { data: p } = await supabase.from("profiles").select("full_name, phone").eq("id", data.session.user.id).maybeSingle();
      if (p) setF({ full_name: p.full_name || "", phone: p.phone || "" });
    })();
  }, [router]);

  async function save(e) {
    e.preventDefault();
    const { error } = await supabase.from("profiles").update(f).eq("id", user.id);
    setMsg(error ? "Kaydedilemedi: " + error.message : "Bilgileriniz güncellendi.");
  }

  if (!user) return <p className="p-10 text-center text-slate-500">Yükleniyor...</p>;
  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <h1 className="font-display text-3xl font-bold">Hesabım</h1>
      <form onSubmit={save} className="mt-6 space-y-3 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">E-posta: {user.email}</p>
        <input className="field" placeholder="Ad soyad" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
        <input className="field" placeholder="Telefon" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        {msg && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{msg}</p>}
        <button className="btn w-full">Kaydet</button>
      </form>
      <Link href="/taleplerim" className="mt-4 block rounded-3xl bg-white p-5 text-center ring-1 ring-slate-200 hover:ring-gold">Transfer taleplerimi gör →</Link>
    </div>
  );
}
