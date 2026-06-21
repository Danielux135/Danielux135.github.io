let arcadePromise;

export function loadArcade() {
    arcadePromise ||= import('./index.js');
    return arcadePromise;
}

export async function openArcade(event) {
    event?.preventDefault?.();
    const arcade = await loadArcade();
    arcade.open();
}

for (const id of ['gamesBtn', 'npbGames']) {
    document.getElementById(id)?.addEventListener('click', openArcade);
}
