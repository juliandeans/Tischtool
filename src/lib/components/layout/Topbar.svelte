<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { page } from '$app/stores';

  const labels: Record<string, { title: string; subtitle: string }> = {
    '/': {
      title: 'Grundgerüst',
      subtitle: 'SvelteKit-Projektbasis, Navigation und Designsystem für Phase 1.'
    },
    '/projects': {
      title: 'Projects',
      subtitle: 'Projektliste, Cover, Meta und Leerzustände kommen hier zusammen.'
    },
    '/library': {
      title: 'Library',
      subtitle: 'Das Bildraster bleibt in Phase 1 bewusst leer, aber strukturell bereit.'
    },
    '/room-insert': {
      title: 'Room Insert',
      subtitle: 'Platzierungs-Canvas und rechte Steuerfläche als visuelles Grundgerüst.'
    },
    '/costs': {
      title: 'Costs',
      subtitle: 'Zusammenfassung und Tabelle sind layoutseitig vorbereitet.'
    },
    '/presets': {
      title: 'Presets',
      subtitle: 'Stil- und Licht-Presets werden hier später ausgebaut.'
    },
    '/settings': {
      title: 'Settings',
      subtitle: 'Lokale Konfiguration und Backend-relevante Werte bleiben Platzhalter.'
    }
  };

  $: pathname = $page.url.pathname;
  $: meta = pathname.startsWith('/projects/')
    ? {
        title: 'Project Detail',
        subtitle: 'Detailansicht für ein Projekt mit Originalbild und Varianten.'
      }
    : pathname.startsWith('/editor/')
      ? {
          title: 'Editor',
          subtitle: `Einzelbildansicht für ${pathname.split('/').pop() ?? 'image'}.`
        }
      : (labels[pathname] ?? labels['/']);
</script>

<header class="topbar">
  <div class="stack">
    <span class="eyebrow">{env.PUBLIC_APP_NAME || 'Möbel Visualisierung'}</span>
    <div>
      <h1>{meta.title}</h1>
      <p>{meta.subtitle}</p>
    </div>
  </div>
  <div class="topbar__status">
    <span class="topbar__chip topbar__chip--blue">SvelteKit</span>
    <span class="topbar__chip topbar__chip--yellow">TypeScript</span>
    <span class="topbar__chip topbar__chip--red">Phase 1</span>
  </div>
</header>

<style>
  .topbar {
    align-items: start;
    display: flex;
    gap: var(--space-3);
    justify-content: space-between;
  }

  h1,
  p {
    margin: 0;
  }

  h1 {
    font-size: clamp(1.65rem, 2vw, 2.3rem);
    line-height: 1.1;
  }

  p {
    color: var(--color-text-muted);
    margin-top: 6px;
    max-width: 65ch;
  }

  .topbar__status {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
  }

  .topbar__chip {
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 8px 12px;
    text-transform: uppercase;
  }

  .topbar__chip--blue {
    background: rgba(0, 87, 184, 0.1);
    color: var(--color-blue);
  }

  .topbar__chip--yellow {
    background: rgba(242, 197, 0, 0.22);
  }

  .topbar__chip--red {
    background: rgba(227, 58, 44, 0.1);
    color: var(--color-red);
  }

  @media (max-width: 720px) {
    .topbar {
      flex-direction: column;
    }

    .topbar__status {
      justify-content: flex-start;
    }
  }
</style>
