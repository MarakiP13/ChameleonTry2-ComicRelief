# Chameleon Overlord

A client-side only boss battle game featuring an AI that learns and evolves with each encounter. The boss adapts to your playstyle, creating a unique and challenging experience every time you play.

## Features

- Dynamic boss AI that learns from player actions
- **Boss Phase System:** Boss changes behavior and attacks at 3 health thresholds (phases 1, 2, 3), with visual cues for transitions
- **NPC Allies:** Select up to two NPCs per game, each with unique abilities
- **Phase-Based NPC Unlocks:** NPC abilities unlock based on boss phase or other game conditions, with on-screen text cues when unlocked
- Multiple attack patterns that evolve as the battle progresses
- Player abilities including movement, jumping, attacking, and special moves
- Achievement-based scoring system with rewards for milestones
- No server required - runs entirely in the browser
- Visual cues for boss phases, NPC ability unlocks, and achievements
- Extensible system for adding new NPCs and phases
- Modern UI and responsive controls

---

## Recent Improvements

- **Boss Phase System:** Boss now transitions through 3 phases with different attack patterns and speeds, including phase transition overlays.
- **NPC Ability Unlocks:** Each NPC unlocks their special ability based on boss phase or game stats (see below).
- **Text Cues:** When an NPC unlocks their ability, a message appears at the top of the screen.
- **Extensible NPC System:** Easily add new NPCs or change unlock conditions in code.
- **Bug Fixes:** Improved phase logic, fixed unlock logic, and improved error handling.

---

## How to Play

### Controls

- **Movement**: Arrow keys or WASD
- **Jump**: Up arrow, W, or Spacebar
- **Attack**: Left mouse button
- **Special Attack**: Right mouse button
- **Block**: Shift key
- **Dash**: Ctrl or Q key
- **Switch Weapons**: 1, 2, 3 keys
  - 1: Sword (melee, low energy cost)
  - 2: Energy Blast (ranged, high energy cost)
  - 3: Shield (defensive, medium energy cost)

### Game Mechanics

#### Scoring System

The game features an achievement-based scoring system that rewards various milestones:

| Achievement | Condition | Points |
|------------|-----------|--------|
| Perfect Striker | Land 10 consecutive hits | 50 |
| Energy Master | Collect 100 energy orbs | 75 |
| Minion Slayer | Defeat 20 minions | 100 |
| Survivor | Survive for 5 minutes | 150 |
| Combo Master | Reach 15x combo | 100 |
| Perfect Guard | Block 10 attacks | 75 |
| Phase Master | Reach boss phase 3 | 200 |
| Determined Spirit | Die 10 times | 50 |

- Achievements are tracked automatically during gameplay
- Points are awarded instantly when conditions are met
- Achievement notifications appear at the top of the screen
- Score persists until starting a new game

#### Player Abilities

- **Basic Movement**: Use arrow keys or WASD to move around the arena
- **Jumping**: Press Up, W, or Spacebar to jump (can only jump when on the ground)
- **Attacking**: Click the left mouse button to perform a basic attack
- **Special Attack**: Right-click to perform a special attack (energy blast)
- **Blocking**: Hold Shift to block incoming damage (reduces damage by 75%)
- **Dashing**: Press Ctrl or Q to perform a quick dash (grants temporary invincibility)
- **Weapon Switching**: Press 1, 2, or 3 to switch between different weapons
- **Combo System**: Consecutive hits increase your damage multiplier

#### Boss Mechanics

- **Adaptive AI**: The boss learns from your actions and adjusts its strategy
- **Multiple Phases**: The boss becomes more aggressive as its health decreases
- **Attack Patterns**: The boss uses various attack patterns that you must learn to counter
- **Rage Mode**: When the boss's health drops below 30%, it enters a more aggressive state
- **Defense Mode**: The boss can activate a shield to reduce incoming damage

#### Energy System

- Your energy regenerates over time
- Different abilities consume different amounts of energy
- Manage your energy wisely to maintain offensive and defensive capabilities

---

## NPC Allies & Abilities

You can select up to two NPC allies per game. Each NPC has a unique ability, which is unlocked by reaching a certain boss phase or meeting a specific condition. When an ability is unlocked, a text cue appears at the top of the screen.

### NPC Unlock Conditions & Abilities

| NPC           | Unlock Condition                                | Ability Description                                  |
|---------------|-------------------------------------------------|------------------------------------------------------|
| Guardian      | Boss Phase 1+                                   | Grants shield when player < 50% health (cooldown)    |
| Tactician     | Boss Phase 3                                    | Analyzes boss, reduces boss attack cooldown          |
| Bard          | Maintain max energy for 1 minute                | Restores energy, can boost damage                    |
| Diplomat      | Survive 5 minutes                               | Distracts boss, makes it skip turns                  |
| ComicRelief   | Die to boss 10 times                            | Uses comedy abilities to heal, stun, and damage boss |
| Summoner      | Defeat 20 minions                               | Empowers minions to increase their damage            |
| Elementalist  | Collect 100 energy orbs                         | Casts random elemental attacks at the boss           |
| Mystic        | Reach combo of 15                               | Randomly buffs player or debuffs boss                |
| Vanguard      | Block 10 attacks                                | Grants temporary invincibility (cooldown)            |
| Scout         | Defeat 5 minions                                | Tracks enemy projectiles, increases move speed       |
| Berserker     | Land 10 consecutive hits                        | Boosts damage (rage)                                |
| Medic         | Survive 3 minutes                               | Heals player when health < 70% (cooldown)            |
| Timekeeper    | Defeat boss in under 5 minutes                  | Slows down boss projectiles for a short time         |

- NPCs activate their abilities automatically when unlocked and off cooldown.
- Text cues will notify you when an ability is unlocked for the first time in a run.
- Each NPC can only be selected once per game.

---

### Tips for Combining NPCs

- **Stack Defensive & Healing**: Guardian + Medic + Vanguard can make you nearly unkillable during tough phases.
- **Synergize Offense**: Berserker, Bard, and Elementalist can boost your damage output—time your attacks when their effects are active.
- **Control the Boss**: Diplomat and Timekeeper can give you breathing room by stopping or slowing the boss. Combine with Tactician to reduce boss aggression.
- **Adapt to the Situation**: NPCs spawn in staggered positions and activate automatically. Watch for visual cues and plan your moves to maximize their effects.
- **Comic Relief**: Don’t underestimate the ComicRelief—its effects can disrupt the boss or give you a quick heal at just the right moment!

### Strategy

- Pay attention to which NPCs are currently active and their cooldowns.
- Move near the NPCs that provide direct support (like Medic or Guardian) if you need their help.
- Use the speed boost from Scout to dodge attacks or reposition quickly.
- Let the Diplomat take the heat off you if the boss is overwhelming.
- Try different combinations each game for new strategies and emergent gameplay!

---

## Tips to Win

### General Strategy

1. **Stay Mobile**: Constant movement makes you harder to hit
2. **Watch the Boss**: Pay attention to visual cues that indicate what attack is coming next
3. **Manage Your Energy**: Don't exhaust your energy with too many special attacks
4. **Learn the Patterns**: Each boss phase introduces new attack patterns - learn to recognize them
5. **Use the Environment**: The arena has boundaries - use them to your advantage

### Countering Specific Attacks

- **Basic Attack**: Dodge by moving away or jumping
- **Rush Attack**: Jump or dash to avoid the charge
- **Projectile Attack**: Move perpendicular to the projectile's path
- **Teleport Attack**: Be ready to change direction quickly when the boss teleports
- **Shield Attack**: Focus on dodging until the shield expires
- **Summon Attack**: Prioritize eliminating minions before they overwhelm you
- **Laser Attack**: Move to the side of the laser beam
- **Counter Attack**: Vary your attack patterns to prevent the boss from predicting your moves

### Advanced Techniques

1. **Combo Mastery**: Build and maintain combos for increased damage
2. **Energy Management**: Keep enough energy for defensive moves when needed
3. **Weapon Switching**: Change weapons based on the boss's current state
4. **Dash Timing**: Use dashes to avoid attacks and reposition quickly
5. **Block Timing**: Block only when necessary to conserve energy

### Phase-Specific Strategies

- **Phase 1**: Focus on learning the boss's basic patterns
- **Phase 2**: The boss becomes more aggressive - prioritize defense
- **Phase 3**: The boss introduces new attacks - stay alert and adapt quickly
- **Phase 4**: The final phase is the most challenging - use all your abilities strategically

### Adapting to the Boss's Learning

- **Vary Your Approach**: The boss learns from your actions, so don't rely on the same strategy
- **Mix Up Your Attacks**: Alternate between melee and ranged attacks
- **Change Your Position**: Don't stay in one area for too long
- **Surprise Elements**: Use unexpected combinations of abilities to catch the boss off guard

## Technical Details

- Built with HTML5 Canvas, CSS, and vanilla JavaScript
- No external dependencies or frameworks required
- Runs entirely in the browser
- Saves high scores using local storage

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development

To modify the game:

1. Clone the repository
2. Edit the JavaScript files to modify game logic
3. Edit the CSS file to change the visual style
4. Open index.html in a browser to test your changes

## Credits

Created by [Your Name] as a demonstration of client-side game development with adaptive AI. 