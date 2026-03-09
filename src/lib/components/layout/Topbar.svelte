<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { page } from '$app/stores';

  const labels: Record<string, { title: string; subtitle: string }> = {
    '/': {
      title: 'Möbel Visualisierung',
      subtitle:
        'Ruhiger MVP für Projekte, Bibliothek, Editor, Raumfoto und nachvollziehbare Dev-Kosten.'
    },
    '/projects': {
      title: 'Projektübersicht',
      subtitle: 'Projektliste, Anlage und direkte Einstiege in Upload- und Bildflows.'
    },
    '/library': {
      title: 'Bibliothek',
      subtitle: 'Bildraster mit Upload, Download, Edit und Projektfilter.'
    },
    '/editor': {
      title: 'Editor',
      subtitle:
        'Öffne ein bestehendes Bild aus der Bibliothek oder springe direkt in die letzte Variante.'
    },
    '/room-insert': {
      title: 'Raumfoto einsetzen',
      subtitle: 'Eigenständiger MVP-Flow für Raumfoto, Zielregion und Varianten.'
    },
    '/costs': {
      title: 'Kosten',
      subtitle: 'Zusammenfassung und Log-Tabelle für nachvollziehbare Dev-Kosten.'
    },
    '/presets': {
      title: 'Presets',
      subtitle: 'Aktuell als vorbereitete Oberfläche für spätere Preset-Verwaltung.'
    },
    '/settings': {
      title: 'Einstellungen',
      subtitle: 'Dokumentierte lokale Konfiguration als read-first Platzhalterfläche.'
    }
  };

  $: pathname = $page.url.pathname;
  $: meta = pathname.startsWith('/projects/')
    ? {
        title: 'Projekt',
        subtitle: 'Detailansicht für ein Projekt mit Originalbild und Varianten.'
      }
    : pathname.startsWith('/editor/')
      ? {
          title: 'Editor',
          subtitle: `Einzelbildansicht für ${pathname.split('/').pop() ?? 'bild'}.`
        }
      : (labels[pathname] ?? labels['/']);
</script>

<header class="topbar">
  <div class="topbar__copy">
    <span class="eyebrow">{env.PUBLIC_APP_NAME || 'Möbel Visualisierung'}</span>
    <div>
      <h1>{meta.title}</h1>
      <p>{meta.subtitle}</p>
    </div>
  </div>
</header>

<style>
  .topbar {
    align-items: start;
    display: flex;
    gap: var(--space-2);
    justify-content: space-between;
  }

  .topbar__copy {
    display: grid;
    gap: 8px;
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
    margin-top: 4px;
    max-width: 65ch;
  }

  .topbar__status {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }

  .topbar__chip {
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 7px 11px;
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
