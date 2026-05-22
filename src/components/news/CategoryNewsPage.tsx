import Link from "next/link";
import { getArticles } from "@/lib/supabase";

interface CategoryNewsPageProps {
  category: string;
  title: string;
  description: string;
  label: string;
  accentClass?: string;
  includeLegacyNews?: boolean;
}

export async function CategoryNewsPage({
  category,
  title,
  description,
  label,
  accentClass = "text-[#FF1A1A]",
  includeLegacyNews = false,
}: CategoryNewsPageProps) {
  const primaryArticles = await getArticles({ limit: 40, category });
  const legacyArticles = includeLegacyNews ? await getArticles({ limit: 40, category: "news" }) : [];
  const articles = [...primaryArticles, ...legacyArticles].filter(
    (article, index, list) => list.findIndex((item) => item.id === article.id) === index
  );

  return (
    <div className="min-h-screen bg-[#000000] text-[#E8E8E8] font-sans">
      <nav className="sticky top-0 z-[100] bg-[rgba(0,0,0,0.95)] backdrop-blur-[12px] border-b border-white/[0.06] h-[64px]">
        <div className="max-w-[1280px] mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-[10px] flex-shrink-0">
            <img src="https://www.tglabs.info/images/logo.png" alt="TopGame Thailand" className="w-9 h-9 object-contain" />
            <div className="flex flex-col leading-none">
              <span className="font-['Bebas_Neue'] text-[18px] tracking-[2px] text-white">
                TOP<span className="text-[#FF1A1A]">GAME</span>
              </span>
              <span className="text-[8px] tracking-[3px] text-white/[0.4] uppercase">Thailand</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            <Link href="/" className="text-[13px] text-white/[0.7] hover:text-white transition-colors">Home</Link>
            <Link href="/news" className="text-[13px] text-white/[0.7] hover:text-white transition-colors">News</Link>
            <Link href="/news/mobile" className="text-[13px] text-white/[0.7] hover:text-white transition-colors">Mobile</Link>
            <Link href="/news/pc-console" className="text-[13px] text-white/[0.7] hover:text-white transition-colors">PC/Console</Link>
            <Link href="/news/gaming" className="text-[13px] text-white/[0.7] hover:text-white transition-colors">Gaming</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[1280px] mx-auto px-4 pb-12">
        <div className="h-[70px] mb-4 flex items-center justify-center bg-gradient-to-r from-[#0D0D0D] to-[#1A1A1A] border border-dashed border-[#2A2A2A] rounded-lg">
          <span className="text-[12px] tracking-[1px] text-[#666666] uppercase">advertisement 728x90</span>
        </div>

        <header className="py-8">
          <p className={`text-[11px] font-bold tracking-[2px] uppercase ${accentClass}`}>{label}</p>
          <h1 className="font-['Kanit'] text-[32px] font-semibold text-white mt-2">{title}</h1>
          <p className="text-[14px] text-[#AAAAAA] mt-2">{description}</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.length > 0 ? articles.map((article) => (
            <Link
              key={article.id}
              href={`/news/${article.slug}`}
              className="bg-[#0D0D0D] rounded-[10px] overflow-hidden border border-white/[0.04] hover:-translate-y-[4px] hover:border-[#FF1A1A]/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 cursor-pointer group"
            >
              {article.hero_image ? (
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={article.hero_image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-[#1A1A1A]" />
              )}
              <div className="p-3">
                <div className={`text-[10px] font-bold tracking-[1px] uppercase mb-2 ${accentClass}`}>
                  {article.category || category}
                </div>
                <h2 className="font-['Kanit'] text-[15px] font-semibold text-white leading-[1.35] line-clamp-2 group-hover:text-[#FF1A1A] transition-colors">
                  {article.title}
                </h2>
                <p className="text-[12px] text-[#AAAAAA] mt-2 line-clamp-2">{article.excerpt}</p>
                <div className="text-[11px] text-[#666666] mt-3">{article.read_time || 3} min read</div>
              </div>
            </Link>
          )) : (
            <div className="col-span-full py-20 text-center text-[#AAAAAA]">No articles in this category yet.</div>
          )}
        </div>
      </main>
    </div>
  );
}
