export class BodybuildingPanel {
    constructor(manager) {
        this.manager = manager;
        this.isVisible = false;
        this.domElement = null;
        this.dragOffset = { x: 0, y: 0 };
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'bodybuilding-panel';
        panel.className = 'bodybuilding-panel';
        panel.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            width: 320px;
            background: var(--bg5);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            padding: 15px;
            z-index: 100;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            display: none;
            user-select: none;
            color: var(--SmartThemeBodyColor);
        `;

        panel.innerHTML = `
            <div class="header" style="cursor: move; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">
                <h3 style="margin: 0; font-size: 1.2em;">Bodybuilding System</h3>
                <div class="actions" style="display: flex; gap: 10px;">
                    <span id="bb-refresh-btn" style="cursor: pointer; opacity: 0.7; font-weight: bold;">⭮</span>
                    <span id="bb-close-btn" style="cursor: pointer; opacity: 0.7; font-weight: bold;">×</span>
                </div>
            </div>
            <div class="content">
                <div class="activity-selector" style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <button data-activity="resting" class="activity-btn" style="padding: 8px 12px; background: var(--SmartThemeQuoteColor); border: none; border-radius: 4px; cursor: pointer; transition: 0.2s;">Resting</button>
                    <button data-activity="cardio" class="activity-btn" style="padding: 8px 12px; background: var(--SmartThemeQuoteColor); border: none; border-radius: 4px; cursor: pointer; transition: 0.2s;">Cardio</button>
                    <button data-activity="training" class="activity-btn" style="padding: 8px 12px; background: var(--SmartThemeQuoteColor); border: none; border-radius: 4px; cursor: pointer; transition: 0.2s;">Training</button>
                </div>
                
                <div class="stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div class="stat" style="background: var(--BlockBorderColor); padding: 10px; border-radius: 5px;">
                        <div>Muscle Lvl:</div>
                        <div class="stat-value" id="bb-muscle-level" style="font-weight: bold; font-size: 1.3em; margin-top: 5px;">1</div>
                    </div>
                    <div class="stat" style="background: var(--BlockBorderColor); padding: 10px; border-radius: 5px;">
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <span>Weight:</span>
                            <button id="bb-change-weight" style="background: none; border: none; cursor: pointer; font-size: 0.9em; padding: 0; margin-top: 3px;">✏️</button>
                        </div>
                        <div class="stat-value" id="bb-workout-weight" style="font-weight: bold; font-size: 1.3em; margin-top: 5px;">10kg</div>
                    </div>
                    <div class="stat" style="background: var(--BlockBorderColor); padding: 10px; border-radius: 5px;">
                        <div>Max Lift:</div>
                        <div class="stat-value" id="bb-max-lift" style="font-weight: bold; font-size: 1.3em; margin-top: 5px;">10kg</div>
                    </div>
                    <div class="stat" style="background: var(--BlockBorderColor); padding: 10px; border-radius: 5px;">
                        <div>Stamina Lvl:</div>
                        <div class="stat-value" id="bb-stamina-level" style="font-weight: bold; font-size: 1.3em; margin-top: 5px;">1</div>
                    </div>
                </div>
                
                <div class="progress-container" style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Stamina</span>
                        <span id="bb-stamina-text" style="font-weight: bold;">0/100</span>
                    </div>
                    <div class="progress-bar" style="height: 20px; background: var(--black30a); border-radius: 10px; overflow: hidden;">
                        <div id="bb-stamina-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #4caf50 0%, #2e7d32 100%); transition: width 0.5s;"></div>
                    </div>
                </div>
                
                <div class="progress-container" style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Muscle EXP</span>
                        <span id="bb-muscle-text" style="font-weight: bold;">0/50</span>
                    </div>
                    <div class="progress-bar" style="height: 20px; background: var(--black30a); border-radius: 10px; overflow: hidden;">
                        <div id="bb-muscle-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #2196f3 0%, #0d47a1 100%); transition: width 0.5s;"></div>
                    </div>
                </div>
                
                <div id="bb-injury-warning" style="display: none; background: rgba(255, 100, 100, 0.2); padding: 10px; border-radius: 5px; margin-top: 10px; border-left: 3px solid #f44336; color: #ff6b6b; font-weight: bold; font-size: 0.9em;"></div>
            </div>
        `;

        document.body.appendChild(panel);
        return panel;
    }

    onMouseDown(e) {
        // Only start drag when clicking on header
        const isHeader = e.target.closest('.header');
        if (!isHeader) return;
        
        // Record initial positions
        const rect = this.domElement.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        // Add movement listeners
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    onMouseMove(e) {
        e.preventDefault();
        // Calculate new position
        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;
        
        // Apply new position
        this.domElement.style.left = `${x}px`;
        this.domElement.style.top = `${y}px`;
    }

    onMouseUp() {
        // Remove movement listeners
        document.removeEventListener('mousemove', this.onMouseMove.bind(this));
        document.removeEventListener('mouseup', this.onMouseUp.bind(this));
    }

    update() {
        if (!this.domElement || !this.manager.character) return;
        
        const progress = this.manager.getProgress();
        
        // Update stats
        this.domElement.querySelector('#bb-muscle-level').textContent = 
            this.manager.state.muscleLevel;
        
        this.domElement.querySelector('#bb-workout-weight').textContent = 
            `${this.manager.state.workoutWeight}kg`;
        
        this.domElement.querySelector('#bb-max-lift').textContent = 
            `${this.manager.getMaxLift()}kg`;
        
        this.domElement.querySelector('#bb-stamina-level').textContent = 
            this.manager.state.staminaLevel;
        
        // Update progress bars
        this.domElement.querySelector('#bb-stamina-bar').style.width = 
            `${progress.staminaPercent}%`;
        this.domElement.querySelector('#bb-stamina-text').textContent = 
            `${this.manager.state.currentStamina.toFixed(1)}/${this.manager.getMaxStamina()}`;
        
        this.domElement.querySelector('#bb-muscle-bar').style.width = 
            `${progress.muscleExpPercent}%`;
        this.domElement.querySelector('#bb-muscle-text').textContent = 
            `${this.manager.state.muscleExp.toFixed(1)}/${this.manager.getRequiredExp('muscle')}`;
        
        // Update activity buttons
        this.domElement.querySelectorAll('.activity-btn').forEach(btn => {
            const active = btn.dataset.activity === this.manager.state.activity;
            btn.style.background = active 
                ? 'var(--SmartThemeActiveSwitchColor)' 
                : 'var(--SmartThemeQuoteColor)';
            btn.style.color = active ? 'var(--SmartThemeButtonTextColor)' : '';
        });
        
        // Injury warning
        const warning = this.domElement.querySelector('#bb-injury-warning');
        if (this.manager.state.injured) {
            warning.textContent = `⚠ INJURY: ${this.manager.state.injuryDuration} days rest required`;
            warning.style.display = 'block';
        } else {
            warning.style.display = 'none';
        }
    }

    attachEventListeners() {
        // Header drag listener
        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        
        // Close button
        this.domElement.querySelector('#bb-close-btn').addEventListener('click', () => {
            this.isVisible = false;
            this.domElement.style.display = 'none';
        });
        
        // Refresh button
        this.domElement.querySelector('#bb-refresh-btn').addEventListener('click', () => {
            this.manager.loadState();
            toastr.info('Bodybuilding stats reloaded');
            this.update();
        });
        
        // Weight edit button
        this.domElement.querySelector('#bb-change-weight').addEventListener('click', () => {
            this.showWeightDialog();
        });
        
        // Activity buttons
        this.domElement.querySelectorAll('.activity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.manager.setActivity(btn.dataset.activity);
                this.update();
            });
        });
    }

    showWeightDialog() {
        const max = this.manager.getMaxLift();
        const weight = prompt(`Set workout weight (max: ${max}kg)`, this.manager.state.workoutWeight);
        if (weight !== null) {
            const newWeight = parseFloat(weight);
            if (!isNaN(newWeight)) {
                this.manager.setWorkoutWeight(newWeight);
                this.update();
            }
        }
    }

    updateIfVisible() {
        if (this.isVisible) this.update();
    }

    updateCharacter(name) {
        if (!this.domElement) return;
        const header = this.domElement.querySelector('.header h3');
        if (header) header.textContent = `Bodybuilding: ${name}`;
        this.update();
    }

    toggle() {
        if (!this.domElement) {
            this.domElement = this.createPanel();
            this.attachEventListeners();
            this.update();
        }
        this.isVisible = !this.isVisible;
        this.domElement.style.display = this.isVisible ? 'block' : 'none';
    }

    sendSystemMessage(message) {
        const input = document.getElementById('send_textarea');
        if (!input) return;
        
        input.value = `/sys ${message}`;
        input.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter',
            bubbles: true
        }));
    }
}
