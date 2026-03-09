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
    'Moderner Wohnraum. Hellgraue Wände, helles Parkettholz, wenig aber hochwertige Dekoration.',
  scandinavian:
    'Skandinavischer Wohnstil. Weiß-cremefarbene Wände, helles Birkenholz, Pflanzen und Leinentextilien.',
  landhaus:
    'Landhaus-Interieur. Gebrochen-weiße Wände, dunkles Eichenholz, rustikale Dekoration.',
  loft: 'Urbaner Loft-Stil. Betonwand oder Sichtziegel, dunkler Betonboden, minimale Dekoration.',
  office: 'Arbeitszimmer. Neutrale helle Wände, Parkettboden, ordentlich und aufgeräumt.',
  childrens_room:
    'Kinderzimmer. Pastellfarbene Wände, heller Boden, kindgerechte bunte Dekoration.'
};
