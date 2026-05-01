import { notFound } from "next/navigation";

async function getArticle(slug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/articles?slug=eq.${slug}&select=*`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      cache: "no-store",
    }
  );

  const data = await res.json();
  return data?.[0] || null;
}

async function getRelated() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/articles?limit=4&order=created_at.desc`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      cache: "no-store",
    }
  );

  return res.json();
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await getArticle(slug);
  if (!article) return notFound();

  const related = await getRelated();

  return (
    <div className="bg-black text-white min-h-screen">
      {/* NAVBAR */}
      <div className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between">
          <div className="font-bold text-lg">TGLabs</div>
          <div className="text-sm text-gray-400">News</div>
        </div>
      </div>

      {/* HERO */}
      <div className="bg-gradient-to-b from-black to-[#0A0A0A] py-10">
        <div className="max-w-5xl mx-auto px-6">
          {article.hero_image && (
  <div className="mb-6 rounded overflow-hidden">
    <img
      src={article.hero_image}
      alt={article.title}
      className="w-full h-[320px] object-cover"
    />
  </div>
)}
          <h1 className="text-4xl font-bold mb-4">
            {article.title}
          </h1>

          <p className="text-gray-400 text-lg mb-3">
            {article.excerpt}
          </p>

          <div className="text-sm text-gray-500">
            อัปเดตล่าสุด • อ่าน 3 นาที
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8">
        
        {/* ARTICLE */}
        <div className="md:col-span-2">
          <div
            className="prose prose-invert max-w-none
                       leading-8
                       [&_p]:mb-5
                       [&_h2]:mt-10
                       [&_h2]:mb-4"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* SOURCE */}
          {article.source_url && (
            <p className="mt-10 text-sm text-gray-400">
              แหล่งที่มา:{" "}
              <a
                href={article.source_url}
                target="_blank"
                className="underline"
              >
                {article.source_url}
              </a>
            </p>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          
          {/* AD SLOT */}
          <div className="bg-gray-900 h-[250px] flex items-center justify-center text-gray-500">
            AD 300x250
          </div>

          {/* RELATED */}
          <div>
            <h3 className="text-lg font-bold mb-3">
              ข่าวที่เกี่ยวข้อง
            </h3>

            <div className="space-y-3">
              {related.map((item: any) => (
                <a
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="block hover:text-red-400"
                >
                  {item.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AD BELOW CONTENT */}
      <div className="max-w-5xl mx-auto px-6 pb-10">
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