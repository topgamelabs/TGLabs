import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/articles?slug=eq.${decodedSlug}&select=*`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      cache: "no-store",
    }
  );

  const data = await res.json();
  const article = data[0];

  if (!article) {
    return {
      title: "Article not found",
    };
  }

  return {
    title: article.title,
    description: article.excerpt,
    alternates: {
      canonical: `https://tglabs.info/news/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `https://tglabs.info/news/${article.slug}`,
      type: "article",
      publishedTime: article.published_at ?? article.created_at,
      authors: [article.author_name ?? "TopGame Thailand"],
    },
  };
}

async function getArticle(slug: string) {
  const decodedSlug = decodeURIComponent(slug);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/articles?slug=eq.${decodedSlug}&select=*`,
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

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) return notFound();

  return (
    <main className="bg-black text-white min-h-screen">
      {/* HERO */}
      <div className="relative h-[320px] bg-gradient-to-b from-black to-[#0A0A0A] flex items-end">
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative max-w-4xl mx-auto px-5 pb-6">
          {/* Category */}
          <div className="text-xs text-tg-red mb-2 uppercase">
            {article.category}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="text-sm text-gray-500 mt-3">
            อัปเดตล่าสุด • อ่าน 3 นาที
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-5 py-10">
        {/* Excerpt */}
        <p className="text-gray-400 mb-6 text-lg">
          {article.excerpt}
        </p>

        {/* Divider */}
        <hr className="border-gray-800 my-8" />

        {/* Article Content */}
        <div
          className="
            prose prose-invert prose-lg max-w-none
            leading-8
            [&_p]:mb-5
            [&_h2]:mt-10
            [&_h2]:mb-4
            [&_ul]:my-6
            [&_li]:mb-2
          "
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </main>
  );
}