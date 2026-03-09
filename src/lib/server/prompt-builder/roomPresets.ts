import type { RoomPreset } from '$lib/types/generation';

export const ROOM_PRESET_LABELS: Record<RoomPreset, string> = {
  none: 'Aktuell belassen',
  modern_living: 'Modernes Wohnzimmer',
  scandinavian: 'Skandinavisch',
  landhaus: 'Landhaus',
  loft: 'Loft / Industrial',
  office: 'Büro / Arbeitszimmer',
  childrens_room: 'Kinderzimmer'
};

export const ROOM_PRESET_PROMPTS: Record<RoomPreset, string | null> = {
  none: null,
  modern_living:
    'Heller, moderner Wohnraum. Hellgraue Wände, helles Parkettholz, diffuses Tageslicht, wenig aber hochwertige Dekoration.',
  scandinavian:
    'Skandinavischer Wohnstil. Weiß-cremefarbene Wände, helles Birkenholz, warmes natürliches Licht, Pflanzen und Leinentextilien.',
  landhaus:
    'Gemütliches Landhaus-Interieur. Gebrochen-weiße Wände, dunkles Eichenholz, warmes Abendlicht, rustikale Dekoration.',
  loft:
    'Urbaner Loft-Stil. Betonwand oder Sichtziegel, dunkler Betonboden, gezielte Akzentbeleuchtung, minimale Dekoration.',
  office:
    'Ruhiges Arbeitszimmer. Neutrale helle Wände, Parkettboden, funktionales gleichmäßiges Licht, ordentlich und aufgeräumt.',
  childrens_room:
    'Freundliches Kinderzimmer. Pastellfarbene Wände, heller Boden, weiches gleichmäßiges Licht, kindgerechte bunte Dekoration.'
};
