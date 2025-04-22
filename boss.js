class Boss {
  updatePhase() {
    let newPhase = 1;
    if (this.health <= this.maxHealth * (1/3)) newPhase = 3;
    else if (this.health <= this.maxHealth * (2/3)) newPhase = 2;
    if (newPhase !== this.phase) {
      this.lastPhase = this.phase;
      this.phase = newPhase;
      this.phaseTransitionFrame = 30;
    }
  }
  constructor(game) {
    this.game = game;
    this.width = 80;
    this.height = 80;
    this.x = this.game.canvas.width / 2 - this.width / 2;
    this.y = 100;
    this.health = 500;
    this.maxHealth = 500;
    this.velocityY = 0;
    this.projectiles = [];
    this.attackCooldown = 60;
    this.color = '#ff00ff';
    this.isDistracted = false;
    this.distractionTimer = 0;
    this.phase = 1; // 1, 2, 3
    this.lastPhase = 1;
    this.phaseTransitionFrame = 0;
  }

  update() {
    this.updatePhase();
    if (this.swapColorTurns && this.swapColorTurns > 0) {
      this.swapColorTurns--;
      if (this.swapColorTurns === 0 && this.originalColor) {
        this.color = this.originalColor;
      }
    }
    // If distracted, skip this turn
    if (this.isDistracted) {
      this.distractionTimer--;
      if (this.distractionTimer <= 0) {
        this.isDistracted = false;
      }
      return;
    }
    // Chase player horizontally
    const dx = this.game.player.x - this.x;
    if (Math.abs(dx) > 5) {
      this.x += Math.sign(dx) * 2;
    }

    // Optional: vertical movement (less aggressive)
    const dy = this.game.player.y - this.y;
    if (Math.abs(dy) > 5) {
      this.y += Math.sign(dy) * 1.5;
    }

    // Gravity
    this.velocityY += 0.8;
    this.y += this.velocityY;

    // Ground collision
    const groundY = this.game.canvas.height - this.height - 20;
    if (this.y > groundY) {
      this.y = groundY;
      this.velocityY = 0;
    }

    // Cooldown and attack
    let phaseAttackCooldown = 120;
    if (this.phase === 2) phaseAttackCooldown = 80;
    if (this.phase === 3) phaseAttackCooldown = 45;
    if (this.attackCooldown <= 0) {
      this.attack();
      this.attackCooldown = phaseAttackCooldown;
    } else {
      this.attackCooldown--;
    }

    // Update projectiles
    this.projectiles.forEach((p, i) => {
      p.update();
      if (p.offscreen) this.projectiles.splice(i, 1);
    });
  }

  attack() {
    // Phase-based attack variation
    if (this.phase === 2) {
      // Double shot
      const player = this.game.player;
      const collides = this.checkCollision(this, player);
      if (collides) {
        this.meleeAttack();
        return;
      }
      const speed = 7;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx ** 2 + dy ** 2);
      for (let angle of [-0.2, 0.2]) {
        let vx = (dx / dist) * speed * Math.cos(angle) - (dy / dist) * speed * Math.sin(angle);
        let vy = (dx / dist) * speed * Math.sin(angle) + (dy / dist) * speed * Math.cos(angle);
        const tk = this.game.npcs.find(npc => npc.type === 'timekeeper' && npc.timeSlowActive);
        let slowed = false;
        if (tk) {
          vx *= 0.3;
          vy *= 0.3;
          slowed = true;
        }
        const proj = new Projectile(
          this.x + this.width / 2,
          this.y + this.height / 2,
          vx,
          vy,
          '#ff00ff',
          10,
          'bossProjectile'
        );
        if (slowed) proj.slowed = true;
        this.projectiles.push(proj);
      }
      return;
    }
    if (this.phase === 3) {
      // Triple shot (spread)
      const player = this.game.player;
      const collides = this.checkCollision(this, player);
      if (collides) {
        this.meleeAttack();
        return;
      }
      const speed = 8;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx ** 2 + dy ** 2);
      for (let angle of [-0.3, 0, 0.3]) {
        let vx = (dx / dist) * speed * Math.cos(angle) - (dy / dist) * speed * Math.sin(angle);
        let vy = (dx / dist) * speed * Math.sin(angle) + (dy / dist) * speed * Math.cos(angle);
        const tk = this.game.npcs.find(npc => npc.type === 'timekeeper' && npc.timeSlowActive);
        let slowed = false;
        if (tk) {
          vx *= 0.3;
          vy *= 0.3;
          slowed = true;
        }
        const proj = new Projectile(
          this.x + this.width / 2,
          this.y + this.height / 2,
          vx,
          vy,
          '#ff00ff',
          12,
          'bossProjectile'
        );
        if (slowed) proj.slowed = true;
        this.projectiles.push(proj);
      }
      return;
    }
    // Always use melee if close (collision)
    const player = this.game.player;
    const collides = this.checkCollision(this, player);
    if (collides) {
      this.meleeAttack();
      return;
    }

    // Otherwise, fire projectile
    const speed = 6;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx ** 2 + dy ** 2);
    let vx = (dx / dist) * speed;
    let vy = (dy / dist) * speed;

    // Check if Timekeeper's slow is active
    const tk = this.game.npcs.find(npc => npc.type === 'timekeeper' && npc.timeSlowActive);
    let slowed = false;
    if (tk) {
      vx *= 0.3;
      vy *= 0.3;
      slowed = true;
    }

    const proj = new Projectile(
      this.x + this.width / 2,
      this.y + this.height / 2,
      vx,
      vy,
      '#ff00ff',
      10,
      'bossProjectile'
    );
    if (slowed) proj.slowed = true;
    this.projectiles.push(proj);
  }

  meleeAttack() {
    // Deal direct damage to player if colliding
    const player = this.game.player;
    // Only damage if not invincible
    if (!player.invincible) {
      // Drain 1/3 of player's current health (rounded up)
      const drain = Math.ceil(player.health / 3);
      player.takeDamage(drain, 'bossMelee');
    }
  }

  checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  takeDamage(amount) {
    this.health -= amount;
    console.log(`Boss takes ${amount} damage, health now: ${this.health}`);
    if (this.game && typeof this.game.updateBossHealthBar === 'function') {
      this.game.updateBossHealthBar();
    }
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.health = 0;
    console.log('Boss defeated!');
    // Stop the game and display win message
    this.game.isRunning = false;
    setTimeout(() => {
      alert('You win! Boss defeated!');
      // Show main menu overlay
      const gameMenu = document.getElementById('gameMenu');
      if (gameMenu) gameMenu.style.display = '';
    }, 100);
  }

  draw(ctx) {
    // Phase transition flash
    if (this.phaseTransitionFrame > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.7, this.phaseTransitionFrame / 30);
      ctx.fillStyle = this.phase === 2 ? '#00BFFF' : '#FF4500';
      ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
      ctx.restore();
      this.phaseTransitionFrame--;
    }
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw health bar
    ctx.fillStyle = '#000000';
    ctx.fillRect(this.x, this.y - 10, this.width, 5);
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(this.x, this.y - 10, (this.health / this.maxHealth) * this.width, 5);

    // Draw projectiles
    this.projectiles.forEach(p => p.draw(ctx));

    // Draw time slow overlay if active
    const tk = this.game.npcs && this.game.npcs.find(npc => npc.type === 'timekeeper' && npc.timeSlowActive);
    if (tk) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#4B0082';
      ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
      ctx.restore();
    }
  }
}
