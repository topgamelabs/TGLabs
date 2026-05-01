import Link from "next/link";

async function getArticles() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/articles?select=*&order=created_at.desc`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      cache: "no-store",
    }
  );

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default async function NewsPage() {
  const articles = await getArticles();

  return (
    <main className="max-w-6xl mx-auto px-5 py-10 text-white">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-8">ข่าวเกมมือถือ</h1>

      {/* Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {articles.map((article: any) => (
          <Link key={article.id} href={`/news/${article.slug}`}>
            <div className="bg-[#1F1F1F] rounded-xl overflow-hidden hover:bg-[#2a2a2a] transition cursor-pointer">
              
              {/* Image (placeholder) */}
              <div className="h-40 bg-gray-800"></div>

              {/* Content */}
              <div className="p-5">
                <div className="text-xs text-tg-red mb-2 uppercase">
                  {article.category}
                </div>

                <h2 className="text-lg font-semibold mb-2 line-clamp-2">
                  {article.title}
                </h2>

                <p className="text-gray-400 text-sm line-clamp-2">
                  {article.excerpt}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}