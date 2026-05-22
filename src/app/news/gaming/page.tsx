import { CategoryNewsPage } from "@/components/news/CategoryNewsPage";

export const revalidate = 60;

export default async function GamingNewsPage() {
  return (
    <CategoryNewsPage
      category="gaming"
      title="Gaming News"
      description="ข่าวทั่วไปในวงการเกม ธุรกิจเกม ประเด็นจากผู้เล่น และความเคลื่อนไหวสำคัญของอุตสาหกรรม"
      label="Gaming"
      accentClass="text-[#4A90D9]"
      includeLegacyNews
    />
  );
}
