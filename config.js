const XP_CAPS = {
    Rookie: 300,
    Champion: 600,
    Ultimate: 900,
    Mega: 1500,
    Ultra: 3000
};

let state = {
    digimonSlots: Array(10).fill(null),
    activeDigimonIndex: null,
    opponent: null,
    bit: 1000,
    jogressShards: 0,
    afkModes: Array(10).fill(null),
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