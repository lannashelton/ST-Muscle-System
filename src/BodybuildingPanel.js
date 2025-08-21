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
        panel.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            width: 320px;
            background: var(--SmartThemeMenuColor);
            border: 1px solid var(--SmartThemeBorderColor);
            border-radius: 10px;
            padding: 15px;
            z-index: 100;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: none;
        `;

        panel.innerHTML = `
            <div class="header">
                <h3>Bodybuilding System</h3>
                <div class="actions">
                    <span id="refresh-btn">↻</span>
                    <span id="close-btn">×</span>
                </div>
            </div>
            <div class="content">
                <div class="activity-selector">
                    <button data-activity="resting" class="activity-btn">Resting</button>
                    <button data-activity="cardio" class="activity-btn">Cardio</button>
                    <button data-activity="training" class="activity-btn">Training</button>
                </div>
                
                <div class="stats">
                    <div class="stat">
                        <label>Muscle Level:</label>
                        <span id="muscle-level">1</span>
                    </div>
                    <div class="stat">
                        <label>Workout Weight:</label>
                        <span id="workout-weight">10</span> kg 
                        <button id="change-weight">✏️</button>
                    </div>
                    <div class="stat">
                        <label>Max Lift:</label>
                        <span id="max-lift">10</span> kg
                    </div>
                    <div class="stat">
                        <label>Stamina Level:</label>
                        <span id="stamina-level">1</span>
                    </div>
                </div>
                
                <div class="progress-bar">
                    <div class="label">Stamina</div>
                    <div class="bar">
                        <div id="stamina-bar" class="fill"></div>
                    </div>
                    <div id="stamina-text" class="text">0/100</div>
                </div>
                
                <div class="progress-bar">
                    <div class="label">Muscle EXP</div>
                    <div class="bar">
                        <div id="muscle-bar" class="fill"></div>
                    </div>
                    <div id="muscle-text" class="text">0/100</div>
                </div>
                
                <div class="warning" id="injury-warning" style="display:none"></div>
            </div>
        `;

        document.body.appendChild(panel);
        return panel;
    }

    update() {
        if (!this.domElement || !this.manager.character) return;
        
        const progress = this.manager.getProgress();
        
        this.domElement.getElementById('muscle-level').textContent = this.manager.state.muscleLevel;
        this.domElement.getElementById('workout-weight').textContent = this.manager.state.workoutWeight;
        this.domElement.getElementById('max-lift').textContent = this.manager.getMaxLift();
        this.domElement.getElementById('stamina-level').textContent = this.manager.state.staminaLevel;
        
        this.domElement.getElementById('stamina-bar').style.width = `${progress.staminaPercent}%`;
        this.domElement.getElementById('stamina-text').textContent = 
            `${this.manager.state.currentStamina.toFixed(1)}/${this.manager.getMaxStamina()}`;
            
        this.domElement.getElementById('muscle-bar').style.width = `${progress.muscleExpPercent}%`;
        this.domElement.getElementById('muscle-text').textContent = 
            `${this.manager.state.muscleExp.toFixed(1)}/${this.manager.getRequiredExp('muscle')}`;
            
        const warning = this.domElement.getElementById('injury-warning');
        if (this.manager.state.injured) {
            warning.textContent = `INJURED! Rest for ${this.manager.state.injuryDuration} days`;
            warning.style.display = 'block';
        } else {
            warning.style.display = 'none';
        }
    }

    showWeightDialog() {
        const currentWeight = this.manager.state.workoutWeight;
        const maxWeight = this.manager.getMaxLift();
        
        const weight = prompt(`Set workout weight (max: ${maxWeight}kg)`, currentWeight);
        if (weight === null) return;
        
        const newWeight = parseFloat(weight);
        if (isNaN(newWeight)) return;
        
        this.manager.setWorkoutWeight(newWeight);
        this.update();
    }

    updateIfVisible() {
        if (!this.isVisible) return;
        this.update();
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
            this.setupEventListeners();
        }
        
        this.isVisible = !this.isVisible;
        this.domElement.style.display = this.isVisible ? 'block' : 'none';
        
        if (this.isVisible) this.update();
    }

    setupEventListeners() {
        this.domElement.getElementById('close-btn').addEventListener('click', () => {
            this.toggle();
        });
        
        this.domElement.getElementById('refresh-btn').addEventListener('click', () => {
            this.manager.loadState();
            toastr.info("State refreshed");
            this.update();
        });
        
        this.domElement.querySelectorAll('.activity-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.manager.setActivity(btn.dataset.activity);
                this.update();
            });
        });
        
        this.domElement.getElementById('change-weight').addEventListener('click', () => {
            this.showWeightDialog();
        });
    }

    sendSystemMessage(message) {
        const input = document.getElementById('send_textarea');
        if (!input) return;
        
        input.value = `/sys ${message}`;
        input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
    }
}
