
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Giris() {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    setF((prev) => ({ ...prev, [key]: e.target.value }));
  };

  async function submit(e) {
    e.preventDefault();

    if (busy) return;

    setBusy(true);
    setMsg("");

    console.log("[LOGIN DEBUG] Form gönderildi", {
      mode,
      email: f.email.trim(),
    });

    try {
      if (mode === "login") {
        console.log("[LOGIN DEBUG] Supabase giriş isteği gönderiliyor");

        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: f.email.trim(),
            password: f.password,
          });

        console.log("[LOGIN DEBUG] Supabase yanıtı", {
          hasUser: !!data?.user,
          hasSession: !!data?.session,
          error: error?.message ?? null,
        });

        if (error) {
          console.error("[LOGIN DEBUG] Giriş hatası:", error);
          setMsg("Giriş hatası: " + error.message);
          return;
        }

        if (!data?.session) {
          console.error("[LOGIN DEBUG] Oturum oluşturulmadı");
          setMsg(
            "Giriş yanıtı alındı ancak oturum bulunamadı. Tekrar deneyin."
          );
          return;
        }

        console.log("[LOGIN DEBUG] Giriş başarılı", {
          hasSession: !!data.session,
          userId: data.user?.id,
          expiresAt: data.session?.expires_at,
        });

        window.location.assign("/app.html");
        return;
      }

      console.log("[REGISTER DEBUG] Kayıt isteği gönderiliyor");

      const { data, error } = await supabase.auth.signUp({
        email: f.email.trim(),
        password: f.password,
        options: {
          data: {
            full_name: f.full_name.trim(),
            phone: f.phone.trim(),
          },
        },
      });

      console.log("[REGISTER DEBUG] Supabase yanıtı", {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error?.message ?? null,
      });

      if (error) {
        console.error("[REGISTER DEBUG] Kayıt hatası:", error);
        setMsg("Kayıt hatası: " + error.message);
        return;
      }

      if (!data?.session) {
        setMsg(
          "Kayıt alındı. E-posta doğrulaması gerekiyorsa gelen kutunu kontrol et."
        );
        return;
      }

      window.location.assign("/app.html");
      return;
    } catch (err) {
      console.error("[AUTH DEBUG] Beklenmeyen hata:", err);
      setMsg("Beklenmeyen hata: " + (err?.message || String(err)));
    } finally {
      setBusy(false);
      console.log("[AUTH DEBUG] İşlem tamamlandı");
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="font-display text-3xl font-bold">
          {mode === "login" ? "Giriş yap" : "Hesap oluştur"}
        </h1>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "register" && (
            <>
              <input
                className="field"
                name="full_name"
                placeholder="Ad soyad"
                autoComplete="name"
                required
                value={f.full_name}
                onChange={set("full_name")}
              />

              <input
                className="field"
                name="phone"
                placeholder="Telefon (05xx xxx xx xx)"
                type="tel"
                autoComplete="tel"
                required
                value={f.phone}
                onChange={set("phone")}
              />
            </>
          )}

          <input
            className="field"
            name="email"
            type="email"
            placeholder="E-posta"
            autoComplete="email"
            required
            value={f.email}
            onChange={set("email")}
          />

          <input
            className="field"
            name="password"
            type="password"
            placeholder="Şifre (en az 6 karakter)"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            minLength={6}
            required
            value={f.password}
            onChange={set("password")}
          />

          {msg && (
            <p
              role="alert"
              className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
            >
              {msg}
            </p>
          )}

          <button className="btn w-full" type="submit" disabled={busy}>
            {busy
              ? "Bekleyin..."
              : mode === "login"
                ? "Giriş yap"
                : "Kayıt ol"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((prev) =>
              prev === "login" ? "register" : "login"
            );
            setMsg("");
          }}
          className="mt-5 text-sm text-slate-600 underline"
        >
          {mode === "login"
            ? "Hesabın yok mu? Kayıt ol"
            : "Zaten hesabın var mı? Giriş yap"}
        </button>
      </div>
    </div>
  );
}
