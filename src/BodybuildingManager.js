import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";

export class BodybuildingManager {
    constructor() {
        this.activities = ['idle', 'resting', 'cardio', 'training'];
        this.character = null;
        this.state = {
            activity: 'idle',
            muscleLevel: 1,
            muscleExp: 0,
            staminaLevel: 1,
            staminaExp: 0,
            currentStamina: 100,
            workoutWeight: 10,
            injured: false,
            injuryDuration: 0
        };
    }

    setCharacter(character) {
        if (!character || character.name === this.character?.name) return;
        this.character = character;
        this.loadState();
    }

    getVarName(key) {
        if (!this.character) return null;
        return `bodybuilding_${this.character.name.replace(/\s+/g, '_')}_${key}`;
    }

    getGlobalVariable(key, asString = false) {
        const varName = this.getVarName(key);
        if (!varName) return asString ? '' : 0;
        
        // Simplified storage check
        if (extension_settings.variables?.global?.[varName] !== undefined) {
            return asString ? 
                String(extension_settings.variables.global[varName]) : 
                parseFloat(extension_settings.variables.global[varName]);
        }
        
        return asString ? '' : 0;
    }
    
    setGlobalVariable(key, value) {
        const varName = this.getVarName(key);
        if (!varName) return;
        
        // Initialize if needed
        if (!extension_settings.variables) {
            extension_settings.variables = { global: {} };
        }
        
        extension_settings.variables.global[varName] = value;
        saveSettingsDebounced();
    }

    loadState() {
        if (!this.character) return;
        
        this.state.activity = this.getGlobalVariable('activity', true) || 'idle';
        this.state.muscleLevel = parseInt(this.getGlobalVariable('muscle_level')) || 1;
        this.state.muscleExp = parseFloat(this.getGlobalVariable('muscle_exp')) || 0;
        this.state.staminaLevel = parseInt(this.getGlobalVariable('stamina_level')) || 1;
        this.state.staminaExp = parseFloat(this.getGlobalVariable('stamina_exp')) || 0;
        this.state.currentStamina = parseFloat(this.getGlobalVariable('current_stamina')) || this.getMaxStamina();
        this.state.workoutWeight = parseFloat(this.getGlobalVariable('workout_weight')) || 10;
        this.state.injured = Boolean(this.getGlobalVariable('injured'));
        this.state.injuryDuration = parseInt(this.getGlobalVariable('injury_duration')) || 0;
        
        // Ensure stamina is within bounds
        if (this.state.currentStamina < 0) this.state.currentStamina = 0;
        const maxStamina = this.getMaxStamina();
        if (this.state.currentStamina > maxStamina) {
            this.state.currentStamina = maxStamina;
        }
    }
    
    saveState() {
        if (!this.character) return;
        
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
        // Calculate based on muscle level (exponential scaling)
        return 10 * Math.pow(1.25, this.state.muscleLevel - 1);
    }
    
    getMaxStamina() {
        // Calculate based on stamina level
        return 100 * Math.pow(1.2, this.state.staminaLevel - 1);
    }
    
    getRequiredExp(type) {
        // Base requirement * level^2 for exponential difficulty
        const base = type === 'muscle' ? 100 : 80;
        return base * Math.pow(this.state[type + 'Level'], 2);
    }

    getProgress() {
        const maxStamina = this.getMaxStamina();
        const staminaPercent = (this.state.currentStamina / maxStamina) * 100;
        const muscleMax = this.getRequiredExp('muscle');
        const muscleExpPercent = (this.state.muscleExp / muscleMax) * 100;
        const staminaMax = this.getRequiredExp('stamina');
        const staminaExpPercent = (this.state.staminaExp / staminaMax) * 100;
        
        return {
            staminaPercent,
            muscleExpPercent,
            staminaExpPercent,
            staminaMax,
            muscleMax
        };
    }
    
    // Core logic for processing character activities
    processActivity() {
        if (!this.character) return null;
        
        if (this.state.injured) {
            return this.processInjury();
        }

        switch(this.state.activity) {
            case 'idle':
                return `${this.character.name} is inactive`;
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
        const cost = 20;
        if (this.state.currentStamina < cost) {
            this.state.currentStamina = 0;
            this.saveState();
            return `${this.character.name} is too exhausted for cardio!`;
        }
        
        this.state.currentStamina = Math.max(0, this.state.currentStamina - cost);
        this.addStaminaExp(0.8);  // Gain stamina EXP
        
        this.saveState();
        return `${this.character.name} performed cardio and gained stamina experience`;
    }
    
    processTraining() {
        const maxLift = this.getMaxLift();
        const weight = this.state.workoutWeight;
        
        // Can't lift more than max capacity
        if (weight > maxLift) {
            return `${this.character.name} can't lift ${weight.toFixed(1)}kg (max: ${maxLift.toFixed(1)}kg)`;
        }
        
        // Calculate cost based on weight intensity (20-50 stamina)
        const intensity = weight / maxLift;
        const baseCost = 20;
        const staminaCost = baseCost + (intensity * 30);
        
        if (this.state.currentStamina < staminaCost) {
            this.state.currentStamina = 0;
            this.saveState();
            return `${this.character.name} is too exhausted to train!`;
        }
        
        this.state.currentStamina = Math.max(0, this.state.currentStamina - staminaCost);
        
        // Gain muscle exp based on intensity (+ random variation)
        const exp = 10 + (weight * intensity) + (Math.random() * 5);
        this.addMuscleExp(exp);
        
        // Injury chance at high intensities
        if (intensity > 0.85 && extension_settings.bodybuilding_system?.riskOfInjury) {
            if (Math.random() < 0.15) {
                this.state.injured = true;
                this.state.injuryDuration = 2 + Math.floor(Math.random() * 3); // 2-4 days
                this.saveState();
                return `${this.character.name} was injured while lifting ${weight}kg!`;
            }
        }
        
        this.saveState();
        return `${this.character.name} lifted ${weight}kg and gained muscle experience`;
    }
    
    processInjury() {
        this.state.injuryDuration--;
        
        if (this.state.injuryDuration <= 0) {
            this.state.injured = false;
            this.state.injuryDuration = 0;
            this.saveState();
            return `${this.character.name} has recovered from their injury`;
        }
        
        this.saveState();
        return `${this.character.name} needs ${this.state.injuryDuration} more days to recover`;
    }
    
    addMuscleExp(amount) {
        this.state.muscleExp += amount;
        const required = this.getRequiredExp('muscle');
        
        // Level up muscle
        while (this.state.muscleExp >= required) {
            this.state.muscleLevel++;
            this.state.muscleExp -= required;
        }
    }
    
    addStaminaExp(amount) {
        this.state.staminaExp += amount;
        const required = this.getRequiredExp('stamina');
        
        // Level up stamina
        while (this.state.staminaExp >= required) {
            this.state.staminaLevel++;
            this.state.staminaExp -= required;
            // Refill stamina on level up
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
        if (weight > max) return `Maximum lift is ${max.toFixed(1)}kg`;
        
        this.state.workoutWeight = weight;
        this.saveState();
        return `Workout weight set to ${weight}kg`;
    }
}
