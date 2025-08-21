import { extension_settings } from "../../../../extensions.js";

export class BodybuildingPanel {
    constructor(manager) {
        this.manager = manager;
        this.isVisible = false;
        this.domElement = null;
        this.weightModal = null;
    }
    
    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'bodybuilding-panel';
        panel.className = 'bodybuilding-panel';

        const characterName = this.manager.character?.name || 'No Character';
        const progress = this.manager.getProgress();
        const maxLift = progress.maxLift;
        
        panel.innerHTML = `
            <div class="bodybuilding-header">
                <h3>Bodybuilding - ${characterName}</h3>
                <div class="bodybuilding-actions">
                    <span class="bodybuilding-action" id="bb-refresh">↻</span>
                    <span class="bodybuilding-action" id="bb-close">×</span>
                </div>
            </div>
            <div class="bodybuilding-content">
                ${this.manager.character ? `
                <div class="activity-selector">
                    ${this.manager.activities.map(a => `
                        <button class="activity-btn ${this.manager.state.activity === a ? 'active' : ''}" 
                                data-activity="${a}">
                            ${a.charAt(0).toUpperCase() + a.slice(1)}
                        </button>
                    `).join('')}
                </div>
                
                <div class="stamina-display">
                    <div class="bar-container">
                        <div class="stamina-bar" style="width: ${progress.staminaPercent}%"></div>
                        <div class="bar-text">
                            Stamina: ${this.manager.state.currentStamina.toFixed(1)}/${progress.maxStamina}
                        </div>
                    </div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Muscle Level</div>
                        <div class="stat-value">${this.manager.state.muscleLevel}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Current Weight</div>
                        <div class="stat-value">
                            ${this.manager.state.workoutWeight}kg
                            <button id="change-weight" class="action-icon">✏️</button>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Max Lift</div>
                        <div class="stat-value">${maxLift}kg</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Stamina Level</div>
                        <div class="stat-value">${this.manager.state.staminaLevel}</div>
                    </div>
                </div>
                
                <div class="muscle-display">
                    <div class="bar-container">
                        <div class="exp-bar" style="width: ${progress.muscleExpPercent}%"></div>
                        <div class="bar-text">
                            Muscle EXP: ${this.manager.state.muscleExp.toFixed(1)}/${progress.nextMuscleLevelExp}
                        </div>
                    </div>
                </div>
                
                <div class="stamina-level-display">
                    <div class="bar-container">
                        <div class="exp-bar" style="width: ${progress.staminaExpPercent}%"></div>
                        <div class="bar-text">
                            Stamina EXP: ${this.manager.state.staminaExp.toFixed(1)}/${progress.nextStaminaLevelExp}
                        </div>
                    </div>
                </div>
                
                ${this.manager.state.injured ? `
                <div class="injury-warning">
                    ⚠ INJURED! Rest for ${this.manager.state.injuryDuration} more days.
                </div>
                ` : 
                this.manager.state.workoutWeight > maxLift * 0.9 ? `
                <div class="injury-warning">
                    ⚠ Lifting ${this.manager.state.workoutWeight}kg (${Math.round(this.manager.state.workoutWeight/maxLift*100)}% max) increases injury risk!
                </div>
                ` : ''}
                ` : '<div>No character selected</div>'}
            </div>
        `;

        document.body.appendChild(panel);
        return panel;
    }

    createWeightModal() {
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
        weightInput.max = this.manager.getMaxLift();
        weightInput.value = this.manager.state.workoutWeight;
        
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
                toastr.success(result, "Weight Updated");
                modal.style.display = 'none';
                this.update();
            }
        });
    }
    
    update() {
        if (!this.domElement) return;
        
        const progress = this.manager.getProgress();
        
        // Update weight display
        const weightDisplay = this.domElement.querySelector('.stat-card:nth-child(2) .stat-value');
        if (weightDisplay) {
            weightDisplay.innerHTML = `
                ${this.manager.state.workoutWeight}kg
                <button id="change-weight" class="action-icon">✏️</button>
            `;
        }
        
        // Injury warning
        const warning = this.domElement.querySelector('.injury-warning');
        if (warning) {
            if (this.manager.state.injured) {
                warning.textContent = `⚠ INJURED! Rest for ${this.manager.state.injuryDuration} more days.`;
            } 
            else if (this.manager.state.workoutWeight > progress.maxLift * 0.9) {
                const ratio = Math.round(this.manager.state.workoutWeight / progress.maxLift * 100);
                warning.textContent = `⚠ Lifting ${this.manager.state.workoutWeight}kg (${ratio}% max) increases injury risk!`;
            }
        }
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

            chatInput.value = `/sys compact=true ${message}`;
            
            const sendButton = document.querySelector('#send_but');
            if (sendButton) {
                sendButton.click();
            } else {
                const event = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    bubbles: true
                });
                chatInput.dispatchEvent(event);
            }
        } catch (error) {
            console.error("Failed to send system message:", error);
        }
    }
    
    toggle() {
        if (!this.manager.character) {
            toastr.info("Please select a character first");
            return;
        }
        
        if (!this.manager.state.enabled) {
            const message = this.manager.enableSystem();
            this.sendSystemMessage(message);
        }
        
        this.isVisible ? this.hide() : this.show();
    }
    
    show() {
        if (!this.domElement) {
            this.domElement = this.createPanel();
            this.makeDraggable(this.domElement);
            this.attachEventListeners();
        }
        this.domElement.style.display = 'block';
        this.update();
        this.isVisible = true;
    }
    
    hide() {
        if (this.domElement) {
            this.domElement.style.display = 'none';
        }
        this.isVisible = false;
    }
    
    attachEventListeners() {
        // Weight change button
        this.domElement.addEventListener('click', (e) => {
            if (e.target.id === 'change-weight') {
                this.showWeightModal();
            }
        });
        
        // Activity buttons
        this.domElement.querySelectorAll('.activity-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const activity = btn.dataset.activity;
                if (this.manager.state.activity !== activity) {
                    this.manager.setActivity(activity);
                    this.update();
                }
            });
        });
        
        // Refresh button
        this.domElement.querySelector('#bb-refresh').addEventListener('click', () => {
            this.manager.loadState();
            toastr.success("Bodybuilding stats reloaded");
            this.update();
        });
        
        // Close button
        this.domElement.querySelector('#bb-close').addEventListener('click', () => {
            this.hide();
        });
    }
    
    makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = element.querySelector('.bodybuilding-header');

        if (header) {
            header.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
}
