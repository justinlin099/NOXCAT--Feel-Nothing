import { NOXCAT_OUTFITS, noxcatOutfitSvg, type NoxcatOutfitId } from '../assets/noxcatOutfits';
import { requireElement, setSafeText } from './dom';

const SHORT_NAMES: Record<NoxcatOutfitId, string> = {
  classic: 'NOXCAT', headphones: '耳機', beanie: '毛帽', scarf: '領巾', visor: '目鏡',
};
const LOCK_ICON = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M6.5 9V6a3.5 3.5 0 0 1 7 0v3M10 12v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const ARROW_ICON = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 6-6 6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/** Preview only. No ownership, wallet, payment, or battle equipment is mutated. */
export function mountOutfitPicker(host: HTMLElement): void {
  let selectedIndex = 0;
  host.innerHTML = `
    <div class="start-visual">
      <img class="start-boss-ghost" src="/assets/boss/boss-office-base-v1.png" alt="" />
      <button class="outfit-arrow outfit-previous" type="button" data-testid="outfit-previous" aria-label="上一個造型">${ARROW_ICON}</button>
      <div class="css-noxcat" data-testid="outfit-preview" role="img"></div>
      <button class="outfit-arrow outfit-next" type="button" data-testid="outfit-next" aria-label="下一個造型">${ARROW_ICON}</button>
    </div>
    <div class="outfit-controls">
      <div class="outfit-summary">
        <div class="outfit-caption">
          <span class="outfit-series">NOXCAT / <span data-outfit-counter></span></span>
          <h2 data-testid="outfit-name"></h2>
        </div>
        <button class="outfit-purchase" type="button" data-testid="outfit-purchase" aria-describedby="outfit-status" disabled>
          <span class="outfit-lock">${LOCK_ICON}</span><span data-purchase-copy></span>
        </button>
      </div>
      <div class="outfit-choices" role="group" aria-label="選擇預覽造型"></div>
      <p class="outfit-status" id="outfit-status" data-testid="outfit-status" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>
  `;
  const preview = requireElement<HTMLElement>(host, '[data-testid="outfit-preview"]');
  const name = requireElement<HTMLElement>(host, '[data-testid="outfit-name"]');
  const purchase = requireElement<HTMLButtonElement>(host, '[data-testid="outfit-purchase"]');
  const purchaseCopy = requireElement<HTMLElement>(host, '[data-purchase-copy]');
  const status = requireElement<HTMLElement>(host, '[data-testid="outfit-status"]');
  const choices = requireElement<HTMLElement>(host, '.outfit-choices');
  const buttons = NOXCAT_OUTFITS.map((outfit, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'outfit-choice';
    button.dataset.testid = `outfit-select-${outfit.id}`;
    button.dataset.outfit = outfit.id;
    button.innerHTML = `<span class="outfit-choice-mark" aria-hidden="true">${outfit.locked ? LOCK_ICON : '✓'}</span><span>${SHORT_NAMES[outfit.id]}</span>`;
    button.setAttribute('aria-label', `預覽${outfit.name}（${outfit.locked ? '未解鎖' : '已擁有'}）`);
    button.addEventListener('click', () => select(index));
    choices.append(button);
    return button;
  });

  const render = (): void => {
    const outfit = NOXCAT_OUTFITS[selectedIndex]!;
    host.dataset.locked = String(outfit.locked);
    preview.dataset.outfit = outfit.id;
    preview.setAttribute('aria-label', `${outfit.name}造型預覽${outfit.locked ? '，尚未解鎖' : ''}`);
    // Only repository-authored artwork selected by a closed enum is inserted.
    preview.innerHTML = noxcatOutfitSvg(outfit.id);
    setSafeText(name, outfit.name);
    setSafeText(requireElement(host, '[data-outfit-counter]'), `${String(selectedIndex + 1).padStart(2, '0')} / ${String(NOXCAT_OUTFITS.length).padStart(2, '0')}`);
    setSafeText(purchaseCopy, outfit.locked ? '使用 NOX 幣購買' : '目前使用中');
    purchase.classList.toggle('is-owned', !outfit.locked);
    // Native disabled; there is no purchase handler or unlock path.
    purchase.disabled = true;
    setSafeText(status, outfit.locked
      ? '尚未開放購買・僅供預覽，遊戲仍使用 NOXCAT'
      : '已擁有・目前使用 NOXCAT');
    buttons.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === selectedIndex));
    });
  };
  function select(index: number): void {
    selectedIndex = (index + NOXCAT_OUTFITS.length) % NOXCAT_OUTFITS.length;
    render();
  }
  requireElement(host, '[data-testid="outfit-previous"]').addEventListener('click', () => select(selectedIndex - 1));
  requireElement(host, '[data-testid="outfit-next"]').addEventListener('click', () => select(selectedIndex + 1));
  choices.addEventListener('keydown', (event) => {
    const index = buttons.indexOf(event.target as HTMLButtonElement);
    if (index < 0) return;
    const next = event.key === 'ArrowLeft' ? index - 1
      : event.key === 'ArrowRight' ? index + 1
      : event.key === 'Home' ? 0
      : event.key === 'End' ? NOXCAT_OUTFITS.length - 1
      : undefined;
    if (next === undefined) return;
    event.preventDefault();
    select(next);
    buttons[selectedIndex]!.focus({ preventScroll: true });
  });
  render();
}
