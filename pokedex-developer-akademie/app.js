const API = "https://pokeapi.co/api/v2";
const LIMIT = 24;
const TYPE_COLORS = {
  normal:"#a8a77a", fire:"#ee4b2b", water:"#4b91f7", electric:"#e8c936",
  grass:"#78c850", ice:"#76d7e8", fighting:"#c22e28", poison:"#a33ea1",
  ground:"#d7b46a", flying:"#a98ff0", psychic:"#f95587", bug:"#a6b91a",
  rock:"#b6a136", ghost:"#735797", dragon:"#6f35fc", dark:"#705746",
  steel:"#b7b7ce", fairy:"#d685ad"
};
const TYPE_LABELS = {
  normal:"Normal",fire:"Feuer",water:"Wasser",electric:"Elektro",grass:"Pflanze",
  ice:"Eis",fighting:"Kampf",poison:"Gift",ground:"Boden",flying:"Flug",
  psychic:"Psycho",bug:"Käfer",rock:"Gestein",ghost:"Geist",dragon:"Drache",
  dark:"Unlicht",steel:"Stahl",fairy:"Fee"
};
const TYPE_EMOJI = {
  normal:"✦",fire:"♨",water:"💧",electric:"ϟ",grass:"❀",ice:"❄",fighting:"✊",
  poison:"☠",ground:"◒",flying:"➤",psychic:"◉",bug:"❋",rock:"◆",ghost:"◌",
  dragon:"♜",dark:"☾",steel:"⚙",fairy:"✧"
};
const state = { all: [], visible: [], shown: LIMIT, loading: false };
const $ = (selector) => document.querySelector(selector);
const grid = $("#pokemon-grid");
const search = $("#search");
const typeFilter = $("#type-filter");
const sortSelect = $("#sort");
const loadMoreButton = $("#load-more");
const status = $("#status");
const emptyState = $("#empty-state");
const resultCount = $("#result-count");

function formatId(id) { return `#${String(id).padStart(3, "0")}`; }
function titleCase(value) { return value.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" "); }
function officialArtwork(pokemon) {
  return pokemon.sprites?.other?.["official-artwork"]?.front_default
    || pokemon.sprites?.front_default || "";
}
function typeBadge(type) {
  return `<span class="type-badge" style="background:${TYPE_COLORS[type] || "#627d83"}" title="${TYPE_LABELS[type] || type}">
    <span aria-hidden="true">${TYPE_EMOJI[type] || "✦"}</span><span>${TYPE_LABELS[type] || titleCase(type)}</span></span>`;
}
function cardTemplate(pokemon, index) {
  const types = pokemon.types.map(item => item.type.name);
  const primaryType = types[0] || "normal";
  const art = officialArtwork(pokemon);
  const name = titleCase(pokemon.name);
  return `<button class="pokemon-card" type="button" data-id="${pokemon.id}" style="animation-delay:${Math.min(index % LIMIT, 12) * 18}ms" aria-label="Details zu ${name} öffnen">
    <span class="card-heading"><span class="card-number">${formatId(pokemon.id)}</span><span class="card-name">${name}</span></span>
    <span class="artwork" style="--type-color:${TYPE_COLORS[primaryType] || "#7ac74c"}">
      <img src="${art}" alt="${name}" loading="lazy" onerror="this.style.opacity='.25'">
    </span>
    <span class="card-footer">${types.map(typeBadge).join("")}</span>
  </button>`;
}
function applyFilters() {
  const query = search.value.trim().toLocaleLowerCase("de");
  const type = typeFilter.value;
  state.visible = state.all.filter(pokemon => {
    const matchesName = pokemon.name.includes(query) || String(pokemon.id) === query.replace(/^#/, "");
    const matchesType = type === "all" || pokemon.types.some(item => item.type.name === type);
    return matchesName && matchesType;
  });
  const sort = sortSelect.value;
  state.visible.sort((a,b) => sort === "name" ? a.name.localeCompare(b.name)
    : sort === "name-desc" ? b.name.localeCompare(a.name) : a.id - b.id);
  state.shown = LIMIT;
  renderGrid();
}
function renderGrid() {
  const visible = state.visible.slice(0, state.shown);
  grid.innerHTML = visible.map(cardTemplate).join("");
  resultCount.textContent = state.visible.length;
  emptyState.hidden = state.visible.length !== 0;
  loadMoreButton.hidden = state.shown >= state.visible.length || state.visible.length === 0;
  status.textContent = state.loading ? "Pokémon werden geladen …" : "";
}
async function loadPokemon() {
  state.loading = true;
  status.textContent = "Pokémon werden geladen …";
  loadMoreButton.disabled = true;
  try {
    const response = await fetch(`${API}/pokemon?limit=151&offset=0`);
    if (!response.ok) throw new Error("Die Pokémon-Liste konnte nicht geladen werden.");
    const data = await response.json();
    // Detaildaten parallel laden, damit Typen und Artwork für Filter/Karten verfügbar sind.
    const details = await Promise.all(data.results.map(async item => {
      const result = await fetch(item.url);
      if (!result.ok) throw new Error("Ein Pokémon konnte nicht geladen werden.");
      return result.json();
    }));
    state.all = details;
    state.visible = [...details];
    renderGrid();
  } catch (error) {
    status.innerHTML = `Die Pokémon konnten gerade nicht geladen werden. Bitte prüfe deine Internetverbindung und <button class="button" id="retry-load" type="button">versuche es erneut</button>.`;
    $("#retry-load")?.addEventListener("click", loadPokemon);
  } finally {
    state.loading = false;
    loadMoreButton.disabled = false;
    if (state.all.length) status.textContent = "";
  }
}
function openDetails(id) {
  const pokemon = state.all.find(item => item.id === Number(id));
  if (!pokemon) return;
  const dialog = $("#detail-dialog");
  const types = pokemon.types.map(item => item.type.name);
  const primaryType = types[0] || "normal";
  const stats = pokemon.stats.map(item => {
    const label = ({hp:"KP",attack:"Angriff",defense:"Verteidigung", "special-attack":"Spezial-Angriff","special-defense":"Spezial-Verteidigung",speed:"Initiative"})[item.stat.name] || titleCase(item.stat.name);
    const value = item.base_stat;
    return `<div class="stat-row"><span class="stat-label">${label}</span><span class="stat-value">${value}</span><span class="stat-track"><span class="stat-fill" style="display:block;width:${Math.min(100, value / 180 * 100)}%"></span></span></div>`;
  }).join("");
  $("#detail-content").innerHTML = `
    <div class="detail-hero" style="--type-color:${TYPE_COLORS[primaryType] || "#7ac74c"}">
      <div class="detail-art"><img src="${officialArtwork(pokemon)}" alt="${titleCase(pokemon.name)}"></div>
      <div class="detail-main">
        <div class="detail-number">${formatId(pokemon.id)} · Pokédex</div>
        <h2 id="detail-name">${titleCase(pokemon.name)}</h2>
        <div class="detail-types">${types.map(typeBadge).join("")}</div>
        <div class="detail-measures">
          <div class="measure"><strong>${(pokemon.height / 10).toFixed(1)} m</strong><span>Größe</span></div>
          <div class="measure"><strong>${(pokemon.weight / 10).toFixed(1)} kg</strong><span>Gewicht</span></div>
          <div class="measure"><strong>${pokemon.base_experience ?? "–"}</strong><span>Basis-EP</span></div>
        </div>
      </div>
    </div>
    <div class="detail-body"><h3>Basiswerte</h3><div class="stats">${stats}</div></div>`;
  if (!dialog.open) dialog.showModal();
}
grid.addEventListener("click", event => {
  const card = event.target.closest("[data-id]");
  if (card) openDetails(card.dataset.id);
});
search.addEventListener("input", () => {
  $("#clear-search").hidden = !search.value;
  applyFilters();
});
$("#clear-search").addEventListener("click", () => {
  search.value = ""; $("#clear-search").hidden = true; applyFilters(); search.focus();
});
typeFilter.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);
loadMoreButton.addEventListener("click", () => { state.shown += LIMIT; renderGrid(); });
$("#reset-filters").addEventListener("click", () => {
  search.value = ""; typeFilter.value = "all"; sortSelect.value = "id";
  $("#clear-search").hidden = true; applyFilters();
});
$("#close-dialog").addEventListener("click", () => $("#detail-dialog").close());
$("#detail-dialog").addEventListener("click", event => {
  if (event.target === $("#detail-dialog")) $("#detail-dialog").close();
});
document.addEventListener("keydown", event => {
  if (event.key === "/" && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault(); search.focus();
  }
});
loadPokemon();
