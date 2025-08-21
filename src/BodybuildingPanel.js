export class BodybuildingPanel {
    constructor(manager) {
        this.manager = manager;
        this.isVisible = false;
        this.domElement = null;
        this.isDragging = false;
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
            background: var(--SmartThemeBodyBgColor);
            border: 1px solid var(--SmartThemeBorderColor);
            border-radius: 10px;
            padding: 15px;
            z-index: 100;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: none;
            user-select: none;
        `;

        panel.innerHTML = `
            <div class="draggable-header" style="cursor: move;">
                <h3>Bodybuilding System</h3>
                <div class="actions">
                    <span id="bb-refresh-btn">↻</span>
                    <span id="bb-close-btn">×</span>
                </div>
            </div>
            <div class="content" style="margin-top: 10px;">
                <div class="activity-selector">
                    <button data-activity="resting" class="activity-btn">Resting</button>
                    <button data-activity="cardio" class="activity-btn">Cardio</button>
                    <button data-activity="training" class="activity-btn">Training</button>
                </div>
                
                <div class="stats">
                    <div class="stat">
                        <label>Muscle Level:</label>
                        <span class="stat-value" id="bb-muscle-level">1</span>
                    </div>
                    <div class="stat">
                        <label>Workout Weight:</label>
                        <span class="stat-value" id="bb-workout-weight">10</span> kg 
                        <button id="bb-change-weight">✏️</button>
                    </div>
                    <div class="stat">
                        <label>Max Lift:</label>
                        <span class="stat-value" id="bb-max-lift">10</span> kg
                    </div>
                    <div class="stat">
                        <label>Stamina Level:</label>
                        <span class="stat-value" id="bb-stamina-level">1</span>
                    </div>
                </div>
                
                <div class="progress-bar">
                    <div class="label">Stamina</div>
                    <div class="bar">
                        <div id="bb-stamina-bar" class="fill"></div>
                        <div id="bb-stamina-text" class="text">0/100</div>
                    </div>
                </div>
                
                <div class="progress-bar">
                    <div class="label">Muscle EXP</div>
                    <div class="bar">
                        <div id="bb-muscle-bar" class="fill"></div>
                        <div id="bb-muscle-text" class="text">0/100</div>
                    </div>
                </div>
                
                <div class="warning" id="bb-injury-warning" style="display:none"></div>
            </div>
        `;

        document.body.appendChild(panel);
        return panel;
    }

    update() {
        if (!this.domElement || !this.manager.character) return;
        
        const progress = this.manager.getProgress();
        
        // Update stats
        this.domElement.querySelector('#bb-muscle-level').textContent = 
            this.manager.state.muscleLevel;
        
        this.domElement.querySelector('#bb-workout-weight').textContent = 
            this.manager.state.workoutWeight;
        
        this.domElement.querySelector('#bb-max-lift').textContent = 
            this.manager.getMaxLift();
        
        this.domElement.querySelector('#bb-stamina-level').textContent = 
            this.manager.state.staminaLevel;
        
        // Update bars and labels
        const staminaText = `${this.manager.state.currentStamina.toFixed(1)}/${this.manager.getMaxStamina()}`;
        const staminaBar = this.domElement.querySelector('#bb-stamina-bar');
        staminaBar.style.width = `${progress.staminaPercent}%`;
        this.domElement.querySelector('#bb-stamina-text').textContent = staminaText;
        
        const muscleText = `${this.manager.state.muscleExp.toFixed(1)}/${this.manager.getRequiredExp('muscle')}`;
        const muscleBar = this.domElement.querySelector('#bb-muscle-bar');
        muscleBar.style.width = `${progress.muscleExpPercent}%`;
        this.domElement.querySelector('#bb-muscle-text').textContent = muscleText;
        
        // Update activity buttons
        this.domElement.querySelectorAll('.activity-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.activity === this.manager.state.activity);
        });
        
        // Update injury warning
        const warning = this.domElement.querySelector('#bb-injury-warning');
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
        const header = this.domElement.querySelector('.draggable-header h3');
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
        // Activity buttons
        this.domElement.querySelectorAll('.activity-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.manager.setActivity(btn.dataset.activity);
                this.update();
            });
        });
        
        // Buttons
        this.domElement.querySelector('#bb-close-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        this.domElement.querySelector('#bb-refresh-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.manager.loadState();
            toastr.info("State refreshed");
            this.update();
        });
        
        this.domElement.querySelector('#bb-change-weight').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showWeightDialog();
        });
        
        // Drag functionality
        const header = this.domElement.querySelector('.draggable-header');
        header.addEventListener('mousedown', this.startDrag.bind(this));
    }

    startDrag(e) {
        if (e.target !== this.domElement.querySelector('.draggable-header')) return;
        
        const panelRect = this.domElement.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - panelRect.left,
            y: e.clientY - panelRect.top
        };
        
        document.addEventListener('mousemove', this.dragPanel);
        document.addEventListener('mouseup', this.stopDrag);
    }
    
    dragPanel = (e) => {
        this.domElement.style.left = `${e.clientX - this.dragOffset.x}px`;
        this.domElement.style.top = `${e.clientY - this.dragOffset.y}px`;
    };
    
    stopDrag = () => {
        document.removeEventListener('mousemove', this.dragPanel);
        document.removeEventListener('mouseup', this.stopDrag);
    };

    sendSystemMessage(message) {
        const input = document.getElementById('send_textarea');
        if (!input) return;
        
        input.value = `/sys ${message}`;
        
        const event = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            bubbles: true
        });
        input.dispatchEvent(event);
    }
}
