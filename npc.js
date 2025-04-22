class NPC {
    // Define static synergy pairs and their effects
    static synergies = {
        'guardian+medic': 'Shield and healing effects are 25% stronger',
        'berserker+bard': 'Damage boost increased by 30% when both active',
        'scout+tactician': 'Enemy projectile tracking accuracy increased to 100%',
        'elementalist+mystic': 'Elemental attacks have 20% chance to apply random debuff',
        'summoner+timekeeper': 'Controlled minions move 50% faster',
        'vanguard+diplomat': 'Invincibility duration increased by 2 seconds',
        'comicRelief+bard': 'Chaos effects trigger 30% more often'
    };

    constructor(game, type, color = '#ffffff') {
        this.game = game;
        this.type = type;
        this.width = 40;
        this.height = 40;
        this.x = 0;
        this.y = 0;
        // Assign maxHealth based on NPC role
        if (type === 'guardian' || type === 'berserker') {
            this.maxHealth = 200;
        } else if (type === 'medic' || type === 'bard' || type === 'tactician') {
            this.maxHealth = 140;
        } else if (type === 'scout' || type === 'comicRelief' || type === 'elementalist' || type === 'summoner' || type === 'timekeeper' || type === 'mystic' || type === 'vanguard' || type === 'diplomat') {
            this.maxHealth = 100;
        } else {
            this.maxHealth = 100;
        }
        this.health = this.maxHealth;
        this.abilities = [];
        this.activeEffects = [];
        this.followDistance = 100;
        this.color = color;
        // Default energy for NPCs that use it
        if (typeof this.energy === 'undefined') this.energy = 100;
        if (typeof this.maxEnergy === 'undefined') this.maxEnergy = 100;

    }

    update() {
        this.followPlayer();
        this.updateAbilities();
        this.checkSynergies();
        this.applyEffects();
        this.handleGroundCollision();
        // Prevent NPCs from moving off the edge of the map
        this.clampToMap();
        // Defensive: clamp health
        if (this.health < 0) this.health = 0;
    }

    handleGroundCollision() {
        const groundY = this.game.canvas.height - this.height - 20;
        if (this.y > groundY) {
            this.y = groundY;
        }
    }

    clampToMap() {
        // Clamp NPC position so they can't leave the visible area
        this.x = Math.max(0, Math.min(this.x, this.game.canvas.width - this.width));
        this.y = Math.max(0, Math.min(this.y, this.game.canvas.height - this.height - 20));
    }

    checkSynergies() {
        // Get all active NPCs except self
        const otherNPCs = this.game.npcs.filter(npc => npc !== this);
        
        // Check each other NPC for synergy
        otherNPCs.forEach(otherNPC => {
            // Create synergy key (alphabetically ordered)
            const synergyKey = [this.type, otherNPC.type].sort().join('+');
            
            // If this combination has a synergy effect
            if (NPC.synergies[synergyKey]) {
                // Apply synergy effects based on the combination
                switch(synergyKey) {
                    case 'guardian+medic':
                        if (this.type === 'guardian') this.shieldStrength = 1.25;
                        if (this.type === 'medic') this.healAmount = 38; // 30 * 1.25
                        break;
                    case 'berserker+bard':
                        if (this.type === 'berserker') this.rageDamageBoost = 1.3;
                        if (this.type === 'bard') this.songEffectiveness = 1.3;
                        break;
                    case 'scout+tactician':
                        if (this.type === 'scout') this.trackingAccuracy = 1.0;
                        break;
                    case 'elementalist+mystic':
                        if (this.type === 'elementalist') this.debuffChance = 0.2;
                        break;
                    case 'summoner+timekeeper':
                        if (this.type === 'summoner') {
                            this.controlledMinions.forEach(minion => {
                                if (!minion.boostedSpeed) {
                                    minion.velocityX *= 1.5;
                                    minion.velocityY *= 1.5;
                                    minion.boostedSpeed = true;
                                }
                            });
                        }
                        break;
                    case 'vanguard+diplomat':
                        if (this.type === 'vanguard') this.invincibilityDuration = 300; // 5s -> 7s
                        break;
                    case 'comicRelief+bard':
                        if (this.type === 'comicRelief') this.chaosChance = 0.3;
                        break;
                }
                
                // Show synergy message if not already shown
                if (!this.shownSynergies?.includes(synergyKey)) {
                    this.game.showNPCCue(`Synergy: ${NPC.synergies[synergyKey]}`);
                    this.shownSynergies = this.shownSynergies || [];
                    this.shownSynergies.push(synergyKey);
                }
            }
        });
    }

    getRole() {
        // Map type to role
        switch (this.type) {
            case 'guardian':
            case 'berserker':
            case 'vanguard':
            case 'summoner':
            case 'elementalist':
                return 'offense';
            case 'medic':
            case 'bard':
            case 'tactician':
            case 'mystic':
                return 'support';
            case 'scout':
            case 'comicRelief':
            case 'timekeeper':
            case 'diplomat':
                return 'utility';
            default:
                return 'utility';
        }
    }

    // Helper: Find nearest wounded ally (player or NPCs below 70% health)
    getNearestWoundedAlly() {
        let minDist = Infinity, nearest = null;
        const candidates = [this.game.player, ...this.game.npcs.filter(n=>n!==this)];
        for (let ally of candidates) {
            if (ally.health < ally.maxHealth * 0.7) {
                const dx = this.x - ally.x;
                const dy = this.y - ally.y;
                const d = Math.sqrt(dx*dx + dy*dy);
                if (d < minDist) { minDist = d; nearest = ally; }
            }
        }
        return nearest;
    }
    // Helper: Is boss charging special? (projectile of type 'special' present)
    isBossChargingSpecial() {
        return this.game.boss && this.game.boss.projectiles && this.game.boss.projectiles.some(p => p.type === 'special');
    }
    // Helper: Are there 2+ allies within 100px (for Bard)?
    isClustered() {
        let count = 0;
        for (let npc of this.game.npcs) {
            if (npc !== this) {
                const dx = this.x - npc.x;
                const dy = this.y - npc.y;
                if (Math.sqrt(dx*dx+dy*dy) < 100) count++;
            }
        }
        return count >= 2;
    }

    // Helper: returns true if c is on the line between a and b (within threshold px)
    isOnLine(a, b, c, threshold = 40) {
        // a, b, c: {x, y}
        const ab = Math.hypot(b.x - a.x, b.y - a.y);
        const ac = Math.hypot(c.x - a.x, c.y - a.y);
        const bc = Math.hypot(c.x - b.x, c.y - b.y);
        // c is on line if sum of ac + bc ~ ab (within threshold)
        return Math.abs((ac + bc) - ab) < threshold;
    }

    followPlayer() {
        const role = this.getRole();
        let targetX = this.x, targetY = this.y;
        const playerMid = { x: this.game.player.x + this.game.player.width / 2, y: this.game.player.y + this.game.player.height / 2 };
        const bossMid = this.game.boss ? { x: this.game.boss.x + this.game.boss.width / 2, y: this.game.boss.y + this.game.boss.height / 2 } : null;
        // --- OFFENSE LOGIC ---
        if (role === 'offense' && this.game.boss) {
            // Flank boss, never block direct line
            const angleToBoss = Math.atan2(bossMid.y - playerMid.y, bossMid.x - playerMid.x);
            // Pick left or right flank based on NPC index
            const idx = this.game.npcs.filter(n=>n.getRole()==='offense').indexOf(this);
            const flankAngle = angleToBoss + (idx % 2 === 0 ? Math.PI/2 : -Math.PI/2);
            const distFromBoss = 100 + idx * 20;
            // If intercepting, allow block; else flank
            let intercepting = false;
            if (this.game.boss.projectiles && this.game.boss.projectiles.length > 0) {
                for (let proj of this.game.boss.projectiles) {
                    const px = this.game.player.x + this.game.player.width/2;
                    const py = this.game.player.y + this.game.player.height/2;
                    const bx = proj.x + proj.width/2;
                    const by = proj.y + proj.height/2;
                    const distToPlayer = Math.hypot(px - bx, py - by);
                    if (distToPlayer < 300 && this.isOnLine(playerMid, bossMid, {x: this.x, y: this.y}, 60)) {
                        // Stand on line to intercept
                        targetX = (this.game.boss.x + this.game.player.x) / 2;
                        targetY = (this.game.boss.y + this.game.player.y) / 2;
                        intercepting = true;
                        break;
                    }
                }
            }
            if (!intercepting) {
                // Flank boss at a safe distance
                targetX = bossMid.x + Math.cos(flankAngle) * distFromBoss;
                targetY = bossMid.y + Math.sin(flankAngle) * distFromBoss;
                // Keep at least 80px from player
                const distToPlayer = Math.hypot(targetX - playerMid.x, targetY - playerMid.y);
                if (distToPlayer < 80) {
                    targetX = playerMid.x + Math.cos(flankAngle) * 80;
                    targetY = playerMid.y + Math.sin(flankAngle) * 80;
                }
            }
        } else if (role === 'support') {
            // --- SUPPORT LOGIC ---
            // Stay diagonally behind player, never block line
            const wounded = this.getNearestWoundedAlly();
            if (wounded) {
                targetX = wounded.x - 40;
                targetY = wounded.y + 40;
            } else {
                // Default: behind and to the side
                const angle = Math.PI * 5 / 6; // 150 degrees
                targetX = playerMid.x + Math.cos(angle) * 120;
                targetY = playerMid.y + Math.sin(angle) * 80;
            }
            // Avoid direct line
            if (bossMid && this.isOnLine(playerMid, bossMid, {x: targetX, y: targetY}, 60)) {
                targetX += 60;
                targetY += 40;
            }
        } else {
            // --- UTILITY LOGIC ---
            // Stay further back and to the side
            const angle = Math.PI * 7 / 6; // 210 degrees
            targetX = playerMid.x + Math.cos(angle) * 160;
            targetY = playerMid.y + Math.sin(angle) * 120;
            // Avoid direct line
            if (bossMid && this.isOnLine(playerMid, bossMid, {x: targetX, y: targetY}, 60)) {
                targetX -= 60;
                targetY += 40;
            }
        }
        // Movement + repulsion
        let dx = targetX - this.x;
        let dy = targetY - this.y;
        let distance = Math.sqrt(dx ** 2 + dy ** 2);
        // Repel from other NPCs
        const minDist = 60;
        let repelX = 0, repelY = 0;
        this.game.npcs.forEach(npc => {
            if (npc !== this) {
                const ndx = this.x - npc.x;
                const ndy = this.y - npc.y;
                const d = Math.sqrt(ndx ** 2 + ndy ** 2);
                if (d > 0 && d < minDist) {
                    // Repel stronger when closer
                    repelX += (ndx / d) * (minDist - d) * 0.15;
                    repelY += (ndy / d) * (minDist - d) * 0.15;
                }
            }
        });
        if (distance > 1) {
            this.x += (dx / distance) * 2 + repelX;
            this.y += (dy / distance) * 2 + repelY;
        }
    }

    draw(ctx) {
        // Draw health bar above NPC
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x, this.y - 18, this.width, 6);
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(this.x, this.y - 18, (this.health / this.maxHealth) * this.width, 6);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(this.x, this.y - 18, this.width, 6);
        ctx.restore();
        // Draw custom icon per NPC type
        ctx.save();
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let icon = '';
        switch (this.type) {
            case 'guardian': icon = '🛡️'; break;
            case 'berserker': icon = '💢'; break;
            case 'scout': icon = '👁️'; break;
            case 'medic': icon = '🩺'; break;
            case 'bard': icon = '🎵'; break;
            case 'tactician': icon = '♟️'; break;
            case 'comicRelief': icon = '🤡'; break;
            case 'elementalist': icon = '🔥'; break;
            case 'summoner': icon = '🐉'; break;
            case 'timekeeper': icon = '⏳'; break;
            case 'mystic': icon = '🔮'; break;
            case 'vanguard': icon = '🚩'; break;
            case 'diplomat': icon = '🕊️'; break;
            default: icon = '⚙️'; break;
        }
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y - 28, 12, 0, 2 * Math.PI);
        ctx.fill();
        ctx.font = '20px Arial';
        ctx.fillStyle = '#222';
        ctx.fillText(icon, this.x + this.width/2, this.y - 28);
        ctx.restore();
        // Add role-based CSS class to DOM if needed (for overlays, not canvas)
        // Draw NPC
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Only draw energy bar for NPCs that use energy
        if (typeof this.energy === 'number' && typeof this.maxEnergy === 'number' && this.maxEnergy > 0 && this.type === 'guardian') {
            ctx.save();
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x, this.y - 12, this.width, 6);
            ctx.fillStyle = '#00BFFF'; // DeepSkyBlue
            ctx.fillRect(this.x, this.y - 12, (this.energy / this.maxEnergy) * this.width, 6);
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(this.x, this.y - 12, this.width, 6);
            ctx.restore();
        }
    }

    updateAbilities() {
        // Comic Relief: Unlock and escalate effects by player deaths
        if (this.type === 'comicRelief') {
            const deaths = this.game.player?.deaths || 0;
            this.abilitiesUnlocked = deaths >= 0;
            if (deaths >= 10) {
                this.comicReliefLevel = 3;
            } else if (deaths >= 5) {
                this.comicReliefLevel = 2;
            } else {
                this.comicReliefLevel = 1;
            }
        }
        // Guardian: Phase 1 or higher
        if (this.type === 'guardian') {
            const prev = this.abilitiesUnlocked;
            this.abilitiesUnlocked = (this.game.boss && this.game.boss.phase >= 1);
            if (!prev && this.abilitiesUnlocked && !this.unlockCueShown) {
                this.game.showNPCCue('Guardian ability unlocked!');
                this.unlockCueShown = true;
            }
        }
        // Tactician: Phase 3
        if (this.type === 'tactician') {
            const prev = this.abilitiesUnlocked;
            this.abilitiesUnlocked = (this.game.boss && this.game.boss.phase >= 3);
            if (!prev && this.abilitiesUnlocked && !this.unlockCueShown) {
                this.game.showNPCCue('Tactician ability unlocked!');
                this.unlockCueShown = true;
            }
        }
        // Bard: Maintain max energy for 1 min
        if (this.type === 'bard') {
            if (!this.energyAtMaxFrames) this.energyAtMaxFrames = 0;
            if (this.game.player.energy === this.game.player.maxEnergy) {
                this.energyAtMaxFrames++;
            } else {
                this.energyAtMaxFrames = 0;
            }
            const prev = this.abilitiesUnlocked;
            this.abilitiesUnlocked = (this.energyAtMaxFrames >= 3600); // 60s at 60fps
            if (!prev && this.abilitiesUnlocked && !this.unlockCueShown) {
                this.game.showNPCCue('Bard ability unlocked!');
                this.unlockCueShown = true;
            }
        }
        // Diplomat: Survive 5 minutes
        if (this.type === 'diplomat') {
            if (!this.survivalFrames) this.survivalFrames = 0;
            if (this.game.isRunning) this.survivalFrames++;
            const prev = this.abilitiesUnlocked;
            this.abilitiesUnlocked = (this.survivalFrames >= 18000); // 5min at 60fps
            if (!prev && this.abilitiesUnlocked && !this.unlockCueShown) {
                this.game.showNPCCue('Diplomat ability unlocked!');
                this.unlockCueShown = true;
            }
        }

        // Summoner: Defeat 20 minions
        if (this.type === 'summoner') {
            if (!this.game.minionsDefeated) this.game.minionsDefeated = 0;
            const prev = this.abilitiesUnlocked;
            this.abilitiesUnlocked = (this.game.minionsDefeated >= 20);
            if (!prev && this.abilitiesUnlocked && !this.unlockCueShown) {
                this.game.showNPCCue('Summoner ability unlocked!');
                this.unlockCueShown = true;
            }
        }
        // Elementalist: Unlocked when boss appears
        if (this.type === 'elementalist') {
            const prev = this.abilitiesUnlocked;
            this.abilitiesUnlocked = this.game.boss !== null;
            if (!prev && this.abilitiesUnlocked && !this.unlockCueShown) {
                this.game.showNPCCue('Elementalist ability unlocked!');
                this.unlockCueShown = true;
            }
        }
        // Mystic: Reach max combo of 15
        if (this.type === 'mystic') {
            const prev = this.abilitiesUnlocked;
            this.abilitiesUnlocked = (this.game.player.comboCount >= 15);
            if (!prev && this.abilitiesUnlocked && !this.unlockCueShown) {
                this.game.showNPCCue('Mystic ability unlocked!');
                this.unlockCueShown = true;
            }
        }
        // Vanguard: Block 10 attacks
        if (this.type === 'vanguard') {
            if (!this.game.player.blocks) this.game.player.blocks = 0;
            const prev = this.abilitiesUnlocked;
            this.abilitiesUnlocked = (this.game.player.blocks >= 10);
            if (!prev && this.abilitiesUnlocked && !this.unlockCueShown) {
                this.game.showNPCCue('Vanguard ability unlocked!');
                this.unlockCueShown = true;
            }
        }
        // Scout: Defeat 5 minions
        if (this.type === 'scout') {
            if (!this.game.minionsDefeated) this.game.minionsDefeated = 0;
            const prev = this.abilitiesUnlocked;
            this.abilitiesUnlocked = (this.game.minionsDefeated >= 5);
            if (!prev && this.abilitiesUnlocked && !this.unlockCueShown) {
                this.game.showNPCCue('Scout ability unlocked!');
                this.unlockCueShown = true;
            }
        }
        // Berserker: Land 10 consecutive hits
        if (this.type === 'berserker') {
            if (!this.game.player.consecutiveHits) this.game.player.consecutiveHits = 0;
            const prev = this.abilitiesUnlocked;
            this.abilitiesUnlocked = (this.game.player.consecutiveHits >= 10);
            if (!prev && this.abilitiesUnlocked && !this.unlockCueShown) {
                this.game.showNPCCue('Berserker ability unlocked!');
                this.unlockCueShown = true;
            }
        }
        // Medic: Survive 3 minutes
        if (this.type === 'medic') {
            if (!this.survivalFrames) this.survivalFrames = 0;
            if (this.game.isRunning) this.survivalFrames++;
            const prev = this.abilitiesUnlocked;
            this.abilitiesUnlocked = (this.survivalFrames >= 10800); // 3min at 60fps
            if (!prev && this.abilitiesUnlocked && !this.unlockCueShown) {
                this.game.showNPCCue('Medic ability unlocked!');
                this.unlockCueShown = true;
            }
        }
        // Timekeeper: Defeat boss in under 5 min (set elsewhere when boss dies)
        if (this.type === 'timekeeper') {
            const prev = this.abilitiesUnlocked;
            this.abilitiesUnlocked = !!this.game.timekeeperUnlocked;
            if (!prev && this.abilitiesUnlocked && !this.unlockCueShown) {
                this.game.showNPCCue('Timekeeper ability unlocked!');
                this.unlockCueShown = true;
            }
        }
        // Fallback: if no unlock logic, default to unlocked
        if (typeof this.abilitiesUnlocked === 'undefined') this.abilitiesUnlocked = true;
        this.abilities.forEach(ability => ability.cooldown > 0 && ability.cooldown--);
    }

    applyEffects() {
        this.activeEffects = this.activeEffects.filter(effect => --effect.duration > 0);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            console.warn(`NPC ${this.type} is dying. Health: ${this.health}`);
            this.onDeath();
        }
    }

    onDeath() {
        const index = this.game.npcs.indexOf(this);
        if (index > -1) {
            console.warn(`Removing NPC ${this.type} at index ${index}. Health: ${this.health}`);
            this.game.npcs.splice(index, 1);
        } else {
            console.warn(`Tried to remove NPC ${this.type} but not found in array. Health: ${this.health}`);
        }
    }
}

// Guardian class
class Guardian extends NPC {
    constructor(game) {
        super(game, 'guardian');
        this.color = '#FFD700'; // Gold
        // Stagger spawn
        this.x = this.game.player.x + 60 * (Math.random() - 0.5);
        this.y = this.game.player.y + 60 * (Math.random() - 0.5);
        this.shieldDuration = 0;
        this.maxEnergy = 100;
        this.energy = this.maxEnergy;
        this.energyRegenRate = 0.7; // per frame
        this.shieldEnergyCost = 1.2; // per frame while shield is active
        this.abilities = [
            {
                name: 'shield',
                cooldown: 0,
                maxCooldown: 400, // ~6.7 seconds
                execute: () => this.activateShield()
            }
        ];
    }

    update() {
        super.update();
        // Shield logic with energy
        if (this.shieldDuration > 0) {
            // Drain energy per frame
            this.energy -= this.shieldEnergyCost;
            if (this.energy <= 0) {
                this.energy = 0;
                this.shieldDuration = 0;
                // Remove shield effect from player
                this.game.player.activeEffects = this.game.player.activeEffects.filter(effect => effect.type !== 'shield');
            }
        } else {
            // Regenerate energy if shield not active
            if (this.energy < this.maxEnergy) {
                this.energy += this.energyRegenRate;
                if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;
            }
        }
        // Provide shield if player is below 50% health, ability is ready, and enough energy
        if (
            this.abilities[0].cooldown <= 0 &&
            this.game.player.health < this.game.player.maxHealth * 0.5 &&
            this.energy >= this.shieldEnergyCost * 10 // require enough for at least 10 frames
        ) {
            this.abilities[0].execute();
            this.abilities[0].cooldown = this.abilities[0].maxCooldown;
        }
        if (this.shieldDuration > 0) this.shieldDuration--;
    }

    activateShield() {
        // Only activate if enough energy
        if (this.energy < this.shieldEnergyCost * 10) return;
        this.shieldDuration = 180; // 3 seconds or until energy runs out
        // Remove any existing shield effects to prevent stacking
        this.game.player.activeEffects = this.game.player.activeEffects.filter(effect => effect.type !== 'shield');
        // Add shield effect to player: blocks 50% damage
        this.game.player.activeEffects.push({
            type: 'shield',
            value: 0.5, // 50% damage block
            duration: this.shieldDuration
        });
        console.log('Guardian activates Shield! 50% damage reduction for 3 seconds');
    }
}

class Scout extends NPC {
    constructor(game) {
        super(game, 'scout');
        this.color = '#32CD32';
        // Stagger spawn
        this.x = this.game.player.x + 60 * (Math.random() - 0.5);
        this.y = this.game.player.y + 60 * (Math.random() - 0.5);
        this.movementSpeedBoost = 1.1;
        this.trackingAccuracy = 0.8;
        this.abilities = [
            {
                name: 'enemyTracking',
                cooldown: 0,
                maxCooldown: 180,
                execute: () => this.activateTracking()
            }
        ];
    }

    update() {
        super.update();
        // Apply movement speed boost to player
        if (this.game.player.baseSpeed) {
            this.game.player.speed = this.game.player.baseSpeed * this.movementSpeedBoost;
        }
        // Activate tracking if ability is ready
        if (this.abilities[0].cooldown <= 0 && this.game.boss && this.game.boss.projectiles.length > 0) {
            this.abilities[0].execute();
            this.abilities[0].cooldown = this.abilities[0].maxCooldown;
        }
    }

    activateTracking() {
        // Make boss projectiles visible with trails
        if (this.game.boss && this.game.boss.projectiles) {
            this.game.boss.projectiles.forEach(projectile => {
                projectile.showTrail = true;
                projectile.trailColor = '#00FF00';
            });
            console.log('Scout activates Enemy Tracking! Boss projectiles are now visible');
        }
    }
}

class Medic extends NPC {
    constructor(game) {
        super(game, 'medic');
        this.color = '#00FFAA';
        // Stagger spawn
        this.x = this.game.player.x + 60 * (Math.random() - 0.5);
        this.y = this.game.player.y + 60 * (Math.random() - 0.5);
        this.abilities = [
            {
                name: 'heal',
                cooldown: 0,
                maxCooldown: 300, // 5 seconds
                execute: () => this.healPlayer()
            }
        ];
    }

    update() {
        super.update();
        // Heal if player is below 70% health and ability is ready
        if (
            this.abilities[0].cooldown <= 0 &&
            this.game.player.health < this.game.player.maxHealth * 0.7
        ) {
            this.abilities[0].execute();
            this.abilities[0].cooldown = this.abilities[0].maxCooldown;
        }
    }

    healPlayer() {
        const healAmount = 30;
        this.game.player.health = Math.min(
            this.game.player.health + healAmount,
            this.game.player.maxHealth
        );
        this.game.player.updateHealthBar();
        console.log(`Medic heals Player for ${healAmount} health!`);
    }
}

class Berserker extends NPC {
    constructor(game) {
        super(game, 'berserker');
        this.color = '#FF4500';
        // Stagger spawn
        this.x = this.game.player.x + 60 * (Math.random() - 0.5);
        this.y = this.game.player.y + 60 * (Math.random() - 0.5);
        this.damageBoost = 1.5;
        this.abilities = [
            {
                name: 'rageBoost',
                cooldown: 0,
                maxCooldown: 450, // 7.5 seconds
                execute: () => this.activateRage()
            }
        ];
    }

    update() {
        super.update();
        // Activate rage if player health < 60% and ability is ready
        if (
            this.abilities[0].cooldown <= 0 &&
            this.game.player.health < this.game.player.maxHealth * 0.6
        ) {
            this.abilities[0].execute();
            this.abilities[0].cooldown = this.abilities[0].maxCooldown;
        }
    }

    activateRage() {
        // Activate rage boost ability
        this.game.player.activeEffects.push({
            type: 'damageBoost',
            value: this.damageBoost,
            duration: 480 // 8 seconds
        });
        console.log(`Berserker activates Rage! ${Math.round(this.damageBoost * 100)}% damage boost for 8 seconds`);
    }
}

class Tactician extends NPC {
    constructor(game) {
        super(game, 'tactician');
        this.color = '#4682B4'; // Steel Blue
        // Stagger spawn
        this.x = this.game.player.x + 60 * (Math.random() - 0.5);
        this.y = this.game.player.y + 60 * (Math.random() - 0.5);
        this.abilities = [
            {
                name: 'analyzePattern',
                cooldown: 0,
                maxCooldown: 400, // ~6.7 seconds
                execute: () => this.analyzeBossPattern()
            }
        ];
    }

    update() {
        super.update();
        // Analyze boss pattern if ability is ready and boss exists
        if (
            this.abilities[0].cooldown <= 0 &&
            this.game.boss
        ) {
            this.abilities[0].execute();
            this.abilities[0].cooldown = this.abilities[0].maxCooldown;
        }
    }

    analyzeBossPattern() {
        // Reduce boss attack cooldown for a short time
        if (this.game.boss) {
            this.game.boss.attackCooldown = Math.max(this.game.boss.attackCooldown - 60, 30); // Faster attacks for boss
            // Optionally, show a visual cue or message
        }
    }
}

class Elementalist extends NPC {
    constructor(game) {
        super(game, 'elementalist');
        this.color = '#00BFFF'; // Deep Sky Blue
        // Stagger spawn
        this.x = this.game.player.x + 60 * (Math.random() - 0.5);
        this.y = this.game.player.y + 60 * (Math.random() - 0.5);
        this.abilities = [
            {
                name: 'elementalAttack',
                cooldown: 0,
                maxCooldown: 300, // 5 seconds
                execute: () => this.castElementalAttack()
            }
        ];
    }

    update() {
        super.update();
        // Cast elemental attack at boss if ability is ready and boss exists
        if (
            this.abilities[0].cooldown <= 0 &&
            this.game.boss
        ) {
            this.abilities[0].execute();
            this.abilities[0].cooldown = this.abilities[0].maxCooldown;
        }
    }

    castElementalAttack() {
        // Cast a random elemental attack at the boss
        if (this.game.boss) {
            const elements = ['fire', 'ice', 'lightning'];
            const element = elements[Math.floor(Math.random() * elements.length)];
            // Example effect: deal direct damage to boss
            let damage = 30;
            if (element === 'fire') damage = 40;
            if (element === 'ice') {
                this.game.boss.velocityY = 0; // Freeze boss for a moment
                console.log(`Elementalist casts Ice! Boss movement frozen`);
            }
            if (element === 'lightning') damage = 25;
            this.game.boss.takeDamage(damage);
            console.log(`Elementalist casts ${element.charAt(0).toUpperCase() + element.slice(1)}! Deals ${damage} damage`);
        }
    }
}

class Timekeeper extends NPC {
    constructor(game) {
        super(game, 'timekeeper');
        this.color = '#4B0082'; // Indigo
        this.slowFactor = 0.5; // 50% speed reduction
        this.abilities = [
            {
                name: 'slowTime',
                cooldown: 0,
                maxCooldown: 600, // 10 seconds cooldown
                execute: () => this.activateTimeSlow()
            }
        ];
        this.timeSlowActive = false;
        this.timeSlowDuration = 0;
    }

    update() {
        super.update();
        // Activate time slow if ability is ready and boss exists
        if (
            this.abilities[0].cooldown <= 0 &&
            this.game.boss &&
            !this.timeSlowActive
        ) {
            this.abilities[0].execute();
            this.abilities[0].cooldown = this.abilities[0].maxCooldown;
        }
        // Update time slow effect
        if (this.timeSlowActive) {
            this.timeSlowDuration--;
            if (this.timeSlowDuration <= 0) {
                this.timeSlowActive = false;
                // Reset boss projectile speed
                if (this.game.boss) {
                    this.game.boss.projectiles.forEach(projectile => {
                        if (projectile.originalVelocityX !== undefined) {
                            projectile.velocityX = projectile.originalVelocityX;
                            projectile.velocityY = projectile.originalVelocityY;
                        }
                    });
                }
            }
        }
    }

    activateTimeSlow() {
        // Slow down boss projectiles for 5 seconds
        if (this.game.boss) {
            this.timeSlowActive = true;
            this.timeSlowDuration = 300; // 5 seconds
            this.game.boss.projectiles.forEach(projectile => {
                if (projectile.velocityX !== undefined) {
                    projectile.originalVelocityX = projectile.velocityX;
                    projectile.originalVelocityY = projectile.velocityY;
                    projectile.velocityX *= 0.3;
                    projectile.velocityY *= 0.3;
                }
            });
        }
    }

    draw(ctx) {
        super.draw(ctx);
        // Draw time slow effect
        if (this.timeSlowActive) {
            ctx.fillStyle = 'rgba(75, 0, 130, 0.2)';
            ctx.beginPath();
            ctx.arc(
                this.x + this.width/2,
                this.y + this.height/2,
                this.width * 3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
}

class Summoner extends NPC {
    constructor(game) {
        super(game, 'summoner');
        this.color = '#00FFFF'; // Cyan
        // Stagger spawn
        this.x = this.game.player.x + 60 * (Math.random() - 0.5);
        this.y = this.game.player.y + 60 * (Math.random() - 0.5);
        this.controlledMinions = [];
        this.maxControlledMinions = 3;
        this.abilities = [
            {
                name: 'minionControl',
                cooldown: 0,
                maxCooldown: 450, // 7.5 seconds cooldown
                execute: () => this.controlMinions()
            }
        ];
    }

    update() {
        super.update();
        // Control minions if ability is ready
        if (
            this.abilities[0].cooldown <= 0
        ) {
            this.abilities[0].execute();
            this.abilities[0].cooldown = this.abilities[0].maxCooldown;
        }
        // Update controlled minions (optional: add more logic here)
    }

    controlMinions() {
        // Find all available minions (projectiles of type 'minion')
        const availableMinions = this.game.projectiles.filter(
            projectile => projectile.type === 'minion' && !this.controlledMinions.includes(projectile)
        );
        // Control up to max allowed minions
        const minionsToControl = availableMinions.slice(0, this.maxControlledMinions - this.controlledMinions.length);
        minionsToControl.forEach(minion => {
            this.controlledMinions.push(minion);
            minion.damage *= 1.5; // Increase damage
        });
        // Optionally show a control effect or message
    }

    update() {
        super.update();
        // Update controlled minions
        this.controlledMinions = this.controlledMinions.filter(minion => {
            // Check if minion still exists
            return this.game.boss && this.game.boss.projectiles.includes(minion);
        });
        // Move controlled minions towards boss
        this.controlledMinions.forEach(minion => {
            if (this.game.boss) {
                const dx = this.game.boss.x - minion.x;
                const dy = this.game.boss.y - minion.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 0) {
                    minion.velocityX = (dx / distance) * 3;
                    minion.velocityY = (dy / distance) * 3;
                    minion.color = '#00FFFF'; // Change color to show control
                }
            }
        });
    }

    draw(ctx) {
        super.draw(ctx);
        // Draw lines to controlled minions
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        this.controlledMinions.forEach(minion => {
            ctx.beginPath();
            ctx.moveTo(this.x + this.width/2, this.y + this.height/2);
            ctx.lineTo(minion.x + minion.width/2, minion.y + minion.height/2);
            ctx.stroke();
        });
    }

    controlMinions() {
        if (!this.game.boss) return;
        // Find minions to control
        const availableMinions = this.game.boss.projectiles.filter(projectile => 
            projectile.type === 'minion' && !this.controlledMinions.includes(projectile)
        );
        // Control up to max allowed minions
        const minionsToControl = availableMinions.slice(0, this.maxControlledMinions - this.controlledMinions.length);
        minionsToControl.forEach(minion => {
            this.controlledMinions.push(minion);
            minion.damage *= 1.5; // Increase damage
        });
        if (minionsToControl.length > 0) {
            this.abilities[0].cooldown = this.abilities[0].maxCooldown;
        }
    }
}

class Mystic extends NPC {
    constructor(game) {
        super(game, 'mystic');
        this.color = '#8A2BE2'; // Blue Violet
        // Stagger spawn
        this.x = this.game.player.x + 60 * (Math.random() - 0.5);
        this.y = this.game.player.y + 60 * (Math.random() - 0.5);
        this.abilities = [
            {
                name: 'mysticSpell',
                cooldown: 0,
                maxCooldown: 500, // ~8.3 seconds
                execute: () => this.castMysticSpell()
            }
        ];
    }

    update() {
        super.update();
        // Cast mystic spell if ability is ready
        if (
            this.abilities[0].cooldown <= 0
        ) {
            this.abilities[0].execute();
            this.abilities[0].cooldown = this.abilities[0].maxCooldown;
        }
    }

    castMysticSpell() {
        // Randomly buff player or debuff boss
        const effects = ['playerRegen', 'bossWeakness', 'playerShield'];
        const effect = effects[Math.floor(Math.random() * effects.length)];
        if (effect === 'playerRegen') {
            // Regenerate player health over time
            this.game.player.activeEffects.push({
                type: 'regen',
                value: 2, // 2 HP per tick
                duration: 150 // 2.5 seconds
            });
        } else if (effect === 'bossWeakness' && this.game.boss) {
            // Reduce boss damage
            this.game.boss.activeEffects = this.game.boss.activeEffects || [];
            this.game.boss.activeEffects.push({
                type: 'damageDown',
                value: 0.7, // 30% less damage
                duration: 180 // 3 seconds
            });
        } else if (effect === 'playerShield') {
            // Add shield effect to player
            this.game.player.activeEffects.push({
                type: 'shield',
                value: 0.3, // 30% damage reduction
                duration: 180 // 3 seconds
            });
        }
        // Optionally show a mystic effect or message
    }

    update() {
        super.update();
        // Apply energy efficiency passive
        if (this.game.player) {
            // Reduce energy costs for player abilities
            this.game.player.weapons.forEach(weapon => {
                if (!weapon.originalEnergyCost) {
                    weapon.originalEnergyCost = weapon.energyCost;
                    weapon.energyCost = Math.floor(weapon.energyCost * this.energyEfficiency);
                }
            });
        }
    }

    draw(ctx) {
        super.draw(ctx);
        // Draw energy aura
        ctx.fillStyle = 'rgba(153, 50, 204, 0.2)';
        ctx.beginPath();
        ctx.arc(
            this.x + this.width/2,
            this.y + this.height/2,
            this.width * 1.2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    restoreEnergy() {
        if (this.game.player) {
            // Restore 50% of player's energy
            this.game.player.energy = Math.min(
                this.game.player.energy + (this.game.player.maxEnergy * 0.5),
                this.game.player.maxEnergy
            );
            this.abilities[0].cooldown = this.abilities[0].maxCooldown;
        }
    }

    onDeath() {
        super.onDeath();
        // Reset weapon energy costs
        if (this.game.player) {
            this.game.player.weapons.forEach(weapon => {
                if (weapon.originalEnergyCost) {
                    weapon.energyCost = weapon.originalEnergyCost;
                    delete weapon.originalEnergyCost;
                }
            });
        }
    }
}

class Vanguard extends NPC {
    constructor(game) {
        super(game, 'vanguard');
        this.color = '#FF6347'; // Tomato
        // Stagger spawn
        this.x = this.game.player.x + 60 * (Math.random() - 0.5);
        this.y = this.game.player.y + 60 * (Math.random() - 0.5);
        this.abilities = [
            {
                name: 'invincibility',
                cooldown: 0,
                maxCooldown: 600, // 10 seconds
                execute: () => this.grantInvincibility()
            }
        ];
    }

    update() {
        super.update();
        // Grant invincibility if ability is ready and player is not already invincible
        if (
            this.abilities[0].cooldown <= 0 &&
            !this.game.player.invincible
        ) {
            this.abilities[0].execute();
            this.abilities[0].cooldown = this.abilities[0].maxCooldown;
        }
    }

    grantInvincibility() {
        // Grant player invincibility for 2.5 seconds
        this.game.player.invincible = true;
        this.game.player.invincibleTimer = 150;
        // Optionally show a vanguard effect or message
    }
}

class Diplomat extends NPC {
    constructor(game) {
        super(game, 'diplomat');
        this.color = '#FFDAB9'; // Peach Puff
        // Stagger spawn
        this.x = this.game.player.x + 60 * (Math.random() - 0.5);
        this.y = this.game.player.y + 60 * (Math.random() - 0.5);
        this.isDistracting = false;
        this.distractionTimeLeft = 0;
        this.abilities = [
            {
                name: 'distract',
                cooldown: 0,
                maxCooldown: 600, // 10 seconds
                execute: () => this.distractBoss()
            }
        ];
    }

    update() {
        super.update();
        // Distract boss if ability is ready and not already distracting
        if (
            this.abilities[0].cooldown <= 0 &&
            !this.isDistracting &&
            this.game.boss
        ) {
            this.abilities[0].execute();
            this.abilities[0].cooldown = this.abilities[0].maxCooldown;
        }
        // Handle distraction state
        if (this.isDistracting) {
            this.distractionTimeLeft--;
            if (this.distractionTimeLeft <= 0) {
                this.isDistracting = false;
            } else if (this.game.boss) {
                // Make boss move towards diplomat instead of player
                const dx = this.x - this.game.boss.x;
                const dy = this.y - this.game.boss.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 0) {
                    this.game.boss.x += (dx / distance) * 2;
                    this.game.boss.y += (dy / distance) * 2;
                }
            }
        }
    }

    distractBoss() {
        this.isDistracting = true;
        this.distractionTimeLeft = 180; // 3 seconds
        if (this.game.boss) {
            this.game.boss.isDistracted = true;
            this.game.boss.distractionTimer = this.distractionTimeLeft;
        }
        // Optionally show a distraction effect or message
    }
}

class Bard extends NPC {
    constructor(game) {
        super(game, 'bard');
        this.color = '#BA55D3'; // Medium Orchid
        // Stagger spawn
        this.x = this.game.player.x + 60 * (Math.random() - 0.5);
        this.y = this.game.player.y + 60 * (Math.random() - 0.5);
        this.currentSong = null;
        this.songDuration = 0;
        this.abilities = [
            {
                name: 'energyBallad',
                cooldown: 0,
                maxCooldown: 450, // 7.5 seconds cooldown
                execute: () => this.playSong('energy')
            },
            {
                name: 'battleSymphony',
                cooldown: 0,
                maxCooldown: 600, // 10 seconds cooldown
                execute: () => this.playSong('battle')
            }
        ];
    }

    update() {
        super.update();
        // Play energyBallad if player energy < 60% and ability is ready
        if (
            this.abilities[0].cooldown <= 0 &&
            this.game.player.energy < this.game.player.maxEnergy * 0.6
        ) {
            this.abilities[0].execute();
            this.abilities[0].cooldown = this.abilities[0].maxCooldown;
        }
        // Play battleSymphony if boss is present, player health < 60%, and ability is ready
        if (
            this.abilities[1].cooldown <= 0 &&
            this.game.player.health < this.game.player.maxHealth * 0.6 &&
            this.game.boss
        ) {
            this.abilities[1].execute();
            this.abilities[1].cooldown = this.abilities[1].maxCooldown;
        }
        if (this.songDuration > 0) this.songDuration--;
    }

    playSong(type) {
        if (type === 'energy') {
            // Restore 30 energy to player
            this.game.player.energy = Math.min(
                this.game.player.energy + 30,
                this.game.player.maxEnergy
            );
            this.songDuration = 180; // 3 seconds
            this.currentSong = 'energyBallad';
        } else if (type === 'battle') {
            // Boost player damage for 5 seconds
            this.game.player.activeEffects.push({
                type: 'damageBoost',
                value: 1.5,
                duration: 300 // 5 seconds
            });
            this.songDuration = 300;
            this.currentSong = 'battleSymphony';
        }
        // Optionally show a song effect or message
    }
}

class ComicRelief extends NPC {
    constructor(game) {
        super(game, 'comicRelief');
        console.log('[ComicRelief DEBUG] ComicRelief NPC constructed');
        this.baseColor = '#FFB347'; // Light Orange (for fallback)
        this.colorShiftTime = 0;
        this.colorShiftSpeed = 0.03; // Speed of color shift
        // Color palette: rainbow colors for comic effect
        // Lower chaosTimerMax for rapid effect testing
        this.colorPalette = [
            '#FFB347', // Orange
            '#FF69B4', // Pink
            '#00FFFF', // Cyan
            '#ADFF2F', // GreenYellow
            '#FFD700', // Gold
            '#FF4500', // OrangeRed
            '#8A2BE2', // BlueViolet
        ];
        this.chaosTimerMax = 60; // 1 second at 60 FPS for testing
        this.chaosTimer = this.chaosTimerMax;
        console.log('[ComicRelief DEBUG] Constructor: chaosTimerMax:', this.chaosTimerMax, 'chaosTimer:', this.chaosTimer, 'abilitiesUnlocked:', this.abilitiesUnlocked);
        // Timer for chaos effect
        // (You may want to adjust or remove the following lines if not needed)
        // this.chaosTimer = 30 * 60; // 30 seconds at 60fps
        // console.log('[ComicRelief DEBUG] chaosTimer initialized to', this.chaosTimer);
        // this.chaosTimerMax = 30 * 60;
        // console.log('[ComicRelief DEBUG] chaosTimerMax initialized to', this.chaosTimerMax);
        this.lastEffectMessage = '';
        this.lastEffectMessageTimer = 0;
        this.lastEffectMessageMax = 180; // 3 seconds
        // Add a dummy ability to enable abilitiesUnlocked logic
        this.abilities = [
            {
                name: 'chaos',
                cooldown: 0,
                maxCooldown: 1,
                execute: () => {}
            }
        ];
    }

    update() {
        super.update();
        // Color shifting logic: increment time and update color
        this.colorShiftTime += this.colorShiftSpeed;
        // Smoothly interpolate between palette colors
        const palette = this.colorPalette;
        const t = this.colorShiftTime;
        const idx = Math.floor(t) % palette.length;
        const nextIdx = (idx + 1) % palette.length;
        const frac = t - Math.floor(t);
        function lerpHex(a, b, f) {
            const ah = a.startsWith('#') ? a.substring(1) : a;
            const bh = b.startsWith('#') ? b.substring(1) : b;
            const ar = parseInt(ah.substring(0,2),16), ag = parseInt(ah.substring(2,4),16), ab = parseInt(ah.substring(4,6),16);
            const br = parseInt(bh.substring(0,2),16), bg = parseInt(bh.substring(2,4),16), bb = parseInt(bh.substring(4,6),16);
            const rr = Math.round(ar + (br-ar)*f);
            const rg = Math.round(ag + (bg-ag)*f);
            const rb = Math.round(ab + (bb-ab)*f);
            return `#${rr.toString(16).padStart(2,'0')}${rg.toString(16).padStart(2,'0')}${rb.toString(16).padStart(2,'0')}`;
        }
        this.color = lerpHex(palette[idx], palette[nextIdx], frac);
        // Chaos effect logic
        if (this.abilitiesUnlocked) {
            console.log('[ComicRelief DEBUG] update: chaosTimer:', this.chaosTimer, 'chaosTimerMax:', this.chaosTimerMax, 'currentEffect:', this.currentEffect);
            this.chaosTimer--;
            if (this.chaosTimer <= 0) {
                console.log('[ComicRelief DEBUG] update: chaosTimer threshold reached, calling triggerComicEffect');
                this.triggerComicEffect();
                this.chaosTimer = this.chaosTimerMax;
                console.log('[ComicRelief DEBUG] chaosTimer reset to chaosTimerMax:', this.chaosTimerMax);
                console.log('[ComicRelief DEBUG] Comic Effect triggered and timer reset.');
            }
        }
        // Handle chaos effect logic
        if (this.currentEffect) {
            this.effectDuration--;
            if (this.effectDuration <= 0) {
                console.log('[ComicRelief DEBUG] update: effectDuration expired, setting currentEffect to null');
                this.currentEffect = null;
            } else {
                this.applyChaosEffect();
            }
        }
        // Handle effect message timer
        if (this.lastEffectMessageTimer > 0) {
            this.lastEffectMessageTimer--;
        }
    }

    // Triggers every 30s automatically, always active
    triggerComicEffect() {
        // Use comicReliefLevel set in updateAbilities()
        let level = this.comicReliefLevel || 1;
        // Level 1: harmless/neutral, Level 2: risk/reward, Level 3: dramatic
        let effects = [];
        if (level === 1) {
            effects = [
                { name: 'squeakyFootsteps', type: 'neutral', msg: 'Everyone moves with squeaky footsteps!', duration: 180 },
                { name: 'colorShift', type: 'neutral', msg: 'The world shifts colors for a moment!', duration: 120 },
                { name: 'funnySound', type: 'neutral', msg: 'A mysterious funny sound echoes...', duration: 90 },
                { name: 'bananaPeel', type: 'positive', msg: 'Boss slips on a banana peel! Stunned!', duration: 120 },
                { name: 'laughTrack', type: 'neutral', msg: 'All damage numbers become "HA HA HA"!', duration: 180 }
            ];
        } else if (level === 2) {
            effects = [
                { name: 'invincibility', type: 'positive', msg: 'Player is invincible for 3s!', duration: 180 },
                { name: 'randomTeleport', type: 'neutral', msg: 'Player is randomly teleported!', duration: 1 },
                { name: 'bananaPeel', type: 'positive', msg: 'Boss slips on a banana peel!', duration: 90 },
                { name: 'laughTrack', type: 'neutral', msg: 'A laugh track plays!', duration: 120 },
                { name: 'pieInFace', type: 'negative', msg: 'Boss gets a pie in the face!', duration: 90 },
                { name: 'rubberChicken', type: 'neutral', msg: 'Weapons become rubber chickens!', duration: 120 },
                { name: 'spotlight', type: 'neutral', msg: 'A stage spotlight appears!', duration: 180 }
            ];
        } else if (level === 3) {
            effects = [
                { name: 'timeReversal', type: 'chaos', msg: 'Time reverses for a moment!', duration: 60 },
                { name: 'gravityChange', type: 'chaos', msg: 'Gravity changes direction!', duration: 180 },
                { name: 'bossTransform', type: 'chaos', msg: 'Boss transforms into something else!', duration: 180 },
                { name: 'bananaPeel', type: 'positive', msg: 'Boss slips on a banana peel!', duration: 90 },
                { name: 'laughTrack', type: 'neutral', msg: 'A laugh track plays!', duration: 120 },
                { name: 'pieInFace', type: 'negative', msg: 'Boss gets a pie in the face!', duration: 90 },
                { name: 'rubberChicken', type: 'neutral', msg: 'Weapons become rubber chickens!', duration: 120 },
                { name: 'spotlight', type: 'neutral', msg: 'A stage spotlight appears!', duration: 180 }
            ];
        }

        // Weighted random selection
        const weights = effects.map(e => e.type === 'positive' ? 2 : (e.type === 'chaos' ? 1 : 1));
        const total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        let idx = 0;
        for (let i = 0; i < effects.length; ++i) {
            r -= weights[i];
            if (r <= 0) { idx = i; break; }
        }
        const effect = effects[idx];
        console.log('[ComicRelief DEBUG] triggerComicEffect: chosen effect:', effect, 'duration:', effect.duration);
        this.currentEffect = effect;
        this.effectDuration = effect.duration;
        console.log('[ComicRelief DEBUG] triggerComicEffect: currentEffect set:', this.currentEffect, 'effectDuration:', this.effectDuration);
        if (this.currentEffect === null) {
            console.log('[ComicRelief DEBUG] triggerComicEffect: currentEffect is null after assignment!');
        }
        this.lastEffectMessage = effect.msg;
        this.lastEffectMessageTimer = this.lastEffectMessageMax;
        // Console and on-screen message
        console.log(`[Comic Relief] ${effect.msg}`);
        if (this.game.showNPCCue) this.game.showNPCCue(`[Comic Relief] ${effect.msg}`);
        // Apply immediate effect logic
        switch (effect.name) {
            case 'bananaPeel':
                if (this.game.boss) {
                    this.game.boss.isStunned = true;
                    this.game.boss.stunTimer = 120;
                }
                break;
            case 'pieInFace':
                if (this.game.boss) {
                    this.game.boss.isBlinded = true;
                    this.game.boss.blindTimer = 90;
                }
                break;
            case 'invincibility':
                this.game.player.invincible = true;
                this.game.player.invincibleTimer = 180;
                break;
            case 'randomTeleport':
                // Randomly teleport player within bounds
                this.game.player.x = Math.random() * (this.game.canvas.width - this.game.player.width);
                this.game.player.y = Math.random() * (this.game.canvas.height - this.game.player.height - 20);
                break;
            case 'sizeChange':
                // Randomly change player size (restore after duration)
                if (!this.game.player._origSize) {
                    this.game.player._origSize = { width: this.game.player.width, height: this.game.player.height };
                }
                const scale = 0.8 + Math.random()*0.8;
                this.game.player.width = this.game.player._origSize.width * scale;
                this.game.player.height = this.game.player._origSize.height * scale;
                setTimeout(()=>{
                    if (this.game.player._origSize) {
                        this.game.player.width = this.game.player._origSize.width;
                        this.game.player.height = this.game.player._origSize.height;
                    }
                }, 3000);
                break;
            case 'timeReversal':
                // Could implement: rewind player position (stub)
                break;
            case 'gravityChange':
                // Could implement: invert gravity (stub)
                break;
            case 'bossTransform':
                // Could implement: boss transforms (stub)
                break;
        }
    }

    performComedy() {
        if (!this.game.boss) return;
        
        // Randomly do something funny or helpful
        const effects = [
            { name: 'healJoke', chance: 0.3 },
            { name: 'bossSlip', chance: 0.4 },
            { name: 'confetti', chance: 0.3 }
        ];
        
        // Select effect based on weighted chances
        const rand = Math.random();
        let cumulative = 0;
        const effect = effects.find(e => {
            cumulative += e.chance;
            return rand <= cumulative;
        }).name;

        if (effect === 'healJoke') {
            // Heal player with a joke
            const healAmount = 20;
            this.game.player.health = Math.min(this.game.player.health + healAmount, this.game.player.maxHealth);
            this.game.player.updateHealthBar();
            console.log(`Comic Relief tells a healing joke! Player heals ${healAmount} HP`);
            
            // Also stun boss briefly
            this.game.boss.isStunned = true;
            this.game.boss.stunTimer = 60; // 1 second
            
        } else if (effect === 'bossSlip') {
            // Boss slips and takes damage
            const damage = 30;
            this.game.boss.takeDamage(damage);
            // Longer stun duration
            this.game.boss.isStunned = true;
            this.game.boss.stunTimer = 120; // 2 seconds
            console.log(`Comic Relief makes the boss slip! Boss takes ${damage} damage and is stunned`);
            
        } else if (effect === 'confetti') {
            // Confetti explosion that damages boss and heals player
            const damage = 15;
            const healAmount = 15;
            this.game.boss.takeDamage(damage);
            this.game.player.health = Math.min(this.game.player.health + healAmount, this.game.player.maxHealth);
            this.game.player.updateHealthBar();
            console.log(`Comic Relief throws confetti! Boss takes ${damage} damage, Player heals ${healAmount} HP`);
        }
    }

    // ... (rest of the code remains the same)

    draw(ctx) {
        super.draw(ctx); // Ensure ComicRelief body, icon, and health bar are always drawn

        // Draw chaos effect visualization
        if (this.currentEffect) {
            switch (this.currentEffect.name) {
                case 'bananaPeel':
                    // Draw banana peel
                    ctx.fillStyle = '#FFFF00';
                    ctx.beginPath();
                    ctx.ellipse(
                        this.game.boss.x + this.game.boss.width/2,
                        this.game.boss.y + this.game.boss.height,
                        20, 10, 0, 0, Math.PI * 2
                    );
                    ctx.fill();
                    break;
                case 'laughTrack':
                    // Draw "HA HA HA" text
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '20px Arial';
                    ctx.fillText('HA HA HA', this.x - 20, this.y - 20);
                    break;
                case 'pieInFace':
                    // Draw pie
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(
                        this.game.boss.x + this.game.boss.width/2,
                        this.game.boss.y + this.game.boss.height/2,
                        30, 0, Math.PI * 2
                    );
                    ctx.fill();
                    break;
                case 'rubberChicken':
                    // Draw chicken shape
                    ctx.fillStyle = '#FFFF00';
                    ctx.fillRect(this.x - 30, this.y - 20, 20, 10);
                    break;
                case 'spotlight':
                    // Draw spotlight
                    const gradient = ctx.createRadialGradient(
                        this.x + this.width/2, this.y + this.height/2, 10,
                        this.x + this.width/2, this.y + this.height/2, 100
                    );
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(
                        this.x + this.width/2,
                        this.y + this.height/2,
                        100, 0, Math.PI * 2
                    );
                    ctx.fill();
                    break;
            }
        }
    }

    triggerRandomEffect() {
        // Only proceed if chaosEffects exists and is a non-empty array
        if (!Array.isArray(this.chaosEffects) || this.chaosEffects.length === 0) {
            return;
        }
        // Choose a random effect
        const randomEffect = this.chaosEffects[Math.floor(Math.random() * this.chaosEffects.length)];
        this.currentEffect = { ...randomEffect };
        this.effectDuration = randomEffect.duration;
        this.abilities[0].cooldown = this.abilities[0].maxCooldown;
        
        // Murphy's Law: chance to reverse effect (good becomes bad, bad becomes good)
        if (Math.random() < this.murphysLawChance) {
            // Implement reversal logic here
            console.log('Murphy\'s Law activated!');
        }
    }

    applyChaosEffect() {
        // Apply the current chaos effect
        if (!this.currentEffect) return;
        console.log('[ComicRelief DEBUG] applyChaosEffect: applying effect', this.currentEffect.name, 'duration left:', this.effectDuration);
        
        switch (this.currentEffect.name) {
            case 'timeReversal':
                // Only trigger once
                if (!this._timeReversalTriggered) {
                    this._timeReversalTriggered = true;
                    if (this.game.rewindToSnapshot) {
                        this.game.rewindToSnapshot(90); // 90 frames = 1.5s at 60fps
                        this.game.showNPCCue('Time Reversal! The world rewinds...');
                    }
                }
                break;
            case 'bossTransform':
                // Only trigger once
                if (!this._bossTransformed) {
                    this._bossTransformed = true;
                    if (this.game.boss && !this.game.boss._isTransformed) {
                        this.game.boss._isTransformed = true;
                        this.game.boss._originalColor = this.game.boss.color;
                        this.game.boss._originalAttack = this.game.boss.attack;
                        // Change color and attack pattern
                        this.game.boss.color = '#FFD700'; // Gold
                        this.game.boss.attack = function() {
                            // More aggressive: always triple shot
                            const player = this.game.player;
                            const collides = this.checkCollision(this, player);
                            if (collides) {
                                this.meleeAttack();
                                return;
                            }
                            const speed = 10;
                            const dx = player.x - this.x;
                            const dy = player.y - this.y;
                            const dist = Math.sqrt(dx ** 2 + dy ** 2);
                            for (let angle of [-0.4, 0, 0.4]) {
                                let vx = (dx / dist) * speed * Math.cos(angle) - (dy / dist) * speed * Math.sin(angle);
                                let vy = (dx / dist) * speed * Math.sin(angle) + (dy / dist) * speed * Math.cos(angle);
                                const proj = new Projectile(
                                    this.x + this.width / 2,
                                    this.y + this.height / 2,
                                    vx,
                                    vy,
                                    '#FFD700',
                                    18,
                                    'bossProjectile'
                                );
                                this.projectiles.push(proj);
                            }
                        }
                        // End transformation after effectDuration
                        setTimeout(() => {
                            if (this.game.boss && this.game.boss._isTransformed) {
                                this.game.boss.color = this.game.boss._originalColor;
                                this.game.boss.attack = this.game.boss._originalAttack;
                                this.game.boss._isTransformed = false;
                            }
                        }, this.effectDuration * 16);
                        this.game.showNPCCue('Boss Transformation! The boss goes wild!');
                    }
                }
                break;
            case 'bananaPeel':
                // Make boss slip
                if (this.game.boss) {
                    if (Math.random() < 0.1) {
                        this.game.boss.attackCooldown = Math.max(this.game.boss.attackCooldown, 120); // 2 seconds
                        console.log('[ComicRelief DEBUG] applyChaosEffect: Boss slipped on banana peel! attackCooldown set to', this.game.boss.attackCooldown);
                    } else {
                        console.log('[ComicRelief DEBUG] applyChaosEffect: Boss banana peel effect did not trigger this frame');
                    }
                } else {
                    console.log('[ComicRelief DEBUG] applyChaosEffect: No boss present for banana peel effect');
                }
                break;
            case 'laughTrack':
                // All damage numbers become "HA HA HA"
                // This is visual only
                break;
            case 'pieInFace':
                // Boss is temporarily blinded
                if (this.game.boss) {
                    this.game.boss.attackCooldown = Math.max(this.game.boss.attackCooldown, 90); // 1.5 seconds
                }
                break;
            case 'rubberChicken':
                // Weapons make squeaky noises and deal random damage
                // This would be implemented in the player's attack method
                break;
            case 'spotlight':
                // Random area becomes highlighted, dealing damage to anyone inside
                if (this.game.boss && Math.random() < 0.05) {
                    this.game.boss.takeDamage(5);
                }
                break;
        }
    }
}
