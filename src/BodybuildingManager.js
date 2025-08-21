import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";

export class BodybuildingManager {
    constructor() {
        this.activities = ['idle', 'resting', 'cardio', 'training'];
        this.character = null;
        this.state = {
            enabled: false,
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

        // Bind methods for event handlers
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
        // Exponential growth: 20% increase per level
        return 10 * Math.pow(1.2, this.state.muscleLevel - 1);
    }
    
    getMaxStamina() {
        // 15% increase per level
        return 100 * Math.pow(1.15, this.state.staminaLevel - 1);
    }
    
    getRequiredExp(type) {
        // Base requirement * level squared for exponential difficulty
        const base = type === 'muscle' ? 50 : 30;
        return base * Math.pow(this.state[type + 'Level'], 1.5);
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
            case 'idle':
                // Completely idle - no changes
                return `${this.character.name} is idling`;
            case 'resting':
                return this.processResting();
            case 'cardio':
                return this.processCardio();
            case 'training':
                return this.processTraining();
            default:
