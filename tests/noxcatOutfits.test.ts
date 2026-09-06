import { describe, expect, it } from 'vitest';
import { NOXCAT_FACE_TEXTURE, noxcatSvg } from '../src/assets/noxcatDesign';
import { NOXCAT_OUTFITS, noxcatOutfitSvg } from '../src/assets/noxcatOutfits';

function pathData(svg: string, id: string): string | undefined {
  return svg.match(new RegExp(`<path id="(?:noxcat-outfit-[a-z]+-\\d+-)?${id}"[^>]*\\bd="([^"]+)"`))?.[1];
}

function withoutNamespace(svg: string): string {
  return svg.replace(/noxcat-outfit-[a-z]+-\d+-/g, '');
}

describe('NOXCAT preview-only outfit catalogue', () => {
  it('offers one unlocked NOXCAT and four named locked previews', () => {
    expect(NOXCAT_OUTFITS.map(({ id, name, locked }) => ({ id, name, locked }))).toEqual([
      { id: 'classic', name: 'NOXCAT', locked: false },
      { id: 'headphones', name: '靜音耳機', locked: true },
      { id: 'beanie', name: '夜行毛帽', locked: true },
      { id: 'scarf', name: '疾風領巾', locked: true },
      { id: 'visor', name: '駭客目鏡', locked: true },
    ]);
    expect(new Set(NOXCAT_OUTFITS.map(({ id }) => id)).size).toBe(5);
    expect(NOXCAT_OUTFITS.every(({ description }) => description.length > 0)).toBe(true);
  });

  it.each(NOXCAT_OUTFITS)('preserves the traced body, green eyes and registration for $id', ({ id, locked }) => {
    const source = noxcatSvg();
    const preview = noxcatOutfitSvg(id);
    const expectedViewBox = id === 'headphones'
      ? '0 -24 200 206.656'
      : `0 0 ${NOXCAT_FACE_TEXTURE.width} ${NOXCAT_FACE_TEXTURE.height}`;
    expect(preview).toContain(`viewBox="${expectedViewBox}"`);
    expect(preview).toContain(`data-outfit="${id}" data-outfit-locked="${locked}"`);
    expect(preview).toContain('aria-hidden="true"');
    for (const path of ['body', 'eye-left', 'eye-right']) {
      expect(pathData(source, path)).toBeTruthy();
      expect(pathData(preview, path)).toBe(pathData(source, path));
      const element = withoutNamespace(preview).match(new RegExp(`<path id="${path}"[^>]+/>`))?.[0];
      expect(element).toBe(source.match(new RegExp(`<path id="${path}"[^>]+/>`))?.[0]);
    }
    expect(withoutNamespace(preview)).toContain('<g id="eyes" fill="#91d500">');
    // No outfit-specific wrapper may move or scale the original character.
    expect(withoutNamespace(preview)).toContain(`${noxcatSvg('body').match(/<path[^>]+\/>/)![0]}<g id="eyes"`);
  });

  it('namespaces all definitions and references across repeated thumbnails', () => {
    const allIds: string[] = [];
    for (let copy = 0; copy < 2; copy += 1) {
      for (const { id } of NOXCAT_OUTFITS) {
        const preview = noxcatOutfitSvg(id);
        const ids = [...preview.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]!);
        expect(ids.length).toBeGreaterThanOrEqual(4);
        expect(ids.every((value) => value.startsWith(`noxcat-outfit-${id}-`))).toBe(true);
        expect(new Set(ids).size).toBe(ids.length);
        for (const reference of preview.matchAll(/(?:href="#|url\(#)([^"\s)]+)/g)) {
          expect(ids).toContain(reference[1]);
        }
        allIds.push(...ids);
      }
    }
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('draws the raised headphone band as continuous matching outline and highlight paths', () => {
    const band = noxcatOutfitSvg('headphones').match(/<g\b[^>]*data-accessory-part="headband"[^>]*>([\s\S]*?)<\/g>/)?.[0];
    expect(band).toBeTruthy();
    const paths = [...band!.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*\/>/g)];
    expect(paths).toHaveLength(2);
    expect(paths[0]![1]).toBe(paths[1]![1]);
    expect(paths[0]![1]!.match(/m/gi)).toHaveLength(1);
    expect(paths[0]![1]).toMatch(/c/i);
    expect(band).toContain('stroke-linecap="round"');
    expect(band).not.toMatch(/clip-path=|mask=/);
  });

  it('keeps the original goggles artwork without changing any locked look', () => {
    const source = noxcatSvg();
    for (const visible of [true, false]) {
      const preview = withoutNamespace(noxcatOutfitSvg('classic', visible));
      expect(preview).toContain(`id="goggles" class="css-goggles" display="${visible ? 'inline' : 'none'}"`);
      for (const path of ['noxcat-goggles-left', 'noxcat-goggles-right']) {
        expect(pathData(preview, path)).toBe(pathData(source, path));
      }
    }
    for (const { id } of NOXCAT_OUTFITS) {
      if (id === 'classic') continue;
      const shown = withoutNamespace(noxcatOutfitSvg(id, true));
      expect(shown).toBe(withoutNamespace(noxcatOutfitSvg(id, false)));
      expect(shown).not.toContain('css-goggles');
      expect(shown).toContain(`data-accessory="${id}"`);
    }
  });

  it('uses only self-contained vectors and the approved per-outfit palette', () => {
    const colors = new Set(['#2c2925', '#91d500', '#101820', '#151d16', '#424939', '#66952a', '#b2b2b2']);
    const accessoryPaths = new Set<string>();
    for (const { id } of NOXCAT_OUTFITS) {
      const preview = noxcatOutfitSvg(id);
      const allowedColors = id === 'visor' ? new Set([...colors, '#697163', '#f6f6f6']) : colors;
      expect(preview).not.toMatch(/<(?:script|style|image|foreignObject|filter|linearGradient|radialGradient)\b/i);
      expect(preview).not.toMatch(/\son\w+=|(?:href|src)="(?!#)/i);
      for (const color of preview.matchAll(/(?:fill|stroke)="(#[a-f\d]+)"/gi)) {
        expect(allowedColors.has(color[1]!.toLowerCase())).toBe(true);
      }
      if (id !== 'classic') accessoryPaths.add(preview.match(/data-accessory="[^"]+"[\s\S]*$/)![0]);
    }
    expect(accessoryPaths.size).toBe(4);
  });
});
