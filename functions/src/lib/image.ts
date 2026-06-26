import OpenAI from "openai";
import { CONFIG } from "../config";

// Provider-agnostic image generation. Returns raw PNG bytes.
export interface ImageProvider {
  generate(prompt: string): Promise<Buffer>;
}

export class OpenAIImageProvider implements ImageProvider {
  private client: OpenAI;
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generate(prompt: string): Promise<Buffer> {
    const res = await this.client.images.generate({
      model: CONFIG.imageModel,
      prompt,
      size: CONFIG.imageSize,
      n: 1,
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image provider returned no image data");
    return Buffer.from(b64, "base64");
  }
}

// Placeholder for a future swap to Google Imagen (Vertex AI).
// Implement generate() the same way and switch the factory below.
export class ImagenProvider implements ImageProvider {
  async generate(_prompt: string): Promise<Buffer> {
    throw new Error("ImagenProvider not implemented yet");
  }
}

export function getImageProvider(openaiKey: string): ImageProvider {
  return new OpenAIImageProvider(openaiKey);
}
