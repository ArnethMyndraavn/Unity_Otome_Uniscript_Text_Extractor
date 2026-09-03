const template = document.createElement("template");
template.innerHTML = `
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
    <option value="other">Other</option>
  </select>
</div>
`;
class GameSelector extends HTMLElement {
  constructor() {
    super();
    const clone = template.content.cloneNode(true);
    this.appendChild(clone);
  }

  get selectedGame() {
    return this.querySelector("select")?.value ?? "";
  }
}
window.customElements.define("game-selector", GameSelector);
