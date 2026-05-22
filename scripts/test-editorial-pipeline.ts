import { runEditorialPipeline } from "@/lib/ai/editorial"

const sample = {
  title:
    process.argv[2] ||
    "Sample mobile RPG opens pre-registration with launch rewards",
  url: process.argv[3] || "https://example.com/sample-mobile-rpg-news",
  source: "local-test",
  excerpt:
    "A mobile RPG has opened pre-registration on iOS and Android with launch rewards for players.",
  content:
    "The game is planned for iOS and Android. Players can pre-register to receive launch rewards, including in-game currency and limited items.",
}

async function main() {
  const result = await runEditorialPipeline(sample, {
    dryRun: true,
    enableResearch: false,
  })

  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
