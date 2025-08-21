import { extension_settings } from "../../../../extensions.js";

export class BodybuildingPanel {
    constructor(manager) {
        this.manager = manager;
        this.isVisible = false;
        this.domElement = null;
        this.weightModal = null;
    }
    
    createPanel() {
        if (this.domElement) {
            this.domElement.remove();
        }
        
        const panel = document.createElement('div');
        panel.id = 'bodybuilding-panel';
        panel.className = 'bodybuilding-panel';

        const characterName = 'Bodybuilding System';
        
        panel.innerHTML = `
            <div class="bodybuilding-header">
                <h3>${characterName}</h3>
                <div class="bodybuilding-actions">
                    <span class="bodybuilding-action" id="bb-refresh">↻</span>
                    <span class="bodybuilding-action" id="bb-close">×</span>
                </div>
            </div>
            <div class="bodybuilding-content">
                <div class="activity-selector">
                    <button class="activity-btn" data-activity="resting">Resting</button>
                    <button class="activity-btn" data-activity="cardio">Cardio</button>
                    <button class="activity-btn" data-activity="training">Training</button>
                </div>
                
                <div class="stamina-display">
                    <div class="bar-container">
                        <div class="stamina-bar"></div>
                        <div class="bar-text">
                            Stamina: 0/kg
                        </div>
                    </div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Muscle Level</div>
                        <div class="stat-value">0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Current Weight</div>
                        <div class="stat-value">
                            0kg
                            <button id="change-weight" class="action-icon">✏️</button>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Max Lift</div>
                        <div class="stat-value">0kg</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Stamina Level</div>
                        <div class="stat-value">0</div>
                    </div>
                </div>
                
                <div class="muscle-display">
                    <div class="bar-container">
                        <div class="exp-bar"></div>
                        <div class="bar-text">
                            Muscle EXP: 0/0
                        </div>
                    </div>
                </div>
                
                <div class="stamina-level-display">
                    <div class="bar-container">
                        <div class="exp-bar"></div>
                        <div class="bar-text">
                            Stamina EXP: 0/0
                        </div>
                    </div>
                </div>
                
                <div class="injury-warning" style="display:none">
                    ⚠ INJURY WARNING
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        return panel;
    }

    createWeightModal() {
        if (this.weightModal) {
            this.weightModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'weight-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--SmartThemeBodyBgColor);
            padding: 20px;
            border-radius: 10px;
            z-index: 2000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            display: none;
        `;

        const maxLift = this.manager.getMaxLift();
        modal.innerHTML = `
            <h4>Set Workout Weight</h4>
            <p>Max Lift: ${maxLift}kg</p>
            
            <div class="flex-container">
                <input type="number" 
                       id="weight-input" 
                       min="0" 
                       max="${maxLift}" 
                       step="0.5" 
                       value="${this.manager.state.workoutWeight || 10}">
                <label for="weight-input">kg</label>
            </div>
            
            <div class="modal-buttons">
                <button id="confirm-weight">Set</button>
                <button id="cancel-weight">Cancel</button>
            </div>
        `;

        document.body.appendChild(modal);
        return modal;
    }

    showWeightModal() {
        if (!this.weightModal) {
            this.weightModal = this.createWeightModal();
            this.setupModalEvents();
        }
        
        const weightInput = this.weightModal.querySelector('#weight-input');
        weightInput.value = this.manager.state.workoutWeight;
        weightInput.max = this.manager.getMaxLift();
        
        this.weightModal.style.display = 'block';
    }

    setupModalEvents() {
        const modal = this.weightModal;
        const confirmBtn = modal.querySelector('#confirm-weight');
        const cancelBtn = modal.querySelector('#cancel-weight');
        const weightInput = modal.querySelector('#weight-input');

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        confirmBtn.addEventListener('click', () => {
            const weight = parseFloat(weightInput.value);
            if (!isNaN(weight)) {
                const result = this.manager.setWorkoutWeight(weight);
                this.manager.saveState();
                toastr.success(result, "Weight Updated");
                modal.style.display = 'none';
                this.update();
            }
        });
    }
    
    update() {
        if (!this.domElement) return;
        if (!this.manager.character) return;
        
        const progress = this.manager.getProgress();
        const maxLift = progress.maxLift;
        const warningEl = this.domElement.querySelector('.injury-warning');
        
        // Update stats
        this.domElement.querySelector('.stat-card:nth-child(1) .stat-value').textContent = 
            this.manager.state.muscleLevel;
        this.domElement.querySelector('.stat-card:nth-child(2) .stat-value').innerHTML = 
            `${this.manager.state.workoutWeight}kg<button id="change-weight" class="action-icon">✏️</button>`;
        this.domElement.querySelector('.stat-card:nth-child(3) .stat-value').textContent = 
            `${maxLift}kg`;
        this.domElement.querySelector('.stat-card:nth-child(4) .stat-value').textContent = 
            this.manager.state.staminaLevel;
        
        // Update bars
        const staminaBar = this.domElement.querySelector('.stamina-bar');
        staminaBar.style.width = `${progress.staminaPercent}%`;
        this.domElement.querySelector('.stamina-display .bar-text').textContent = 
            `Stamina: ${this.manager.state.currentStamina.toFixed(1)}/${progress.maxStamina}`;
        
        const muscleBar = this.domElement.querySelector('.muscle-display .exp-bar');
        muscleBar.style.width = `${progress.muscleExpPercent}%`;
        this.domElement.querySelector('.muscle-display .bar-text').textContent = 
            `Muscle EXP: ${this.manager.state.muscleExp.toFixed(1)}/${progress.nextMuscleLevelExp}`;
        
        const staminaExpBar = this.domElement.querySelector('.stamina-level-display .exp-bar');
        staminaExpBar.style.width = `${progress.staminaExpPercent}%`;
        this.domElement.querySelector('.stamina-level-display .bar-text').textContent = 
            `Stamina EXP: ${this.manager.state.staminaExp.toFixed(1)}/${progress.nextStaminaLevelExp}`;
        
        // Update activities
        this.domElement.querySelectorAll('.activity-btn').forEach(btn => {
            btn.classList.toggle('active', 
                btn.dataset.activity === this.manager.state.activity
            );
        });
        
        // Injury warning
        if (this.manager.state.injured) {
            warningEl.textContent = `⚠ INJURED! Rest for ${this.manager.state.injuryDuration} more days.`;
            warningEl.style.display = 'block';
        } 
        else if (this.manager.state.workoutWeight > maxLift * 0.9) {
            const ratio = Math.round(this.manager.state.workoutWeight / maxLift * 100);
            warningEl.textContent = `⚠ Lifting at ${ratio}% max increases injury risk!`;
            warningEl.style.display = 'block';
        } else {
            warningEl.style.display = 'none';
        }
    }
    
    updateIfVisible() {
        if (this.isVisible) this.update();
    }
    
    updateCharacter(name) {
        if (!this.domElement) return;
        const header = this.domElement.querySelector('.bodybuilding-header h3');
        if (header) header.textContent = `Bodybuilding - ${name}`;
        this.update();
    }
    
    sendSystemMessage(message) {
        try {
            const chatInput = document.getElementById('send_textarea');
            if (!chatInput) return;

            chatInput.value = `/sys ${message}`;
            
            const sendButton = document.querySelector('#send_but');
            if (sendButton) {
                sendButton.click();
            }
        } catch (error) {
            console.error("Failed to send system message:", error);
        }
    }
    
    toggle(character) {
        if (!this.domElement) {
            this.domElement = this.createPanel();
            this.attachEventListeners();
        }
        
        if (character) {
            this.manager.setCharacter(character);
            this.updateCharacter(character.name);
        }
        
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    show() {
        if (!this.domElement) return;
        this.domElement.style.display = 'block';
        this.update();
        this.isVisible = true;
    }
    
    hide() {
        if (!this.domElement) return;
        this.domElement.style.display = 'none';
        this.isVisible = false;
    }
    
    attachEventListeners() {
        if (!this.domElement) return;
        
        // Weight change button
        this.domElement.addEventListener('click', (e) => {
            if (e.target.id === 'change-weight') {
                this.showWeightModal();
            }
        });
        
        // Activity buttons
        this.domElement.querySelectorAll('.activity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const activity = e.target.dataset.activity;
                this.manager.setActivity(activity);
                this.update();
            });
        });
        
        // Refresh button
        this.domElement.querySelector('#bb-refresh').addEventListener('click', () => {
            this.manager.loadState();
            toastr.success("Stats reloaded");
            this.update();
        });
        
        // Close button
        this.domElement.querySelector('#bb-close').addEventListener('click', () => {
            this.hide();
        });
    }
}
