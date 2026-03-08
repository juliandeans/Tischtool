import { writable } from 'svelte/store';

export const roomInsertState = writable({
  targetDefined: false
});
