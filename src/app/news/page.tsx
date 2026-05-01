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

  return res.json();
}

export default async function NewsPage() {
  const articles = await getArticles();

  return (
    <div className="bg-black text-white min-h-screen">
      {/* NAVBAR */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between">
          <Link href="/" className="font-bold text-xl">
            TGLabs
          </Link>

          <div className="text-sm text-gray-400 flex gap-4">
            <Link href="/news">ข่าว</Link>
            <Link href="/">หน้าแรก</Link>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-2">
          ข่าวเกมล่าสุด
        </h1>
        <p className="text-gray-400">
          อัปเดตข่าวเกมใหม่ทุกวัน
        </p>
      </div>

      {/* MAIN */}
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-8 pb-10">
        
        {/* CONTENT */}
        <div className="md:col-span-3 grid md:grid-cols-2 gap-6">
          {articles.map((a: any) => (
            <Link
              key={a.id}
              href={`/news/${a.slug}`}
              className="block bg-[#111] border border-gray-800 rounded overflow-hidden hover:border-red-500 transition"
            >
              {a.hero_image && (
  <div className="h-40 bg-gray-800 overflow-hidden">
    <img
      src={a.hero_image}
      alt={a.title}
      className="w-full h-full object-cover"
    />
  </div>
)}

<div className="p-5">
                <h2 className="text-lg font-bold mb-2 line-clamp-2">
                  {a.title}
                </h2>

                <p className="text-sm text-gray-400 line-clamp-3">
                  {a.excerpt}
                </p>

                <div className="text-xs text-gray-500 mt-3">
                  อ่านเพิ่มเติม →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* AD SLOT */}
          <div className="bg-gray-900 h-[250px] flex items-center justify-center text-gray-500">
            AD 300x250
          </div>

          {/* TRENDING (placeholder) */}
          <div>
            <h3 className="text-lg font-bold mb-3">
              ข่าวยอดนิยม
            </h3>

            <div className="space-y-3 text-sm text-gray-300">
              {articles.slice(0, 5).map((a: any) => (
                <Link
                  key={a.id}
                  href={`/news/${a.slug}`}
                  className="block hover:text-red-400"
                >
                  {a.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM AD */}
      <div className="max-w-6xl mx-auto px-6 pb-10">
        <div className="bg-gray-900 h-[120px] flex items-center justify-center text-gray-500">
          AD BANNER
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm">
        © 2026 TGLabs
      </div>
    </div>
  );
}