document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, setting up event delegation'); // Temporary debug, remove after testing

    const buttons = {
        'start-normal-fight': () => startBattle(),
        'start-boss-fight': () => startBattle(true),
        'go-to-shop': goToShop,
        'jogress-menu': toggleJogressMenu,
        'manage-equipment': showEquipMenu,
        'reset-game': resetGame,
        'auto-save': () => saveProgress(true),
        'export-save': exportSave,
        'perform-jogress': performJogress,
        'back-to-menu-jogress': showMenu,
        'back-to-menu-equip': showMenu,
        'back-to-menu-battle': showMenu,
        'buy-jogress-shard': buyJogressShards,
        'buy-attack-boost': buyAttackBoost,
        'buy-attack-boost-half': () => buyAttackBoostBulk('half'),
        'buy-attack-boost-all': () => buyAttackBoostBulk('all'),
        'buy-hp-boost': buyHPBoost,
        'buy-hp-boost-half': () => buyHPBoostBulk('half'),
        'buy-hp-boost-all': () => buyHPBoostBulk('all'),
        'attack-button': async (event) => await attack(event)
    };

    Object.entries(buttons).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', handler);
            console.log(`Attached event to #${id}`); // Temporary debug, remove after testing
        } else {
            console.log(`Button #${id} not found`); // Temporary debug, remove after testing
        }
    });

    // Event delegation for dynamic slot buttons
    const digimonSlots = document.getElementById('digimon-slots');
    if (digimonSlots) {
        digimonSlots.addEventListener('click', (event) => {
            const button = event.target.closest('.slot button');
            if (button) {
                const slotIndex = parseInt(button.parentElement.textContent.match(/\d+/)[0]) - 1;
                if (!isNaN(slotIndex)) {
                    buySlot(slotIndex);
                    console.log(`Triggered buySlot for slot ${slotIndex + 1}`); // Temporary debug, remove after testing
                } else {
                    console.log(`Invalid slot index for button in ${button.parentElement.textContent}`);
                }
            }
        });
    } else {
        console.log('digimon-slots element not found');
    }

    const combatModeSelect = document.getElementById('combat-mode-select');
    if (combatModeSelect) {
        combatModeSelect.innerHTML = `
            <option value="charging">Charging Bar</option>
            <option value="precision">Precision Strike</option>
        `;
        combatModeSelect.addEventListener('change', toggleCombatMode);
    }

    const healToggle = document.getElementById('heal-toggle');
    if (healToggle) healToggle.addEventListener('change', toggleHealing);

    const loadInput = document.getElementById('load-game-input');
    if (loadInput) loadInput.addEventListener('change', () => handleLoadGame(loadInput.files[0]));
});