import sharp from "sharp";
import { env } from "$env/dynamic/private";

export interface OpenAIImageEditInput {
  sourceImageBuffer: Buffer;
  sourceImageMimeType: string;
  secondaryImageBuffer?: Buffer;
  secondaryImageMimeType?: string;
  promptText: string;
}

export interface OpenAIImageEditOutput {
  imageBase64: string;
  mimeType: string;
}

export const OPENAI_IMAGE_MODEL = "gpt-image-1";
export const OPENAI_API_URL = "https://api.openai.com/v1/images/edits";

export async function callOpenAIImageEdit(
  input: OpenAIImageEditInput
): Promise<OpenAIImageEditOutput> {
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const originalRoomMetadata = input.secondaryImageBuffer
    ? await sharp(input.secondaryImageBuffer).rotate().metadata()
    : null;
  const originalRoomWidth = originalRoomMetadata?.width ?? null;
  const originalRoomHeight = originalRoomMetadata?.height ?? null;

  const resizedSource = await sharp(input.sourceImageBuffer)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  const resizedSecondary =
    input.secondaryImageBuffer && input.secondaryImageMimeType
      ? await sharp(input.secondaryImageBuffer)
          .rotate()
          .resize({ width: 1500, withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer()
      : null;

  const formData = new FormData();
  formData.append("model", OPENAI_IMAGE_MODEL);
  formData.append("prompt", input.promptText);
  formData.append("n", "1");
  formData.append("size", "auto");
  formData.append(
    "image[]",
    new Blob([new Uint8Array(resizedSource)], {
      type: "image/jpeg",
    }),
    "source.jpg"
  );

  if (resizedSecondary) {
    formData.append(
      "image[]",
      new Blob([new Uint8Array(resizedSecondary)], {
        type: "image/jpeg",
      }),
      "room.jpg"
    );
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });
  const json = (await response.json().catch(() => null)) as {
    error?: { message?: string };
    data?: Array<{ b64_json?: string }>;
  } | null;

  if (!response.ok) {
    throw new Error(
      json?.error?.message ||
        `OpenAI request failed with status ${response.status}.`
    );
  }

  const b64 = json?.data?.[0]?.b64_json;

  if (!b64) {
    throw new Error("OpenAI response contains no image.");
  }

  const outputBuffer = Buffer.from(b64, "base64");
  const finalBuffer =
    originalRoomWidth && originalRoomHeight && input.secondaryImageBuffer
      ? await sharp(outputBuffer)
          .resize({
            width: originalRoomWidth,
            height: originalRoomHeight,
            fit: "cover",
            position: "centre",
          })
          .png()
          .toBuffer()
      : await sharp(outputBuffer).png().toBuffer();

  return {
    imageBase64: finalBuffer.toString("base64"),
    mimeType: "image/png",
  };
}
