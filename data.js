export const BASE_STATS = {
    Rookie: { hp: 80, attack: 20 },
    Champion: { hp: 120, attack: 30 },
    Ultimate: { hp: 160, attack: 40 },
    Mega: { hp: 200, attack: 50 },
    Ultra: { hp: 240, attack: 60 }
};

export let digimonData = {
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

export async function fetchDigimon(name) {
    if (digimonData[name]) return digimonData[name]; // Return cached data

    try {
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const response = await fetch(proxyUrl + encodeURIComponent(`https://digimon-api.com/api/v1/digimon/${encodeURIComponent(name)}`));
        const proxyData = await response.json();
        const detailData = JSON.parse(proxyData.contents);

        const validStages = ["Rookie", "Champion", "Ultimate", "Mega", "Ultra"];
        const stageOrder = { Rookie: 1, Champion: 2, Ultimate: 3, Mega: 4, Ultra: 5 };
        const stage = normalizeStage(detailData.levels?.[0]?.level);

        if (!validStages.includes(stage)) {
            console.warn(`Invalid stage for '${name}': ${detailData.levels?.[0]?.level}`);
            return null;
        }

        const evolutions = detailData.nextEvolutions
            .filter(evo => {
                const evoStage = normalizeStage(evo.level);
                return (
                    validStages.includes(evoStage) &&
                    stageOrder[evoStage] > stageOrder[stage] &&
                    (!evo.condition || !evo.condition.includes("with "))
                );
            })
            .map(evo => ({
                name: evo.digimon,
                level: getEvolutionLevel(stage),
                sprite: "https://digimon-api.com/images/digimon/" + encodeURIComponent(evo.digimon) + ".png"
            }));

        const digimon = {
            sprite: detailData.images[0]?.href || "https://digimon-api.com/images/digimon/Agumon.png",
            evolutions,
            baseStats: { ...BASE_STATS[stage] },
            stage,
            nextEvolutions: detailData.nextEvolutions
        };

        digimonData[name] = digimon;
        console.log(`Fetched and cached Digimon: ${name}`);
        return digimon;
    } catch (error) {
        console.warn(`Failed to fetch Digimon '${name}':`, error);
        return null;
    }
}

export function normalizeStage(apiLevel) {
    switch (apiLevel) {
        case "Rookie": return "Rookie";
        case "Champion": return "Champion";
        case "Ultimate": return "Ultimate";
        case "Mega": return "Mega";
        case "Ultra": return "Ultra";
        default: return null;
    }
}

export function getEvolutionLevel(currentStage) {
    const levelMap = {
        Rookie: 50,
        Champion: 200,
        Ultimate: 1000,
        Mega: 5000
    };
    return levelMap[currentStage] || 50;
}

export function getJogressShardCost(resultStage) {
    const shardCostMap = {
        Champion: 3,
        Ultimate: 5,
        Mega: 10,
        Ultra: 20
    };
    return shardCostMap[resultStage] || 5;
}

export function parseConditionPartners(condition) {
    const partnerMatch = condition.match(/with (.+?)(?:, or | or |$)/);
    if (!partnerMatch) return [];
    return partnerMatch[1].split(/, | or /).map(name => name.trim()).filter(name => name && digimonData[name]);
}

export async function generateJogressPairs() {
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
                    const partnerData = await fetchDigimon(partner);
                    if (partnerData && stageOrder[partnerData.stage] >= stageOrder[digimon.stage]) {
                        jogressPairs.push({
                            digimon1: name,
                            digimon2: partner,
                            result: {
                                name: evo.digimon,
                                sprite: digimonData[evo.digimon]?.sprite || "https://digimon-api.com/images/digimon/" + encodeURIComponent(evo.digimon) + ".png",
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

export function getFallbackJogressPairs() {
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

export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}