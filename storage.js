const STORAGE_KEY = "digimonRPG_save";

if (typeof window.state === "undefined") {
    window.state = {};
}

function resetState(isInitial = false) {
    state.digimonSlots = [null, null, null, null, null];
    state.activeDigimonIndex = null;
    state.bit = 0;
    state.jogressShards = 0;
    state.opponent = null;
    state.battleActive = false;
    state.isAttackDisabled = false;
    state.selectedEnemyStage = "Rookie";
    state.combatMode = "charging";
    state.healOnVictory = false;
    state.ringInventory = [];
    state.equipmentSlots = [null, null, null, null, null];
    state.currentEquipSlot = 0;
    state.globalAfkInterval = null;
    state.enemyAttackIntervalId = null;
    state.markerPosition = 0;
    state.markerDirection = 1;
    state.lastAttackTime = 0;
    state.consecutiveCriticalHits = 0;
    state.enemyStunned = false;
    state.targetPositions = {};
    state.animationFrame = null;
    state.animationStartTime = null;
    state.afkModes = [null, null, null, null, null];

    if (!isInitial) {
        saveProgress(true);
    }
}

function saveProgress(autoSave = false) {
    try {
        const saveData = JSON.stringify({
            digimonSlots: state.digimonSlots,
            activeDigimonIndex: state.activeDigimonIndex,
            bit: state.bit,
            jogressShards: state.jogressShards,
            selectedEnemyStage: state.selectedEnemyStage,
            combatMode: state.combatMode,
            healOnVictory: state.healOnVictory,
            ringInventory: state.ringInventory,
            equipmentSlots: state.equipmentSlots,
            currentEquipSlot: state.currentEquipSlot,
            afkModes: state.afkModes
        });
        localStorage.setItem(STORAGE_KEY, saveData);
        if (!autoSave) {
            logMessage("Game saved successfully!");
        }
    } catch (error) {
        console.error("Error saving progress:", error);
        logMessage("Failed to save game progress.");
    }
}

function loadFromLocalStorage() {
    try {
        const saveData = localStorage.getItem(STORAGE_KEY);
        if (saveData) {
            const parsed = JSON.parse(saveData);
            state.digimonSlots = parsed.digimonSlots || [null, null, null, null, null];
            state.activeDigimonIndex = parsed.activeDigimonIndex || null;
            state.bit = parsed.bit || 0;
            state.jogressShards = parsed.jogressShards || 0;
            state.selectedEnemyStage = parsed.selectedEnemyStage || "Rookie";
            state.combatMode = parsed.combatMode || "charging";
            state.healOnVictory = parsed.healOnVictory || false;
            state.ringInventory = parsed.ringInventory || [];
            state.equipmentSlots = parsed.equipmentSlots || [null, null, null, null, null];
            state.currentEquipSlot = parsed.currentEquipSlot || 0;
            state.afkModes = parsed.afkModes || [null, null, null, null, null];
            logMessage("Game loaded successfully!");
        }
    } catch (error) {
        console.error("Error loading progress:", error);
        logMessage("Failed to load game progress.");
    }
}

function exportSave() {
    try {
        const saveData = localStorage.getItem(STORAGE_KEY);
        if (saveData) {
            const blob = new Blob([saveData], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "digimonRPG_save.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            logMessage("Save file exported successfully!");
        } else {
            logMessage("No save data to export!");
        }
    } catch (error) {
        console.error("Error exporting save:", error);
        logMessage("Failed to export save file.");
    }
}

function loadProgress(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            state.digimonSlots = parsed.digimonSlots || [null, null, null, null, null];
            state.activeDigimonIndex = parsed.activeDigimonIndex || null;
            state.bit = parsed.bit || 0;
            state.jogressShards = parsed.jogressShards || 0;
            state.selectedEnemyStage = parsed.selectedEnemyStage || "Rookie";
            state.combatMode = parsed.combatMode || "charging";
            state.healOnVictory = parsed.healOnVictory || false;
            state.ringInventory = parsed.ringInventory || [];
            state.equipmentSlots = parsed.equipmentSlots || [null, null, null, null, null];
            state.currentEquipSlot = parsed.currentEquipSlot || 0;
            state.afkModes = parsed.afkModes || [null, null, null, null, null];
            saveProgress(true);
            updateUI();
            logMessage("Save file imported successfully!");
        } catch (error) {
            console.error("Error importing save:", error);
            logMessage("Failed to import save file.");
        }
    };
    reader.readAsText(file);
}

function buyJogressShards() {
    if (state.bit < 2000) {
        logMessage(`Not enough BIT (need 2000, have ${state.bit}) to buy a Jogress Shard!`);
        return;
    }
    state.bit -= 2000;
    state.jogressShards += 1;
    logMessage("Purchased 1 Jogress Shard!");
    updateUI();
    saveProgress(true);
}

function setAfkMode(slotIndex, mode) {
    const digimon = state.digimonSlots[slotIndex];
    if (!digimon) {
        logMessage(`No Digimon in slot ${slotIndex + 1} to set AFK mode!`);
        return;
    }

    if (mode === "cycle") {
        if (state.afkModes[slotIndex] === "training") {
            state.afkModes[slotIndex] = "farming";
            logMessage(`${digimon.name} set to AFK Farming mode.`);
        } else if (state.afkModes[slotIndex] === "farming") {
            state.afkModes[slotIndex] = null;
            logMessage(`${digimon.name} AFK mode turned off.`);
        } else {
            state.afkModes[slotIndex] = "training";
            logMessage(`${digimon.name} set to AFK Training mode.`);
        }
    } else {
        state.afkModes[slotIndex] = mode;
        logMessage(`${digimon.name} set to AFK ${mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : "Off"} mode.`);
    }

    if (state.afkModes.some(m => m)) {
        if (!state.globalAfkInterval) {
            state.globalAfkInterval = setInterval(() => {
                state.afkModes.forEach((mode, index) => {
                    if (mode === "training") {
                        gainXP(index, 10);
                    } else if (mode === "farming") {
                        state.bit = Math.min(Math.max(0, state.bit + 10), Number.MAX_SAFE_INTEGER);
                        updateUI();
                    }
                });
                saveProgress(true);
            }, 1000);
        }
    } else if (state.globalAfkInterval) {
        clearInterval(state.globalAfkInterval);
        state.globalAfkInterval = null;
    }

    saveProgress(true);
}

const XP_CAPS = {
    Rookie: 100,
    Champion: 200,
    Ultimate: 300,
    Mega: 400,
    Ultra: 500
};

console.log("storage.js loaded successfully.");