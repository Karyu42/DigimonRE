async function createOpponent(isBoss = false) {
    const activeDigimon = state.digimonSlots[state.activeDigimonIndex];
    if (!activeDigimon) {
        logMessage("No active Digimon selected! Please select a Digimon.");
        return null;
    }

    const stage = state.selectedEnemyStage;
    const levelMap = {
        Rookie: "Rookie",
        Champion: "Champion",
        Ultimate: "Ultimate",
        Mega: "Mega",
        Ultra: "Mega" // Ultra maps to Mega for API compatibility
    };
    const apiLevel = levelMap[stage] || "Rookie";
    let possibleDigimon = await fetchDigimonByLevel(apiLevel);
    
    if (stage === "Ultra") {
        possibleDigimon = [
            { name: "Omnimon", baseStats: { hp: 300, attack: 60 }, images: [{ href: "https://digi-api.com/images/omnimon.jpg" }], level: "Mega" },
            { name: "Imperialdramon", baseStats: { hp: 280, attack: 60 }, images: [{ href: "https://digi-api.com/images/imperialdramon.jpg" }], level: "Mega" }
        ];
    }

    if (possibleDigimon.length === 0) {
        possibleDigimon = [{ name: "Agumon", baseStats: { hp: 100, attack: 20 }, images: [{ href: "https://digi-api.com/images/agumon.jpg" }], level: "Rookie" }];
    }

    const selectedDigimon = possibleDigimon[Math.floor(Math.random() * possibleDigimon.length)];
    const level = activeDigimon.level + Math.floor(Math.random() * 3) - 1;
    const stageMultiplier = { Rookie: 1, Champion: 2, Ultimate: 4, Mega: 16, Ultra: 200 }[stage] || 1;
    const bitMultiplier = { Rookie: 1, Champion: 2, Ultimate: 4, Mega: 8, Ultra: 12 }[stage] || 1;
    const hpMultiplier = isBoss ? 100 : 1;
    const attackMultiplier = isBoss ? 0.5 : 1;

    return {
        name: selectedDigimon.name + (isBoss ? " (Boss)" : ""),
        level: Math.max(1, level),
        hp: (selectedDigimon.baseStats?.hp || 100 + (level - 1) * 10) * stageMultiplier * hpMultiplier,
        maxHp: (selectedDigimon.baseStats?.hp || 100 + (level - 1) * 10) * stageMultiplier * hpMultiplier,
        attack: (selectedDigimon.baseStats?.attack || 20 + (level - 1) * 2) * stageMultiplier * attackMultiplier,
        sprite: validateSpriteUrl(selectedDigimon.images?.[0]?.href),
        stage: stage,
        bitDrop: isBoss ? 0 : Math.floor(Math.sqrt(level) * 50 * bitMultiplier),
        xpDrop: isBoss ? 0 : 50 + level * 10
    };
}

// Rest of the battle.js remains unchanged
function spawnNewTarget(targetId) {
    const field = document.getElementById("precision-field");
    const target = document.getElementById(targetId);
    if (!field || !target) return;
    const fieldWidth = field.offsetWidth;
    const fieldHeight = field.offsetHeight;
    const targetSize = 25;
    const maxX = fieldWidth - targetSize;
    const maxY = fieldHeight - targetSize;
    const position = { x: Math.random() * maxX, y: Math.random() * maxY };
    state.targetPositions = state.targetPositions || {};
    state.targetPositions[targetId] = position;
    target.style.left = `${position.x}px`;
    target.style.top = `${position.y}px`;
}

function performAttack(isAuto = false, clickX = null, clickY = null) {
    const player = state.digimonSlots[state.activeDigimonIndex];
    if (!player || !state.battleActive || player.hp <= 0 || !state.opponent || state.opponent.hp <= 0) {
        logMessage("Cannot attack: invalid battle state.");
        return;
    }

    if (!isAuto && state.combatMode === "charging") {
        const currentTime = Date.now();
        if (currentTime - state.lastAttackTime < 200) {
            logMessage("Attack too fast! Wait a moment.");
            return;
        }
        state.lastAttackTime = currentTime;
    }

    if (!isAuto) state.isAttackDisabled = true;

    let damageMultiplier = 0;
    let hitTargetId = null;

    if (state.combatMode === "charging") {
        const timingBar = document.getElementById("timing-bar");
        const marker = document.getElementById("marker");
        const barWidth = timingBar.offsetWidth;
        const markerWidth = parseFloat(marker.style.width) || 0;
        const fillPercentage = markerWidth / barWidth;

        if (fillPercentage < 0.2) damageMultiplier = 0.3;
        else if (fillPercentage < 0.4) damageMultiplier = 1.0;
        else if (fillPercentage < 0.6) damageMultiplier = 1.5;
        else if (fillPercentage < 0.8) damageMultiplier = 2.0;
        else if (fillPercentage < 0.9) damageMultiplier = 3.0;
        else if (fillPercentage < 0.95) {
            damageMultiplier = 5.0;
            state.consecutiveCriticalHits++;
            state.enemyStunned = true;
            logMessage(`${state.opponent.name} is stunned! Next attack prevented.`);
        } else damageMultiplier = 3.0;
    } else if (state.combatMode === "precision" && clickX !== null && clickY !== null) {
        const field = document.getElementById("precision-field");
        const fieldRect = field.getBoundingClientRect();
        const clickXRelative = clickX - fieldRect.left;
        const clickYRelative = clickY - fieldRect.top;

        for (const targetId of ["target", "target2"]) {
            const target = document.getElementById(targetId);
            const targetPos = state.targetPositions?.[targetId];
            if (!targetPos) continue;

            const targetX = targetPos.x + 12.5;
            const targetY = targetPos.y + 12.5;
            const distance = Math.sqrt(Math.pow(clickXRelative - targetX, 2) + Math.pow(clickYRelative - targetY, 2));

            if (distance < 3) {
                damageMultiplier = 5.0;
                state.consecutiveCriticalHits++;
                state.enemyStunned = true;
                logMessage(`Perfect Hit! ${state.opponent.name} is stunned!`);
                hitTargetId = targetId;
                break;
            } else if (distance < 4.9) {
                damageMultiplier = 3.0;
                logMessage("Great Hit!");
                hitTargetId = targetId;
                break;
            } else if (distance < 6.8) {
                damageMultiplier = 2.0;
                logMessage("Good Hit!");
                hitTargetId = targetId;
                break;
            } else if (distance < 8.7) {
                damageMultiplier = 1.5;
                logMessage("Fair Hit!");
                hitTargetId = targetId;
                break;
            } else if (distance < 10.6) {
                damageMultiplier = 1.0;
                logMessage("Weak Hit!");
                hitTargetId = targetId;
                break;
            } else if (distance < 12.5) {
                damageMultiplier = 0.3;
                logMessage("Glancing Hit!");
                hitTargetId = targetId;
                break;
            }
        }
    }

    if (damageMultiplier > 0) {
        const attackBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.baseStats.attack || 0), 0);
        const attackDamageBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'attackDamage')?.value || 0), 0) / 100;
        const totalAttack = (player.attack + player.shopBonuses.attack + player.rebirthBonuses.attack + attackBonus) * (1 + attackDamageBonus);
        let damage = Math.floor(totalAttack * damageMultiplier * (0.8 + Math.random() * 0.4));

        const nullifyChance = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'nullifyDamage')?.value || 0), 0) / 100;
        if (Math.random() < nullifyChance) {
            damage = 0;
            logMessage(`${player.name}'s attack was nullified by equipment effect!`);
        }

        state.opponent.hp = Math.max(0, state.opponent.hp - damage);
        logMessage(`${player.name} hits ${state.opponent.name} for ${damage} damage! (Multiplier: ${damageMultiplier.toFixed(1)}x)`);
    }

    const prevTargetPositions = { ...state.targetPositions };

    if (state.opponent.hp <= 0) {
        logMessage(`${state.opponent.name} defeated!`);
        if (state.opponent.name.endsWith("(Boss)")) {
            const ring = createRing(state.opponent);
            state.ringInventory.push(ring);
            logMessage(`Boss dropped a ${ring.name} ring! Added to inventory.`);
        }
        const baseXP = state.opponent.xpDrop;
        const trainingBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'trainingExp')?.value || 0), 0) / 100;
        const cappedXP = Math.min(baseXP * (1 + trainingBonus), XP_CAPS[state.opponent.stage] || 300);
        logMessage(`+${Math.floor(cappedXP)} XP, +${state.opponent.bitDrop} BIT`);
        gainXP(state.activeDigimonIndex, Math.floor(cappedXP));
        state.bit = Math.min(Math.max(0, state.bit + state.opponent.bitDrop), Number.MAX_SAFE_INTEGER);
        if (state.healOnVictory) {
            const equipHpBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.baseStats.hp || 0), 0) +
                Math.floor(player.maxHp * state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'maxHp')?.value || 0), 0) / 100);
            const totalMaxHp = player.maxHp + player.shopBonuses.hp + player.rebirthBonuses.hp + equipHpBonus;
            const hpMissing = totalMaxHp - player.hp;
            const bitNeeded = Math.ceil(hpMissing / 5);
            if (state.bit >= bitNeeded) {
                state.bit -= bitNeeded;
                player.hp = totalMaxHp;
                logMessage(`${player.name} healed to full HP (-${bitNeeded} BIT)`);
            } else {
                const hpHealed = state.bit * 5;
                player.hp = Math.min(totalMaxHp, player.hp + hpHealed);
                logMessage(`${player.name} healed ${hpHealed} HP (-${state.bit} BIT)`);
                state.bit = 0;
            }
        }
        saveProgress(true);
        if (!state.opponent.name.endsWith("(Boss)")) {
            state.opponent = createOpponent(false);
            logMessage(`New opponent: ${state.opponent.name}!`);
            if (state.combatMode === "precision") {
                state.targetPositions = prevTargetPositions;
                for (const targetId of ["target", "target2"]) {
                    const target = document.getElementById(targetId);
                    const pos = state.targetPositions[targetId];
                    if (pos) {
                        target.style.left = `${pos.x}px`;
                        target.style.top = `${pos.y}px`;
                    } else {
                        spawnNewTarget(targetId);
                    }
                }
            }
        } else {
            endBattle();
        }
    }

    if (state.combatMode === "charging") {
        const marker = document.getElementById("marker");
        state.markerPosition = 0;
        marker.style.width = "0px";
        marker.style.background = "red";
        state.animationStartTime = null;
    } else if (hitTargetId) {
        spawnNewTarget(hitTargetId);
    }

    state.isAttackDisabled = false;
    updateUI();
}

function playerAttack(event) {
    if (state.combatMode === "precision" && event) {
        performAttack(false, event.clientX, event.clientY);
    } else if (state.combatMode === "charging") {
        performAttack(false);
    }
}

function opponentAttack() {
    if (state.enemyStunned) {
        logMessage(`${state.opponent.name} is stunned and cannot attack!`);
        state.enemyStunned = false;
        return;
    }

    const player = state.digimonSlots[state.activeDigimonIndex];
    if (!player || !state.battleActive || player.hp <= 0 || !state.opponent || state.opponent.hp <= 0) return;

    const dodgeChance = 0.05;
    if (Math.random() < dodgeChance) {
        logMessage(`${player.name} dodged ${state.opponent.name}'s attack!`);
    } else {
        const equipHpBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.baseStats.hp || 0), 0) +
            Math.floor(player.maxHp * state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'maxHp')?.value || 0), 0) / 100);
        const totalMaxHp = player.maxHp + player.shopBonuses.hp + player.rebirthBonuses.hp + equipHpBonus;
        let damage = Math.floor(state.opponent.attack * (0.8 + Math.random() * 0.4));
        const nullifyChance = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'nullifyDamage')?.value || 0), 0) / 100;
        if (Math.random() < nullifyChance) {
            damage = 0;
            logMessage(`${state.opponent.name}'s attack was nullified by equipment effect!`);
        }
        player.hp = Math.max(0, player.hp - damage);
        if (damage > 0) {
            logMessage(`${state.opponent.name} hits ${player.name} for ${damage}!`);
        }
    }

    if (player.hp <= 0) {
        logMessage(`${player.name} defeated! Healed and returning to menu...`);
        const equipHpBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.baseStats.hp || 0), 0) +
            Math.floor(player.maxHp * state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'maxHp')?.value || 0), 0) / 100);
        const totalMaxHp = player.maxHp + player.shopBonuses.hp + player.rebirthBonuses.hp + equipHpBonus;
        player.hp = totalMaxHp;
        endBattle();
    }

    updateUI();
}

function animateMarker(timestamp) {
    if (!state.battleActive) return;

    const timingBar = document.getElementById("timing-bar");
    const marker = document.getElementById("marker");

    if (!state.animationStartTime) state.animationStartTime = timestamp;

    if (state.combatMode === "charging") {
        const barWidth = timingBar.offsetWidth;
        let baseDuration = 3000;
        const chargeSpeedBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'chargeSpeed')?.value || 0), 0) / 100;
        let adjustedDuration = baseDuration * Math.pow(0.95, state.consecutiveCriticalHits) * (1 - chargeSpeedBonus);
        const elapsed = timestamp - state.animationStartTime;
        let progress = Math.min(elapsed / adjustedDuration, 1);

        state.markerPosition = barWidth * progress;
        marker.style.width = `${Math.min(state.markerPosition, barWidth)}px`;

        const fillPercentage = progress;
        if (fillPercentage < 0.5) {
            const r = 255;
            const g = Math.floor(255 * (fillPercentage / 0.5));
            marker.style.background = `rgb(${r}, ${g}, 0)`;
        } else {
            const r = Math.floor(255 * (1 - (fillPercentage - 0.5) / 0.5));
            const g = 255;
            marker.style.background = `rgb(${r}, ${g}, 0)`;
        }

        if (progress < 1) {
            state.animationFrame = requestAnimationFrame(animateMarker);
        } else {
            state.markerPosition = 0;
            performAttack(true);
            state.animationStartTime = timestamp;
            state.animationFrame = requestAnimationFrame(animateMarker);
        }
    } else if (state.combatMode === "precision") {
        state.animationFrame = requestAnimationFrame(animateMarker);
    }
}

function attack(event) {
    if (state.battleActive && !state.isAttackDisabled && state.combatMode === "precision" && event) {
        playerAttack(event);
    } else if (state.battleActive && !state.isAttackDisabled && state.combatMode === "charging") {
        playerAttack();
    }
}

function startBattle(isBoss = false) {
    if (state.activeDigimonIndex === null) {
        logMessage("No active Digimon selected! Please select a Digimon first.");
        return;
    }
    state.selectedEnemyStage = document.getElementById("enemy-stage-select").value;
    createOpponent(isBoss).then(opponent => {
        if (!opponent) {
            logMessage("Failed to create opponent for this stage!");
            return;
        }
        state.opponent = opponent;
        state.battleActive = true;
        state.markerPosition = 0;
        state.markerDirection = 1;
        state.lastAttackTime = 0;
        state.isAttackDisabled = false;
        state.animationStartTime = null;
        state.consecutiveCriticalHits = 0;
        state.enemyStunned = false;
        state.targetPositions = {};

        const player = state.digimonSlots[state.activeDigimonIndex];
        const equipHpBonus = state.equipmentSlots.reduce((sum, ring) => sum + (ring?.baseStats.hp || 0), 0) +
            Math.floor(player.maxHp * state.equipmentSlots.reduce((sum, ring) => sum + (ring?.effects.find(e => e.type === 'maxHp')?.value || 0), 0) / 100);
        const totalMaxHp = player.maxHp + player.shopBonuses.hp + player.rebirthBonuses.hp + equipHpBonus;
        player.hp = totalMaxHp;

        if (state.enemyAttackIntervalId) {
            clearInterval(state.enemyAttackIntervalId);
            state.enemyAttackIntervalId = null;
        }

        state.enemyAttackIntervalId = setInterval(opponentAttack, 3000);

        document.getElementById("menu-screen").style.display = "none";
        document.getElementById("battle-screen").style.display = "block";
        logMessage(`Battle vs ${state.opponent.name} begins!`);

        const timingBar = document.getElementById("timing-bar");
        const field = document.getElementById("precision-field");
        const attackButtonContainer = document.getElementById("attack-button-container");

        if (state.combatMode === "charging") {
            timingBar.style.display = "block";
            field.style.display = "none";
            attackButtonContainer.style.display = "block";
            marker.style.width = "0px";
            marker.style.left = "0px";
            timingBar.querySelectorAll(".power-line").forEach(line => line.style.display = "block");
        } else {
            timingBar.style.display = "none";
            field.style.display = "block";
            attackButtonContainer.style.display = "none";
            spawnNewTarget("target");
            spawnNewTarget("target2");
            field.onclick = attack;
        }

        state.animationFrame = requestAnimationFrame(animateMarker);
        document.addEventListener("keydown", handleKeyPress, { once: false });

        updateUI();
    });
}

function endBattle() {
    state.battleActive = false;
    if (state.animationFrame) {
        cancelAnimationFrame(state.animationFrame);
        state.animationFrame = null;
    }
    document.removeEventListener("keydown", handleKeyPress);
    const field = document.getElementById("precision-field");
    if (field) field.onclick = null;
    if (state.enemyAttackIntervalId) {
        clearInterval(state.enemyAttackIntervalId);
        state.enemyAttackIntervalId = null;
    }
    state.isAttackDisabled = false;
    state.animationStartTime = null;
    state.consecutiveCriticalHits = 0;
    state.enemyStunned = false;
    state.opponent = null;
    state.targetPositions = {};
    showMenu();
}

function handleKeyPress(event) {
    if (state.combatMode === "charging" && event.code === "KeyA" && state.battleActive) {
        playerAttack();
    } else if (event.code === "Space") {
        endBattle();
    }
}

function toggleCombatMode() {
    const combatModeSelect = document.getElementById("combat-mode-select");
    if (combatModeSelect) {
        state.combatMode = combatModeSelect.value;
        logMessage(`Combat mode set to ${state.combatMode === "charging" ? "Charging Bar" : "Precision Strike"}.`);
        saveProgress(true);
        updateUI();
    }
}