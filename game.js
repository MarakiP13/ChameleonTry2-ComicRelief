const npcClasses = {
  guardian: Guardian,
  scout: Scout,
  medic: Medic,
  berserker: Berserker,
  tactician: Tactician,
  elementalist: Elementalist,
  timekeeper: Timekeeper,
  summoner: Summoner,
  mystic: Mystic,
  vanguard: Vanguard,
  diplomat: Diplomat,
  bard: Bard,
  comicRelief: ComicRelief
};

class Game {
  // --- Snapshot/Rewind System for Time Reversal ---
  _initSnapshots() {
    this._snapshots = [];
    this._maxSnapshots = 120; // store up to 2 seconds at 60fps
  }
  _takeSnapshot() {
    // Deep clone state (player, boss, npcs, projectiles, score, etc)
    const snapshot = {
      player: this._clonePlayer(this.player),
      boss: this._cloneBoss(this.boss),
      npcs: this.npcs.map(npc => this._cloneNPC(npc)),
      projectiles: this.projectiles.map(p => this._cloneProjectile(p)),
      score: this.score,
      bossProjectiles: this.boss.projectiles.map(p => this._cloneProjectile(p)),
      time: Date.now(),
    };
    this._snapshots.push(snapshot);
    if (this._snapshots.length > this._maxSnapshots) this._snapshots.shift();
  }
  rewindToSnapshot(framesBack) {
    if (!this._snapshots || this._snapshots.length === 0) return;
    const idx = Math.max(0, this._snapshots.length - framesBack);
    const snap = this._snapshots[idx];
    if (!snap) return;
    // Restore player
    Object.assign(this.player, snap.player);
    // Restore boss
    Object.assign(this.boss, snap.boss);
    // Restore NPCs
    this.npcs = snap.npcs.map(npcSnap => this._restoreNPC(npcSnap));
    // Restore projectiles
    this.projectiles = snap.projectiles.map(p => this._restoreProjectile(p));
    // Restore boss projectiles
    this.boss.projectiles = snap.bossProjectiles.map(p => this._restoreProjectile(p));
    // Restore score
    this.score = snap.score;
    this.updateScore();
    this.updateBossHealthBar();
  }
  _clonePlayer(player) {
    // Only clone relevant state properties, not methods or circular refs
    return {
      x: player.x,
      y: player.y,
      width: player.width,
      height: player.height,
      speed: player.speed,
      jumpForce: player.jumpForce,
      gravity: player.gravity,
      velocityY: player.velocityY,
      velocityX: player.velocityX,
      isJumping: player.isJumping,
      health: player.health,
      maxHealth: player.maxHealth,
      energy: player.energy,
      maxEnergy: player.maxEnergy,
      energyRegenRate: player.energyRegenRate,
      attackCooldown: player.attackCooldown,
      specialCooldown: player.specialCooldown,
      isAttacking: player.isAttacking,
      invincible: player.invincible,
      invincibleTimer: player.invincibleTimer,
      invincibleDuration: player.invincibleDuration,
      deaths: player.deaths,
      comboCount: player.comboCount,
      comboTimer: player.comboTimer,
      comboTimeout: player.comboTimeout,
      activeEffects: player.activeEffects ? JSON.parse(JSON.stringify(player.activeEffects)) : [],
      // Add any other properties you need to restore
    };
  }
  _cloneBoss(boss) {
    // Only clone relevant state properties, not methods or circular refs
    return {
      x: boss.x,
      y: boss.y,
      width: boss.width,
      height: boss.height,
      health: boss.health,
      maxHealth: boss.maxHealth,
      velocityY: boss.velocityY,
      attackCooldown: boss.attackCooldown,
      color: boss.color,
      phase: boss.phase,
      lastPhase: boss.lastPhase,
      phaseTransitionFrame: boss.phaseTransitionFrame,
      isDistracted: boss.isDistracted,
      distractionTimer: boss.distractionTimer,
      _isTransformed: boss._isTransformed,
      _originalColor: boss._originalColor,
      // Add any other properties you need to restore
    };
  }
  _cloneNPC(npc) {
    // Only clone relevant state properties, not methods or circular refs
    return {
      type: npc.type,
      x: npc.x,
      y: npc.y,
      width: npc.width,
      height: npc.height,
      color: npc.color,
      health: npc.health,
      maxHealth: npc.maxHealth,
      energy: npc.energy,
      maxEnergy: npc.maxEnergy,
      abilities: npc.abilities ? JSON.parse(JSON.stringify(npc.abilities)) : [],
      activeEffects: npc.activeEffects ? JSON.parse(JSON.stringify(npc.activeEffects)) : [],
      followDistance: npc.followDistance,
      chaosChance: npc.chaosChance,
      // Add any other properties you need to restore for rewind
    };
  }
  _cloneProjectile(proj) {
    return JSON.parse(JSON.stringify(proj));
  }
  _restoreNPC(npcSnap) {
    // Find matching NPC class
    const npcClass = npcClasses[npcSnap.type] || NPC;
    const npc = new npcClass(this);
    Object.assign(npc, npcSnap);
    return npc;
  }
  _restoreProjectile(projSnap) {
    const proj = new Projectile(0,0,0,0,'#fff',0);
    Object.assign(proj, projSnap);
    return proj;
  }
  // --- END Snapshot/Rewind System ---
  showNPCCue(message) {
    this.npcCueMessage = message;
    this.npcCueTimer = 180; // show for 3 seconds at 60fps
  }
  handleClick(e) {
    if (!this.isRunning) return;
    if (typeof this.player.attack === 'function') {
      this.player.attack();
    }
  }

  handleRightClick(e) {
    e.preventDefault();
    if (!this.isRunning) return;
    if (typeof this.player.specialAttack === 'function') {
      this.player.specialAttack();
    }
  }
  constructor() {
    this._initSnapshots();
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.keys = [];
    this.projectiles = [];
    this.npcs = [];
    this.activeNPCs = [];
    this.isRunning = false;
    this.score = 0;
    this.npcMenuOpen = false;
    this.playerDeaths = 0; // Track deaths across games
    
    // Scoring system
    this.scoreSystem = {
      consecutiveHits: { points: 50, achieved: false, message: 'Perfect Striker: 10 consecutive hits' },
      energyOrbsCollected: { points: 75, achieved: false, message: 'Energy Master: 100 orbs collected' },
      minionsDefeated: { points: 100, achieved: false, message: 'Minion Slayer: 20 minions defeated' },
      survivalTime: { points: 150, achieved: false, message: 'Survivor: 5 minutes' },
      maxCombo: { points: 100, achieved: false, message: 'Combo Master: 15x combo' },
      blocks: { points: 75, achieved: false, message: 'Perfect Guard: 10 attacks blocked' },
      bossPhase: { points: 200, achieved: false, message: 'Phase Master: Reach phase 3' },
      comicDeaths: { points: 50, achieved: false, message: 'Determined Spirit: Die 10 times' }
    };

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.player = new Player(this);
this.player.updateHealthBar();
    this.boss = new Boss(this);

    window.addEventListener('keydown', e => this.handleKeyDown(e));
    window.addEventListener('keyup', e => this.handleKeyUp(e));
    this.canvas.addEventListener('click', e => this.handleClick(e));
    this.canvas.addEventListener('contextmenu', e => this.handleRightClick(e));

    this.initializeNPCMenu();

    document.getElementById('startGame').addEventListener('click', () => this.startGame());
    document.getElementById('resetBoss').addEventListener('click', () => this.resetBoss());
    document.getElementById('toggleNPCs').addEventListener('click', () => this.toggleNPCMenu());

    this.showMenu();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth * 0.8;
    this.canvas.height = window.innerHeight * 0.8;
  }

  startGame() {
    // Reset all game state for a new game
    this.player = new Player(this, this.playerDeaths);
    this.player.updateHealthBar();
    this.boss = new Boss(this);
    this.projectiles = [];
    // Instantiate selected NPCs by type, spawn near player
    console.log('DEBUG: activeNPCs at startGame:', this.activeNPCs);
    this.npcs = this.activeNPCs.map((type, i) => {
      const npcClass = npcClasses[type];
      if (!npcClass) {
        console.log('DEBUG: No npcClass for type', type);
        return null;
      }
      const npc = new npcClass(this);
      // Stagger NPC spawn near the player
      if (this.player) {
        npc.x = this.player.x + 60 * (i - 0.5);
        npc.y = this.player.y + 60 * (Math.random() - 0.5);
      }
      console.log('DEBUG: Instantiated NPC', type, npc);
      return npc;
    }).filter(npc => npc);
    this.isRunning = true;
    this.score = 0;
    
    // Reset score system achievements
    Object.keys(this.scoreSystem).forEach(key => {
      this.scoreSystem[key].achieved = false;
    });
    
    this.updateScore();
    this.updateBossHealthBar();
    document.getElementById('gameMenu').style.display = 'none';
    this.gameLoop();
  }

  updateScore() {
    const scoreDisplay = document.getElementById('score');
    if (scoreDisplay) {
      scoreDisplay.textContent = this.score;
    }
  }

  updateBossHealthBar() {
    const bar = document.querySelector('.boss-health-fill');
    if (bar && this.boss) {
      bar.style.width = `${(this.boss.health / this.boss.maxHealth) * 100}%`;
    }
    // Update phase display
    const phaseDisplay = document.getElementById('phase');
    if (phaseDisplay && this.boss && this.boss.phase) {
      phaseDisplay.textContent = this.boss.phase;
    }
  }

  resetBoss() {
    this.boss = new Boss(this);
    this.updateBossHealthBar();
  }

  showMenu() {
    document.getElementById('gameMenu').style.display = 'block';
  }

  toggleNPCMenu() {
    const npcMenu = document.getElementById('npcMenu');
    this.npcMenuOpen = !this.npcMenuOpen;
    npcMenu.style.display = this.npcMenuOpen ? 'block' : 'none';
  }

  initializeNPCMenu() {
    const npcTypes = [
      { type: 'guardian', name: 'Guardian', description: 'Provides shield protection' },
      { type: 'scout', name: 'Scout', description: 'Tracks enemy projectiles' },
      { type: 'medic', name: 'Medic', description: 'Heals the player' },
      { type: 'berserker', name: 'Berserker', description: 'Boosts damage' },
      { type: 'tactician', name: 'Tactician', description: 'Analyzes boss patterns' },
      { type: 'elementalist', name: 'Elementalist', description: 'Uses elemental attacks' },
      { type: 'timekeeper', name: 'Timekeeper', description: 'Slows down time' },
      { type: 'summoner', name: 'Summoner', description: 'Controls minions' },
      { type: 'mystic', name: 'Mystic', description: 'Restores energy' },
      { type: 'vanguard', name: 'Vanguard', description: 'Performs charge attacks' },
      { type: 'diplomat', name: 'Diplomat', description: 'Distracts the boss' },
      { type: 'bard', name: 'Bard', description: 'Provides musical buffs' },
      { type: 'comicRelief', name: 'Comic Relief', description: 'Creates random chaos' }
    ];

    const npcMenu = document.createElement('div');
    npcMenu.id = 'npcMenu';
    npcMenu.className = 'npc-menu';
    npcMenu.style.display = 'none';

    const title = document.createElement('h2');
    title.textContent = 'Select NPCs (0/2)';
    npcMenu.appendChild(title);

    const npcList = document.createElement('div');
    npcList.className = 'npc-grid';

    npcTypes.forEach(npc => {
      const npcItem = document.createElement('div');
      npcItem.className = 'npc-card';
      npcItem.dataset.type = npc.type;

      const npcName = document.createElement('h3');
      npcName.textContent = npc.name;

      const npcDesc = document.createElement('p');
      npcDesc.textContent = npc.description;

      npcItem.append(npcName, npcDesc);
      npcItem.addEventListener('click', () => this.toggleNPCSelection(npc.type));
      npcList.appendChild(npcItem);
    });

    npcMenu.appendChild(npcList);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => this.toggleNPCMenu());
    npcMenu.appendChild(closeButton);

    document.querySelector('.game-container').appendChild(npcMenu);
  }

  toggleNPCSelection(type) {
    // Store only types in activeNPCs
    const selected = this.activeNPCs.includes(type);
    if (selected) {
      this.activeNPCs = this.activeNPCs.filter(t => t !== type);
    } else if (this.activeNPCs.length < 2) {
      this.activeNPCs.push(type);
    }
    // Update UI
    document.getElementById('toggleNPCs').textContent = `Select NPCs (${this.activeNPCs.length}/2)`;
    document.querySelector('#npcMenu h2').textContent = `Select NPCs (${this.activeNPCs.length}/2)`;
    document.querySelectorAll('.npc-card').forEach(card => {
      card.classList.toggle('selected', this.activeNPCs.includes(card.dataset.type));
    });
    // Update preview list (not game NPCs)
    this.npcs = this.activeNPCs.map(type => {
      const npcClass = npcClasses[type];
      return npcClass ? new npcClass(this) : null;
    }).filter(npc => npc);
  }

  handleKeyDown(e) {
    if (!this.keys.includes(e.key)) this.keys.push(e.key);
  }

  handleKeyUp(e) {
    this.keys = this.keys.filter(key => key !== e.key);
  }

  checkAchievements() {
    // Check each achievement condition and award points if not already achieved
    const achievements = {
      consecutiveHits: this.player.consecutiveHits >= 10,
      energyOrbsCollected: this.energyOrbsCollected >= 100,
      minionsDefeated: this.minionsDefeated >= 20,
      survivalTime: this.npcs.some(npc => npc.survivalFrames >= 18000), // 5 min at 60fps
      maxCombo: this.player.comboCount >= 15,
      blocks: this.player.blocks >= 10,
      bossPhase: this.boss && this.boss.phase >= 3,
      comicDeaths: this.player.comicDeaths >= 10
    };

    Object.entries(achievements).forEach(([key, achieved]) => {
      if (achieved && !this.scoreSystem[key].achieved) {
        this.score += this.scoreSystem[key].points;
        this.scoreSystem[key].achieved = true;
        this.showNPCCue(`Achievement: ${this.scoreSystem[key].message} (+${this.scoreSystem[key].points} points)`);
        this.updateScore();
      }
    });
  }

  gameLoop() {
    // Take snapshot for time reversal every frame
    this._takeSnapshot();

    // If player just died, update the score immediately to refresh the HUD
    if (this.player.health === 0 && this.lastPlayerDeaths !== this.player.deaths) {
      this.updateScore();
      this.lastPlayerDeaths = this.player.deaths;
    }

    // Draw NPC unlock cue if present
    if (this.npcCueMessage && this.npcCueTimer > 0) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.92;
      this.ctx.font = 'bold 28px Arial';
      this.ctx.fillStyle = '#ff00ff';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.npcCueMessage, this.canvas.width / 2, 60);
      this.ctx.restore();
      this.npcCueTimer--;
      if (this.npcCueTimer === 0) this.npcCueMessage = '';
    }

    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw player death counter (HUD, top left)
    this.ctx.save();
    this.ctx.font = 'bold 22px Arial';
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'left';
    this.ctx.shadowColor = '#000';
    this.ctx.shadowBlur = 6;
    this.ctx.fillText(`Deaths: ${this.player.deaths || 0}`, 32, 48);
    this.ctx.restore();

    this.player.update();
    this.player.draw(this.ctx);

    this.boss.update();
    this.boss.draw(this.ctx);
    
    // Check achievements
    this.checkAchievements();

    // Boss projectile collision with player
    this.boss.projectiles.forEach((proj, i) => {
      // Simple rectangle collision check with player
      const px = this.player.x, py = this.player.y, pw = this.player.width, ph = this.player.height;
      const bx = proj.x, by = proj.y, bw = proj.width, bh = proj.height;
      if (
        px < bx + bw &&
        px + pw > bx &&
        py < by + bh &&
        py + ph > by
      ) {
        this.player.takeDamage(proj.damage);
        this.boss.projectiles.splice(i, 1);
        return; // Only one collision per projectile
      }
      // Now check collision with each NPC
      this.npcs.forEach(npc => {
        const nx = npc.x, ny = npc.y, nw = npc.width, nh = npc.height;
        if (
          nx < bx + bw &&
          nx + nw > bx &&
          ny < by + bh &&
          ny + nh > by
        ) {
          // Special projectiles do more damage
          const dmg = proj.type === 'special' ? 20 : 10;
          npc.takeDamage(dmg);
          this.boss.projectiles.splice(i, 1);
        }
      });
    });

    // Update and draw NPCs
    this.npcs.forEach((npc, idx) => {
      if (idx === 0) {
        console.log('DEBUG: NPC', npc.type, 'at', npc.x, npc.y, 'health:', npc.health);
      }
      npc.update();
      npc.draw(this.ctx);
    });

    this.projectiles.forEach((proj, i) => {
      proj.update();
      proj.draw(this.ctx);
      // Check collision with boss
      const bx = this.boss.x, by = this.boss.y, bw = this.boss.width, bh = this.boss.height;
      const px = proj.x, py = proj.y, pw = proj.width, ph = proj.height;
      if (
        px < bx + bw &&
        px + pw > bx &&
        py < by + bh &&
        py + ph > by
      ) {
        // Only damage boss from player's projectiles (not NPCs)
        if (proj.type === 'special') {
          this.boss.takeDamage(proj.damage);
        }
        // Remove projectile on hit
        this.projectiles.splice(i, 1);
        return;
      }
      if (proj.offscreen) this.projectiles.splice(i, 1);
    });

    requestAnimationFrame(() => this.gameLoop());
  }
}
