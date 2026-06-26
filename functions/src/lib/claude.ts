import Anthropic from "@anthropic-ai/sdk";
import { BRAND } from "../brand";
import { CONFIG } from "../config";
import { PILLARS } from "../pillars";
import { GeneratedCaption, Pillar } from "../types";

// Generates an on-brand caption, hashtags, and an image prompt for a pillar.
export async function generateCaption(
  pillar: Pillar,
  apiKey: string
): Promise<GeneratedCaption> {
  const client = new Anthropic({ apiKey });
  const spec = PILLARS[pillar];

  const system = [
    `You are the Instagram content writer for ${BRAND.name} (${BRAND.handle}), tagline "${BRAND.tagline}".`,
    `About: ${BRAND.oneLiner}`,
    `Core message: ${BRAND.coreMessage}`,
    `Audience: ${BRAND.audience}`,
    `Voice: ${BRAND.voice}`,
    `Never: ${BRAND.avoid}`,
    `Caption rules: open with a scroll-stopping hook as the first line; then 120-250 words, conversational, speaking directly to the reader ("you"/"your"); reframe any Stoic/anime reference for this gym-identity tribe; end with a question, a challenge, or "tag someone who needs this". Mention the brand only when it feels natural. UK English. At most one or two emojis.`,
  ].join("\n");

  const user = [
    `Write one Instagram post for the "${spec.label}" content pillar.`,
    `Brief: ${spec.captionBrief}`,
    `Also propose an image generation prompt consistent with this visual style: ${BRAND.visualStyle}`,
    spec.imageBrief ? `Image starting point: ${spec.imageBrief}` : "",
    `Return ONLY valid JSON, no markdown fences, with this shape:`,
    `{"caption": string, "hashtags": string[10-15 tags, with or without the # prefix], "imagePrompt": string}`,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await client.messages.create({
    model: CONFIG.captionModel,
    max_tokens: 1200,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  const parsed = JSON.parse(stripFences(text)) as GeneratedCaption;

  // Normalise hashtags to "#tag" and merge with the brand base set (deduped).
  const norm = (t: string) => "#" + t.replace(/^#/, "").trim();
  const tags = new Set<string>([
    ...BRAND.baseHashtags,
    ...(parsed.hashtags ?? []).map(norm),
  ]);

  return {
    caption: parsed.caption.trim(),
    hashtags: [...tags].slice(0, 15),
    imagePrompt: parsed.imagePrompt?.trim() || spec.imageBrief || "",
  };
}

function stripFences(s: string): string {
  return s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
}
