# CoinBattle Saki — Next Experiments

## Priority: High

### EXP-001: Strategy Win Rate Balance
- Run 1000 simulated battles per matchup
- Log win rates for each strategy pairing
- Adjust parameters until no strategy wins >60%
- Deliverable: balanced parameter JSON

### EXP-002: Visual Impact Assessment
- Measure character viewport coverage at different camera distances
- Ensure >40% rule is met on mobile and desktop
- Test particle visibility at different screen sizes

### EXP-003: Stage Escalation Pacing
- Test different volatility->stage mapping functions
- Linear vs logarithmic vs custom curve
- Measure time-in-stage distribution across 100 battles

## Priority: Medium

### EXP-004: Audio Integration
- Port Web Audio synth from vanilla prototype
- Implement stage-specific audio profiles
- Test with positional audio in Three.js

### EXP-005: Character Shader Effects
- Custom shaders for hero glow effects
- Post-processing bloom for high stages
- Shield/aura visual when position is profitable

## Priority: Low

### EXP-006: AI Personality Expression
- Make camera behavior respond to character personality
- Aggressive characters: closer camera, faster cuts
- Patient characters: wider shots, slower movement

### EXP-007: Multi-character Tournament
- Round-robin tournament system
- Bracket visualization
- Persistent power levels across battles
