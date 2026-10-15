import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "Turista Transfer | Türkiye grup ulaşım platformu",
  description: "Havalimanı, şehirlerarası, düğün ve turizm grupları için güvenceli transfer.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="font-sans antialiased">
        <Nav />
        <main>{children}</main>
        <footer className="mt-20 bg-navy py-8 text-center text-sm text-white/60">
          © Turista Transfer. Müşteri ile ulaşım firması arasında güvence sağlar.
        </footer>
      </body>
    </html>
  );
}
