"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Giris() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ full_name: "", phone: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
      if (error) setMsg("E-posta veya şifre hatalı. Kontrol edip tekrar deneyin.");
      else router.push("/talep");
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: f.email,
        password: f.password,
        options: { data: { full_name: f.full_name, phone: f.phone } },
      });
      if (error) setMsg("Kayıt tamamlanamadı: " + error.message);
      else if (!data.session) setMsg("Kayıt alındı. E-postanıza gelen doğrulama bağlantısına tıklayın, sonra giriş yapın.");
      else router.push("/talep");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="font-display text-3xl font-bold">{mode === "login" ? "Giriş yap" : "Hesap oluştur"}</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "register" && (
            <>
              <input className="field" placeholder="Ad soyad" required value={f.full_name} onChange={set("full_name")} />
              <input className="field" placeholder="Telefon (05xx xxx xx xx)" required value={f.phone} onChange={set("phone")} />
            </>
          )}
          <input className="field" type="email" placeholder="E-posta" required value={f.email} onChange={set("email")} />
          <input className="field" type="password" minLength={6} placeholder="Şifre (en az 6 karakter)" required value={f.password} onChange={set("password")} />
          {msg && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{msg}</p>}
          <button className="btn w-full" disabled={busy}>{busy ? "Bekleyin..." : mode === "login" ? "Giriş yap" : "Kayıt ol"}</button>
        </form>
        <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setMsg(""); }} className="mt-5 text-sm text-slate-600 underline">
          {mode === "login" ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap"}
        </button>
      </div>
    </div>
  );
}
