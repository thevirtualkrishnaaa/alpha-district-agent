import { Pillar } from "./types";
import { BRAND } from "./brand";

export interface PillarSpec {
  id: Pillar;
  label: string;
  aiImage: boolean; // true → agent AI-generates the image
  captionBrief: string;
  imageBrief?: string; // base fragment fed to the image model
  research?: string; // if set, the agent web-searches this before writing
}

const STYLE = BRAND.visualStyle;

export const PILLARS: Record<Pillar, PillarSpec> = {
  gym_motivation: {
    id: "gym_motivation",
    label: "Gym Motivation & Culture",
    aiImage: true,
    captionBrief:
      "Raw, gritty gym-lifestyle motivation — consistency, showing up on bad days, the 'do it again tomorrow' mentality, powerlifting/bodybuilding culture. Honest, not toxic positivity.",
    imageBrief: `A gritty, cinematic gym / powerlifting scene — heavy barbell, chalk, low-key dramatic lighting, focused lone athlete (no readable faces or logos). ${STYLE} No text.`,
    research:
      "a gym/powerlifting/bodybuilding topic, debate, or moment trending in the fitness community in the last week or two (e.g. a notable lift, a viral training take, a community talking point)",
  },
  nutrition: {
    id: "nutrition",
    label: "Nutrition, Protein & Meals",
    aiImage: true,
    captionBrief:
      "Practical high-protein nutrition the tribe will save — a meal idea with rough macros, budget student-friendly, or a myth debunked. Useful and specific, not generic.",
    imageBrief: `Moody premium food photography of a high-protein meal (chicken/eggs/rice/greens) on a dark surface. ${STYLE} Appetising, cinematic, no text, no hands.`,
    research:
      "a specific high-protein meal idea (with rough macros and UK budget angle) or a recent, credible sports-nutrition insight relevant to gym-goers",
  },
  identity: {
    id: "identity",
    label: "Identity, Philosophy & Anime",
    aiImage: true,
    captionBrief:
      "The soul of the brand. Reframe a Stoic idea or an anime training arc for gym discipline and identity. Freedom vs Constraint.",
    imageBrief: `A bold manga / anime-inspired illustration of a disciplined warrior/athlete, high-contrast linework, stoic and intense. ${STYLE} Centered, no text.`,
    research:
      "an authentic Stoic quote (name the philosopher — Marcus Aurelius, Epictetus or Seneca) OR a specific anime training/discipline moment (Baki, Hajime no Ippo, Vinland Saga, Kengan Ashura) to reframe for gym identity",
  },
  london: {
    id: "london",
    label: "London Fitness Scene",
    aiImage: true,
    captionBrief:
      "Hyperlocal London gym-culture content — a shout-out to the city's strength community, training in London on a budget, or London vs elsewhere gym culture. Community-building.",
    imageBrief: `A gritty East London / urban gym scene at dusk, cinematic, moody, recognisably city but no readable signage or logos. ${STYLE} No text.`,
    research:
      "a real London (or UK) fitness/strength event in the next ~30 days — a powerlifting meet, bodybuilding show (UKBFF), strength expo, or competition — with its name and date if available",
  },
  brand: {
    id: "brand",
    label: "Alpha District Brand",
    aiImage: true,
    captionBrief:
      "Organic brand post (never a hard ad in Month 1). Freedom vs Constraint — why generic gym wear constrains identity; what Alpha District is building and why it matters to YOU. Mention the brand naturally.",
    imageBrief: `An atmospheric identity / apparel mood shot — an oversized dark gym hoodie aesthetic on a lone figure in shadow, premium and raw (do NOT fabricate a specific real product or logo). ${STYLE} No text.`,
    // No web research — brand posts come from internal context.
  },
};

// Pillars the agent can fully auto-generate (all have AI imagery).
export const AUTO_PILLARS: Pillar[] = Object.values(PILLARS)
  .filter((p) => p.aiImage)
  .map((p) => p.id);

// Rotate sequentially through all five pillars by calendar day, so even on a
// 3x/week schedule every pillar (incl. brand + London) still comes round.
const ROTATION: Pillar[] = [
  "gym_motivation",
  "nutrition",
  "identity",
  "london",
  "brand",
];

export function pickPillar(date = new Date()): Pillar {
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  return ROTATION[dayIndex % ROTATION.length];
}
