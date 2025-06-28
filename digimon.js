async function hatchEgg(slotIndex) {
    let rookies = [];
    let page = 1;
    const pageSize = 100;
    const levels = ["Child", "child"];

    try {
        for (const level of levels) {
            logMessage(`Attempting to fetch Digimon for level ${level}, page ${page}`);
            const response = await fetchWithRetry(`${API_BASE_URL}/digimon?level=${encodeURIComponent(level)}&page=${page}&pageSize=${pageSize}`);
            if (response.content && response.content.length > 0) {
                rookies = rookies.concat(response.content);
                while (response.pageable && response.pageable.nextPage) {
                    page++;
                    const nextResponse = await fetchWithRetry(response.pageable.nextPage);
                    if (nextResponse.content && nextResponse.content.length > 0) {
                        rookies = rookies.concat(nextResponse.content);
                    } else {
                        break;
                    }
                }
                break;
            }
        }
    } catch (error) {
        logMessage(`Failed to fetch Digimon: ${error.message}`);
        return;
    }

    if (rookies.length === 0) {
        logMessage("No Digimon data available from API.");
        return;
    }

    const digimon = rookies[Math.floor(Math.random() * rookies.length)];
    const multiplier = getStatMultiplier("Rookie");
    const newDigimon = {
        name: digimon.name,
        level: 1,
        hp: (digimon.baseStats?.hp || 100) * multiplier,
        maxHp: (digimon.baseStats?.hp || 100) * multiplier,
        attack: (digimon.baseStats?.attack || 20) * multiplier,
        xp: 0,
        totalXp: 0,
        xpNext: 100,
        sprite: validateSpriteUrl(digimon.images?.[0]?.href || FALLBACK_SPRITE),
        evolutions: digimon.priorEvolutions?.map(evo => ({ id: evo.id, name: evo.digimon, level: getEvolutionLevel(evo.level) })) || [],
        shopBonuses: { attack: 0, hp: 0 },
        rebirthBonuses: { attack: 0, hp: 0 },
        stage: "Rookie"
    };

    state.digimonSlots[slotIndex] = newDigimon;
    state.activeDigimonIndex = slotIndex;
    logMessage(`A ${newDigimon.name} hatched in slot ${slotIndex + 1}!`);
    showMenu();
    updateUI();
    saveProgress(true);
}

function buySlot(slotIndex) {
    const cost = 100 * Math.pow(5, slotIndex);
    if (state.digimonSlots[slotIndex]) {
        logMessage(`Slot ${slotIndex + 1} is already occupied!`);
        return;
    }
    if (state.bit < cost) {
        logMessage(`Not enough BIT (need ${cost}, have ${state.bit}) to buy slot ${slotIndex + 1}!`);
        return;
    }
    state.bit -= cost;
    hatchEgg(slotIndex);
}

function buyAttackBoost() {
    if (state.bit < 10000) {
        logMessage(`Not enough BIT (need 10000, have ${state.bit}) to buy an Attack Boost!`);
        return;
    }
    const digimon = state.digimonSlots[state.activeDigimonIndex];
    if (!digimon) {
        logMessage(`No active Digimon selected! Select a Digimon first.`);
        return;
    }
    state.bit -= 10000;
    digimon.shopBonuses.attack += 1;
    digimon.attack += 1;
    logMessage(`${digimon.name}'s Attack permanently increased by 1!`);
    updateUI();
    saveProgress();
}

function buyAttackBoostBulk(amount) {
    const costPerBoost = 10000;
    const digimon = state.digimonSlots[state.activeDigimonIndex];
    if (!digimon) {
        logMessage(`No active Digimon selected! Select a Digimon first.`);
        return;
    }
    let maxAffordable = Math.floor(state.bit / costPerBoost);
    let numBoosts = amount === 'half' ? Math.floor(maxAffordable / 2) : amount === 'all' ? maxAffordable : 0;
    if (numBoosts === 0) {
        logMessage(`Not enough BIT to buy any Attack Boosts (need ${costPerBoost}, have ${state.bit})!`);
        return;
    }
    const totalCost = numBoosts * costPerBoost;
    state.bit -= totalCost;
    digimon.shopBonuses.attack += numBoosts;
    digimon.attack += numBoosts;
    logMessage(`${digimon.name}'s Attack permanently increased by ${numBoosts}! Spent ${totalCost} BIT.`);
    updateUI();
    saveProgress();
}

function buyHPBoost() {
    if (state.bit < 10000) {
        logMessage(`Not enough BIT (need 10000, have ${state.bit}) to buy an HP Boost!`);
        return;
    }
    const digimon = state.digimonSlots[state.activeDigimonIndex];
    if (!digimon) {
        logMessage(`No active Digimon selected! Select a Digimon first.`);
        return;
    }
    state.bit -= 10000;
    digimon.shopBonuses.hp += 5;
    digimon.maxHp += 5;
    digimon.hp = digimon.maxHp;
    logMessage(`${digimon.name}'s HP permanently increased by 5!`);
    updateUI();
    saveProgress();
}

function buyHPBoostBulk(amount) {
    const costPerBoost = 10000;
    const digimon = state.digimonSlots[state.activeDigimonIndex];
    if (!digimon) {
        logMessage(`No active Digimon selected! Select a Digimon first.`);
        return;
    }
    let maxAffordable = Math.floor(state.bit / costPerBoost);
    let numBoosts = amount === 'half' ? Math.floor(maxAffordable / 2) : amount === 'all' ? maxAffordable : 0;
    if (numBoosts === 0) {
        logMessage(`Not enough BIT to buy any HP Boosts (need ${costPerBoost}, have ${state.bit})!`);
        return;
    }
    const totalCost = numBoosts * costPerBoost;
    state.bit -= totalCost;
    digimon.shopBonuses.hp += numBoosts * 5;
    digimon.maxHp += numBoosts * 5;
    digimon.hp = digimon.maxHp;
    logMessage(`${digimon.name}'s HP permanently increased by ${numBoosts * 5}! Spent ${totalCost} BIT.`);
    updateUI();
    saveProgress();
}

async function rebirthDigimon(slotIndex) {
    const digimon = state.digimonSlots[slotIndex];
    if (!digimon) {
        logMessage(`No Digimon in slot ${slotIndex + 1}.`);
        return;
    }
    if (digimon.level < 15) {
        logMessage(`${digimon.name} must be at least level 15 to rebirth (current level: ${digimon.level})!`);
        return;
    }
    let rookies = [];
    let page = 1;
    const pageSize = 100;
    const levels = ["Child", "child"];

    try {
        for (const level of levels) {
            logMessage(`Attempting to fetch Digimon for level ${level}, page ${page}`);
            const response = await fetchWithRetry(`${API_BASE_URL}/digimon?level=${encodeURIComponent(level)}&page=${page}&pageSize=${pageSize}`);
            if (response.content && response.content.length > 0) {
                rookies = rookies.concat(response.content);
                while (response.pageable && response.pageable.nextPage) {
                    page++;
                    const nextResponse = await fetchWithRetry(response.pageable.nextPage);
                    if (nextResponse.content && nextResponse.content.length > 0) {
                        rookies = rookies.concat(nextResponse.content);
                    } else {
                        break;
                    }
                }
                break;
            }
        }
    } catch (error) {
        logMessage(`Failed to fetch Digimon: ${error.message}`);
        return;
    }

    if (rookies.length === 0) {
        logMessage("No Child Digimon data available from API.");
        return;
    }

    const newDigimon = rookies[Math.floor(Math.random() * rookies.length)];
    const multiplier = getStatMultiplier("Rookie");
    const newAttackBonus = Math.floor((digimon.attack - digimon.shopBonuses.attack - digimon.rebirthBonuses.attack) * 0.05);
    const newMaxHpBonus = Math.floor((digimon.maxHp - digimon.shopBonuses.hp - digimon.rebirthBonuses.hp) * 0.05);

    state.digimonSlots[slotIndex] = {
        name: newDigimon.name,
        level: 1,
        hp: ((newDigimon.baseStats?.hp || 100) * multiplier) + digimon.rebirthBonuses.hp + newMaxHpBonus + digimon.shopBonuses.hp,
        maxHp: ((newDigimon.baseStats?.hp || 100) * multiplier) + digimon.rebirthBonuses.hp + newMaxHpBonus + digimon.shopBonuses.hp,
        attack: ((newDigimon.baseStats?.attack || 20) * multiplier) + digimon.rebirthBonuses.attack + newAttackBonus + digimon.shopBonuses.attack,
        xp: 0,
        totalXp: digimon.totalXp,
        xpNext: 100,
        sprite: validateSpriteUrl(newDigimon.images?.[0]?.href || FALLBACK_SPRITE),
        evolutions: newDigimon.priorEvolutions?.map(evo => ({ id: evo.id, name: evo.digimon, level: getEvolutionLevel(evo.level) })) || [],
        shopBonuses: { attack: digimon.shopBonuses.attack, hp: digimon.shopBonuses.hp },
        rebirthBonuses: { attack: digimon.rebirthBonuses.attack + newAttackBonus, hp: digimon.rebirthBonuses.hp + newMaxHpBonus },
        stage: "Rookie"
    };
    if (state.activeDigimonIndex === slotIndex) state.activeDigimonIndex = slotIndex;
    state.afkModes[slotIndex] = null;
    logMessage(`${digimon.name} rebirthed into ${newDigimon.name}!`);
    updateMenu();
    saveProgress();
}

async function checkEvolution(slotIndex) {
    const digimon = state.digimonSlots[slotIndex];
    if (!digimon) return;
    const evolution = digimon.evolutions.find(e => 
        (e.level === 50 && digimon.level >= 50 && digimon.stage === "Rookie") ||
        (e.level === 500 && digimon.level >= 500 && digimon.stage === "Champion") ||
        (e.level === 5000 && digimon.level >= 5000 && digimon.stage === "Ultimate")
    );
    if (evolution) {
        const oldStage = digimon.stage;
        const evolvedDigimon = await fetchDigimonById(evolution.id);
        if (!evolvedDigimon) {
            logMessage(`Failed to fetch evolution data for ${evolution.name}!`);
            return;
        }
        digimon.name = evolvedDigimon.name;
        digimon.sprite = validateSpriteUrl(evolvedDigimon.images?.[0]?.href || FALLBACK_SPRITE);
        digimon.stage = evolvedDigimon.level === "Adult" ? "Champion" : evolvedDigimon.level === "Perfect" ? "Ultimate" : "Mega";
        const newMultiplier = getStatMultiplier(digimon.stage);
        const oldMultiplier = getStatMultiplier(oldStage);
        digimon.maxHp = Math.floor((digimon.maxHp / oldMultiplier) * newMultiplier);
        digimon.hp = digimon.maxHp;
        digimon.attack = Math.floor((digimon.attack / oldMultiplier) * newMultiplier);
        digimon.evolutions = evolvedDigimon.priorEvolutions?.map(evo => ({ id: evo.id, name: evo.digimon, level: getEvolutionLevel(evo.level) })) || [];
        logMessage(`${digimon.name} evolved into ${evolvedDigimon.name}!`);
    }
    updateUI();
}

function getEvolutionLevel(level) {
    const levelMap = {
        "Child": 50,
        "Adult": 500,
        "Perfect": 5000,
        "Ultimate": 5000
    };
    return levelMap[level] || 5000;
}

async function jogress(slotIndex1, slotIndex2) {
    const digimon1 = state.digimonSlots[slotIndex1];
    const digimon2 = state.digimonSlots[slotIndex2];
    if (!digimon1 || !digimon2) {
        logMessage(`Invalid Digimon selection (Slot ${slotIndex1 + 1} or Slot ${slotIndex2 + 1} empty).`);
        return;
    }
    const pair = jogressPairs.find(p =>
        (p.digimon1 === digimon1.name && p.digimon2 === digimon2.name) ||
        (p.digimon1 === digimon2.name && p.digimon2 === digimon1.name)
    );
    if (!pair) {
        logMessage(`No valid Jogress pair for ${digimon1.name} and ${digimon2.name}.`);
        return;
    }
    if (digimon1.level < pair.minLevel || digimon2.level < pair.minLevel) {
        logMessage(`Both Digimon must be at least level ${pair.minLevel} (${digimon1.name}: Lv${digimon1.level}, ${digimon2.name}: Lv${digimon2.level}).`);
        return;
    }
    if (state.jogressShards < pair.shardCost) {
        logMessage(`Need ${pair.shardCost} Jogress Shards (have ${state.jogressShards}) for this Jogress. Buy in shop for 2000 BIT each.`);
        return;
    }
    state.jogressShards -= pair.shardCost;
    const newLevel = Math.max(digimon1.level, digimon2.level);
    const newStage = pair.minLevel >= 25 ? "Mega" : pair.minLevel >= 10 ? "Ultimate" : "Champion";
    const multiplier = getStatMultiplier(newStage);
    const baseMaxHp = pair.result.baseStats.hp * multiplier + digimon1.shopBonuses.hp + digimon2.shopBonuses.hp + digimon1.rebirthBonuses.hp + digimon2.rebirthBonuses.hp;
    const baseAttack = pair.result.baseStats.attack * multiplier + digimon1.shopBonuses.attack + digimon2.shopBonuses.attack + digimon1.rebirthBonuses.attack + digimon2.rebirthBonuses.attack;
    const jogressDigimon = await fetchDigimonByName(pair.result.name);
    state.digimonSlots[slotIndex1] = {
        name: pair.result.name,
        level: newLevel,
        hp: baseMaxHp,
        maxHp: baseMaxHp,
        attack: baseAttack,
        xp: 0,
        totalXp: digimon1.totalXp + digimon2.totalXp,
        xpNext: 100 * newLevel,
        sprite: jogressDigimon ? validateSpriteUrl(jogressDigimon.images?.[0]?.href || FALLBACK_SPRITE) : pair.result.sprite,
        evolutions: jogressDigimon?.priorEvolutions?.map(evo => ({ id: evo.id, name: evo.digimon, level: getEvolutionLevel(evo.level) })) || [],
        shopBonuses: { attack: digimon1.shopBonuses.attack + digimon2.shopBonuses.attack, hp: digimon1.shopBonuses.hp + digimon2.shopBonuses.hp },
        rebirthBonuses: { attack: digimon1.rebirthBonuses.attack + digimon2.rebirthBonuses.attack, hp: digimon1.rebirthBonuses.hp + digimon2.rebirthBonuses.hp },
        stage: newStage
    };
    state.digimonSlots[slotIndex2] = null;
    if (state.activeDigimonIndex === slotIndex2) state.activeDigimonIndex = slotIndex1;
    logMessage(`${digimon1.name} and ${digimon2.name} Jogressed into ${pair.result.name}!`);
    updateMenu();
    saveProgress();
}

function showDigimonInfo(slotIndex) {
    const digimon = state.digimonSlots[slotIndex];
    if (!digimon) {
        logMessage(`No Digimon in slot ${slotIndex + 1}.`);
        return;
    }
    const evolutions = digimon.evolutions.map(e => `${e.name} (Lv${e.level})`).join(", ") || "None";
    logMessage(`
Digimon Info:
- Name: ${digimon.name}
- Level: ${digimon.level}
- HP: ${digimon.hp}/${digimon.maxHp} (+${digimon.shopBonuses.hp} shop, +${digimon.rebirthBonuses.hp} rebirth)
- Attack: ${digimon.attack} (+${digimon.shopBonuses.attack} shop, +${digimon.rebirthBonuses.attack} rebirth)
- XP: ${digimon.xp}/${digimon.xpNext}
- Total XP: ${digimon.totalXp}
- Current Evolution: ${digimon.name}
- Possible Evolutions: ${evolutions}
    `.trim());
}

function getStatMultiplier(stage) {
    return { Rookie: 1, Champion: 2, Ultimate: 3, Mega: 4, Ultra: 6 }[stage] || 1;
}