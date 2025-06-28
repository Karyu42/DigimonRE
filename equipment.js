function createRing(opponent) {
    const baseAtk = Math.floor(opponent.attack / 10);
    const baseHp = Math.floor(opponent.maxHp / 100);
    const effects = [];
    const usedEffectTypes = new Set();

    for (let i = 0; i < 4; i++) {
        if (Math.random() < 0.1) {
            const effect = getRandomEffect(opponent.stage);
            if (!usedEffectTypes.has(effect.type)) {
                effects.push(effect);
                usedEffectTypes.add(effect.type);
            }
        }
    }

    const ring = {
        name: `${opponent.name.split(" (")[0]} Ring`,
        baseStats: { attack: baseAtk, hp: baseHp },
        effects: effects
    };
    return ring;
}

function getRandomEffect(stage) {
    const effectPools = {
        Rookie: [
            { type: 'chargeSpeed', min: 1, max: 10 },
            { type: 'attackDamage', min: 1, max: 10 },
            { type: 'maxHp', min: 1, max: 10 },
            { type: 'trainingExp', min: 1, max: 10 },
            { type: 'farmingGain', min: 1, max: 10 },
            { type: 'trainingCost', min: -10, max: -1 },
            { type: 'nullifyDamage', min: 1, max: 5 }
        ],
        Champion: [
            { type: 'chargeSpeed', min: 3, max: 20 },
            { type: 'attackDamage', min: 3, max: 20 },
            { type: 'maxHp', min: 3, max: 20 },
            { type: 'trainingExp', min: 3, max: 20 },
            { type: 'farmingGain', min: 3, max: 20 },
            { type: 'trainingCost', min: -15, max: -2 },
            { type: 'nullifyDamage', min: 2, max: 7 }
        ],
        Ultimate: [
            { type: 'chargeSpeed', min: 5, max: 30 },
            { type: 'attackDamage', min: 5, max: 30 },
            { type: 'maxHp', min: 5, max: 30 },
            { type: 'trainingExp', min: 5, max: 30 },
            { type: 'farmingGain', min: 5, max: 30 },
            { type: 'trainingCost', min: -17, max: -3 },
            { type: 'nullifyDamage', min: 3, max: 9 }
        ],
        Mega: [
            { type: 'chargeSpeed', min: 7, max: 40 },
            { type: 'attackDamage', min: 7, max: 40 },
            { type: 'maxHp', min: 7, max: 40 },
            { type: 'trainingExp', min: 7, max: 40 },
            { type: 'farmingGain', min: 7, max: 40 },
            { type: 'trainingCost', min: -19, max: -4 },
            { type: 'nullifyDamage', min: 4, max: 11 }
        ],
        Ultra: [
            { type: 'chargeSpeed', min: 15, max: 100 },
            { type: 'attackDamage', min: 15, max: 100 },
            { type: 'maxHp', min: 15, max: 100 },
            { type: 'trainingExp', min: 15, max: 100 },
            { type: 'farmingGain', min: 15, max: 100 },
            { type: 'trainingCost', min: -20, max: -5 },
            { type: 'nullifyDamage', min: 5, max: 19 }
        ]
    };

    const pool = effectPools[stage] || effectPools["Rookie"];
    const effect = pool[Math.floor(Math.random() * pool.length)];
    let value = Math.floor(Math.random() * (effect.max - effect.min + 1)) + effect.min;
    if (effect.type === 'trainingCost' && value > -1) {
        value = -1;
    }
    return { type: effect.type, value: value };
}

function equipFromInventory(invIndex) {
    if (state.currentEquipSlot === null || state.currentEquipSlot < 0 || state.currentEquipSlot >= 5) {
        logMessage("No valid equipment slot selected.");
        return;
    }
    if (invIndex < 0 || invIndex >= state.ringInventory.length) {
        logMessage("Invalid ring selected from inventory.");
        return;
    }
    const ring = state.ringInventory[invIndex];
    const slot = state.currentEquipSlot;
    if (state.equipmentSlots[slot]) {
        const oldRing = state.equipmentSlots[slot];
        state.ringInventory[invIndex] = oldRing;
        logMessage(`Swapped ${ring.name} with ${oldRing.name} in slot ${slot + 1}.`);
    } else {
        state.ringInventory.splice(invIndex, 1);
        logMessage(`Equipped ${ring.name} to slot ${slot + 1}.`);
    }
    state.equipmentSlots[slot] = ring;
    const player = state.digimonSlots[state.activeDigimonIndex];
    if (player) {
        const equipHpBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.baseStats.hp || 0), 0) +
            Math.floor(player.maxHp * state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'maxHp')?.value || 0), 0) / 100);
        const totalMaxHp = player.maxHp + player.shopBonuses.hp + player.rebirthBonuses.hp + equipHpBonus;
        player.hp = Math.min(player.hp, totalMaxHp);
    }
    updateUI();
    saveProgress();
}

function sellRing(slotIndex) {
    if (slotIndex < 0 || slotIndex >= 5 || !state.equipmentSlots[slotIndex]) {
        logMessage(`No ring in slot ${slotIndex + 1} to sell!`);
        return;
    }
    const ring = state.equipmentSlots[slotIndex];
    const sellValue = Math.floor((ring.baseStats.attack + ring.baseStats.hp) * 0.5);
    state.bit += sellValue;
    logMessage(`Sold ${ring.name} from slot ${slotIndex + 1} for ${sellValue} BIT!`);
    state.equipmentSlots[slotIndex] = null;
    const player = state.digimonSlots[state.activeDigimonIndex];
    if (player) {
        const equipHpBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.baseStats.hp || 0), 0) +
            Math.floor(player.maxHp * state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'maxHp')?.value || 0), 0) / 100);
        const totalMaxHp = player.maxHp + player.shopBonuses.hp + player.rebirthBonuses.hp + equipHpBonus;
        player.hp = Math.min(player.hp, totalMaxHp);
    }
    updateUI();
    saveProgress();
}

function sellInventoryRing(invIndex) {
    if (invIndex < 0 || invIndex >= state.ringInventory.length) {
        logMessage("Invalid ring selected for selling.");
        return;
    }
    const ring = state.ringInventory.splice(invIndex, 1)[0];
    const sellValue = Math.floor((ring.baseStats.attack + ring.baseStats.hp) * 0.5);
    state.bit += sellValue;
    logMessage(`Sold ${ring.name} from inventory for ${sellValue} BIT!`);
    updateUI();
    saveProgress();
}