import { extension_settings } from "../../../../extensions.js";

export class BodybuildingPanel {
    constructor(manager) {
        this.manager = manager;
        this.isVisible = false;
        this.domElement = null;
    }
    
    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'bodybuilding-panel';
        panel.className = 'bodybuilding-panel';

        const characterName = this.manager.character?.name || 'No Character';
        const progress = this.manager.getProgress();
        const liftRecord = this.manager.state.maxLiftToday?.toFixed(1) || 'None';
        
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
                        <div class="stat-label">Max Lift</div>
                        <div class="stat-value">${progress.maxLift}kg</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Stamina Level</div>
                        <div class="stat-value">${this.manager.state.staminaLevel}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Today's Record</div>
                        <div class="stat-value">${liftRecord}kg</div>
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
                
                ${this.manager.state.activity === 'training' ? `
                <div class="intensity-control">
                    <label>
                        Training Intensity: 
                        <span id="intensity-value">${this.manager.state.trainingIntensity}</span>%
                    </label>
                    <input type="range" min="10" max="100" value="${this.manager.state.trainingIntensity}" 
                           class="intensity-slider" id="training-intensity">
                </div>
                ${this.manager.state.trainingIntensity > 90 ? `
                <div class="injury-warning">
                    ⚠ High intensity increases injury risk!
                </div>
                ` : ''}
                ` : ''}
                
                ${this.manager.state.injured ? `
                <div class="injury-warning">
                    ⚠ INJURED! Rest for ${this.manager.state.injuryDuration} more days.
                </div>
                ` : ''}
                ` : '<div>No character selected</div>'}
            </div>
        `;

        document.body.appendChild(panel);
        return panel;
    }
    
    update() {
        if (!this.domElement) return;
        
        const progress = this.manager.getProgress();
        
        // Stamina bar
        const staminaBar = this.domElement.querySelector('.stamina-bar');
        const staminaText = this.domElement.querySelector('.bar-text');
        if (staminaBar && staminaText) {
            staminaBar.style.width = `${progress.staminaPercent}%`;
            staminaText.textContent = 
                `Stamina: ${this.manager.state.currentStamina.toFixed(1)}/${progress.maxStamina}`;
        }
        
        // Muscle exp bar
        const muscleBar = this.domElement.querySelector('.muscle-display .exp-bar');
        const muscleText = this.domElement.querySelector('.muscle-display .bar-text');
        if (muscleBar && muscleText) {
            muscleBar.style.width = `${progress.muscleExpPercent}%`;
            muscleText.textContent = 
                `Muscle EXP: ${this.manager.state.muscleExp.toFixed(1)}/${progress.nextMuscleLevelExp}`;
        }
        
        // Stamina exp bar
        const staminaExpBar = this.domElement.querySelector('.stamina-level-display .exp-bar');
        const staminaExpText = this.domElement.querySelector('.stamina-level-display .bar-text');
        if (staminaExpBar && staminaExpText) {
            staminaExpBar.style.width = `${progress.staminaExpPercent}%`;
            staminaExpText.textContent = 
                `Stamina EXP: ${this.manager.state.staminaExp.toFixed(1)}/${progress.nextStaminaLevelExp}`;
        }
        
        // Stats grid
        const maxLiftEl = this.domElement.querySelector('.stat-card:nth-child(2) .stat-value');
        if (maxLiftEl) {
            maxLiftEl.textContent = `${progress.maxLift}kg`;
        }
        
        const recordEl = this.domElement.querySelector('.stat-card:nth-child(4) .stat-value');
        if (recordEl) {
            recordEl.textContent = `${this.manager.state.maxLiftToday.toFixed(1)}kg`;
        }
        
        // Intensity slider
        const intensityValue = this.domElement.querySelector('#intensity-value');
        if (intensityValue) {
            intensityValue.textContent = this.manager.state.trainingIntensity;
        }
        const intensitySlider = this.domElement.querySelector('#training-intensity');
        if (intensitySlider) {
            intensitySlider.value = this.manager.state.trainingIntensity;
        }
        
        // Activity buttons
        const activityButtons = this.domElement.querySelectorAll('.activity-btn');
        activityButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.activity === this.manager.state.activity);
        });
        
        // Injury warning
        const injuryWarning = this.domElement.querySelector('.injury-warning');
        if (injuryWarning) {
            injuryWarning.textContent = this.manager.state.injured ?
                `⚠ INJURED! Rest for ${this.manager.state.injuryDuration} more days.` :
                '⚠ High intensity increases injury risk!';
        }
    }
    
    updateCharacter(name) {
        if (!this.domElement) return;
        const header = this.domElement.querySelector('.bodybuilding-header h3');
        if (header) {
            header.textContent = `Bodybuilding - ${name}`;
        }
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
        
        // Intensity slider
        const slider = this.domElement.querySelector('#training-intensity');
        if (slider) {
            slider.addEventListener('input', (e) => {
                this.manager.state.trainingIntensity = e.target.value;
                this.update();
            });
            
            // Save after mouseup
            slider.addEventListener('change', () => {
                this.manager.saveState();
            });
        }
        
        // Refresh button
        this.domElement.querySelector('#bb-refresh').addEventListener('click', () => {
            this.manager.loadState();
            toastr.success("Muscle stats reloaded");
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
