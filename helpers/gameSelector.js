const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
<div class="gameDropdown">
  <select name="game" class="gameSelect">
    <option value="SPADE_WHITE_JP">
      Spade no Kuni no Alice ~Wonderful White World~
    </option>
    <option value="SPADE_BLACK_JP">
      Spade no Kuni no Alice ~Wonderful Black World~
    </option>
    <option value="BUSTA_EN">BUSTAFELLOWS</option>
    <option value="BUSTA2_EN">BUSTAFELLOWS season2</option>
    <option value="MISTONIAS_HOPE_EN">Mistonia's Hope -The Lost Delight-</option>
    <option value="other">Other</option>
  </select>
</div>
`;
class GameSelector extends HTMLElement {
  constructor() {
    super();
    const CLONE = TEMPLATE.content.cloneNode(true);
    this.appendChild(CLONE);
  }

  get selectedGame() {
    return this.querySelector("select")?.value ?? "";
  }
}
window.customElements.define("game-selector", GameSelector);
