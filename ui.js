function toggleHealing() {
    const healToggle = document.getElementById("heal-toggle");
    if (healToggle) {
        state.healOnVictory = healToggle.checked;
        saveProgress(true);
        updateUI();
    }
}

function populateJogressDropdowns() {
    const dropdown1 = document.getElementById("jogress-digimon1");
    const dropdown2 = document.getElementById("jogress-digimon2");
    if (!dropdown1 || !dropdown2) return;

    dropdown1.innerHTML = '<option value="">Select First Digimon</option>';
    dropdown2.innerHTML = '<option value="">Select Second Digimon</option>';

    state.digimonSlots.forEach((digimon, index) => {
        if (digimon) {
            const option = `<option value="${index}">${digimon.name} (${digimon.stage})</option>`;
            dropdown1.innerHTML += option;
            dropdown2.innerHTML += option;
        }
    });

    dropdown1.onchange = () => {
        const selectedIndex = parseInt(dropdown1.value);
        Array.from(dropdown2.options).forEach(opt => {
            opt.disabled = parseInt(opt.value) === selectedIndex;
        });
    };

    dropdown2.onchange = () => {
        const selectedIndex = parseInt(dropdown2.value);
        Array.from(dropdown1.options).forEach(opt => {
            opt.disabled = parseInt(opt.value) === selectedIndex;
        });
    };
}

function performJogress() {
    const dropdown1 = document.getElementById("jogress-digimon1");
    const dropdown2 = document.getElementById("jogress-digimon2");
    if (!dropdown1 || !dropdown2) return;

    const slotIndex1 = parseInt(dropdown1.value);
    const slotIndex2 = parseInt(dropdown2.value);

    if (isNaN(slotIndex1) || isNaN(slotIndex2)) {
        logMessage("Please select two Digimon to Jogress.");
        return;
    }

    if (slotIndex1 === slotIndex2) {
        logMessage("Cannot Jogress the same Digimon!");
        return;
    }

    jogress(slotIndex1, slotIndex2);
    showMenu();
}

function goToShop() {
    const menuScreen = document.getElementById("menu-screen");
    const shopScreen = document.getElementById("shop-screen");
    if (menuScreen && shopScreen) {
        menuScreen.style.display = "none";
        shopScreen.style.display = "block";
        updateUI();
    }
}

function setActiveDigimon(index) {
    if (!state.digimonSlots[index]) {
        logMessage("No Digimon in this slot!");
        return;
    }
    state.activeDigimonIndex = index === state.activeDigimonIndex ? null : index;
    updateMenu();
    saveProgress(true);
}

function updateMenu() {
    const menuPlayerName = document.getElementById("menu-player-name");
    const menuPlayerLevel = document.getElementById("menu-player-level");
    const slotsDiv = document.getElementById("digimon-slots");
    if (!menuPlayerName || !menuPlayerLevel || !slotsDiv) return;

    const activeDigimon = state.digimonSlots[state.activeDigimonIndex];
    menuPlayerName.textContent = activeDigimon ? activeDigimon.name : "None";
    menuPlayerLevel.textContent = activeDigimon ? activeDigimon.level : 0;
    slotsDiv.innerHTML = "";
    state.digimonSlots.forEach((digimon, index) => {
        const slotDiv = document.createElement("div");
        slotDiv.className = `slot ${index === state.activeDigimonIndex ? 'active' : ''}`;
        if (digimon) {
            const img = document.createElement("img");
            img.src = digimon.sprite;
            img.alt = digimon.name;
            img.style.width = "60px";
            img.style.height = "60px";
            img.style.cursor = "pointer";
            img.title = "Click to view Digimon info";
            img.onclick = () => showDigimonInfo(index);

            const nameP = document.createElement("p");
            nameP.textContent = `${digimon.name} (Lv${digimon.level})`;

            const afkP = document.createElement("p");
            afkP.textContent = `AFK: ${state.afkModes[index] || 'Off'}`;
            afkP.style.fontSize = "10px";

            const activateBtn = document.createElement("button");
            activateBtn.textContent = index === state.activeDigimonIndex ? 'Deactivate' : 'Activate';
            activateBtn.title = index === state.activeDigimonIndex ? "Deactivate this Digimon" : "Set as active Digimon";
            activateBtn.onclick = () => setActiveDigimon(index);

            const modeBtn = document.createElement("button");
            modeBtn.textContent = state.afkModes[index] === 'training' ? 'Training' : state.afkModes[index] === 'farming' ? 'Farming' : 'Off';
            modeBtn.title = "Cycle AFK mode: Off -> Training -> Farming";
            modeBtn.onclick = () => {
                setAfkMode(index, 'cycle');
                updateMenu();
            };

            const rebirthBtn = document.createElement("button");
            rebirthBtn.textContent = "Rebirth";
            rebirthBtn.title = digimon.level < 15 ? "Requires level 15" : "Reset to level 1 with bonuses";
            rebirthBtn.disabled = digimon.level < 15;
            rebirthBtn.onclick = () => {
                rebirthDigimon(index);
                updateMenu();
            };

            slotDiv.appendChild(img);
            slotDiv.appendChild(nameP);
            slotDiv.appendChild(afkP);
            slotDiv.appendChild(activateBtn);
            slotDiv.appendChild(modeBtn);
            slotDiv.appendChild(rebirthBtn);
        } else {
            const emptyP = document.createElement("p");
            emptyP.textContent = `Slot ${index + 1}`;
            const cost = 100 * Math.pow(5, index);
            const buyBtn = document.createElement("button");
            buyBtn.textContent = `Buy (${cost} BIT)`;
            buyBtn.title = `Hatch a Digimon in this slot for ${cost} BIT`;
            buyBtn.onclick = () => buySlot(index);
            slotDiv.appendChild(emptyP);
            slotDiv.appendChild(buyBtn);
        }
        slotsDiv.appendChild(slotDiv);
    });
}

function updateShop() {
    const shopBitAmount = document.getElementById("shop-bit-amount");
    const shopJogressShards = document.getElementById("shop-jogress-shards");
    if (shopBitAmount && shopJogressShards) {
        shopBitAmount.textContent = state.bit;
        shopJogressShards.textContent = state.jogressShards;
    }
}

function updateUI() {
    const bitAmount = document.getElementById("bit-amount");
    const jogressShards = document.getElementById("jogress-shards");
    const shopBitAmount = document.getElementById("shop-bit-amount");
    const shopJogressShards = document.getElementById("shop-jogress-shards");
    const playerName = document.getElementById("player-name");
    const playerSprite = document.getElementById("player-sprite");
    const playerLevel = document.getElementById("player-level");
    const playerHp = document.getElementById("player-hp");
    const playerMaxHp = document.getElementById("player-max-hp");
    const playerAttack = document.getElementById("player-attack");
    const playerXp = document.getElementById("player-xp");
    const playerXpNext = document.getElementById("player-xp-next");
    const xpProgress = document.getElementById("xp-progress");
    const menuPlayerName = document.getElementById("menu-player-name");
    const menuPlayerLevel = document.getElementById("menu-player-level");
    const playerAttackBonus = document.getElementById("player-attack-bonus");
    const playerHpBonus = document.getElementById("player-hp-bonus");
    const opponentName = document.getElementById("opponent-name");
    const opponentSprite = document.getElementById("opponent-sprite");
    const opponentLevel = document.getElementById("opponent-level");
    const opponentHp = document.getElementById("opponent-hp");
    const opponentMaxHp = document.getElementById("opponent-max-hp");
    const opponentAttack = document.getElementById("opponent-attack");
    const attackButton = document.getElementById("attack-button");
    const healToggle = document.getElementById("heal-toggle");

    if (bitAmount) bitAmount.textContent = state.bit;
    if (jogressShards) jogressShards.textContent = state.jogressShards;
    if (shopBitAmount) shopBitAmount.textContent = state.bit;
    if (shopJogressShards) shopJogressShards.textContent = state.jogressShards;

    const player = state.digimonSlots[state.activeDigimonIndex];
    if (player) {
        if (playerName) playerName.textContent = player.name;
        if (playerSprite) playerSprite.src = player.sprite;
        if (playerLevel) playerLevel.textContent = player.level;
        const equipHpBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.baseStats.hp || 0), 0) +
            Math.floor(player.maxHp * state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'maxHp')?.value || 0), 0) / 100);
        const totalMaxHp = player.maxHp + player.shopBonuses.hp + player.rebirthBonuses.hp + equipHpBonus;
        if (playerHp) playerHp.textContent = player.hp;
        if (playerMaxHp) playerMaxHp.textContent = totalMaxHp;
        const attackBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.baseStats.attack || 0), 0);
        const attackDamageBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'attackDamage')?.value || 0), 0) / 100;
        const totalAttack = (player.attack + player.shopBonuses.attack + player.rebirthBonuses.attack + attackBonus) * (1 + attackDamageBonus);
        if (playerAttack) playerAttack.textContent = Math.floor(totalAttack);
        if (playerXp) playerXp.textContent = player.xp;
        if (playerXpNext) playerXpNext.textContent = player.xpNext;
        if (xpProgress) xpProgress.style.width = `${(player.xp / player.xpNext) * 100}%`;
        if (menuPlayerName) menuPlayerName.textContent = player.name;
        if (menuPlayerLevel) menuPlayerLevel.textContent = player.level;

        const attackBonusText = [];
        if (player.shopBonuses.attack > 0) attackBonusText.push(`<span class="shop-bonus">+${player.shopBonuses.attack}</span>`);
        if (player.rebirthBonuses.attack > 0) attackBonusText.push(`<span class="rebirth-bonus">+${player.rebirthBonuses.attack}</span>`);
        if (attackBonus > 0 || attackDamageBonus > 0) attackBonusText.push(`<span class="equip-bonus">+${attackBonus} (${Math.floor(attackDamageBonus * 100)}%)</span>`);
        if (playerAttackBonus) playerAttackBonus.innerHTML = attackBonusText.join(" ");

        const hpBonusText = [];
        if (player.shopBonuses.hp > 0) hpBonusText.push(`<span class="shop-bonus">+${player.shopBonuses.hp}</span>`);
        if (player.rebirthBonuses.hp > 0) hpBonusText.push(`<span class="rebirth-bonus">+${player.rebirthBonuses.hp}</span>`);
        if (equipHpBonus > 0) hpBonusText.push(`<span class="equip-bonus">+${equipHpBonus}</span>`);
        if (playerHpBonus) playerHpBonus.innerHTML = hpBonusText.join(" ");
    } else {
        if (playerName) playerName.textContent = "None";
        if (playerSprite) playerSprite.src = "";
        if (playerLevel) playerLevel.textContent = "";
        if (playerHp) playerHp.textContent = "0";
        if (playerMaxHp) playerMaxHp.textContent = "0";
        if (playerAttack) playerAttack.textContent = "0";
        if (playerXp) playerXp.textContent = "0";
        if (playerXpNext) playerXpNext.textContent = "0";
        if (xpProgress) xpProgress.style.width = "0%";
        if (playerAttackBonus) playerAttackBonus.innerHTML = "";
        if (playerHpBonus) playerHpBonus.innerHTML = "";
        if (menuPlayerName) menuPlayerName.textContent = "None";
        if (menuPlayerLevel) menuPlayerLevel.textContent = "0";
    }

    if (state.opponent) {
        if (opponentName) opponentName.textContent = state.opponent.name;
        if (opponentSprite) opponentSprite.src = state.opponent.sprite;
        if (opponentLevel) opponentLevel.textContent = state.opponent.level;
        if (opponentHp) opponentHp.textContent = state.opponent.hp;
        if (opponentMaxHp) opponentMaxHp.textContent = state.opponent.maxHp;
        if (opponentAttack) opponentAttack.textContent = state.opponent.attack;
    } else {
        if (opponentName) opponentName.textContent = "None";
        if (opponentSprite) opponentSprite.src = "";
        if (opponentLevel) opponentLevel.textContent = "";
        if (opponentHp) opponentHp.textContent = "0";
        if (opponentMaxHp) opponentMaxHp.textContent = "0";
        if (opponentAttack) opponentAttack.textContent = "0";
    }

    if (attackButton) {
        attackButton.disabled = state.isAttackDisabled || !state.battleActive || !state.opponent;
    }
    if (healToggle) healToggle.checked = state.healOnVictory;
    updateMenu();
}

function showEquipMenu(slotIndex) {
    if (state.activeDigimonIndex === null) {
        logMessage("No active Digimon selected! Please select a Digimon first.");
        return;
    }

    if (slotIndex === null || slotIndex === undefined) {
        const emptySlot = state.equipmentSlots.findIndex(slot => slot === null);
        state.currentEquipSlot = emptySlot !== -1 ? emptySlot : 0;
    } else if (slotIndex >= 0 && slotIndex < 5) {
        state.currentEquipSlot = slotIndex;
    } else {
        logMessage("Invalid equipment slot selected.");
        return;
    }

    const menuScreen = document.getElementById("menu-screen");
    const equipManageScreen = document.getElementById("equip-manage-screen");
    if (menuScreen && equipManageScreen) {
        menuScreen.style.display = "none";
        equipManageScreen.style.display = "block";
    }

    const equipMenu = document.getElementById("equip-manage-content");
    if (!equipMenu) return;

    equipMenu.innerHTML = '';

    const header = document.createElement("h3");
    header.textContent = "Equipment Management";
    equipMenu.appendChild(header);

    const info = document.createElement("p");
    info.textContent = `Slot ${state.currentEquipSlot + 1} is selected. Click "Equip" to equip a ring from inventory, "Unequip" to return a ring to inventory, or "Sell" to sell a ring. Click another slot to change selection.`;
    equipMenu.appendChild(info);

    const equippedHeader = document.createElement("h4");
    equippedHeader.textContent = "Equipped Rings";
    equipMenu.appendChild(equippedHeader);

    const equipGrid = document.createElement("div");
    equipGrid.className = "equip-grid";
    state.equipmentSlots.forEach((ring, index) => {
        const slotDiv = document.createElement("div");
        slotDiv.className = `equip-item ${state.currentEquipSlot === index ? 'selected' : ''}`;
        slotDiv.innerHTML = `<strong>Slot ${index + 1}</strong><br>`;
        if (ring) {
            slotDiv.innerHTML += `${ring.name}<br>Atk: ${ring.baseStats.attack}, HP: ${ring.baseStats.hp}<br>`;
            ring.effects.forEach(effect => {
                slotDiv.innerHTML += `${effect.type}: ${effect.value}%<br>`;
            });
            const buttonDiv = document.createElement("div");
            buttonDiv.style.display = "flex";
            buttonDiv.style.gap = "5px";

            const unequipBtn = document.createElement("button");
            unequipBtn.textContent = "Unequip";
            unequipBtn.title = "Return ring to inventory";
            unequipBtn.onclick = () => {
                unequipRing(index);
                showEquipMenu(state.currentEquipSlot);
            };
            buttonDiv.appendChild(unequipBtn);

            const sellBtn = document.createElement("button");
            sellBtn.textContent = "Sell";
            sellBtn.title = `Sell for ${Math.floor((ring.baseStats.attack + ring.baseStats.hp) * 0.5)} BIT`;
            sellBtn.onclick = () => {
                sellRing(index);
                showEquipMenu(state.currentEquipSlot);
            };
            buttonDiv.appendChild(sellBtn);

            slotDiv.appendChild(buttonDiv);
        } else {
            slotDiv.innerHTML += "Empty";
        }
        slotDiv.title = ring ? "View equipped ring" : "Click to select this slot for equipping";
        slotDiv.onclick = () => showEquipMenu(index);
        equipGrid.appendChild(slotDiv);
    });
    equipMenu.appendChild(equipGrid);

    const inventoryHeader = document.createElement("h4");
    inventoryHeader.textContent = "Ring Inventory";
    equipMenu.appendChild(inventoryHeader);

    const inventoryGrid = document.createElement("div");
    inventoryGrid.className = "equip-grid";
    if (state.ringInventory.length === 0) {
        const emptyP = document.createElement("p");
        emptyP.textContent = "No rings in inventory. Defeat bosses to obtain rings.";
        inventoryGrid.appendChild(emptyP);
    } else {
        state.ringInventory.forEach((ring, index) => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "equip-item";
            itemDiv.innerHTML = `<strong>${ring.name}</strong><br>Atk: ${ring.baseStats.attack}, HP: ${ring.baseStats.hp}<br>`;
            ring.effects.forEach(effect => {
                itemDiv.innerHTML += `${effect.type}: ${effect.value}%<br>`;
            });

            const buttonDiv = document.createElement("div");
            buttonDiv.style.display = "flex";
            buttonDiv.style.gap = "5px";

            const equipBtn = document.createElement("button");
            equipBtn.textContent = "Equip";
            equipBtn.title = `Equip to Slot ${state.currentEquipSlot + 1}`;
            equipBtn.disabled = state.currentEquipSlot === null || state.currentEquipSlot < 0 || state.currentEquipSlot >= 5;
            equipBtn.onclick = () => {
                equipFromInventory(index);
                showEquipMenu(state.currentEquipSlot);
            };
            buttonDiv.appendChild(equipBtn);

            const sellBtn = document.createElement("button");
            sellBtn.textContent = "Sell";
            sellBtn.title = `Sell for ${Math.floor((ring.baseStats.attack + ring.baseStats.hp) * 0.5)} BIT`;
            sellBtn.onclick = () => {
                sellInventoryRing(index);
                showEquipMenu(state.currentEquipSlot);
            };
            buttonDiv.appendChild(sellBtn);

            itemDiv.appendChild(buttonDiv);
            inventoryGrid.appendChild(itemDiv);
        });
    }
    equipMenu.appendChild(inventoryGrid);
}

function unequipRing(slotIndex) {
    if (slotIndex < 0 || slotIndex >= 5 || !state.equipmentSlots[slotIndex]) {
        logMessage(`No ring in slot ${slotIndex + 1} to unequip!`);
        return;
    }
    const ring = state.equipmentSlots[slotIndex];
    state.ringInventory.push(ring);
    state.equipmentSlots[slotIndex] = null;
    logMessage(`Unequipped ${ring.name} from slot ${slotIndex + 1} to inventory.`);
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

function resetGame() {
    if (state.globalAfkInterval) {
        clearInterval(state.globalAfkInterval);
        state.globalAfkInterval = null;
    }
    if (state.enemyAttackIntervalId) {
        clearInterval(state.enemyAttackIntervalId);
        state.enemyAttackIntervalId = null;
    }
    if (state.animationFrame) {
        cancelAnimationFrame(state.animationFrame);
        state.animationFrame = null;
    }
    document.removeEventListener("keydown", handleKeyPress);
    if (typeof resetState === 'function') {
        resetState();
        localStorage.removeItem(STORAGE_KEY);
        const screens = ["battle-screen", "menu-screen", "shop-screen", "jogress-screen", "equip-manage-screen"];
        screens.forEach(screen => {
            const element = document.getElementById(screen);
            if (element) element.style.display = screen === "menu-screen" ? "block" : "none";
        });
        const battleLog = document.getElementById("battle-log");
        if (battleLog) battleLog.innerHTML = "";
        if (typeof hatchEgg === 'function') {
            hatchEgg(0);
            state.bit = 1000; // Give initial BIT for gameplay
            logMessage("Welcome to Digimon RPG! A default Agumon has been hatched.");
            updateUI();
        } else {
            console.error("hatchEgg is not defined.");
            logMessage("Failed to initialize game: hatchEgg not available.");
        }
    } else {
        console.error("resetState is not defined. Ensure storage.js is loaded correctly.");
        logMessage("Failed to reset game: system error. Please refresh the page.");
    }
}

function logMessage(message) {
    const log = document.getElementById("battle-log");
    if (log) {
        const p = document.createElement("p");
        p.textContent = message;
        log.appendChild(p);
        log.scrollTop = log.scrollHeight;
    } else {
        console.log(`Log message: ${message}`);
    }
}

function showMenu() {
    const screens = ["battle-screen", "shop-screen", "jogress-screen", "equip-manage-screen", "menu-screen"];
    screens.forEach(screen => {
        const element = document.getElementById(screen);
        if (element) element.style.display = screen === "menu-screen" ? "block" : "none";
    });
    updateUI();
}

function handleLoadGame(file) {
    if (file) {
        loadProgress(file);
        const loadInput = document.getElementById("load-game-input");
        if (loadInput) loadInput.value = "";
    }
}

function toggleJogressMenu() {
    const jogressScreen = document.getElementById("jogress-screen");
    const menuScreen = document.getElementById("menu-screen");
    if (jogressScreen && menuScreen) {
        if (jogressScreen.style.display === "none") {
            menuScreen.style.display = "none";
            jogressScreen.style.display = "block";
            populateJogressDropdowns();
        } else {
            jogressScreen.style.display = "none";
            menuScreen.style.display = "block";
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Starting game initialization...");
    window.state = window.state || {};
    if (typeof resetState === 'function') {
        resetState(true);
        loadFromLocalStorage();
    } else {
        console.error("resetState is not defined. Ensure storage.js is loaded correctly.");
        logMessage("Failed to initialize game: system error. Please refresh the page.");
    }

    // Initialize default Digimon if none exist
    if (!state.digimonSlots.some(slot => slot !== null)) {
        console.log("No Digimon in slots, hatching default Agumon...");
        if (typeof hatchEgg === 'function') {
            hatchEgg(0);
            state.bit = 1000; // Give initial BIT for gameplay
            logMessage("Welcome to Digimon RPG! A default Agumon has been hatched.");
        } else {
            console.error("hatchEgg is not defined.");
            logMessage("Failed to initialize game: hatchEgg not available.");
        }
    }

    const screens = ["battle-screen", "shop-screen", "jogress-screen", "equip-manage-screen", "menu-screen"];
    screens.forEach(screen => {
        const element = document.getElementById(screen);
        if (element) element.style.display = screen === "menu-screen" ? "block" : "none";
    });

    updateUI();
    console.log("UI updated, game initialized");

    document.querySelectorAll('button').forEach(button => {
        if (!button.onclick && !button.disabled) {
            console.warn(`Button "${button.textContent}" has no onclick handler.`);
        }
    });
});