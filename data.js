const API_BASE_URL = "https://digi-api.com/api/v1";
const FALLBACK_SPRITE = "https://digi-api.com/images/default.png";

async function fetchDigimonByLevel(level) {
    try {
        const response = await fetch(`${API_BASE_URL}/digimon?level=${encodeURIComponent(level)}&pageSize=100`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        return data.content || [];
    } catch (error) {
        console.error(`Error fetching Digimon for level ${level}:`, error);
        return [];
    }
}

async function fetchDigimonById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/digimon/${id}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching Digimon ID ${id}:`, error);
        return null;
    }
}

function validateSpriteUrl(url) {
    try {
        new URL(url);
        return url;
    } catch {
        return FALLBACK_SPRITE;
    }
}

const jogressPairs = [
    {
        digimon1: "Angemon",
        digimon2: "Ankylomon",
        result: { name: "Shakkoumon", baseStats: { hp: 200, attack: 28 }, sprite: FALLBACK_SPRITE },
        minLevel: 5,
        shardCost: 5
    },
    {
        digimon1: "ExVeemon",
        digimon2: "Stingmon",
        result: { name: "Paildramon", baseStats: { hp: 180, attack: 40 }, sprite: FALLBACK_SPRITE },
        minLevel: 5,
        shardCost: 3
    },
    {
        digimon1: "Aquilamon",
        digimon2: "Gatomon",
        result: { name: "Silphymon", baseStats: { hp: 160, attack: 35 }, sprite: FALLBACK_SPRITE },
        minLevel: 5,
        shardCost: 3
    },
    {
        digimon1: "Angewomon",
        digimon2: "LadyDevimon",
        result: { name: "Mastemon", baseStats: { hp: 280, attack: 55 }, sprite: FALLBACK_SPRITE },
        minLevel: 10,
        shardCost: 10
    },
    {
        digimon1: "MagnaAngemon",
        digimon2: "Angewomon",
        result: { name: "Magnadramon", baseStats: { hp: 280, attack: 50 }, sprite: FALLBACK_SPRITE },
        minLevel: 10,
        shardCost: 10
    },
    {
        digimon1: "WarGreymon",
        digimon2: "MetalGarurumon",
        result: { name: "Omnimon", baseStats: { hp: 300, attack: 60 }, sprite: FALLBACK_SPRITE },
        minLevel: 25,
        shardCost: 20
    }
];