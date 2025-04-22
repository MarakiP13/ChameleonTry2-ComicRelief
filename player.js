class Player {
    constructor(game, initialDeaths = 0) {
        this.deaths = initialDeaths; // Track player deaths
        this.game = game;
        this.width = 50;
        this.height = 50;
        this.x = game.canvas.width / 2 - this.width / 2;
        this.y = game.canvas.height - this.height - 20;
        this.speed = 5;
        this.jumpForce = -15;
        this.gravity = 0.8;
        this.velocityY = 0;
        this.velocityX = 0;
        this.isJumping = false;
        this.health = 100;
        this.maxHealth = 100;
        this.energy = 100;
        this.maxEnergy = 100;
        this.energyRegenRate = 0.5;
        this.attackCooldown = 0;
        this.specialCooldown = 0;
        this.isAttacking = false;
        this.isBlocking = false;
        this.isDashing = false;
        this.dashCooldown = 0;
        this.dashDuration = 0;
        this.dashSpeed = 15;
        this.attackBox = {
            width: 60,
            height: 60
        };
        this.color = '#00ff9d';
        this.trail = [];
        this.maxTrailLength = 5;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboTimeout = 60; // frames
        this.weapons = [
            { name: 'sword', damage: 10, energyCost: 0, cooldown: 20 },
            { name: 'energyBlast', damage: 20, energyCost: 30, cooldown: 60 },
            { name: 'shield', damage: 0, energyCost: 5, cooldown: 10, duration: 30 }
        ];
        this.currentWeapon = 0;
        this.weaponCooldown = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 30; // frames
        this.activeEffects = []; // Ensure this is defined

        // Default attack box for melee attacks
        this.attackBox = { width: 50, height: 30 };
    }

    update() {
        // Energy regeneration
        if (this.energy < this.maxEnergy) {
            this.energy += this.energyRegenRate;
            if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;
        }

        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer === 0) {
                this.comboCount = 0;
            }
        }

        // Invincibility timer
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // ComicRelief color swap logic
        if (this.swapColorTurns && this.swapColorTurns > 0) {
            this.swapColorTurns--;
            if (this.swapColorTurns === 0 && this.originalColor) {
                this.color = this.originalColor;
            }
        }

        // Dash mechanics
        if (this.isDashing) {
            this.dashDuration--;
            if (this.dashDuration <= 0) {
                this.isDashing = false;
                this.velocityX = 0;
            }
        } else if (this.dashCooldown > 0) {
            this.dashCooldown--;
        }

        // Weapon cooldown
        if (this.weaponCooldown > 0) {
            this.weaponCooldown--;
        }

        // Movement
        if (!this.isDashing) {
            if (this.game.keys.includes('ArrowLeft') || this.game.keys.includes('a')) {
                this.x -= this.speed;
            }
            if (this.game.keys.includes('ArrowRight') || this.game.keys.includes('d')) {
                this.x += this.speed;
            }
        }

        // Jump
        if ((this.game.keys.includes('ArrowUp') || this.game.keys.includes('w') || this.game.keys.includes(' ')) && !this.isJumping) {
            this.velocityY = this.jumpForce;
            this.isJumping = true;
        }

        // Block
        this.isBlocking = this.game.keys.includes('Shift') && this.energy >= 5;
        if (this.isBlocking) {
            this.energy -= 0.5;
        }

        // Weapon switch
        if (this.game.keys.includes('1')) {
            this.currentWeapon = 0;
        } else if (this.game.keys.includes('2')) {
            this.currentWeapon = 1;
        } else if (this.game.keys.includes('3')) {
            this.currentWeapon = 2;
        }

        // Dash
        if ((this.game.keys.includes('Control') || this.game.keys.includes('q')) && this.dashCooldown <= 0 && !this.isDashing) {
            this.dash();
        }

        // Apply gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Ground collision
        if (this.y > this.game.canvas.height - this.height - 20) {
            this.y = this.game.canvas.height - this.height - 20;
            this.velocityY = 0;
            this.isJumping = false;
        }

        // Wall collision
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.canvas.width - this.width) {
            this.x = this.game.canvas.width - this.width;
        }

        // Attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        if (this.specialCooldown > 0) {
            this.specialCooldown--;
        }

        // Update trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    die() {
        this.deaths = (this.deaths || 0) + 1;
        if (this.game && typeof this.game.playerDeaths === 'number') {
            this.game.playerDeaths = this.deaths;
        }
        this.game.isRunning = false;
        setTimeout(() => {
            alert('Game Over! You have been defeated.');
            // Show main menu overlay
            const gameMenu = document.getElementById('gameMenu');
            if (gameMenu) gameMenu.style.display = '';
        }, 100);
    }

    draw(ctx) {
        // Draw trail
        ctx.save();
        this.trail.forEach((pos, index) => {
            const alpha = (index + 1) / this.maxTrailLength;
            ctx.fillStyle = `rgba(0, 255, 157, ${alpha * 0.5})`;
            ctx.fillRect(pos.x, pos.y, this.width, this.height);
        });
        ctx.restore();

        // Draw player
        ctx.fillStyle = this.invincible ? 'rgba(0, 255, 157, 0.5)' : this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw shield effect (gold glow) if shield is active
        const hasShield = this.activeEffects.some(effect => effect.type === 'shield');
        if (hasShield) {
            ctx.save();
            // Gold glowing circle
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, Math.max(this.width, this.height) * 0.7, 0, Math.PI * 2);
            ctx.strokeStyle = 'gold';
            ctx.lineWidth = 8;
            ctx.shadowColor = 'gold';
            ctx.shadowBlur = 24;
            ctx.stroke();
            // Semi-transparent gold overlay
            ctx.fillStyle = 'rgba(255, 215, 0, 0.18)';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, Math.max(this.width, this.height) * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw block effect
        if (this.isBlocking) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        // Draw dash effect
        if (this.isDashing) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(this.x - 10, this.y, this.width + 20, this.height);
        }

        // Draw attack box if attacking
        if (this.isAttacking) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(
                this.x + this.width / 2 - this.attackBox.width / 2,
                this.y - this.attackBox.height,
                this.attackBox.width,
                this.attackBox.height
            );
        }

        // Draw combo counter
        if (this.comboCount > 1) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '20px Arial';
            ctx.fillText(`${this.comboCount}x Combo!`, this.x, this.y - 20);
        }

        // Draw energy bar
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x, this.y - 10, this.width, 5);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(this.x, this.y - 10, (this.energy / this.maxEnergy) * this.width, 5);
    }

    attack() {
        const weapon = this.weapons[this.currentWeapon];
        
        if (this.weaponCooldown <= 0 && this.energy >= weapon.energyCost) {
            this.isAttacking = true;
            this.weaponCooldown = weapon.cooldown;
            this.energy -= weapon.energyCost;
            
            // Combo system
            this.comboCount++;
            this.comboTimer = this.comboTimeout;
            
            // Damage multiplier based on combo
            const damageMultiplier = 1 + (this.comboCount - 1) * 0.1;
            const damage = Math.floor(weapon.damage * damageMultiplier);
            
            setTimeout(() => {
                this.isAttacking = false;
            }, 200);

            // Check for boss hit
            const attackBox = {
                x: this.x + this.width / 2 - this.attackBox.width / 2,
                y: this.y - this.attackBox.height,
                width: this.attackBox.width,
                height: this.attackBox.height
            };

            if (this.checkCollision(attackBox, this.game.boss)) {
                const actualDamage = Math.max(1, damage); // Always at least 1 damage
                this.game.boss.takeDamage(actualDamage);
                this.game.score += actualDamage;
                this.game.updateScore();

            }
        }
    }

    specialAttack() {
        if (this.specialCooldown <= 0 && this.energy >= 50) {
            this.specialCooldown = 120;
            this.energy -= 50;

            const boss = this.game.boss;
            // If boss is on the same vertical level (within 30px)
            if (Math.abs((this.y + this.height / 2) - (boss.y + boss.height / 2)) < 30) {
                // Fire a large projectile toward the boss horizontally
                const direction = boss.x > this.x ? 1 : -1;
                this.game.projectiles.push(new Projectile(
                    this.x + (direction === 1 ? this.width : -20),
                    this.y + this.height / 2 - 10,
                    12 * direction,
                    0,
                    '#ff00ff',
                    40,
                    'special'
                ));
            } else {
                // Default: 3 projectiles (up, up-left, up-right)
                this.game.projectiles.push(new Projectile(
                    this.x + this.width / 2,
                    this.y,
                    0,
                    -10,
                    '#ff00ff',
                    20,
                    'special'
                ));
                this.game.projectiles.push(new Projectile(
                    this.x + this.width / 2,
                    this.y,
                    -5,
                    -8,
                    '#ff00ff',
                    20,
                    'special'
                ));
                this.game.projectiles.push(new Projectile(
                    this.x + this.width / 2,
                    this.y,
                    5,
                    -8,
                    '#ff00ff',
                    20,
                    'special'
                ));
            }
        }
    }

    dash() {
        this.isDashing = true;
        this.dashDuration = 10;
        this.dashCooldown = 60;
        this.invincible = true;
        this.invincibleTimer = this.invincibleDuration;
        // Determine dash direction
        if (this.game.keys.includes('ArrowLeft') || this.game.keys.includes('a')) {
            this.velocityX = -this.dashSpeed;
        } else if (this.game.keys.includes('ArrowRight') || this.game.keys.includes('d')) {
            this.velocityX = this.dashSpeed;
        } else {
            // Default dash direction based on boss position
            this.velocityX = this.game.boss.x > this.x ? -this.dashSpeed : this.dashSpeed;
        }
    }

    takeDamage(amount, source = null) {
        if (this.invincible) return;
        // If shield is active, reduce damage by shield value (e.g., 50%)
        const shieldEffect = this.activeEffects.find(effect => effect.type === 'shield');
        if (shieldEffect) {
            amount = Math.floor(amount * (1 - shieldEffect.value));
        }
        
        if (this.isBlocking) {
            // Block reduces damage by 75%
            amount = Math.floor(amount * 0.25);
        }
        
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        this.updateHealthBar();

        if (this.health === 0) {
            this.die();
            return;
        }
        
        // Reset combo on taking damage
        this.comboCount = 0;
        
        // Knockback if hit by boss melee
        if (source === 'bossMelee') {
            // Push player away from boss
            const boss = this.game.boss;
            if (this.x < boss.x) {
                this.x -= 30; // Knockback left
            } else {
                this.x += 30; // Knockback right
            }
        }

        // Brief invincibility after taking damage
        this.invincible = true;
        this.invincibleTimer = this.invincibleDuration;
    }

    updateHealthBar() {
        const healthBar = document.querySelector('.health-fill');
        healthBar.style.width = `${(this.health / this.maxHealth) * 100}%`;
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
}

class Projectile {
    constructor(x, y, velocityX, velocityY, color, damage, type = 'normal') {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.color = color;
        this.damage = damage;
        this.type = type;
        this.width = type === 'special' ? 20 : 10;
        this.height = type === 'special' ? 20 : 10;
        this.lifetime = type === 'special' ? 120 : 60; // frames
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.lifetime--;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        // If slowed, add a purple glow or outline
        if (this.slowed) {
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#4B0082';
        }
        if (this.type === 'special') {
            // Draw special projectile with glow effect
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    }
} 