import { CategoryNewsPage } from "@/components/news/CategoryNewsPage";

export const revalidate = 60;

export default async function PcConsoleNewsPage() {
  return (
    <CategoryNewsPage
      category="pc-console"
      title="PC/Console"
      description="ข่าวเกม PC, Steam, PlayStation, Xbox, Switch และเกมคอนโซลที่ผู้เล่นควรรู้"
      label="PC/Console"
      accentClass="text-[#F97316]"
    />
  );
}
