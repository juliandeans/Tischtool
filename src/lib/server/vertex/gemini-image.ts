import sharp from 'sharp';

export interface GeminiImageEditInput {
  sourceImageBase64: string;
  sourceImageMimeType: string;
  promptText: string;
}

export interface GeminiImageEditOutput {
  imageBase64: string;
  mimeType: string;
  text?: string;
}

export const GEMINI_IMAGE_MODEL = 'gemini-3-pro-image-preview';
export const GEMINI_FLASH_IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

export const getGeminiGenerateContentUrl = (
  projectId: string,
  modelId: string = GEMINI_IMAGE_MODEL
) =>
  `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${modelId}:generateContent`;

export const buildGeminiImageEditPayload = (input: GeminiImageEditInput) => ({
  contents: [
    {
      role: 'USER',
      parts: [
        {
          inlineData: {
            mimeType: input.sourceImageMimeType,
            data: input.sourceImageBase64
          }
        },
        {
          text: input.promptText
        }
      ]
    }
  ],
  generationConfig: {
    responseModalities: ['TEXT', 'IMAGE']
  }
});

export async function callGeminiImageEdit(
  input: GeminiImageEditInput,
  projectId: string,
  accessToken: string,
  model: string = GEMINI_IMAGE_MODEL
): Promise<GeminiImageEditOutput> {
  const normalizedImageBytes = await sharp(Buffer.from(input.sourceImageBase64, 'base64'))
    .rotate()
    .png()
    .toBuffer();
  const normalizedInput: GeminiImageEditInput = {
    ...input,
    sourceImageBase64: normalizedImageBytes.toString('base64'),
    sourceImageMimeType: 'image/png'
  };

  const response = await fetch(getGeminiGenerateContentUrl(projectId, model), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(buildGeminiImageEditPayload(normalizedInput))
  });

  const payload = (await response.json()) as {
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
    throw new Error(payload.error?.message || `Gemini request failed with status ${response.status}.`);
  }

  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data);
  const textPart = parts.find((part) => typeof part.text === 'string' && part.text.trim().length > 0);

  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini response does not contain an image part.');
  }

  return {
    imageBase64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || 'image/png',
    text: textPart?.text
  };
}
