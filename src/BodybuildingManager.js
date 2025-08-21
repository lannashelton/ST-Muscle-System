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
            workoutWeight: 10,
            injured: false,
            injuryDuration: 0
        };

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
    }

    setCharacter(character) {
        if (!character || character.name === this.character?.name) return;
        this.character = character;
        this.loadState();
    }

    getVarName(key) {
        return this.character ? `${this.character.name}_${key}`.replace(/\s+/g, '_') : null;
    }

    getGlobalVariable(key) {
        const varName = this.getVarName(key);
        return varName && window[varName] ? parseFloat(window[varName]) : 0;
    }

    setGlobalVariable(key, value) {
        const varName = this.getVarName(key);
        if (!varName) return;
        
        window[varName] = value;
        if (!extension_settings.variables) extension_settings.variables = { global: {} };
        
        extension_settings.variables.global[varName] = value;
        saveSettingsDebounced();
    }

    enableSystem() {
        this.state.enabled = true;
        if (this.state.currentStamina <= 0) {
            this.state.currentStamina = this.getMaxStamina();
        }
        this.saveState();
        return `Bodybuilding system activated`;
    }

    disableSystem() {
        this.state.enabled = false;
        this.saveState();
        return `Bodybuilding system disabled`;
    }

    loadState() {
        if (!this.character) return;

        this.state.enabled = !!this.getGlobalVariable('bodybuilding_enabled');
        this.state.muscleLevel = this.getGlobalVariable('muscle_level') || 1;
        this.state.muscleExp = this.getGlobalVariable('muscle_exp') || 0;
        this.state.staminaLevel = this.getGlobalVariable('stamina_level') || 1;
        this.state.staminaExp = this.getGlobalVariable('stamina_exp') || 0;
        this.state.currentStamina = this.getGlobalVariable('current_stamina') || 0;
        this.state.workoutWeight = this.getGlobalVariable('workout_weight') || 10;
        this.state.activity = 'resting';
        this.state.injured = false;
    }

    saveState() {
        if (!this.character) return;

        this.setGlobalVariable('bodybuilding_enabled', this.state.enabled ? 1 : 0);
        this.setGlobalVariable('muscle_level', this.state.muscleLevel);
        this.setGlobalVariable('muscle_exp', this.state.muscleExp);
        this.setGlobalVariable('stamina_level', this.state.staminaLevel);
        this.setGlobalVariable('stamina_exp', this.state.staminaExp);
        this.setGlobalVariable('current_stamina', this.state.currentStamina);
        this.setGlobalVariable('workout_weight', this.state.workoutWeight);
    }

    getMaxLift() {
        return this.maxLiftValues[this.state.muscleLevel] || 10;
    }

    getMaxStamina() {
        return this.maxStaminaValues[this.state.staminaLevel] || 100;
    }

    getRequiredExp(type) {
        return this.levelExpRequirements[type][this.state[type + 'Level']] || 100;
    }

    processActivity() {
        if (!this.state.enabled || this.state.injured) return null;

        switch(this.state.activity) {
            case 'resting': return this.processResting();
            case 'cardio': return this.processCardio();
            case 'training': return this.processTraining();
        }
        return null;
    }

    processResting() {
        const recovery = this.getMaxStamina() * 0.1;
        this.state.currentStamina = Math.min(
            this.getMaxStamina(),
            this.state.currentStamina + recovery
        );
        this.saveState();
        return null;
    }

    processCardio() {
        const cost = 15;
        if (this.state.currentStamina < cost) {
            this.state.currentStamina = 0;
            return "Too exhausted for cardio";
        }

        this.state.currentStamina -= cost;
        this.addStaminaExp(0.5);
        this.saveState();
        return `${this.character.name} did cardio`;
    }

    processTraining() {
        const max = this.getMaxLift();
        const weight = Math.min(this.state.workoutWeight, max);

        if (weight > max) {
            return `Can't lift ${weight}kg (max: ${max}kg)`;
        }

        const cost = 20 + (weight / max) * 40;
        if (this.state.currentStamina < cost) {
            this.state.currentStamina = 0;
            return "Too exhausted to train";
        }

        this.state.currentStamina -= cost;
        const exp = 10 + (10 * weight / max);
        
        if (weight > max * 0.9 && extension_settings.bodybuilding_system?.riskOfInjury) {
            if (Math.random() < 0.1) {
                this.state.injured = true;
                this.state.injuryDuration = 3;
                return `Strained a muscle lifting ${weight}kg!`;
            }
            this.addMuscleExp(exp * 1.5);
        } else {
            this.addMuscleExp(exp);
        }

        this.saveState();
        return `${this.character.name} lifted ${weight}kg`;
    }

    addMuscleExp(amount) {
        this.state.muscleExp += amount;
        while (this.state.muscleExp >= this.getRequiredExp('muscle') && this.state.muscleLevel < 10) {
            this.state.muscleExp -= this.getRequiredExp('muscle');
            this.state.muscleLevel++;
        }
    }
    
    addStaminaExp(amount) {
        this.state.staminaExp += amount;
        while (this.state.staminaExp >= this.getRequiredExp('stamina') && this.state.staminaLevel < 10) {
            this.state.staminaExp -= this.getRequiredExp('stamina');
            this.state.staminaLevel++;
        }
    }
    
    setActivity(activity) {
        if (!this.activities.includes(activity)) return;
        this.state.activity = activity;
        this.saveState();
    }
    
    setWorkoutWeight(weight) {
        const max = this.getMaxLift();
        this.state.workoutWeight = Math.max(0, Math.min(weight, max));
        this.saveState();
    }

    getProgress() {
        return {
            staminaPercent: (this.state.currentStamina / this.getMaxStamina()) * 100,
            muscleExpPercent: (this.state.muscleExp / this.getRequiredExp('muscle')) * 100,
            staminaExpPercent: (this.state.staminaExp / this.getRequiredExp('stamina')) * 100,
            maxLift: this.getMaxLift()
        };
    }
}
