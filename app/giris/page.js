
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const AUTH_TIMEOUT_MS = 10000;

function withTimeout(promise, ms = AUTH_TIMEOUT_MS) {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          "Supabase 10 saniye içinde yanıt vermedi. Bağlantı veya oturum kontrol edilmeli."
        )
      );
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timeoutId);
  });
}

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

    const email = f.email.trim();

    console.log("[AUTH DEBUG] Form gönderildi", {
      mode,
      email,
      time: new Date().toISOString(),
    });

    try {
      if (mode === "login") {
        console.log("[LOGIN DEBUG] Supabase isteği gönderiliyor");

        let result;

        try {
          result = await withTimeout(
            supabase.auth.signInWithPassword({
              email,
              password: f.password,
            })
          );
        } catch (err) {
          console.error("[LOGIN DEBUG] İstek tamamlanamadı:", err);
          setMsg(
            err?.message ||
              "Giriş isteği tamamlanamadı. Lütfen tekrar deneyin."
          );
          return;
        }

        const { data, error } = result;

        console.log("[LOGIN DEBUG] Supabase yanıtı", {
          hasUser: !!data?.user,
          hasSession: !!data?.session,
          error: error?.message ?? null,
          status: error?.status ?? null,
        });

        if (error) {
          console.error("[LOGIN DEBUG] Supabase hata ayrıntısı:", error);
          setMsg("Giriş hatası: " + error.message);
          return;
        }

        if (!data?.session) {
          console.error("[LOGIN DEBUG] Oturum bulunamadı");
          setMsg(
            "Giriş yanıtı alındı ancak oturum oluşturulmadı. E-posta doğrulamasını kontrol edin."
          );
          return;
        }

        console.log("[LOGIN DEBUG] Giriş başarılı", {
          hasSession: true,
          userId: data.user?.id,
          expiresAt: data.session.expires_at,
        });

        setMsg("Giriş başarılı. Uygulama açılıyor...");

        window.location.assign("/app.html");
        return;
      }

      console.log("[REGISTER DEBUG] Supabase kayıt isteği gönderiliyor");

      let result;

      try {
        result = await withTimeout(
          supabase.auth.signUp({
            email,
            password: f.password,
            options: {
              data: {
                full_name: f.full_name.trim(),
                phone: f.phone.trim(),
              },
            },
          })
        );
      } catch (err) {
        console.error("[REGISTER DEBUG] İstek tamamlanamadı:", err);
        setMsg(
          err?.message ||
            "Kayıt isteği tamamlanamadı. Lütfen tekrar deneyin."
        );
        return;
      }

      const { data, error } = result;

      console.log("[REGISTER DEBUG] Supabase yanıtı", {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error?.message ?? null,
        status: error?.status ?? null,
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

      console.log("[REGISTER DEBUG] Kayıt ve oturum başarılı");

      setMsg("Kayıt başarılı. Uygulama açılıyor...");
      window.location.assign("/app.html");
    } catch (err) {
      console.error("[AUTH DEBUG] Beklenmeyen hata:", err);
      setMsg(
        "Beklenmeyen hata: " +
          (err?.message || String(err))
      );
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
              mode === "login"
                ? "current-password"
                : "new-password"
            }
            minLength={6}
            required
            value={f.password}
            onChange={set("password")}
          />

          {msg && (
            <p
              role="alert"
              aria-live="polite"
              className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
            >
              {msg}
            </p>
          )}

          <button
            className="btn w-full"
            type="submit"
            disabled={busy}
          >
            {busy
              ? "Bekleniyor..."
              : mode === "login"
                ? "Giriş yap"
                : "Kayıt ol"}
          </button>
        </form>

        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setMode((prev) =>
              prev === "login" ? "register" : "login"
            );
            setMsg("");
          }}
          className="mt-5 text-sm text-slate-600 underline disabled:opacity-50"
        >
          {mode === "login"
            ? "Hesabın yok mu? Kayıt ol"
            : "Zaten hesabın var mı? Giriş yap"}
        </button>
      </div>
    </div>
  );
}
