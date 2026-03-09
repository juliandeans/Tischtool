<script lang="ts">
  import { page } from '$app/stores';

  const navigation = [
    { href: '/projects', label: 'Projekte', accent: 'blue' },
    { href: '/library', label: 'Bibliothek', accent: 'yellow' },
    { href: '/editor', label: 'Editor', accent: 'blue' },
    { href: '/room-insert', label: 'Implementieren', accent: 'red' },
    { href: '/costs', label: 'Kosten', accent: 'yellow' },
    { href: '/presets', label: 'Presets', accent: 'blue' },
    { href: '/settings', label: 'Einstellungen', accent: 'red' }
  ] as const;

  const isActive = (href: string, pathname: string) =>
    href === '/projects'
      ? pathname === '/projects' || pathname.startsWith('/projects/')
      : href === '/editor'
        ? pathname === '/editor' || pathname.startsWith('/editor/')
        : pathname === href;
</script>

<aside class="sidebar">
  <div class="sidebar__brand">
    <div class="sidebar__mark" aria-hidden="true">
      <span class="blue"></span>
      <span class="red"></span>
      <span class="yellow"></span>
    </div>
    <div>
      <strong>Tischtool</strong>
    </div>
  </div>

  <nav class="sidebar__nav" aria-label="Hauptnavigation">
    {#each navigation as item}
      <a
        aria-current={isActive(item.href, $page.url.pathname) ? 'page' : undefined}
        class:active={isActive(item.href, $page.url.pathname)}
        class={`sidebar__link sidebar__link--${item.accent}`}
        href={item.href}
      >
        <span class="sidebar__marker" aria-hidden="true">
          <span class="sidebar__dot"></span>
        </span>
        <span>{item.label}</span>
      </a>
    {/each}
  </nav>
</aside>

<style>
  .sidebar {
    align-self: start;
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(10px);
    border: 1px solid var(--color-border);
    border-radius: 2px;
    display: grid;
    gap: var(--space-4);
    grid-template-rows: auto 1fr;
    height: calc(100vh - (var(--space-3) * 2));
    padding: var(--space-4);
    position: sticky;
    top: var(--space-3);
  }

  .sidebar__brand {
    align-items: center;
    display: flex;
    gap: var(--space-3);
  }

  .sidebar__mark {
    display: grid;
    gap: 4px;
  }

  .sidebar__mark span {
    display: block;
    height: 16px;
    width: 26px;
  }

  .blue {
    background: var(--color-blue);
  }

  .red {
    background: var(--color-red);
  }

  .yellow {
    background: var(--color-yellow);
  }

  .sidebar__nav {
    align-content: start;
    display: grid;
    gap: var(--space-1);
  }

  .sidebar__link {
    align-items: center;
    border: none;
    display: flex;
    font-weight: 600;
    gap: 14px;
    min-height: 54px;
    padding: 0 18px;
    position: relative;
    transition:
      background-color 120ms ease,
      border-color 120ms ease,
      transform 120ms ease;
  }

  .sidebar__link:hover .sidebar__dot,
  .sidebar__link.active .sidebar__dot {
    width: 7px;
    height: 32px;
    border-radius: 0px;
  }

  .sidebar__link:focus-visible {
    outline: 2px solid var(--color-blue);
    outline-offset: 2px;
  }

  .sidebar__link.active {
    background: var(--color-surface);
    border-color: var(--color-border);
    box-shadow: none;
  }

  .sidebar__dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    transition:
      width 140ms ease,
      height 140ms ease,
      border-radius 140ms ease;
  }

  .sidebar__link:hover {
    transform: none;
  }

  .sidebar__marker {
    width: 18px;
    height: 32px;
    flex: 0 0 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sidebar__link--blue .sidebar__dot {
    background: var(--color-blue);
  }

  .sidebar__link--yellow .sidebar__dot {
    background: var(--color-yellow);
  }

  .sidebar__link--red .sidebar__dot {
    background: var(--color-red);
  }

  @media (max-width: 960px) {
    .sidebar {
      height: auto;
      position: static;
    }

    .sidebar__nav {
      grid-auto-columns: minmax(160px, 1fr);
      grid-auto-flow: column;
      overflow-x: auto;
    }
  }
</style>
