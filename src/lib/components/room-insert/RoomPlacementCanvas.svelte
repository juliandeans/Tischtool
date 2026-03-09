<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import type { ImagePlacement } from '$lib/types/image';

  export let roomImageUrl = '';
  export let roomImageTitle = '';
  export let imageWidth: number | null = null;
  export let imageHeight: number | null = null;
  export let placement: ImagePlacement | null = null;

  const dispatch = createEventDispatcher<{
    change: ImagePlacement;
    reset: void;
  }>();

  let surfaceElement: HTMLDivElement | null = null;
  let dragStart: { x: number; y: number } | null = null;
  let livePlacement: ImagePlacement | null = null;

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const getIntrinsicSize = () => ({
    width: imageWidth ?? 1,
    height: imageHeight ?? 1
  });

  const getPoint = (event: PointerEvent) => {
    if (!surfaceElement) {
      return null;
    }

    const rect = surfaceElement.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return null;
    }

    const intrinsic = getIntrinsicSize();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = clamp(event.clientY - rect.top, 0, rect.height);

    return {
      x: Math.round((x / rect.width) * intrinsic.width),
      y: Math.round((y / rect.height) * intrinsic.height)
    };
  };

  const toRect = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const intrinsic = getIntrinsicSize();
    const x = clamp(Math.min(start.x, end.x), 0, intrinsic.width);
    const y = clamp(Math.min(start.y, end.y), 0, intrinsic.height);
    const maxWidth = intrinsic.width - x;
    const maxHeight = intrinsic.height - y;

    return {
      x,
      y,
      width: clamp(Math.abs(end.x - start.x), 0, maxWidth),
      height: clamp(Math.abs(end.y - start.y), 0, maxHeight)
    };
  };

  const buildClickPlacement = (point: { x: number; y: number }) => {
    const intrinsic = getIntrinsicSize();
    const defaultWidth = Math.max(120, Math.round(intrinsic.width * 0.24));
    const defaultHeight = Math.max(120, Math.round(intrinsic.height * 0.28));
    const x = clamp(point.x - Math.round(defaultWidth / 2), 0, intrinsic.width - defaultWidth);
    const y = clamp(point.y - Math.round(defaultHeight / 2), 0, intrinsic.height - defaultHeight);

    return {
      x,
      y,
      width: defaultWidth,
      height: defaultHeight
    };
  };

  const startPlacement = (event: PointerEvent) => {
    if (!roomImageUrl) {
      return;
    }

    const point = getPoint(event);

    if (!point) {
      return;
    }

    dragStart = point;
    livePlacement = {
      x: point.x,
      y: point.y,
      width: 0,
      height: 0
    };
    surfaceElement?.setPointerCapture(event.pointerId);
  };

  const movePlacement = (event: PointerEvent) => {
    if (!dragStart) {
      return;
    }

    const point = getPoint(event);

    if (!point) {
      return;
    }

    livePlacement = toRect(dragStart, point);
  };

  const finishPlacement = (event: PointerEvent) => {
    if (!dragStart) {
      return;
    }

    const point = getPoint(event) ?? dragStart;
    const candidate = toRect(dragStart, point);
    const isClick = candidate.width < 18 || candidate.height < 18;
    const nextPlacement = isClick ? buildClickPlacement(point) : candidate;

    dragStart = null;
    livePlacement = null;
    dispatch('change', nextPlacement);
    surfaceElement?.releasePointerCapture(event.pointerId);
  };

  $: displayedPlacement = livePlacement ?? placement;
  $: overlayStyle =
    displayedPlacement && imageWidth && imageHeight
      ? `left:${(displayedPlacement.x / imageWidth) * 100}%;top:${(displayedPlacement.y / imageHeight) * 100}%;width:${(displayedPlacement.width / imageWidth) * 100}%;height:${(displayedPlacement.height / imageHeight) * 100}%;`
      : '';
</script>

<div class="placement-card">
  <Card padded={false}>
    {#if roomImageUrl}
      <div class="placement">
        <div class="placement__surface-wrap">
          <div
            bind:this={surfaceElement}
            aria-label="Zielregion im Raumfoto setzen"
            class="placement__surface"
            on:pointerdown={startPlacement}
            on:pointermove={movePlacement}
            on:pointerup={finishPlacement}
            on:pointercancel={() => {
              dragStart = null;
              livePlacement = null;
            }}
            role="application"
          >
            <img class="placement__image" src={roomImageUrl} alt={roomImageTitle || 'Raumfoto'} />
            {#if displayedPlacement && imageWidth && imageHeight}
              <div class="placement__target" style={overlayStyle}>
                <div class="placement__target-label">
                  {displayedPlacement.width} × {displayedPlacement.height}
                </div>
              </div>
            {/if}
          </div>
        </div>
        <div class="placement__legend">
          <div class="stack">
            <div class="eyebrow">Zielregion</div>
            <p>Klick setzt eine Standardgröße. Ziehen definiert eine freie Zielbox.</p>
          </div>
          <slot name="actions"></slot>
          <div class="cluster">
            {#if placement}
              <Button type="button" on:click={() => dispatch('reset')}>Auswahl zurücksetzen</Button>
            {/if}
            <span class="muted">
              {roomImageTitle || 'Raumfoto'}
              {#if imageWidth && imageHeight}
                · {imageWidth} × {imageHeight}px
              {/if}
            </span>
          </div>
        </div>
      </div>
    {:else}
      <div class="placement__empty">
        <EmptyState
          title="Noch kein Raumfoto gewählt"
          description="Wähle rechts ein bestehendes Raumfoto oder lade ein neues hoch. Danach kannst du im Bild klicken oder ziehen."
          accent="red"
        />
      </div>
    {/if}
  </Card>
</div>

<style>
  .placement-card {
    overflow: hidden;
  }

  .placement {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-4);
  }

  .placement__surface-wrap {
    display: grid;
    place-items: center;
  }

  .placement__surface {
    background:
      linear-gradient(180deg, rgba(242, 197, 0, 0.08), rgba(0, 87, 184, 0.04)),
      var(--color-surface-muted);
    border: 1px solid var(--color-border);
    border-radius: 18px;
    cursor: crosshair;
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    position: relative;
  }

  .placement__image {
    display: block;
    height: auto;
    max-height: min(70vh, 760px);
    max-width: min(100%, 1040px);
    user-select: none;
  }

  .placement__target {
    background: rgba(227, 58, 44, 0.08);
    border: 2px solid var(--color-red);
    border-radius: 14px;
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.3);
    min-height: 12px;
    min-width: 12px;
    pointer-events: none;
    position: absolute;
  }

  .placement__target-label {
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    color: var(--color-text);
    font-size: 0.78rem;
    font-weight: 700;
    left: 10px;
    padding: 6px 10px;
    position: absolute;
    top: 10px;
    transform: translateY(-100%);
  }

  .placement__legend {
    display: grid;
    gap: var(--space-2);
  }

  .placement__empty {
    padding: var(--space-4);
  }

  p {
    color: var(--color-text-muted);
    margin: 0;
  }
</style>
