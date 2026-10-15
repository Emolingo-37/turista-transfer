"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Nav() {
  const [session, setSession] = useState(null);
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }
  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-xl font-bold">
          Turista <span className="text-gold">Transfer</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {session ? (
            <>
              <Link href="/talep" className="hover:text-gold">Yeni talep</Link>
              <Link href="/taleplerim" className="hover:text-gold">Taleplerim</Link>
              <button onClick={logout} className="rounded-xl border border-white/30 px-3 py-1.5 hover:border-gold">Çıkış yap</button>
            </>
          ) : (
            <Link href="/giris" className="rounded-xl bg-gold px-4 py-1.5 font-semibold text-navy">Giriş yap</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
