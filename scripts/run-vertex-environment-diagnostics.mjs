import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.APP_BASE_URL || 'http://127.0.0.1:4173';
const reportRoot = path.resolve(process.cwd(), 'data', '_debug', 'diagnostic-reports');

const TESTS = [
  { name: 'nur Wand gelb', instructions: 'gelbe Wand' },
  { name: 'nur Bücher ins Regal', instructions: 'Bücher ins Regal' },
  { name: 'nur Pflanzen auf das Regal', instructions: 'Pflanzen auf das Regal' },
  { name: 'nur Hintergrund dunkelgrün', instructions: 'Hintergrund dunkelgrün' }
];

const requestJson = async (url, init) => {
  const response = await fetch(url, init);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`${url} -> ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
};

const pickSourceImage = async () => {
  const projectsPayload = await requestJson(`${baseUrl}/api/projects`);

  for (const project of projectsPayload.projects) {
    const projectImages = await requestJson(`${baseUrl}/api/projects/${project.id}/images`);

    for (const image of projectImages.images) {
      const imagePayload = await requestJson(`${baseUrl}/api/images/${image.id}`);

      if (imagePayload.image.type !== 'generated') {
        return {
          project,
          image: imagePayload.image
        };
      }
    }
  }

  throw new Error('Kein geeignetes Ausgangsbild gefunden.');
};

const inferMaskAssessment = (instructions) => {
  const normalized = instructions.toLowerCase();

  if (normalized.includes('wand') || normalized.includes('hintergrund')) {
    return 'Wahrscheinlich zulaessig: Background-Swap sollte Hintergrund- und Wandflaechen prinzipiell erfassen.';
  }

  if (normalized.includes('bücher') || normalized.includes('pflanzen')) {
    return 'Eher kritisch: Eine automatische Hintergrundmaske schuetzt oft das Hauptobjekt und erlaubt neue Details auf/nahe dem Objekt nur eingeschraenkt.';
  }

  return 'Unklar: die automatische Hintergrundmaske kann die gewuenschte Region eventuell nicht praezise freigeben.';
};

const run = async () => {
  const source = await pickSourceImage();
  const results = [];

  for (const test of TESTS) {
    const payload = await requestJson(`${baseUrl}/api/generations`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        projectId: source.project.id,
        sourceImageId: source.image.id,
        mode: 'environment_edit',
        variantsRequested: 1,
        stylePreset: 'original',
        lightPreset: 'original',
        instructions: test.instructions,
        targetMaterial: null,
        surfaceDescription: '',
        preserveObject: true,
        preservePerspective: true,
        protectionRules: {
          preserveObject: true,
          preservePerspective: true,
          preserveFrame: true,
          noExtraFurniture: true,
          changeEnvironmentFirst: true
        },
        placement: null
      })
    });

    const runDebug = payload.promptDebug.providerDebug.run;
    const findArtifact = (label) =>
      runDebug?.artifacts?.find((artifact) => artifact.label === label)?.relativePath ?? null;

    results.push({
      test: test.name,
      sourceImageId: source.image.id,
      prompt: payload.promptDebug.promptText,
      editMode: payload.promptDebug.providerDebug.request.providerParameters.editMode ?? null,
      maskMode: payload.promptDebug.providerDebug.request.providerParameters.maskMode ?? null,
      runId: runDebug?.runId ?? null,
      actualFlow: runDebug?.usedFlow ?? null,
      httpStatus: runDebug?.responseStatus ?? null,
      predictionCount: runDebug?.predictionsCount ?? null,
      automaticMask: findArtifact('input-mask-approximation'),
      automaticMaskOverlay: findArtifact('input-mask-overlay'),
      providerOutput: findArtifact('provider-output-1'),
      storedOutput: findArtifact('stored-output-1'),
      displayedOutput: findArtifact('displayed-output-1'),
      storedMatchesProvider: runDebug?.persistedImages?.[0]?.storedMatchesProvider ?? null,
      storedMatchesProviderReason:
        runDebug?.persistedImages?.[0]?.storedMatchesProviderReason ?? null,
      maskAssessment: inferMaskAssessment(test.instructions)
    });
  }

  await mkdir(reportRoot, { recursive: true });
  const reportPath = path.join(reportRoot, `environment-diagnostic-${Date.now()}.json`);
  await writeFile(reportPath, JSON.stringify(results, null, 2), 'utf8');

  console.log(
    JSON.stringify(
      {
        baseUrl,
        projectId: source.project.id,
        sourceImageId: source.image.id,
        reportPath,
        results
      },
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
