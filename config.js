const XP_CAPS = {
    Rookie: 300,
    Champion: 600,
    Ultimate: 900,
    Mega: 1500,
    Ultra: 3000
};

let state = {
    digimonSlots: Array(5).fill(null), // Reduced to 5 slots to match storage.js
    activeDigimonIndex: null,
    opponent: null,
    bit: 1000,
    jogressShards: 0,
    afkModes: Array(5).fill(null), // Match digimonSlots length
    globalAfkInterval: null,
    healOnVictory: false,
    selectedEnemyStage: "Rookie",
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
    version: "1.0.1"
};

// Validate selectedEnemyStage
const validStages = ["Rookie", "Champion", "Ultimate", "Mega", "Ultra"];
if (!validStages.includes(state.selectedEnemyStage)) {
    state.selectedEnemyStage = "Rookie";
}

console.log("config.js loaded successfully.");