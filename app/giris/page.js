
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Giris() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function updateField(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function runWithTimeout(promise, ms = 15000) {
    let timer;

    try {
      return await Promise.race([
        promise,
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(
              new Error(
                "Sunucudan 15 saniye içinde yanıt alınamadı. İnternet bağlantısını kontrol edip tekrar deneyin."
              )
            ),
            ms
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  async function submit(e) {
    e.preventDefault();

    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const email = form.email.trim().toLowerCase();

      if (mode === "login") {
        const result = await runWithTimeout(
          supabase.auth.signInWithPassword({
            email,
            password: form.password,
          })
        );

        if (result.error) {
          console.error("Giriş hatası:", result.error);
          setMessage("Giriş yapılamadı: " + result.error.message);
          return;
        }

        if (!result.data?.session) {
          setMessage(
            "Giriş tamamlandı ancak oturum oluşturulamadı. Tekrar deneyin."
          );
          return;
        }

        setMessage("Giriş başarılı. Uygulama açılıyor...");

        window.location.replace("/app.html");
        return;
      }

      const result = await runWithTimeout(
        supabase.auth.signUp({
          email,
          password: form.password,
          options: {
            data: {
              full_name: form.full_name.trim(),
              phone: form.phone.trim(),
            },
          },
        })
      );

      if (result.error) {
        console.error("Kayıt hatası:", result.error);
        setMessage("Kayıt yapılamadı: " + result.error.message);
        return;
      }

      if (!result.data?.session) {
        setMessage(
          "Kayıt isteği alındı. E-posta doğrulaması gerekiyorsa gelen kutunu kontrol et."
        );
        return;
      }

      setMessage("Kayıt başarılı. Uygulama açılıyor...");
      window.location.replace("/app.html");
    } catch (error) {
      console.error("Kimlik doğrulama hatası:", error);
      setMessage(
        error?.message ||
          "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."
      );
    } finally {
      setBusy(false);
    }
  }

  function toggleMode() {
    setMode((prev) => prev === "login" ? "register" : "login");
    setMessage("");
  }

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
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
                value={form.full_name}
                onChange={updateField}
                required
              />

              <input
                className="field"
                name="phone"
                type="tel"
                placeholder="Telefon (05xx xxx xx xx)"
                autoComplete="tel"
                value={form.phone}
                onChange={updateField}
                required
              />
            </>
          )}

          <input
            className="field"
            name="email"
            type="email"
            placeholder="E-posta"
            autoComplete="email"
            value={form.email}
            onChange={updateField}
            required
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
            value={form.password}
            onChange={updateField}
            required
          />

          {message && (
            <p
              role="alert"
              aria-live="polite"
              className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
            >
              {message}
            </p>
          )}

          <button
            className="btn w-full"
            type="submit"
            disabled={busy}
          >
            {busy
              ? "İşleniyor..."
              : mode === "login"
                ? "Giriş yap"
                : "Kayıt ol"}
          </button>
        </form>

        <button
          type="button"
          onClick={toggleMode}
          disabled={busy}
          className="mt-5 text-sm text-slate-600 underline disabled:opacity-50"
        >
          {mode === "login"
            ? "Hesabın yok mu? Kayıt ol"
            : "Zaten hesabın var mı? Giriş yap"}
        </button>
      </section>
    </main>
  );
}
