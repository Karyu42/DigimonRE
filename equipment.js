function createRing(opponent) {
    console.log("Creating ring for defeated opponent:", opponent.name);
    const effects = [
        { type: "attackDamage", value: Math.floor(Math.random() * 10) + 5 },
        { type: "maxHp", value: Math.floor(Math.random() * 10) + 5 },
        { type: "trainingExp", value: Math.floor(Math.random() * 10) + 5 },
        { type: "nullifyDamage", value: Math.floor(Math.random() * 5) + 1 },
        { type: "chargeSpeed", value: Math.floor(Math.random() * 10) + 5 }
    ];
    const selectedEffects = [];
    const effectCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < effectCount; i++) {
        selectedEffects.push(effects[Math.floor(Math.random() * effects.length)]);
    }
    return {
        name: `${opponent.stage} Ring`,
        baseStats: {
            attack: Math.floor(Math.random() * 10),
            hp: Math.floor(Math.random() * 50)
        },
        effects: selectedEffects
    };
}

function equipFromInventory(inventoryIndex) {
    if (inventoryIndex < 0 || inventoryIndex >= state.ringInventory.length) {
        logMessage("Invalid inventory index!");
        return;
    }
    if (state.currentEquipSlot < 0 || state.currentEquipSlot >= 5) {
        logMessage("Invalid equipment slot!");
        return;
    }
    const ring = state.ringInventory[inventoryIndex];
    if (state.equipmentSlots[state.currentEquipSlot]) {
        state.ringInventory.push(state.equipmentSlots[state.currentEquipSlot]);
    }
    state.equipmentSlots[state.currentEquipSlot] = ring;
    state.ringInventory.splice(inventoryIndex, 1);
    logMessage(`Equipped ${ring.name} to slot ${state.currentEquipSlot + 1}!`);
    const player = state.digimonSlots[state.activeDigimonIndex];
    if (player) {
        const equipHpBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.baseStats.hp || 0), 0) +
            Math.floor(player.maxHp * state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'maxHp')?.value || 0), 0) / 100);
        const totalMaxHp = player.maxHp + player.shopBonuses.hp + player.rebirthBonuses.hp + equipHpBonus;
        player.hp = Math.min(player.hp, totalMaxHp);
    }
    updateUI();
    saveProgress(true);
}

function sellRing(slotIndex) {
    if (slotIndex < 0 || slotIndex >= 5 || !state.equipmentSlots[slotIndex]) {
        logMessage(`No ring in slot ${slotIndex + 1} to sell!`);
        return;
    }
    const ring = state.equipmentSlots[slotIndex];
    const bitValue = Math.floor((ring.baseStats.attack + ring.baseStats.hp) * 0.5);
    state.bit += bitValue;
    state.equipmentSlots[slotIndex] = null;
    logMessage(`Sold ${ring.name} for ${bitValue} BIT!`);
    const player = state.digimonSlots[state.activeDigimonIndex];
    if (player) {
        const equipHpBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.baseStats.hp || 0), 0) +
            Math.floor(player.maxHp * state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'maxHp')?.value || 0), 0) / 100);
        const totalMaxHp = player.maxHp + player.shopBonuses.hp + player.rebirthBonuses.hp + equipHpBonus;
        player.hp = Math.min(player.hp, totalMaxHp);
    }
    updateUI();
    saveProgress(true);
}

function sellInventoryRing(inventoryIndex) {
    if (inventoryIndex < 0 || inventoryIndex >= state.ringInventory.length) {
        logMessage("Invalid inventory index!");
        return;
    }
    const ring = state.ringInventory[inventoryIndex];
    const bitValue = Math.floor((ring.baseStats.attack + ring.baseStats.hp) * 0.5);
    state.bit += bitValue;
    state.ringInventory.splice(inventoryIndex, 1);
    logMessage(`Sold ${ring.name} for ${bitValue} BIT!`);
    updateUI();
    saveProgress(true);
}

console.log("equipment.js loaded successfully.");