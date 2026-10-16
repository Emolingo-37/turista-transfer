"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const LINKS = [["/", "Ana menü"], ["/yerler", "Turistik yerler"], ["/sohbet", "Transfer asistanı"], ["/taleplerim", "Taleplerim"]];

export default function Nav() {
  const [session, setSession] = useState(null);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => setOpen(false), [path]);
  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }
  const item = (h, l) => (
    <Link key={h} href={h} className={"rounded-xl px-3 py-2 " + (path === h ? "bg-white/10 text-gold" : "hover:text-gold")}>{l}</Link>
  );
  return (
    <header className="sticky top-0 z-40 bg-navy/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="font-display text-xl font-bold">Turista <span className="text-gold">Transfer</span></Link>
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {LINKS.map(([h, l]) => item(h, l))}
          {session ? (
            <>
              {item("/hesabim", "Hesabım")}
              <button onClick={logout} className="ml-2 rounded-xl border border-white/30 px-3 py-1.5 hover:border-gold">Çıkış</button>
            </>
          ) : (
            <Link href="/giris" className="ml-2 rounded-xl bg-gold px-4 py-1.5 font-semibold text-navy">Giriş yap</Link>
          )}
        </nav>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menü">
          <span className="text-2xl">{open ? "✕" : "☰"}</span>
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-5 py-3 md:hidden">
          {LINKS.map(([h, l]) => item(h, l))}
          {session ? (
            <>
              {item("/hesabim", "Hesabım")}
              <button onClick={logout} className="px-3 py-2 text-left text-white/70">Çıkış yap</button>
            </>
          ) : item("/giris", "Giriş yap / Kayıt ol")}
        </nav>
      )}
    </header>
  );
}
