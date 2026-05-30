import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, "..")
const width = 1080
const height = 1350
const fontConfigPath = path.join(root, "output", "facebook-creative", "fonts.conf")

if (fs.existsSync(fontConfigPath)) {
  process.env.FONTCONFIG_FILE = fontConfigPath
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/)
    if (!match) continue

    const key = match[1]
    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!process.env[key]) process.env[key] = value
  }
}

function parseArgs() {
  const parsed = {
    articleId: "",
    background: "",
    headline: "",
    output: "",
  }
  const args = process.argv.slice(2)

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === "--article-id") parsed.articleId = args[++i] || ""
    if (arg === "--background") parsed.background = args[++i] || ""
    if (arg === "--headline") parsed.headline = args[++i] || ""
    if (arg === "--output") parsed.output = args[++i] || ""
  }

  return parsed
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

function dataUrl(filePath, mimeType) {
  return `data:${mimeType};base64,${fs.readFileSync(filePath).toString("base64")}`
}

function headlineLines(value) {
  const lines = value
    .split("|")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)

  if (lines.length === 3) {
    return lines
  }

  throw new Error(
    "HEADLINE_THREE_LINES_REQUIRED: summarize the full article into exactly 3 short lines separated by |"
  )
}

function lineColor(line) {
  return /[A-Za-z]/.test(line) ? "#ff1a1a" : "#ffffff"
}

async function renderTextLayer(sharp, text, options) {
  const input = {
    text: {
      text,
      font: `${options.family} ${options.size}`,
      fontfile: options.fontFile,
      rgba: true,
    },
  }

  return sharp(input).png().toBuffer({ resolveWithObject: true })
}

async function renderFittedHeadline(sharp, lines, fontFile) {
  const maxWidth = 900
  const maxBlockHeight = 245
  const minFontSize = 66
  const lineGap = 18

  for (let size = 92; size >= minFontSize; size -= 2) {
    const rendered = []

    for (const line of lines) {
      rendered.push(
        await renderTextLayer(sharp, line, {
          family: "Kanit Black",
          fontFile,
          size,
        })
      )
    }

    const widest = Math.max(...rendered.map((item) => item.info.width))
    const blockHeight =
      rendered.reduce((sum, item) => sum + item.info.height, 0) +
      lineGap * (rendered.length - 1)

    if (widest <= maxWidth && blockHeight <= maxBlockHeight) {
      return { rendered, size, blockHeight, lineGap }
    }
  }

  throw new Error("HEADLINE_DOES_NOT_FIT_THREE_LINES")
}

async function colorizeTextMask(sharp, textLayer, color) {
  const alpha = await sharp(textLayer.data).ensureAlpha().extractChannel("alpha").toBuffer()

  return sharp({
    create: {
      width: textLayer.info.width,
      height: textLayer.info.height,
      channels: 3,
      background: color,
    },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer()
}

async function loadArticle(supabase, articleId) {
  const { data, error } = await supabase
    .from("articles")
    .select("id,title,slug,excerpt")
    .eq("id", articleId)
    .single()

  if (error) throw new Error(`ARTICLE_SELECT_FAILED: ${error.message}`)
  return data
}

async function main() {
  loadDotEnv(path.join(root, ".env.local"))
  const args = parseArgs()
  if (!args.articleId) throw new Error("--article-id is required")
  if (!args.background) throw new Error("--background is required")
  if (!args.headline) {
    throw new Error(
      '--headline is required. Summarize the full article into exactly 3 attention-grabbing lines separated by "|".'
    )
  }
  if (!args.output) throw new Error("--output is required")

  const { default: sharp } = await import("sharp")
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  )
  const article = await loadArticle(supabase, args.articleId)
  const backgroundPath = path.resolve(root, args.background)
  const outputPath = path.resolve(root, args.output)
  const logoPath = path.join(root, "public", "images", "topgame-mark-white-alpha.png")
  const kanit900Path = path.join(root, "public", "fonts", "kanit-900.ttf")
  const kanit300Path = path.join(root, "public", "fonts", "kanit-300.ttf")
  const bgUrl = dataUrl(backgroundPath, "image/png")
  const logoUrl = dataUrl(logoPath, "image/png")
  const titleLines = headlineLines(args.headline)
  const headline = await renderFittedHeadline(sharp, titleLines, kanit900Path)

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="headlineFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000000" stop-opacity="0"/>
      <stop offset="0.2" stop-color="#000000" stop-opacity="0.12"/>
      <stop offset="0.42" stop-color="#000000" stop-opacity="0.48"/>
      <stop offset="0.66" stop-color="#000000" stop-opacity="0.82"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.98"/>
    </linearGradient>
    <linearGradient id="topgameRule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ff1a1a" stop-opacity="0"/>
      <stop offset="0.18" stop-color="#ff1a1a" stop-opacity="0.34"/>
      <stop offset="0.5" stop-color="#ff1a1a" stop-opacity="1"/>
      <stop offset="0.82" stop-color="#ff1a1a" stop-opacity="0.34"/>
      <stop offset="1" stop-color="#ff1a1a" stop-opacity="0"/>
    </linearGradient>
    <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.85"/>
    </filter>
    <filter id="logoShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#ffffff" flood-opacity="0.55"/>
      <feDropShadow dx="0" dy="7" stdDeviation="10" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="#050505"/>
  <image href="${bgUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
  <rect x="0" y="630" width="${width}" height="720" fill="url(#headlineFade)"/>
  <image href="${logoUrl}" x="480" y="842" width="120" height="96" preserveAspectRatio="xMidYMid meet" filter="url(#logoShadow)"/>
  <rect x="190" y="970" width="700" height="4" fill="url(#topgameRule)"/>
  <rect x="0" y="${height - 3}" width="${width}" height="3" fill="#ff1a1a"/>
</svg>`

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  const composites = []
  const blockTop = Math.round(1005 + (225 - headline.blockHeight) / 2)
  let currentTop = blockTop

  for (let index = 0; index < titleLines.length; index++) {
    const line = titleLines[index]
    const rendered = headline.rendered[index]
    const left = Math.round((width - rendered.info.width) / 2)

    const shadowBuffer = await colorizeTextMask(sharp, rendered, "#000000")
    const blurredShadowBuffer = await sharp(shadowBuffer)
      .blur(5)
      .png()
      .toBuffer()
    const colorBuffer = await colorizeTextMask(sharp, rendered, lineColor(line))

    composites.push({
      input: blurredShadowBuffer,
      left,
      top: currentTop + 4,
    })
    composites.push({
      input: colorBuffer,
      left,
      top: currentTop,
    })
    currentTop += rendered.info.height + headline.lineGap
  }

  const tagline = await renderTextLayer(sharp, "TopGame Thailand | อัปเดตข่าวสารวงการเกมได้ทุกวัน", {
    family: "Kanit Light",
    fontFile: kanit300Path,
    size: 24,
  })
  composites.push({
    input: await colorizeTextMask(sharp, tagline, "#d9d9d9"),
    left: Math.round((width - tagline.info.width) / 2),
    top: 1290,
  })

  await sharp(Buffer.from(svg)).png().composite(composites).toFile(outputPath)
  console.log(JSON.stringify({ success: true, articleId: article.id, output: outputPath }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
