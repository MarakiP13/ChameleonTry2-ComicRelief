# Comic Relief NPC: Chaos Effects Testing Guide

This document provides detailed suggestions for testing and verifying the Comic Relief NPC's chaos effects, including debugging tips and recommended scenarios.

## Quick Testing Setup
- **Rapid Effect Cycling:**
  - In `npc.js`, set `this.chaosTimerMax = 60;` in the Comic Relief constructor for effects to trigger every second (at 60 FPS).
  - For normal gameplay, restore to `this.chaosTimerMax = 1800;` (30 seconds).

## Debug Logging
- All major chaos effect events are logged to the console:
  - When the Comic Relief NPC is constructed.
  - On every update: current `chaosTimer`, `chaosTimerMax`, and `currentEffect`.
  - When a chaos effect is triggered (`triggerComicEffect`).
  - When a chaos effect is applied (`applyChaosEffect`).
  - Special logs for the banana peel effect and its impact on the boss.

## Suggested Test Scenarios
1. **Effect Triggering:**
   - Confirm that effects trigger at the expected interval (every 60 frames in testing mode).
   - Observe `[ComicRelief DEBUG] triggerComicEffect: currentEffect set:` in the console.
2. **Banana Peel Effect:**
   - Ensure `[ComicRelief DEBUG] applyChaosEffect: Boss slipped on banana peel!` appears and boss is affected.
   - Boss `attackCooldown` should reset, and boss should be unable to attack for the duration.
3. **Other Effects:**
   - Confirm that other chaos effects (e.g., laughTrack, colorShift) trigger and apply as described in their debug messages.
4. **Effect Cycling:**
   - Let the game run and confirm multiple different effects are triggered in sequence.
5. **Return to Normal Mode:**
   - Set `chaosTimerMax` back to 1800 and verify effects now trigger less frequently.

## Troubleshooting
- If effects do not trigger:
  - Ensure `abilitiesUnlocked` is `true` for Comic Relief.
  - Check for syntax errors in `npc.js` (see browser console for errors).
  - Confirm that the Comic Relief NPC is present and active in the game.
- If boss is not affected by banana peel:
  - Make sure the boss object exists and supports `attackCooldown`.
  - Review logs for any skipped or failed effect application.

## Debug Log Examples
```
[ComicRelief DEBUG] update: chaosTimer: 10 chaosTimerMax: 60 currentEffect: Object
[ComicRelief DEBUG] applyChaosEffect: applying effect bananaPeel duration left: 68
[ComicRelief DEBUG] applyChaosEffect: Boss slipped on banana peel! attackCooldown set to 120
```

## Additional Suggestions
- Try running a boss encounter with Comic Relief present and observe the chaos.
- Test with multiple players/NPCs if supported.
- For production, remove or reduce debug logging for performance.

---

For further help, see the main README or contact the project maintainer.
