"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Giris() {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ full_name: "", phone: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

 
async function submit(e) {
  e.preventDefault();
  setBusy(true);
  setMsg("");

  try {
    if (mode === "login") {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: f.email.trim(),
          password: f.password,
        });

      if (error) {
        console.error("Supabase giriş hatası:", error);
        setMsg("Giriş hatası: " + error.message);
        return;
      }

      if (!data.session) {
        setMsg("Giriş yanıtı geldi ancak oturum oluşturulmadı.");
        return;
      }

      window.location.href = "/app.html";
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: {
        data: {
          full_name: f.full_name,
          phone: f.phone,
        },
      },
    });

    if (error) {
      setMsg("Kayıt hatası: " + error.message);
      return;
    }

    if (!data.session) {
      setMsg(
        "Kayıt alındı. E-postanı doğrulaman gerekebilir."
      );
      return;
    }

        window.location.href = "/app.html";
    return;
  }
} catch (err) {
    console.error("Beklenmeyen giriş hatası:", err);
    setMsg("Beklenmeyen hata: " + (err.message || String(err)));
  } finally {
    setBusy(false);
  }
}
