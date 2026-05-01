import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { processNewsURL } from "@/lib/aiNews";

const parser = new Parser();

// 🔥 ใช้ feed ที่เสถียรกว่า
const FEEDS = [
  "https://feeds.feedburner.com/ign/all",
  "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
];

export async function GET() {
  try {
    let total = 0;

    for (const feed of FEEDS) {
      try {
        console.log("FETCH RSS:", feed);

        const data = await parser.parseURL(feed);
        const items = data.items.slice(0, 2);

        console.log("FOUND:", items.length);

        for (const item of items) {
          if (!item.link) continue;

          console.log("PROCESS:", item.link);

          await processNewsURL(item.link);
          total++;
        }
      } catch (err: any) {
        console.error("RSS ERROR:", feed, err.message);
        continue; // 🔥 ข้าม feed ที่พัง
      }
    }

    return NextResponse.json({
      success: true,
      processed: total,
    });
  } catch (err: any) {
    console.error("CRON ERROR:", err);
    return NextResponse.json({
      error: err.message,
    });
  }
}