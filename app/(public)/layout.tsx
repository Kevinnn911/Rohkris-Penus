import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { getSiteSettings } from "@/lib/data/public";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#konten-utama" className="skip-link rounded-lg bg-navy-800 px-4 py-2 text-ivory-50">
        Lewati ke konten utama
      </a>
      <Navbar />
      <main id="konten-utama" className="flex-1">
        {children}
      </main>
      <Footer settings={settings} />
    </div>
  );
}
