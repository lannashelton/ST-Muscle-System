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
            currentStamina: 0,
            workoutWeight: 10, // Default weight (kg)
            injured: false,
            injuryDuration: 0
        };

        // Level definitions
        this.levelExpRequirements = {
            muscle: {
                1: 50,     2: 120,     3: 250,     4: 450,   5: 800,
                6: 1500,   7: 2500,    8: 4000,    9: 6500,  10: 10000,
                11: 15000, 12: 22000,  13: 32000,  14: 45000, 15: 60000
            },
            stamina: {
                1: 30,     2: 70,      3: 150,     4: 300,   5: 600,
                6: 1200,   7: 2500,    8: 5000,    9: 10000, 10: 20000
            }
        };

        this.maxLiftValues = {
            1: 10,  2: 15,  3: 20,  4: 25,  5: 30,
            6: 40,  7: 45,  8: 55,  9: 65,  10: 75,
            11: 85, 12: 100, 13: 120, 14: 140, 15: 160
        };

        this.maxStaminaValues = {
            1: 100, 2: 130, 3: 170, 4: 210, 5: 260,
            6: 320, 7: 390, 8: 470, 9: 560, 10: 660
        };
    }

    // ===== Core Functions =====
    setCharacter(character) {
        if (!character || character.name === this.character?.name) return;
        this.character = character;
        this.loadState();
    }

    getVarName(variable) {
        if (!this.character) return null;
        return `${this.character.name.replace(/\s+/g, '_')}_${variable}`;
    }

    getGlobalVariable(name, asString = false) {
        const varName = this.getVarName(name);
        if (!varName) return asString ? '' : 0;
        
        const value = window[varName] || 
                     extension_settings.variables?.global?.[varName] ||
                     (asString ? '' : 0);
        
        return asString ? String(value) : parseFloat(value) || 0;
    }
    
    setGlobalVariable(name, value) {
        const varName = this.getVarName(name);
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
        if (this.state.currentStamina === 0) {
            this.state.currentStamina = this.getMaxStamina();
        }
        this.saveState();
        return `${this.character.name}'s bodybuilding system activated`;
    }

    disableSystem() {
        this.state.enabled = false;
        this.saveState();
        return `${this.character.name}'s bodybuilding system deactivated`;
    }

    loadState() {
        if (!this.character) return;
        
        this.state.enabled = Boolean(this.getGlobalVariable('bodybuilding_enabled'));
        this.state.activity = this.getGlobalVariable('activity', true) || 'resting';
        this.state.muscleLevel = parseInt(this.getGlobalVariable('muscle_level')) || 1;
        this.state.muscleExp = parseInt(this.getGlobalVariable('muscle_exp')) || 0;
        this.state.staminaLevel = parseInt(this.getGlobalVariable('stamina_level')) || 1;
        this.state.staminaExp = parseFloat(this.getGlobalVariable('stamina_exp')) || 0;
        this.state.currentStamina = parseFloat(this.getGlobalVariable('current_stamina')) || 0;
        this.state.workoutWeight = parseInt(this.getGlobalVariable('workout_weight')) || 10;
        this.state.injured = Boolean(this.getGlobalVariable('injured'));
        this.state.injuryDuration = parseInt(this.getGlobalVariable('injury_duration')) || 0;
        
        // Initialize current stamina if empty
        if (this.state.currentStamina === 0 && this.state.enabled) {
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
        this.setGlobalVariable('stamina_exp', Math.floor(this.state.staminaExp * 10) / 10);
        this.setGlobalVariable('current_stamina', Math.floor(this.state.currentStamina * 10) / 10);
        this.setGlobalVariable('workout_weight', this.state.workoutWeight);
        this.setGlobalVariable('injured', this.state.injured ? 1 : 0);
        this.setGlobalVariable('injury_duration', this.state.injuryDuration);
        
        console.log('[BodybuildingManager] State saved');
    }
    
    // ===== Stats Calculation =====
    getMaxLift() {
        return this.maxLiftValues[this.state.muscleLevel] || 10;
    }
    
    getMaxStamina() {
        return this.maxStaminaValues[this.state.staminaLevel] || 100;
    }
    
    getRequiredExp(type = 'muscle') {
        const expMap = this.levelExpRequirements[type] || {};
        return expMap[this.state[type + 'Level']] || 100;
    }

    getProgress() {
        return {
            staminaPercent: (this.state.currentStamina / this.getMaxStamina()) * 100,
            muscleExpPercent: (this.state.muscleExp / this.getRequiredExp('muscle')) * 100,
            staminaExpPercent: (this.state.staminaExp / this.getRequiredExp('stamina')) * 100,
            nextMuscleLevelExp: this.getRequiredExp('muscle'),
            nextStaminaLevelExp: this.getRequiredExp('stamina'),
            maxLift: this.getMaxLift(),
            maxStamina: this.getMaxStamina()
        };
    }

    // ===== Core Activity Processing =====
    processActivity() {
        if (!this.character || !this.state.enabled || this.state.injured) {
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
        const staminaRecovery = maxStamina * 0.10; // 10% recovery
        this.state.currentStamina = Math.min(maxStamina, this.state.currentStamina + staminaRecovery);
        
        this.saveState();
        if (this.state.currentStamina >= maxStamina * 0.9) {
            return `${this.character.name} feels fully rested`;
        }
        return null;
    }
    
    processCardio() {
        // Cardio cost
        const cardioCost = 15;
        
        if (this.state.currentStamina < cardioCost) {
            this.state.currentStamina = 0;
            return `${this.character.name} is too exhausted for cardio`;
        }
        
        this.state.currentStamina -= cardioCost;
        this.addStaminaExp(0.5);
        this.saveState();
        
        return `${this.character.name} did some cardio`;
    }
    
    processTraining() {
        const weight = this.state.workoutWeight;
        const maxLift = this.getMaxLift();
        
        // Validate workout weight
        if (weight > maxLift) {
            return `${this.character.name} can't lift ${weight}kg (max: ${maxLift}kg)`;
        }
        
        // Calculate stamina cost (weight/max ratio based)
        const weightRatio = weight / maxLift;
        const baseCost = 20;
        const weightFactor = weightRatio * 40; // Scales with weight
        const staminaCost = baseCost + weightFactor;
        
        // Check if enough stamina
        if (this.state.currentStamina < staminaCost) {
            this.state.currentStamina = 0;
            return `${this.character.name} is too exhausted to train`;
        }
        
        // Apply stamina cost
        this.state.currentStamina -= staminaCost;
        
        // Calculate exp gain (0-20 range based on weight)
        const baseExp = 10;
        const weightBonus = weightRatio * 10;
        let expGain = baseExp + weightBonus;
        
        // Injury risk at >=90% max weight
        if (weightRatio >= 0.9 && extension_settings.bodybuilding_system?.riskOfInjury) {
            expGain *= 1.5; // High weight bonus
            if (Math.random() > 0.9) { // 10% injury chance
                this.state.injured = true;
                this.state.injuryDuration = 3;
                return `${this.character.name} strained a muscle lifting ${weight}kg!`;
            }
        }
        
        // EXP modifiers
        if (weightRatio < 0.3) expGain *= 0.7; // Low weight penalty
        if (weightRatio > 0.95) expGain *= 1.2; // High weight bonus
        
        this.addMuscleExp(expGain);
        this.saveState();
        return `${this.character.name} lifted ${weight}kg`;
    }
    
    processInjury() {
        this.state.injuryDuration--;
        if (this.state.injuryDuration <= 0) {
            this.state.injured = false;
            return `${this.character.name}'s injury has healed`;
        }
        return `${this.character.name} is recovering (${this.state.injuryDuration} days left)`;
    }

    // ===== Level Management =====
    addMuscleExp(amount) {
        this.state.muscleExp += amount;
        
        // Level up
        while (this.state.muscleExp >= this.getRequiredExp('muscle') && 
               this.state.muscleLevel < 15) {
            this.state.muscleExp -= this.getRequiredExp('muscle');
            this.state.muscleLevel++;
        }
    }
    
    addStaminaExp(amount) {
        this.state.staminaExp += amount;
        
        // Level up
        while (this.state.staminaExp >= this.getRequiredExp('stamina') && 
               this.state.staminaLevel < 10) {
            this.state.staminaExp -= this.getRequiredExp('stamina');
            this.state.staminaLevel++;
            
            // Increase stamina cap when leveling
            this.state.currentStamina = this.getMaxStamina();
        }
    }
    
    // ===== Weight Management =====
    setWorkoutWeight(weight) {
        if (weight < 0) return "Weight can't be negative";
        
        const maxLift = this.getMaxLift();
        if (weight > maxLift) {
            this.state.workoutWeight = maxLift;
            return `${this.character.name}'s max is ${maxLift}kg. Weight set to max.`;
        }
        
        this.state.workoutWeight = weight;
        this.saveState();
        return `Workout weight set to ${weight}kg`;
    }
    
    // ===== UI Actions =====
    setActivity(activity) {
        if (!this.activities.includes(activity)) return "Invalid activity";
        this.state.activity = activity;
        this.saveState();
        return `${this.character.name} started ${activity}`;
    }
}
