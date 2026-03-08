<div class="spinner" aria-hidden="true"></div>

<style>
  .spinner {
    animation: spin 0.8s linear infinite;
    border: 2px solid var(--color-border);
    border-radius: 999px;
    border-top-color: var(--color-blue);
    height: 20px;
    width: 20px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
