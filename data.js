const BASE_STATS = {
    Rookie: { hp: 80, attack: 20 },
    Champion: { hp: 120, attack: 30 },
    Ultimate: { hp: 160, attack: 40 },
    Mega: { hp: 200, attack: 50 },
    Ultra: { hp: 240, attack: 60 }
};

let digimonData = {
    Agumon: {
        sprite: "https://digimon-api.com/images/digimon/Agumon.png",
        evolutions: [
            { name: "Greymon", level: 50, sprite: "https://digimon-api.com/images/digimon/Greymon.png" },
            { name: "MetalGreymon", level: 200, sprite: "https://digimon-api.com/images/digimon/MetalGreymon.png" },
            { name: "WarGreymon", level: 1000, sprite: "https://digimon-api.com/images/digimon/WarGreymon.png" }
        ],
        baseStats: { ...BASE_STATS.Rookie },
        stage: "Rookie",
        nextEvolutions: []
    },
    Greymon: {
        sprite: "https://digimon-api.com/images/digimon/Greymon.png",
        evolutions: [
            { name: "MetalGreymon", level: 200, sprite: "https://digimon-api.com/images/digimon/MetalGreymon.png" },
            { name: "WarGreymon", level: 1000, sprite: "https://digimon-api.com/images/digimon/WarGreymon.png" }
        ],
        baseStats: { ...BASE_STATS.Champion },
        stage: "Champion",
        nextEvolutions: []
    },
    MetalGreymon: {
        sprite: "https://digimon-api.com/images/digimon/MetalGreymon.png",
        evolutions: [
            { name: "WarGreymon", level: 1000, sprite: "https://digimon-api.com/images/digimon/WarGreymon.png" }
        ],
        baseStats: { ...BASE_STATS.Ultimate },
        stage: "Ultimate",
        nextEvolutions: []
    },
    WarGreymon: {
        sprite: "https://digimon-api.com/images/digimon/WarGreymon.png",
        evolutions: [],
        baseStats: { ...BASE_STATS.Mega },
        stage: "Mega",
        nextEvolutions: []
    },
    Omnimon: {
        sprite: "https://digimon-api.com/images/digimon/Omnimon.png",
        evolutions: [],
        baseStats: { ...BASE_STATS.Ultra },
        stage: "Ultra",
        nextEvolutions: []
    }
};

async function fetchDigimonFromAPI(name) {
    try {
        const response = await fetch(`/api/digimon?name=${encodeURIComponent(name)}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        const digimon = data[0];
        if (!digimon) return null;
        return {
            name: digimon.name,
            sprite: digimon.images[0]?.href || `https://via.placeholder.com/60?text=${encodeURIComponent(digimon.name)}`,
            baseStats: BASE_STATS[normalizeStage(digimon.level)] || BASE_STATS.Rookie,
            stage: normalizeStage(digimon.level),
            evolutions: [] // API doesn't provide evolutions, use hardcoded if needed
        };
    } catch (error) {
        logMessage(`API Error: Failed to fetch ${name}.`);
        console.error(`Failed to fetch Digimon ${name}:`, error);
        return null;
    }
}

async function fetchDigimon(name) {
    const apiData = await fetchDigimonFromAPI(name);
    return apiData || digimonData[name] || null;
}

function normalizeStage(apiLevel) {
    switch (apiLevel) {
        case "Rookie": return "Rookie";
        case "Champion": return "Champion";
        case "Ultimate": return "Ultimate";
        case "Mega": return "Mega";
        case "Ultra": return "Ultra";
        default: return "Rookie";
    }
}

function getEvolutionLevel(currentStage) {
    const levelMap = {
        Rookie: 50,
        Champion: 200,
        Ultimate: 1000,
        Mega: 5000
    };
    return levelMap[currentStage] || 50;
}

function getJogressShardCost(resultStage) {
    const shardCostMap = {
        Champion: 3,
        Ultimate: 5,
        Mega: 10,
        Ultra: 20
    };
    return shardCostMap[resultStage] || 5;
}

function parseConditionPartners(condition) {
    const partnerMatch = condition.match(/with (.+?)(?:, or | or |$)/);
    if (!partnerMatch) return [];
    return partnerMatch[1].split(/, | or /).map(name => name.trim()).filter(name => name && digimonData[name]);
}

function generateJogressPairs() {
    const validStages = ["Rookie", "Champion", "Ultimate", "Mega", "Ultra"];
    const stageOrder = { Rookie: 1, Champion: 2, Ultimate: 3, Mega: 4, Ultra: 5 };
    const jogressPairs = [];

    for (const [name, digimon] of Object.entries(digimonData)) {
        for (const evo of digimon.nextEvolutions) {
            const evoStage = normalizeStage(evo.level);
            if (!validStages.includes(evoStage) || !digimonData[evo.digimon] || stageOrder[evoStage] <= stageOrder[digimon.stage]) continue;

            if (evo.condition && evo.condition.includes("with ")) {
                const partners = parseConditionPartners(evo.condition);
                for (const partner of partners) {
                    const partnerData = fetchDigimon(partner);
                    if (partnerData && stageOrder[partnerData.stage] >= stageOrder[digimon.stage]) {
                        jogressPairs.push({
                            digimon1: name,
                            digimon2: partner,
                            result: {
                                name: evo.digimon,
                                sprite: digimonData[evo.digimon]?.sprite || "https://via.placeholder.com/60?text=" + encodeURIComponent(evo.digimon),
                                baseStats: { ...BASE_STATS[evoStage] }
                            },
                            minStage: digimon.stage,
                            shardCost: getJogressShardCost(evoStage)
                        });
                    }
                }
            }
        }
    }

    jogressPairs.push(...getFallbackJogressPairs());

    const uniquePairs = [];
    const seen = new Set();
    jogressPairs.forEach(pair => {
        const key = [pair.digimon1, pair.digimon2, pair.result.name].sort().join('|');
        if (!seen.has(key)) {
            seen.add(key);
            uniquePairs.push(pair);
        }
    });

    return uniquePairs;
}

function getFallbackJogressPairs() {
    return [
        {
            digimon1: "Angemon",
            digimon2: "Ankylomon",
            result: {
                name: "Shakkoumon",
                sprite: "https://digimon-api.com/images/digimon/Shakkoumon.png",
                baseStats: { ...BASE_STATS.Ultimate }
            },
            minStage: "Champion",
            shardCost: 5
        },
        {
            digimon1: "ExVeemon",
            digimon2: "Stingmon",
            result: {
                name: "Paildramon",
                sprite: "https://digimon-api.com/images/digimon/Paildramon.png",
                baseStats: { ...BASE_STATS.Ultimate }
            },
            minStage: "Champion",
            shardCost: 3
        },
        {
            digimon1: "Aquilamon",
            digimon2: "Gatomon",
            result: {
                name: "Silphymon",
                sprite: "https://digimon-api.com/images/digimon/Silphymon.png",
                baseStats: { ...BASE_STATS.Ultimate }
            },
            minStage: "Champion",
            shardCost: 3
        },
        {
            digimon1: "Angewomon",
            digimon2: "LadyDevimon",
            result: {
                name: "Mastemon",
                sprite: "https://digimon-api.com/images/digimon/Mastemon.png",
                baseStats: { ...BASE_STATS.Mega }
            },
            minStage: "Ultimate",
            shardCost: 10
        },
        {
            digimon1: "MagnaAngemon",
            digimon2: "Angewomon",
            result: {
                name: "Magnadramon",
                sprite: "https://digimon-api.com/images/digimon/Magnadramon.png",
                baseStats: { ...BASE_STATS.Mega }
            },
            minStage: "Ultimate",
            shardCost: 10
        },
        {
            digimon1: "WarGreymon",
            digimon2: "MetalGarurumon",
            result: {
                name: "Omnimon",
                sprite: "https://digimon-api.com/images/digimon/Omnimon.png",
                baseStats: { ...BASE_STATS.Mega }
            },
            minStage: "Mega",
            shardCost: 20
        }
    ];
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

console.log("data.js loaded successfully.");