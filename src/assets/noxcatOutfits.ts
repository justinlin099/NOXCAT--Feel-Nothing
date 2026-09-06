import { noxcatSvg } from './noxcatDesign';

/** Preview catalogue only: locked accessories do not change the playable rig. */
export const NOXCAT_OUTFITS = [
  { id: 'classic', name: 'NOXCAT', description: '熟悉的飛行護目鏡，隨時準備出發。', locked: false },
  { id: 'headphones', name: '靜音耳機', description: '把雜音關小，把自己的節奏放大。', locked: true },
  { id: 'beanie', name: '夜行毛帽', description: '壓低帽沿，安靜穿過漫長的夜。', locked: true },
  { id: 'scarf', name: '疾風領巾', description: '讓煩惱留在身後，跟風一起前進。', locked: true },
  { id: 'visor', name: '駭客目鏡', description: '鎖定眼前目標，過濾多餘的訊號。', locked: true },
] as const;

export type NoxcatOutfitId = typeof NOXCAT_OUTFITS[number]['id'];
type PreviewOutfitId = Exclude<NoxcatOutfitId, 'classic'>;
type OutfitArtwork = Readonly<{ behind?: string; front: string }>;

// Accessories use the trace's own 200 × 182.656 coordinates. Body and eye
// paths remain untouched; only these independent flat vector layers differ.
const ARTWORK: Readonly<Record<PreviewOutfitId, OutfitArtwork>> = {
  headphones: {
    front: `<g data-accessory="headphones" stroke-linejoin="round">
      <g data-accessory-part="headband" fill="none" stroke-linecap="round">
        <path d="M10 65C4 52 3 30 10 15C22-14 59-24 89-10C108-1 120 14 117 31" stroke="#101820" stroke-width="9"/>
        <path d="M10 65C4 52 3 30 10 15C22-14 59-24 89-10C108-1 120 14 117 31" stroke="#b2b2b2" stroke-width="4"/>
      </g>
      <rect x="5" y="58" width="10" height="9" rx="3" transform="rotate(-19 10 62.5)" fill="#424939" stroke="#101820" stroke-width="1.5"/>
      <rect x="111" y="25" width="10" height="9" rx="3" transform="rotate(-19 116 29.5)" fill="#424939" stroke="#101820" stroke-width="1.5"/>
      <g transform="rotate(-19 14 76)">
        <rect x="4" y="59" width="20" height="34" rx="9" fill="#101820" stroke="#b2b2b2" stroke-width="2"/>
        <rect x="9" y="65" width="10" height="22" rx="4" fill="#424939"/>
        <path d="M14 70V82" stroke="#91d500" stroke-width="3" stroke-linecap="round"/>
      </g>
      <g transform="rotate(-19 117 42)">
        <rect x="106" y="25" width="22" height="34" rx="9" fill="#101820" stroke="#b2b2b2" stroke-width="2"/>
        <rect x="112" y="31" width="11" height="22" rx="4" fill="#424939"/>
        <path d="M116 36V48M120 39V45" stroke="#91d500" stroke-width="2" stroke-linecap="round"/>
      </g>
    </g>`,
  },
  beanie: {
    front: `<g data-accessory="beanie" stroke-linejoin="round">
      <path d="M10 61C4 41 15 20 38 10C64-1 88 3 101 20Q110 32 110 44L18 68Z" fill="#424939" stroke="#101820" stroke-width="2"/>
      <g fill="none" stroke="#b2b2b2" stroke-opacity="0.35" stroke-width="1.5" stroke-linecap="round">
        <path d="M26 51Q24 29 44 15M44 47Q43 25 57 10M64 42Q67 22 70 10M84 39Q89 26 84 14"/>
      </g>
      <path d="M9 58Q48 42 109 39L112 51Q56 55 13 73Z" fill="#151d16" stroke="#101820" stroke-width="2"/>
      <path d="M17 63Q54 49 102 46" fill="none" stroke="#66952a" stroke-width="2"/>
      <g transform="rotate(-12 82 49)">
        <rect x="75" y="42" width="14" height="13" rx="2" fill="#91d500"/>
        <path d="M79 51V46L85 51V46" fill="none" stroke="#101820" stroke-width="1.7" stroke-linejoin="miter"/>
      </g>
    </g>`,
  },
  scarf: {
    front: `<g data-accessory="scarf" stroke-linejoin="round">
      <defs><clipPath id="scarf-body-clip" clipPathUnits="userSpaceOnUse"><use href="#body"/></clipPath></defs>
      <path d="M109 119Q136 96 165 96L153 109L170 116Q139 118 117 137Z" fill="#91d500" stroke="#101820" stroke-width="2"/>
      <path d="M117 125L137 138L134 163L124 155L115 165L107 138Z" fill="#66952a" stroke="#101820" stroke-width="2"/>
      <path d="M119 135L123 149" fill="none" stroke="#91d500" stroke-width="3" stroke-linecap="round"/>
      <g clip-path="url(#scarf-body-clip)">
        <path d="M4 116Q45 132 104 105L117 121Q54 151 8 136Z" fill="#66952a" stroke="#101820" stroke-width="2"/>
        <path d="M9 122Q49 137 105 113" fill="none" stroke="#91d500" stroke-width="4" stroke-linecap="round"/>
      </g>
      <path d="M99 115L112 108L126 121L113 136L101 130Z" fill="#91d500" stroke="#101820" stroke-width="2"/>
      <path d="M106 119L116 127" fill="none" stroke="#424939" stroke-width="2" stroke-linecap="round"/>
    </g>`,
  },
  visor: {
    front: `<g data-accessory="visor" stroke-linejoin="round">
      <defs><clipPath id="visor-body-clip" clipPathUnits="userSpaceOnUse"><use href="#body"/></clipPath></defs>
      <g clip-path="url(#visor-body-clip)" fill="#151d16" stroke="#697163" stroke-width="2">
        <path d="M0 79L21 71L25 84L2 92Z"/>
        <path d="M96 51L120 39L127 48L100 65Z"/>
      </g>
      <g transform="rotate(-19 57 88)">
        <rect x="5" y="73" width="12" height="19" rx="4" fill="#151d16" stroke="#697163" stroke-width="2"/>
        <rect x="102" y="73" width="12" height="19" rx="4" fill="#151d16" stroke="#697163" stroke-width="2"/>
        <path data-accessory-part="lens" d="M22 63H94Q102 63 102 72L99 102Q98 110 90 110H72L64 104Q57 98 50 104L43 110H29Q21 110 20 103L16 73Q14 63 22 63Z" fill="#91d500" fill-opacity="0.16"/>
        <path data-accessory-part="frame" fill-rule="evenodd" d="M20 58H96Q109 58 108 73L104 104Q102 116 90 116H71L61 109Q57 106 53 109L45 116H28Q16 116 14 105L10 74Q7 58 20 58Z M22 64Q15 64 17 73L21 103Q22 110 29 110H43L50 104Q57 98 64 104L73 110H90Q98 110 99 102L102 72Q103 64 94 64Z" fill="#697163" stroke="#101820" stroke-width="2"/>
        <path d="M22 61H94" stroke="#91d500" stroke-width="3" stroke-linecap="round"/>
        <path d="M27 71H42L34 78H25Z" fill="#f6f6f6" fill-opacity="0.3"/>
        <path d="M94 83L92 93" stroke="#f6f6f6" stroke-opacity="0.24" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M9 78V86M110 78V86" stroke="#91d500" stroke-width="2.5" stroke-linecap="round"/>
      </g>
    </g>`,
  },
};

let previewSequence = 0;

function innerSvg(svg: string): string {
  return svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>'));
}

function namespaceSvg(svg: string, id: NoxcatOutfitId): string {
  // The selected preview and its thumbnail may show the same outfit together.
  // Each render therefore owns its references, not just each catalogue entry.
  const prefix = `noxcat-outfit-${id}-${++previewSequence}-`;
  return svg
    .replace(/\sid="([^"]+)"/g, (_, value: string) => ` id="${prefix}${value}"`)
    .replace(/\bhref="#([^"]+)"/g, (_, value: string) => `href="#${prefix}${value}"`)
    .replace(/url\(#([^\s)]+)\)/g, (_, value: string) => `url(#${prefix}${value})`)
    .replace('<svg ', `<svg data-outfit="${id}" data-outfit-locked="${id !== 'classic'}" `);
}

/** Locked looks are preview-only; the goggles switch affects the classic look. */
export function noxcatOutfitSvg(id: NoxcatOutfitId, gogglesVisible = true): string {
  if (id === 'classic') {
    const classic = noxcatSvg().replace(
      /(<g id="goggles"[^>]*\bdisplay=")[^"]+("[^>]*>)/,
      `$1${gogglesVisible ? 'inline' : 'none'}$2`,
    );
    return namespaceSvg(classic, id);
  }
  const artwork = ARTWORK[id];
  const bodySvg = noxcatSvg('body');
  const baseOpeningTag = bodySvg.slice(0, bodySvg.indexOf('>') + 1);
  // Give only the outer headphone arch room above the original ear tips.
  // The cat's own paths and coordinates remain identical to every other look.
  const openingTag = id === 'headphones'
    ? baseOpeningTag.replace(/viewBox="0 0 ([\d.]+) ([\d.]+)"/,
      (_, width: string, height: string) => `viewBox="0 -24 ${width} ${Number(height) + 24}"`)
    : baseOpeningTag;
  return namespaceSvg(`${openingTag}${artwork.behind ?? ''}${innerSvg(bodySvg)}${innerSvg(noxcatSvg('eyes'))}${artwork.front}</svg>`, id);
}
