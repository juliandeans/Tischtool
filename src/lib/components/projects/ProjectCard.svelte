<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';

  export let title = '';
  export let meta = '';
  export let href = '/projects';
</script>

<a class="project-card" {href}>
  <Card padded={false}>
    <div class="project-card__cover" aria-hidden="true"></div>
    <div class="project-card__body">
      <h3>{title}</h3>
      <p>{meta}</p>
    </div>
  </Card>
</a>

<style>
  .project-card {
    display: block;
  }

  .project-card__cover {
    background:
      linear-gradient(135deg, rgba(0, 87, 184, 0.14), rgba(242, 197, 0, 0.18)),
      var(--color-surface-muted);
    min-height: 148px;
  }

  .project-card__body {
    display: grid;
    gap: 8px;
    padding: var(--space-3);
  }

  h3,
  p {
    margin: 0;
  }

  p {
    color: var(--color-text-muted);
  }
</style>
