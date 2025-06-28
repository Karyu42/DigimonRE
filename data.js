const BASE_STATS = {
    Rookie: { hp: 80, attack: 20 },
    Champion: { hp: 120, attack: 30 },
    Ultimate: { hp: 160, attack: 40 },
    Mega: { hp: 200, attack: 50 },
    Ultra: { hp: 240, attack: 60 }
};

async function fetchDigimonFromAPI(name) {
    try {
        const response = await fetch(`/api/digimon?name=${encodeURIComponent(name)}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const [digimon] = await response.json();
        if (!digimon) throw new Error(`Digimon ${name} not found`);
        return {
            name: digimon.name,
            sprite: digimon.images[0]?.href || `https://via.placeholder.com/60?text=${encodeURIComponent(digimon.name)}`,
            baseStats: BASE_STATS[normalizeStage(digimon.level)] || BASE_STATS.Rookie,
            stage: normalizeStage(digimon.level),
            evolutions: [] // API doesn't provide evolutions
        };
    } catch (error) {
        logMessage(`API Error: Failed to fetch ${name}.`);
        console.error(`Failed to fetch Digimon ${name}:`, error);
        throw error;
    }
}

function normalizeStage(apiLevel) {
    const stageMap = {
        Fresh: "Rookie",
        InTraining: "Rookie",
        Training: "Rookie",
        Rookie: "Rookie",
        Champion: "Champion",
        Ultimate: "Ultimate",
        Mega: "Mega",
        Ultra: "Ultra",
        Armor: "Champion",
        Hybrid: "Ultimate"
    };
    return stageMap[apiLevel] || "Rookie";
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

function generateJogressPairs() {
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