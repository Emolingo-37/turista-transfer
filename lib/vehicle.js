// Araç seçim kuralı: kodda sabit, yapay zekâya bırakılmaz.
export function pickVehicle(n) {
  if (!n || n < 1) return null;
  if (n <= 8) return { category: "vito", label: "Mercedes Vito / Caravelle", seats: "1-8 kişi" };
  if (n <= 16) return { category: "sprinter", label: "Mercedes Sprinter", seats: "9-16 kişi" };
  if (n <= 25) return { category: "midibus", label: "Midibüs (21-25 koltuk)", seats: "17-25 kişi" };
  return null;
}
export const STATUS = {
  draft: ["Taslak", "bg-slate-200 text-slate-700"],
  searching: ["Araç aranıyor", "bg-amber-100 text-amber-800"],
  matched: ["Araç bulundu", "bg-sky-100 text-sky-800"],
  confirmed: ["Onaylandı", "bg-emerald-100 text-emerald-800"],
  completed: ["Tamamlandı", "bg-slate-200 text-slate-700"],
  cancelled: ["İptal edildi", "bg-rose-100 text-rose-800"],
};
