import { fetchDigimon, generateJogressPairs } from './data.js';

export async function getStatMultiplier(stage) {
    return {
        Champion: 2,
        Ultimate: 3,
        Mega: 4,
        Ultra: 6,
        Rookie: 1
    }[stage] || 1;
}

export async function hatchEgg(slotIndex) {
    const rookieNames = Object.keys(digimonData).filter(name => digimonData[name]?.stage === "Rookie");
    const randomIndex = Math.floor(Math.random() * rookieNames.length);
    let name = rookieNames[randomIndex] || "Agumon";

    // Try fetching a new random Rookie from the API
    try {
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const response = await fetch(proxyUrl + encodeURIComponent('https://digimon-api.com/api/v1/digimon?pageSize=100'));
        const proxyData = await response.json();
        const data = JSON.parse(proxyData.contents);
        const rookies = data.content.filter(d => d.levels?.[0]?.level === "Rookie");
        if (rookies.length > 0) {
            name = rookies[Math.floor(Math.random() * rookies.length)].name;
        }
    } catch (error) {
        console.warn("Failed to fetch Rookie list, using cached name:", name);
    }

    const baseDigimon = await fetchDigimon(name) || {
        sprite: "https://digimon-api.com/images/digimon/Agumon.png",
        evolutions: [
            { name: "Greymon", level: 50, sprite: "https://digimon-api.com/images/digimon/Greymon.png" },
            { name: "MetalGreymon", level: 200, sprite: "https://digimon-api.com/images/digimon/MetalGreymon.png" },
            { name: "WarGreymon", level: 1000, sprite: "https://digimon-api.com/images/digimon/WarGreymon.png" }
        ],
        baseStats: { hp: 80, attack: 20 },
        stage: "Rookie",
        nextEvolutions: []
    };

    const multiplier = await getStatMultiplier(baseDigimon.stage);
    const newDigimon = {
        name,
        level: 1,
        hp: baseDigimon.baseStats.hp * multiplier,
        maxHp: baseDigimon.baseStats.hp * multiplier,
        attack: baseDigimon.baseStats.attack * multiplier,
        xp: 0,
        totalXp: 0,
        xpNext: 100,
        sprite: baseDigimon.sprite,
        evolutions: baseDigimon.evolutions,
        shopBonuses: { attack: 0, hp: 0 },
        rebirthBonuses: { attack: 0, hp: 0 },
        stage: baseDigimon.stage
    };
    state.digimonSlots[slotIndex] = newDigimon;
    state.activeDigimonIndex = slotIndex;
    showMenu();
    logMessage(`A ${newDigimon.name} hatched in slot ${slotIndex + 1}!`);
}

export async function buySlot(slotIndex) {
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
    await hatchEgg(slotIndex);
    updateUI();
    saveProgress();
}

export function buyAttackBoost() {
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

export function buyAttackBoostBulk(amount) {
    const costPerBoost = 10000;
    const digimon = state.digimonSlots[state.activeDigimonIndex];
    if (!digimon) {
        logMessage(`No active Digimon selected! Select a Digimon first.`);
        return;
    }
    let maxAffordable = Math.floor(state.bit / costPerBoost);
    let numBoosts;
    if (amount === 'half') {
        numBoosts = Math.floor(maxAffordable / 2);
    } else if (amount === 'all') {
        numBoosts = maxAffordable;
    } else {
        logMessage("Invalid bulk purchase option.");
        return;
    }
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

export function buyHPBoost() {
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

export function buyHPBoostBulk(amount) {
    const costPerBoost = 10000;
    const digimon = state.digimonSlots[state.activeDigimonIndex];
    if (!digimon) {
        logMessage(`No active Digimon selected! Select a Digimon first.`);
        return;
    }
    let maxAffordable = Math.floor(state.bit / costPerBoost);
    let numBoosts;
    if (amount === 'half') {
        numBoosts = Math.floor(maxAffordable / 2);
    } else if (amount === 'all') {
        numBoosts = maxAffordable;
    } else {
        logMessage("Invalid bulk purchase option.");
        return;
    }
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

export async function rebirthDigimon(slotIndex) {
    const digimon = state.digimonSlots[slotIndex];
    if (!digimon) {
        logMessage(`No Digimon in slot ${slotIndex + 1}.`);
        return;
    }
    if (digimon.level < 15) {
        logMessage(`${digimon.name} must be at least level 15 to rebirth (current level: ${digimon.level})!`);
        return;
    }
    const rookieNames = Object.keys(digimonData).filter(name => digimonData[name]?.stage === "Rookie");
    const randomIndex = Math.floor(Math.random() * rookieNames.length);
    let newName = rookieNames[randomIndex] || "Agumon";

    // Try fetching a new random Rookie from the API
    try {
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const response = await fetch(proxyUrl + encodeURIComponent('https://digimon-api.com/api/v1/digimon?pageSize=100'));
        const proxyData = await response.json();
        const data = JSON.parse(proxyData.contents);
        const rookies = data.content.filter(d => d.levels?.[0]?.level === "Rookie");
        if (rookies.length > 0) {
            newName = rookies[Math.floor(Math.random() * rookies.length)].name;
        }
    } catch (error) {
        console.warn("Failed to fetch Rookie list for rebirth, using cached name:", newName);
    }

    const baseDigimon = await fetchDigimon(newName) || {
        sprite: "https://digimon-api.com/images/digimon/Agumon.png",
        evolutions: [
            { name: "Greymon", level: 50, sprite: "https://digimon-api.com/images/digimon/Greymon.png" },
            { name: "MetalGreymon", level: 200, sprite: "https://digimon-api.com/images/digimon/MetalGreymon.png" },
            { name: "WarGreymon", level: 1000, sprite: "https://digimon-api.com/images/digimon/WarGreymon.png" }
        ],
        baseStats: { hp: 80, attack: 20 },
        stage: "Rookie",
        nextEvolutions: []
    };

    const multiplier = await getStatMultiplier(baseDigimon.stage);
    const newAttackBonus = Math.floor((digimon.attack - digimon.shopBonuses.attack - digimon.rebirthBonuses.attack) * 0.05);
    const newMaxHpBonus = Math.floor((digimon.maxHp - digimon.shopBonuses.hp - digimon.rebirthBonuses.hp) * 0.05);

    state.digimonSlots[slotIndex] = {
        name: newName,
        level: 1,
        hp: (baseDigimon.baseStats.hp * multiplier) + digimon.rebirthBonuses.hp + newMaxHpBonus + digimon.shopBonuses.hp,
        maxHp: (baseDigimon.baseStats.hp * multiplier) + digimon.rebirthBonuses.hp + newMaxHpBonus + digimon.shopBonuses.hp,
        attack: (baseDigimon.baseStats.attack * multiplier) + digimon.rebirthBonuses.attack + newAttackBonus + digimon.shopBonuses.attack,
        xp: 0,
        totalXP: digimon.totalXp,
        xpNext: 100,
        sprite: baseDigimon.sprite,
        evolutions: baseDigimon.evolutions,
        shopBonuses: { attack: digimon.shopBonuses.attack, hp: digimon.shopBonuses.hp },
        rebirthBonuses: { attack: digimon.rebirthBonuses.attack + newAttackBonus, hp: digimon.rebirthBonuses.hp + newMaxHpBonus },
        stage: baseDigimon.stage
    };
    if (state.activeDigimonIndex === slotIndex) {
        state.activeDigimonIndex = slotIndex;
    }
    state.afkModes[slotIndex] = null;
    logMessage(`${digimon.name} rebirthed into ${newName}!`);
    updateMenu();
    saveProgress();
}

export function gainXP(slotIndex, amount) {
    const digimon = state.digimonSlots[slotIndex];
    if (!digimon) return;
    digimon.xp += amount;
    digimon.totalXp += amount;
    const multiplier = getStatMultiplier(digimon.stage);
    while (digimon.xp >= digimon.xpNext) {
        digimon.level++;
        digimon.xp -= digimon.xpNext;
        digimon.xpNext = digimon.level < 10 ? Math.floor(digimon.xpNext * 1.5) : 3000;
        digimon.maxHp += 20 * multiplier;
        digimon.hp = digimon.maxHp;
        digimon.attack += 5 * multiplier;
        logMessage(`${digimon.name} leveled up to Level ${digimon.level}!`);
        const evolutionLevels = [50, 200, 1000, 5000];
        if (evolutionLevels.includes(digimon.level)) {
            checkEvolution(slotIndex);
        }
    }
    updateUI();
}

export async function checkEvolution(slotIndex) {
    const digimon = state.digimonSlots[slotIndex];
    if (!digimon || digimon.evolutions.length === 0) return;

    const stageOrder = { Rookie: 1, Champion: 2, Ultimate: 3, Mega: 4, Ultra: 5 };
    const validEvolutions = digimon.evolutions.filter(evo => {
        const evoData = digimonData[evo.name] || {};
        const evoStage = evoData.stage;
        return (
            evoStage &&
            stageOrder[evoStage] > stageOrder[digimon.stage] &&
            (
                (evoStage === "Champion" && digimon.level >= 50 && digimon.stage === "Rookie") ||
                (evoStage === "Ultimate" && digimon.level >= 200 && digimon.stage === "Champion") ||
                (evoStage === "Mega" && digimon.level >= 1000 && digimon.stage === "Ultimate") ||
                (evoStage === "Ultra" && digimon.level >= 5000 && digimon.stage === "Mega")
            )
        );
    });

    if (validEvolutions.length > 0) {
        const evolution = validEvolutions[Math.floor(Math.random() * validEvolutions.length)];
        await fetchDigimon(evolution.name); // Ensure evolution data is fetched
        const oldStage = digimon.stage;
        digimon.name = evolution.name;
        digimon.sprite = evolution.sprite;
        digimon.stage = digimonData[evolution.name].stage;
        const newMultiplier = await getStatMultiplier(digimon.stage);
        const oldMultiplier = await getStatMultiplier(oldStage);
        const baseDigimon = digimonData[evolution.name];
        if (baseDigimon) {
            digimon.maxHp = Math.floor((digimon.maxHp / oldMultiplier) * newMultiplier);
            digimon.hp = digimon.maxHp;
            digimon.attack = Math.floor((digimon.attack / oldMultiplier) * newMultiplier);
            digimon.evolutions = baseDigimon.evolutions;
        }
        logMessage(`${digimon.name} evolved into ${evolution.name}!`);
    }
    updateUI();
}

export async function jogress(slotIndex1, slotIndex2) {
    const digimon1 = state.digimonSlots[slotIndex1];
    const digimon2 = state.digimonSlots[slotIndex2];
    if (!digimon1 || !digimon2) {
        logMessage(`Invalid Digimon selection (Slot ${slotIndex1 + 1} or Slot ${slotIndex2 + 1} empty).`);
        return;
    }
    const jogressPairs = await generateJogressPairs();
    const stageOrder = { Rookie: 1, Champion: 2, Ultimate: 3, Mega: 4, Ultra: 5 };
    const pair = jogressPairs.find(p =>
        (p.digimon1 === digimon1.name && p.digimon2 === digimon2.name) ||
        (p.digimon1 === digimon2.name && p.digimon2 === digimon1.name)
    );
    if (!pair) {
        logMessage(`No valid Jogress pair for ${digimon1.name} and ${digimon2.name}.`);
        return;
    }
    if (stageOrder[digimon1.stage] < stageOrder[pair.minStage] || stageOrder[digimon2.stage] < stageOrder[pair.minStage]) {
        logMessage(`Both Digimon must be at least ${pair.minStage} stage (${digimon1.name}: ${digimon1.stage}, ${digimon2.name}: ${digimon2.stage}).`);
        return;
    }
    if (state.jogressShards < pair.shardCost) {
        logMessage(`Need ${pair.shardCost} Jogress Shards (have ${state.jogressShards}) for this Jogress. Buy in shop for 2000 BIT each.`);
        return;
    }
    await fetchDigimon(pair.result.name); // Ensure result Digimon data is fetched
    state.jogressShards -= pair.shardCost;
    const newLevel = Math.max(digimon1.level, digimon2.level);
    const newStage = pair.result.baseStats.hp === BASE_STATS.Champion.hp ? "Champion" :
                    pair.result.baseStats.hp === BASE_STATS.Ultimate.hp ? "Ultimate" :
                    pair.result.baseStats.hp === BASE_STATS.Mega.hp ? "Mega" : "Ultra";
    const multiplier = await getStatMultiplier(newStage);
    const baseMaxHp = pair.result.baseStats.hp * multiplier + digimon1.shopBonuses.hp + digimon2.shopBonuses.hp + digimon1.rebirthBonuses.hp + digimon2.rebirthBonuses.hp;
    const baseAttack = pair.result.baseStats.attack * multiplier + digimon1.shopBonuses.attack + digimon2.shopBonuses.attack + digimon1.rebirthBonuses.attack + digimon2.rebirthBonuses.attack;
    state.digimonSlots[slotIndex1] = {
        name: pair.result.name,
        level: newLevel,
        hp: baseMaxHp,
        maxHp: baseMaxHp,
        attack: baseAttack,
        xp: 0,
        totalXP: digimon1.totalXp + digimon2.totalXp,
        xpNext: 100 * newLevel,
        sprite: pair.result.sprite,
        evolutions: digimonData[pair.result.name]?.evolutions || [],
        shopBonuses: { attack: digimon1.shopBonuses.attack + digimon2.shopBonuses.attack, hp: digimon1.shopBonuses.hp + digimon2.shopBonuses.hp },
        rebirthBonuses: { attack: digimon1.rebirthBonuses.attack + digimon2.rebirthBonuses.attack, hp: digimon1.rebirthBonuses.hp + digimon2.rebirthBonuses.hp },
        stage: newStage
    };
    state.digimonSlots[slotIndex2] = null;
    if (state.activeDigimonIndex === slotIndex2) {
        state.activeDigimonIndex = slotIndex1;
    }
    logMessage(`${digimon1.name} and ${digimon2.name} Jogressed into ${pair.result.name}!`);
    updateMenu();
    saveProgress();
}

export function showDigimonInfo(slotIndex) {
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
- Current Evolution: ${digimon.stage}
- Possible Evolutions: ${evolutions}
    `.trim());
}