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
  return data[0];
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);

  if (!article) return notFound();

  return (
    <main className="max-w-3xl mx-auto py-10 text-white">
      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

      <p className="text-gray-400 mb-6">{article.excerpt}</p>

      <div
        className="prose prose-invert"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </main>
  );
}