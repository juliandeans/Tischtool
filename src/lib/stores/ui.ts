import { writable } from 'svelte/store';

export const uiState = writable({
  shellReady: true
});
