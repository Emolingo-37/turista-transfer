
"use client";

import { useEffect, useState } from "react";
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
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!active) return;

        if (!error && data?.session) {
          window.location.replace("/app.html");
          return;
        }
      } catch (error) {
        console.error("Oturum kontrolü:", error);
      }

      if (active) setChecking(false);
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const email = form.email.trim().toLowerCase();

      if (mode === "login") {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email,
            password: form.password,
          });

        if (error) throw error;

        if (!data?.session) {
          throw new Error("Oturum oluşturulamadı.");
        }

        window.location.replace("/app.html");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
          },
        },
      });

      if (error) throw error;

      if (data?.session) {
        window.location.replace("/app.html");
        return;
      }

      setMessage(
        "Kayıt oluşturuldu. E-posta doğrulaması gerekiyorsa gelen kutunuzu kontrol edin."
      );
    } catch (error) {
      setMessage(
        error?.message || "Bir hata oluştu. Tekrar deneyin."
      );
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
    width: "100%",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    borderRadius: 14,
    padding: "15px 16px",
    fontSize: 14,
    color: "#0a2342",
    outlineColor: "#d4af37",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  if (checking) {
    return (
      <main style={{
        minHeight: "100vh",
        background: "#0a2342",
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontFamily: "system-ui",
      }}>
        Turista Transfer yükleniyor...
      </main>
    );
  }

  return (
    <main style={{
      minHeight: "100vh",
      background:
        "radial-gradient(circle at 90% 5%, #203d65, transparent 40%), linear-gradient(150deg, #0a2342, #13315c)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "35px 20px",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif',
      boxSizing: "border-box",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 440,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 42,
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            background: "#d4af37",
            display: "grid",
            placeItems: "center",
            color: "#0a2342",
            fontSize: 23,
            fontWeight: 800,
          }}>
            T
          </div>
          <div>
            <div style={{
              color: "white",
              fontSize: 19,
              fontWeight: 750,
              letterSpacing: "-0.6px",
            }}>
              Turista Transfer
            </div>
            <div style={{
              color: "#a9bed8",
              fontSize: 12,
              marginTop: 3,
            }}>
              Güvenli transferin adresi
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 30 }}>
          <h1 style={{
            color: "#fff",
            fontSize: 36,
            letterSpacing: "-1.5px",
            lineHeight: 1.15,
            margin: 0,
            fontWeight: 750,
          }}>
            Yolculuğunuz
            <br />
            burada başlar.
          </h1>

          <p style={{
            color: "#bfcee0",
            fontSize: 14,
            lineHeight: 1.7,
            marginTop: 16,
          }}>
            Size özel transfer deneyimi,
            birkaç dokunuş uzağınızda.
          </p>
        </div>

        <section style={{
          background: "#fff",
          borderRadius: 28,
          padding: "30px 26px",
          boxShadow: "0 25px 65px #00000030",
        }}>
          <h2 style={{
            color: "#0a2342",
            fontSize: 25,
            margin: 0,
            letterSpacing: "-0.8px",
            fontWeight: 750,
          }}>
            {mode === "login"
              ? "Tekrar hoş geldiniz."
              : "Aramıza hoş geldiniz."}
          </h2>

          <p style={{
            color: "#64748b",
            fontSize: 13,
            marginTop: 9,
            marginBottom: 25,
          }}>
            {mode === "login"
              ? "Hesabınıza giriş yaparak devam edin."
              : "Yeni hesabınızı oluşturun."}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
            <div style={{ padding: 13, border: "2px solid #d4af37", borderRadius: 14, background: "#fffbec", textAlign: "center", color: "#0a2342", fontSize: 13, fontWeight: 750 }}>👤 Müşteri girişi</div>
            <a href="/turista-partner.html" style={{ padding: 13, border: "1px solid #dce4ed", borderRadius: 14, background: "#f8fafc", textAlign: "center", color: "#0a2342", fontSize: 13, fontWeight: 750, textDecoration: "none" }}>🏢 Acenta / Firma<br/><span style={{ fontSize: 11, fontWeight: 500 }}>Demo panelini aç ↗</span></a>
          </div>
          <form onSubmit={submit} style={{
            display: "grid",
            gap: 13,
          }}>
            {mode === "register" && (
              <>
                <input
                  style={inputStyle}
                  name="full_name"
                  placeholder="Ad Soyad"
                  autoComplete="name"
                  value={form.full_name}
                  onChange={updateField}
                  required
                />

                <input
                  style={inputStyle}
                  name="phone"
                  type="tel"
                  placeholder="Telefon numarası"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={updateField}
                  required
                />
              </>
            )}

            <input
              style={inputStyle}
              name="email"
              type="email"
              placeholder="E-posta adresiniz"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              required
            />

            <div style={{ position: "relative" }}>
              <input
                style={{
                  ...inputStyle,
                  paddingRight: 76,
                }}
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Şifreniz"
                minLength={6}
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                value={form.password}
                onChange={updateField}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: 0,
                  background: "transparent",
                  color: "#64748b",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {showPassword ? "Gizle" : "Göster"}
              </button>
            </div>

            {message && (
              <p role="alert" style={{
                background: "#fff7e5",
                borderRadius: 12,
                padding: 13,
                color: "#8a5700",
                fontSize: 13,
                lineHeight: 1.6,
                margin: 0,
              }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              style={{
                background: "#d4af37",
                color: "#0a2342",
                border: "none",
                borderRadius: 14,
                padding: 16,
                fontSize: 15,
                fontWeight: 750,
                cursor: busy ? "wait" : "pointer",
                opacity: busy ? 0.65 : 1,
                marginTop: 8,
                fontFamily: "inherit",
              }}
            >
              {busy
                ? "İşleniyor..."
                : mode === "login"
                  ? "Giriş Yap →"
                  : "Hesap Oluştur →"}
            </button>
          </form>

          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setMessage("");
            }}
            style={{
              display: "block",
              margin: "22px auto 0",
              background: "transparent",
              border: 0,
              color: "#0a2342",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {mode === "login"
              ? "Hesabınız yok mu? Kayıt olun"
              : "Zaten hesabınız var mı? Giriş yapın"}
          </button>
        </section>

        <p style={{
          color: "#a9bed8",
          textAlign: "center",
          fontSize: 12,
          marginTop: 28,
        }}>
          Turista Transfer © 2026
        </p>
      </div>
    </main>
  );
}
