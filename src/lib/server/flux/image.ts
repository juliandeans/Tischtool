import sharp from "sharp";
import { env } from "$env/dynamic/private";

export interface FluxImageEditInput {
  sourceImageBuffer: Buffer;
  sourceImageMimeType: string;
  secondaryImageBuffer?: Buffer;
  secondaryImageMimeType?: string;
  promptText: string;
}

export interface FluxImageEditOutput {
  imageBase64: string;
  mimeType: string;
}

export type FluxImageModel = "flux-2-pro" | "flux-2-pro-preview";

type FluxCreateResponse = {
  id?: string;
  polling_url?: string;
  message?: string;
  detail?: unknown; // war: string
};

type FluxPollingResponse = {
  status?: string;
  result?: { sample?: string; [key: string]: unknown };
  message?: string;
  detail?: unknown; // war: string
};

export const FLUX_API_BASE_URL = "https://api.bfl.ai/v1";
export const FLUX_POLL_INTERVAL_MS = 1000;
export const FLUX_POLL_TIMEOUT_MS = 120_000;

const DEFAULT_OUTPUT_DIMENSION = 1024;
const MAX_OUTPUT_DIMENSION = 2048;
const MIN_OUTPUT_DIMENSION = 32;
const OUTPUT_DIMENSION_STEP = 32;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const roundToFluxDimension = (value: number | null | undefined) => {
  const safeValue = Number.isFinite(value)
    ? Math.round(value as number)
    : DEFAULT_OUTPUT_DIMENSION;
  const clamped = Math.max(
    MIN_OUTPUT_DIMENSION,
    Math.min(MAX_OUTPUT_DIMENSION, safeValue)
  );

  return Math.max(
    MIN_OUTPUT_DIMENSION,
    Math.round(clamped / OUTPUT_DIMENSION_STEP) * OUTPUT_DIMENSION_STEP
  );
};

const getFluxCreateUrl = (model: FluxImageModel) =>
  `${FLUX_API_BASE_URL}/${model}`;

const extractFluxErrorMessage = (
  payload: { message?: unknown; detail?: unknown } | null,
  fallback: string
): string => {
  const msg = payload?.message || payload?.detail;
  if (!msg) return fallback;
  if (typeof msg === "string") return msg;
  return JSON.stringify(msg);
};

export async function callFluxImageEdit(
  input: FluxImageEditInput,
  model: FluxImageModel
): Promise<FluxImageEditOutput> {
  const apiKey = env.BFL_API_KEY;

  if (!apiKey) {
    throw new Error("BFL_API_KEY is not configured.");
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
  const targetMetadata = await sharp(
    resizedSecondary ?? resizedSource
  ).metadata();
  const width = roundToFluxDimension(targetMetadata.width);
  const height = roundToFluxDimension(targetMetadata.height);
  const payload = {
    prompt: input.promptText,
    input_image: resizedSource.toString("base64"),
    input_image_2: resizedSecondary?.toString("base64"),
    width,
    height,
    output_format: "jpeg",
    prompt_upsampling: false,
    safety_tolerance: 5,
  };

  console.log("[debug][flux] sending request", {
    model,
    width,
    height,
    sourceBytes: resizedSource.byteLength,
    secondaryBytes: resizedSecondary?.byteLength ?? 0,
  });

  const createResponse = await fetch(getFluxCreateUrl(model), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-key": apiKey,
    },
    body: JSON.stringify(payload),
  });
  const createPayload = (await createResponse
    .json()
    .catch(() => null)) as FluxCreateResponse | null;

  if (!createResponse.ok) {
    throw new Error(
      extractFluxErrorMessage(
        createPayload,
        `FLUX request failed with status ${createResponse.status}.`
      )
    );
  }

  if (!createPayload?.polling_url) {
    throw new Error("FLUX response did not include a polling_url.");
  }

  console.log("[debug][flux] request accepted", {
    model,
    id: createPayload.id ?? null,
    pollingUrlPresent: true,
  });

  const startedAt = Date.now();

  while (Date.now() - startedAt < FLUX_POLL_TIMEOUT_MS) {
    const pollingResponse = await fetch(createPayload.polling_url, {
      method: "GET",
      headers: {
        "x-key": apiKey,
      },
    });
    const pollingPayload = (await pollingResponse
      .json()
      .catch(() => null)) as FluxPollingResponse | null;

    if (!pollingResponse.ok) {
      throw new Error(
        extractFluxErrorMessage(
          pollingPayload,
          `FLUX polling failed with status ${pollingResponse.status}.`
        )
      );
    }

    console.log("[debug][flux] polling response", {
      model,
      status: pollingPayload?.status ?? "unknown",
    });

    if (pollingPayload?.status === "Ready") {
      const sampleUrl = pollingPayload.result?.sample;

      if (!sampleUrl) {
        throw new Error(
          "FLUX result is Ready but does not include result.sample."
        );
      }

      const assetResponse = await fetch(sampleUrl);

      if (!assetResponse.ok) {
        throw new Error(
          `FLUX result download failed with status ${assetResponse.status}.`
        );
      }

      const assetBytes = new Uint8Array(await assetResponse.arrayBuffer());
      const outputBuffer = Buffer.from(assetBytes);
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

    if (pollingPayload?.status === "Error") {
      throw new Error(
        extractFluxErrorMessage(
          pollingPayload,
          "FLUX returned status Error during polling."
        )
      );
    }

    await sleep(FLUX_POLL_INTERVAL_MS);
  }

  throw new Error(
    `FLUX polling timed out after ${FLUX_POLL_TIMEOUT_MS / 1000} seconds.`
  );
}
