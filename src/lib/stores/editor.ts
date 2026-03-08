import { writable } from 'svelte/store';

export const editorState = writable({
  mode: 'environment_edit'
});
