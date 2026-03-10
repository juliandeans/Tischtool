import sharp from "sharp";

export interface GeminiImageEditInput {
  sourceImageBase64: string;
  sourceImageMimeType: string;
  secondaryImageBase64?: string;
  secondaryImageMimeType?: string;
  promptText: string;
}

export interface GeminiImageEditOutput {
  imageBase64: string;
  mimeType: string;
  text?: string;
}

export const GEMINI_IMAGE_MODEL = "gemini-3-pro-image-preview";
export const GEMINI_FLASH_IMAGE_MODEL = "gemini-3.1-flash-image-preview";
export const GEMINI_25_FLASH_IMAGE_MODEL = "gemini-2.5-flash-image-preview";

export const getGeminiGenerateContentUrl = (
  projectId: string,
  modelId: string = GEMINI_IMAGE_MODEL,
  location: string = "global"
) =>
  `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

export const buildGeminiImageEditPayload = (input: GeminiImageEditInput) => {
  const parts: Array<
    | {
        inlineData: {
          mimeType: string;
          data: string;
        };
      }
    | {
        text: string;
      }
  > = [
    {
      inlineData: {
        mimeType: input.sourceImageMimeType,
        data: input.sourceImageBase64,
      },
    },
  ];

  if (input.secondaryImageBase64 && input.secondaryImageMimeType) {
    parts.push({
      inlineData: {
        mimeType: input.secondaryImageMimeType,
        data: input.secondaryImageBase64,
      },
    });
  }

  parts.push({
    text: input.promptText,
  });

  return {
    contents: [
      {
        role: "USER",
        parts,
      },
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  };
};

export async function callGeminiImageEdit(
  input: GeminiImageEditInput,
  projectId: string,
  accessToken: string,
  model: string = GEMINI_IMAGE_MODEL
): Promise<GeminiImageEditOutput> {
  const originalSecondaryImageBytes = input.secondaryImageBase64
    ? Buffer.from(input.secondaryImageBase64, "base64")
    : null;
  const originalSecondaryMetadata = originalSecondaryImageBytes
    ? await sharp(originalSecondaryImageBytes).rotate().metadata()
    : null;
  const originalRoomWidth = originalSecondaryMetadata?.width ?? null;
  const originalRoomHeight = originalSecondaryMetadata?.height ?? null;
  const normalizedImageBytes = await sharp(
    Buffer.from(input.sourceImageBase64, "base64")
  )
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  const normalizedSecondaryImageBytes =
    input.secondaryImageBase64 && input.secondaryImageMimeType
      ? await sharp(Buffer.from(input.secondaryImageBase64, "base64"))
          .rotate()
          .resize({ width: 1500, withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer()
      : null;
  const normalizedInput: GeminiImageEditInput = {
    ...input,
    sourceImageBase64: normalizedImageBytes.toString("base64"),
    sourceImageMimeType: "image/jpeg",
    secondaryImageBase64: normalizedSecondaryImageBytes?.toString("base64"),
    secondaryImageMimeType: normalizedSecondaryImageBytes
      ? "image/jpeg"
      : undefined,
  };
  const primaryBase64 = normalizedInput.sourceImageBase64;
  const secondaryBase64 = normalizedInput.secondaryImageBase64;
  const payload = buildGeminiImageEditPayload(normalizedInput);
  const { contents } = payload;

  console.log("[debug][gemini] sending request", {
    partsCount: contents[0].parts.length,
    primaryBytes: primaryBase64?.length,
    secondaryBytes: secondaryBase64?.length ?? 0,
  });

  const response = await fetch(getGeminiGenerateContentUrl(projectId, model), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  console.log("[debug][gemini] response received", {
    status: response.status,
    ok: response.ok,
  });

  const responsePayload = (await response.json()) as {
    error?: { message?: string };
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { mimeType?: string; data?: string };
          text?: string;
        }>;
      };
    }>;
  };

  if (!response.ok) {
    throw new Error(
      responsePayload.error?.message ||
        `Gemini request failed with status ${response.status}.`
    );
  }

  const parts = responsePayload.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data);
  const textPart = parts.find(
    (part) => typeof part.text === "string" && part.text.trim().length > 0
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini response does not contain an image part.");
  }

  const geminiOutputBuffer = Buffer.from(imagePart.inlineData.data, "base64");
  let finalImageBuffer: Uint8Array = geminiOutputBuffer;
  let finalMimeType = imagePart.inlineData.mimeType || "image/png";

  if (originalRoomWidth && originalRoomHeight && originalSecondaryImageBytes) {
    const beforeMetadata = await sharp(geminiOutputBuffer).metadata();
    const outputResized = await sharp(geminiOutputBuffer)
      .resize({
        width: originalRoomWidth,
        height: originalRoomHeight,
        fit: "cover",
        position: "centre",
      })
      .png()
      .toBuffer();

    console.log("[debug][gemini] dimension-correction", {
      inputWidth: originalRoomWidth,
      inputHeight: originalRoomHeight,
      outputBeforeCorrection: {
        w: beforeMetadata.width ?? null,
        h: beforeMetadata.height ?? null,
      },
      corrected: true,
    });

    finalImageBuffer = outputResized;
    finalMimeType = "image/png";
  }

  return {
    imageBase64: Buffer.from(finalImageBuffer).toString("base64"),
    mimeType: finalMimeType,
    text: textPart?.text,
  };
}
