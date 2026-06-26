import Anthropic from "@anthropic-ai/sdk";
import { BRAND } from "../brand";
import { CONFIG } from "../config";
import { PILLARS } from "../pillars";
import { GeneratedCaption, Pillar } from "../types";

// Generates an on-brand caption, hashtags, and an image prompt for a pillar.
// For pillars with a `research` target, Claude web-searches a real, current
// hook first and grounds the caption in it.
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

  const researchLine = spec.research
    ? `First, use web search to find ${spec.research}. Ground the caption in that real, specific, current detail (don't invent it). `
    : "";

  const user = [
    `${researchLine}Write one Instagram post for the "${spec.label}" content pillar.`,
    `Brief: ${spec.captionBrief}`,
    `Also propose an image generation prompt consistent with this visual style: ${BRAND.visualStyle}`,
    spec.imageBrief ? `Image starting point: ${spec.imageBrief}` : "",
    `When done, your FINAL message must be ONLY this JSON object (no other text, no markdown fences):`,
    `{"caption": string, "hook": string (a punchy 3-6 word scroll-stopper for the image overlay, no emoji), "hashtags": string[10-15 tags, with or without the # prefix], "imagePrompt": string}`,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await client.messages.create({
    model: CONFIG.captionModel,
    max_tokens: 1500,
    system,
    messages: [{ role: "user", content: user }],
    // Server-side web search; Anthropic runs the searches and returns the
    // final answer in one call. Only enabled for pillars that need it.
    ...(spec.research
      ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }] as any }
      : {}),
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const parsed = JSON.parse(extractJson(text)) as GeneratedCaption;

  // Normalise hashtags to "#tag" and merge with the brand base set (deduped).
  const norm = (t: string) => "#" + t.replace(/^#/, "").trim();
  const tags = new Set<string>([
    ...BRAND.baseHashtags,
    ...(parsed.hashtags ?? []).map(norm),
  ]);

  return {
    caption: parsed.caption.trim(),
    hook: (parsed.hook || parsed.caption.split("\n")[0]).trim(),
    hashtags: [...tags].slice(0, 15),
    imagePrompt: parsed.imagePrompt?.trim() || spec.imageBrief || "",
  };
}

// Pulls the JSON object out of the model's final text, tolerating any
// surrounding narration or citations that web search may add.
function extractJson(s: string): string {
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in model response");
  }
  return s.slice(start, end + 1);
}
