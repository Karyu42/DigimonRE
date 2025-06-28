const SAVE_VERSION = "1.0.1";
const STORAGE_KEY = "digimonRPG_save";
let isInitialLoad = true;

function saveProgress(logToGame = false) {
    if (isInitialLoad) return;
    try {
        state.lastSavedTime = Date.now();
        state.version = SAVE_VERSION;
        const safeState = {
            ...state,
            globalAfkInterval: null,
            animationFrame: null,
            enemyAttackIntervalId: null,
            opponent: null
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(safeState));
        if (logToGame) logMessage("Game saved!");
    } catch (e) {
        logMessage("Failed to save progress. Storage may be full.");
    }
}

function exportSave() {
    try {
        const stateString = localStorage.getItem(STORAGE_KEY);
        if (!stateString) {
            logMessage("No save data to export!");
            return;
        }
        const blob = new Blob([stateString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'digimonRPG_save.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        logMessage("Save file exported!");
    } catch (e) {
        logMessage("Failed to export save.");
    }
}

function loadProgress(file) {
    try {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const loadedState = JSON.parse(event.target.result);
                applyLoadedState(loadedState);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedState));
                logMessage("Progress loaded and saved!");
            } catch (e) {
                logMessage("Failed to load progress. Invalid save file.");
            }
        };
        reader.readAsText(file);
    } catch (e) {
        logMessage("Failed to load progress.");
    }
}

function loadFromLocalStorage() {
    try {
        const stateString = localStorage.getItem(STORAGE_KEY);
        if (stateString) {
            const loadedState = JSON.parse(stateString);
            applyLoadedState(loadedState);
            logMessage("Progress loaded from auto-save!");
        }
    } catch (e) {
        logMessage("Failed to load auto-save. Starting new game.");
    }
}

async function validateDigimon(digimon) {
    if (!digimon || typeof digimon !== 'object') return null;
    const apiDigimon = await fetchDigimonByName(digimon.name);
    const baseStats = apiDigimon?.baseStats || { hp: 100, attack: 20 };
    const sprite = apiDigimon?.images?.[0]?.href || FALLBACK_SPRITE;

    return {
        name: digimon.name,
        level: Number.isInteger(digimon.level) && digimon.level > 0 ? digimon.level : 1,
        hp: typeof digimon.hp === 'number' && digimon.hp >= 0 ? digimon.hp : baseStats.hp,
        maxHp: typeof digimon.maxHp === 'number' && digimon.maxHp >= 0 ? digimon.maxHp : baseStats.hp,
        attack: typeof digimon.attack === 'number' && digimon.attack >= 0 ? digimon.attack : baseStats.attack,
        xp: typeof digimon.xp === 'number' && digimon.xp >= 0 ? digimon.xp : 0,
        totalXp: typeof digimon.totalXp === 'number' && digimon.totalXp >= 0 ? digimon.totalXp : 0,
        xpNext: typeof digimon.xpNext === 'number' && digimon.xpNext >= 0 ? digimon.xpNext : 100,
        sprite: validateSpriteUrl(digimon.sprite) || sprite,
        evolutions: Array.isArray(digimon.evolutions) ? digimon.evolutions : apiDigimon?.evolutions || [],
        shopBonuses: {
            attack: typeof digimon.shopBonuses?.attack === 'number' ? digimon.shopBonuses.attack : 0,
            hp: typeof digimon.shopBonuses?.hp === 'number' ? digimon.shopBonuses.hp : 0
        },
        rebirthBonuses: {
            attack: typeof digimon.rebirthBonuses?.attack === 'number' ? digimon.rebirthBonuses.attack : 0,
            hp: typeof digimon.rebirthBonuses?.hp === 'number' ? digimon.rebirthBonuses.hp : 0
        },
        stage: digimon.stage || apiDigimon?.level || "Rookie"
    };
}

function validateRing(ring) {
    if (!ring || typeof ring !== 'object' || !ring.name || !ring.baseStats || !Array.isArray(ring.effects)) {
        return null;
    }
    return {
        name: ring.name,
        baseStats: {
            attack: typeof ring.baseStats.attack === 'number' && ring.baseStats.attack >= 0 ? ring.baseStats.attack : 0,
            hp: typeof ring.baseStats.hp === 'number' && ring.baseStats.hp >= 0 ? ring.baseStats.hp : 0
        },
        effects: ring.effects.filter(e => 
            e && ['chargeSpeed', 'attackDamage', 'maxHp', 'trainingExp', 'farmingGain', 'trainingCost', 'nullifyDamage'].includes(e.type) &&
            typeof e.value === 'number'
        )
    };
}

function resetState(skipSave = false) {
    if (state.globalAfkInterval) {
        clearInterval(state.globalAfkInterval);
    }
    state = {
        digimonSlots: Array(10).fill(null),
        activeDigimonIndex: null,
        opponent: null,
        bit: 1000,
        jogressShards: 0,
        afkModes: Array(10).fill(null),
        globalAfkInterval: null,
        healOnVictory: false,
        selectedEnemyStage: "Rookie",
        combatMode: "charging",
        lastSavedTime: Date.now(),
        battleActive: false,
        markerPosition: 0,
        markerDirection: 1,
        animationFrame: null,
        targetZonePosition: 0,
        lastAttackTime: 0,
        enemyAttackIntervalId: null,
        isAttackDisabled: false,
        animationStartTime: null,
        consecutiveCriticalHits: 0,
        enemyStunned: false,
        equipmentSlots: Array(5).fill(null),
        ringInventory: [
            {
                name: "Starter Ring",
                baseStats: { attack: 1, hp: 5 },
                effects: [{ type: "maxHp", value: 5 }]
            }
        ],
        currentEquipSlot: null,
        version: SAVE_VERSION
    };
    if (!skipSave && !isInitialLoad) {
        saveProgress();
    }
}

function buyJogressShards() {
    if (state.bit < 2000) {
        logMessage(`Not enough BIT (need 2000, have ${state.bit}) to buy a Jogress Shard!`);
        return;
    }
    state.bit -= 2000;
    state.jogressShards += 1;
    logMessage(`Bought a Jogress Shard! Current shards: ${state.jogressShards}`);
    updateUI();
    saveProgress(true);
}

function setAfkMode(slotIndex, mode, fromLoad = false) {
    const digimon = state.digimonSlots[slotIndex];
    if (!digimon) {
        logMessage(`No Digimon in slot ${slotIndex + 1} to set AFK mode.`);
        return;
    }

    const currentMode = state.afkModes[slotIndex];
    let newMode = mode === 'cycle' ? (currentMode === null ? 'training' : currentMode === 'training' ? 'farming' : null) : mode;
    state.afkModes[slotIndex] = newMode;

    if (state.globalAfkInterval) {
        clearInterval(state.globalAfkInterval);
        state.globalAfkInterval = null;
    }

    if (state.afkModes.some(m => m !== null)) {
        state.globalAfkInterval = setInterval(() => {
            state.digimonSlots.forEach((digimon, index) => {
                if (digimon && state.afkModes[index] === 'training') {
                    const trainingCostReduction = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'trainingCost')?.value || 0), 0) / 100;
                    const costPerTick = 50 * (1 + trainingCostReduction);
                    if (state.bit >= costPerTick) {
                        state.bit -= costPerTick;
                        const trainingBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'trainingExp')?.value || 0), 0) / 100;
                        gainXP(index, 100 * (1 + trainingBonus));
                    } else {
                        state.afkModes[index] = null;
                        logMessage(`${digimon.name} stopped training due to insufficient BIT.`);
                    }
                } else if (digimon && state.afkModes[index] === 'farming') {
                    const farmingBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'farmingGain')?.value || 0), 0) / 100;
                    state.bit = Math.min(state.bit + digimon.level * 5 * (1 + farmingBonus), Number.MAX_SAFE_INTEGER);
                }
            });
            updateUI();
        }, 10000);
    }

    if (!fromLoad && !isInitialLoad) {
        logMessage(`${digimon.name} set to ${newMode || 'no'} AFK mode.`);
        updateMenu();
        saveProgress();
    }
}

function logMessage(message) {
    const battleScreen = document.getElementById("battle-screen");
    const log = document.getElementById("battle-log");
    if (battleScreen?.style.display === "block" && log) {
        const p = document.createElement("p");
        p.textContent = message;
        log.appendChild(p);
        while (log.children.length > 50) {
            log.removeChild(log.firstChild);
        }
        log.scrollTop = log.scrollHeight;
    }
}

async function fetchDigimonByName(name) {
    try {
        const response = await fetch(`${API_BASE_URL}/digimon?name=${encodeURIComponent(name)}&exact=true`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        return data.content?.[0] || null;
    } catch (error) {
        return null;
    }
}