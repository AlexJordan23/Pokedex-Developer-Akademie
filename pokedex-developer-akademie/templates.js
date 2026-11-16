
export function pokemonDetailTemplate({
    id,
    name,
    color,
    artwork,
    typeBadges,
    height,
    weight,
    experience,
    statsHTML
}) {
    return `
        <div class="detail-header" style="--type-color: ${color}">
            <div class="detail-art">
                <img src="${artwork}" alt="${name}">
            </div>

            <div class="detail-main">
                <div class="detail-number">${id}</div>

                <h2 id="detail-name">${name}</h2>

                <div class="detail-types">
                    ${typeBadges}
                </div>

                <div class="detail-measures">
                    <div class="measure">
                        <strong>${height}</strong>
                        <span>Größe</span>
                    </div>

                    <div class="measure">
                        <strong>${weight}</strong>
                        <span>Gewicht</span>
                    </div>

                    <div class="measure">
                        <strong>${experience}</strong>
                        <span>Basis-EP</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="detail-body">
            <h3>Basiswerte</h3>
            <div class="stats">${statsHTML}</div>
        </div>
    `;
}
