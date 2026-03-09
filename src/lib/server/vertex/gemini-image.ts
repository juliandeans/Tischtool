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

export const getGeminiGenerateContentUrl = (projectId: string) =>
  `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${GEMINI_IMAGE_MODEL}:generateContent`;

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
  accessToken: string
): Promise<GeminiImageEditOutput> {
  const response = await fetch(getGeminiGenerateContentUrl(projectId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(buildGeminiImageEditPayload(input))
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
