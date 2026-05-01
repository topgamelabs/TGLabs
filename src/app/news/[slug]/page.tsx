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

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // 🔥 FIX ตรงนี้
  const { slug } = await params;

  const article = await getArticle(slug);

  if (!article) return notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-bold mb-3">{article.title}</h1>

      <div className="text-sm text-gray-500 mb-6">
        อัปเดตล่าสุด
      </div>

      <p className="text-lg text-gray-300 mb-6">
        {article.excerpt}
      </p>

      <hr className="border-gray-800 mb-8" />

      <div
        className="prose prose-invert prose-lg max-w-none
                   leading-8
                   [&_p]:mb-5
                   [&_h2]:mt-10
                   [&_h2]:mb-4
                   [&_ul]:my-6
                   [&_li]:mb-2"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* SOURCE */}
      {article.source_url && (
        <p className="mt-10 text-sm text-gray-400">
          แหล่งที่มา:{" "}
          <a href={article.source_url} target="_blank" className="underline">
            {article.source_url}
          </a>
        </p>
      )}
    </div>
  );
}