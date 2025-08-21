import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";

export class BodybuildingManager {
    constructor() {
        this.activities = ['resting', 'cardio', 'training'];
        this.character = null;
        this.state = {
            enabled: false,
            activity: 'resting',
            muscleLevel: 1,
            muscleExp: 0,
            staminaLevel: 1,
            staminaExp: 0,
            currentStamina: 100, // Start with full stamina
            workoutWeight: 10,
            injured: false,
            injuryDuration: 0
        };

        // Level definitions
        this.levelExpRequirements = {
            muscle: {
                1: 50, 2: 120, 3: 250, 4: 450, 5: 800,
                6: 1500, 7: 2500, 8: 4000, 9: 6500, 10: 10000
            },
            stamina: {
                1: 30, 2: 70, 3: 150, 4: 300, 5: 600,
                6: 1200, 7: 2500, 8: 5000, 9: 10000, 10: 20000
            }
        };

        this.maxLiftValues = {
            1: 10, 2: 15, 3: 20, 4: 25, 5: 30,
            6: 40, 7: 45, 8: 55, 9: 65, 10: 75
        };

        this.maxStaminaValues = {
            1: 100, 2: 130, 3: 170, 4: 210, 5: 260,
            6: 320, 7: 390, 8: 470, 9: 560, 10: 660
        };
        
        // Transition multipliers for level changes
        this.addStaminaExp = this.addStaminaExp.bind(this);
        this.addMuscleExp = this.addMuscleExp.bind(this);
    }

    setCharacter(character) {
        if (!character || character.name === this.character?.name) return;
        this.character = character;
        this.loadState();
    }

    getVarName(key) {
        if (!this.character) return null;
        return `${this.character.name.replace(/\s+/g, '_')}_${key}`;
    }

    getGlobalVariable(key, asString = false) {
        const varName = this.getVarName(key);
        if (!varName) return asString ? '' : 0;
        
        const value = window[varName] || 
                     extension_settings.variables?.global?.[varName] ||
                     (asString ? '' : 0);
        
        return asString ? String(value) : parseFloat(value) || 0;
    }
    
    setGlobalVariable(key, value) {
        const varName = this.getVarName(key);
        if (!varName) return;
        
        window[varName] = value;
        if (!extension_settings.variables) {
            extension_settings.variables = { global: {} };
        }
        extension_settings.variables.global[varName] = value;
        saveSettingsDebounced();
    }

    enableSystem() {
        this.state.enabled = true;
        if (this.state.currentStamina <= 0) {
            this.state.currentStamina = this.getMaxStamina();
        }
        this.saveState();
        return `Bodybuilding system activated for ${this.character.name}`;
    }

    disableSystem() {
        this.state.enabled = false;
        this.saveState();
        return `Bodybuilding system disabled for ${this.character.name}`;
    }

    loadState() {
        if (!this.character) return;
        
        this.state.enabled = Boolean(this.getGlobalVariable('bodybuilding_enabled'));
        this.state.activity = this.getGlobalVariable('activity', true) || 'resting';
        this.state.muscleLevel = parseInt(this.getGlobalVariable('muscle_level')) || 1;
        this.state.muscleExp = parseFloat(this.getGlobalVariable('muscle_exp')) || 0;
        this.state.staminaLevel = parseInt(this.getGlobalVariable('stamina_level')) || 1;
        this.state.staminaExp = parseFloat(this.getGlobalVariable('stamina_exp')) || 0;
        this.state.currentStamina = parseFloat(this.getGlobalVariable('current_stamina')) || this.getMaxStamina();
        this.state.workoutWeight = parseInt(this.getGlobalVariable('workout_weight')) || 10;
        this.state.injured = Boolean(this.getGlobalVariable('injured'));
        this.state.injuryDuration = parseInt(this.getGlobalVariable('injury_duration')) || 0;
        
        // Make sure stamina is within bounds
        if (this.state.currentStamina < 0) this.state.currentStamina = 0;
        if (this.state.currentStamina > this.getMaxStamina()) {
            this.state.currentStamina = this.getMaxStamina();
        }
    }
    
    saveState() {
        if (!this.character) return;
        
        this.setGlobalVariable('bodybuilding_enabled', this.state.enabled ? 1 : 0);
        this.setGlobalVariable('activity', this.state.activity);
        this.setGlobalVariable('muscle_level', this.state.muscleLevel);
        this.setGlobalVariable('muscle_exp', this.state.muscleExp);
        this.setGlobalVariable('stamina_level', this.state.staminaLevel);
        this.setGlobalVariable('stamina_exp', this.state.staminaExp);
        this.setGlobalVariable('current_stamina', this.state.currentStamina);
        this.setGlobalVariable('workout_weight', this.state.workoutWeight);
        this.setGlobalVariable('injured', this.state.injured ? 1 : 0);
        this.setGlobalVariable('injury_duration', this.state.injuryDuration);
    }
    
    getMaxLift() {
        return this.maxLiftValues[this.state.muscleLevel] || 10;
    }
    
    getMaxStamina() {
        return this.maxStaminaValues[this.state.staminaLevel] || 100;
    }
    
    getRequiredExp(type) {
        const expMap = this.levelExpRequirements[type] || {};
        return expMap[this.state[type + 'Level']] || 100;
    }

    getProgress() {
        return {
            staminaPercent: (this.state.currentStamina / this.getMaxStamina()) * 100,
            muscleExpPercent: (this.state.muscleExp / this.getRequiredExp('muscle')) * 100,
            staminaMax: this.getMaxStamina(),
            muscleMax: this.getRequiredExp('muscle')
        };
    }
    
    // Core logic for processing character activities
    processActivity() {
        if (!this.state.enabled || !this.character || this.state.injured) {
            if (this.state.injured) {
                return this.processInjury();
            }
            return null;
        }

        switch(this.state.activity) {
            case 'resting':
                return this.processResting();
            case 'cardio':
                return this.processCardio();
            case 'training':
                return this.processTraining();
            default:
                return null;
        }
    }
    
    processResting() {
        const maxStamina = this.getMaxStamina();
        const recovery = maxStamina * 0.1; // 10% recovery
        
        this.state.currentStamina = Math.min(
            maxStamina,
            this.state.currentStamina + recovery
        );
        
        this.saveState();
        return `${this.character.name} rested and recovered ${recovery.toFixed(1)} stamina`;
    }
    
    processCardio() {
        const cost = 15;
        if (this.state.currentStamina < cost) {
            this.state.currentStamina = 0;
            return `${this.character.name} is too exhausted for cardio!`;
        }
        
        this.state.currentStamina -= cost;
        this.addStaminaExp(0.5);
        this.saveState();
        
        return `${this.character.name} performed cardio and gained stamina experience`;
    }
    
    processTraining() {
        const maxLift = this.getMaxLift();
        const weight = this.state.workoutWeight;
        
        if (weight > maxLift) {
            return `${this.character.name} can't lift ${weight}kg (max: ${maxLift}kg)`;
        }
        
        // Calculate stamina cost based on weight intensity
        const baseCost = 20;
        const intensity = weight / maxLift;
        const staminaCost = baseCost + (intensity * 30);
        
        if (this.state.currentStamina < staminaCost) {
            this.state.currentStamina = 0;
            return `${this.character.name} is too exhausted to train!`;
        }
        
        this.state.currentStamina -= staminaCost;
        let exp = 8 + (weight * 0.4);
        
        // Bonus for hard training with injury risk
        if (intensity > 0.85 && extension_settings.bodybuilding_system?.riskOfInjury) {
            exp *= 1.6;
            if (Math.random() < 0.15) { // 15% injury chance at high intensity
                this.state.injured = true;
                this.state.injuryDuration = 3;
                return `${this.character.name} was injured while lifting ${weight}kg!`;
            }
        }
        
        this.addMuscleExp(exp);
        this.saveState();
        
        return `${this.character.name} lifted ${weight}kg and gained muscle experience`;
    }
    
    processInjury() {
        this.state.injuryDuration--;
        if (this.state.injuryDuration <= 0) {
            this.state.injured = false;
            return `${this.character.name} has recovered from their injury`;
        }
        this.saveState();
        return `${this.character.name} needs ${this.state.injuryDuration} more days to recover`;
    }
    
    addMuscleExp(amount) {
        this.state.muscleExp += amount;
        
        // Check for level ups
        while (this.state.muscleExp >= this.getRequiredExp('muscle') && 
               this.state.muscleLevel < 10) {
            this.state.muscleExp -= this.getRequiredExp('muscle');
            this.state.muscleLevel++;
        }
    }
    
    addStaminaExp(amount) {
        this.state.staminaExp += amount;
        
        // Check for level ups
        while (this.state.staminaExp >= this.getRequiredExp('stamina') && 
               this.state.staminaLevel < 10) {
            this.state.staminaExp -= this.getRequiredExp('stamina');
            this.state.staminaLevel++;
            
            // When stamina levels up, refill stamina
            this.state.currentStamina = this.getMaxStamina();
        }
    }
    
    setActivity(activity) {
        if (!this.activities.includes(activity)) return "Invalid activity";
        this.state.activity = activity;
        this.saveState();
        return `Activity set to ${activity}`;
    }
    
    setWorkoutWeight(weight) {
        const max = this.getMaxLift();
        if (weight > max) return `Maximum lift is ${max}kg`;
        
        this.state.workoutWeight = weight;
        this.saveState();
        return `Workout weight set to ${weight}kg`;
    }
}
