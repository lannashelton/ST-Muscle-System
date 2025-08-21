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
            top: 150px;
            right: 20px;
            width: 320px;
            background: var(--MenuItemBg);
            border: 1px solid var(--MenuItemBorder);
            border-radius: 10px;
            padding: 15px;
            z-index: 100;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: none;
            user-select: none;
        `;

        panel.innerHTML = `
            <div class="draggable-header" style="cursor: move; padding-bottom: 10px; border-bottom: 1px solid var(--MenuItemBorder); margin-bottom: 15px;">
                <h3 style="margin: 0; display: flex; justify-content: space-between; align-items: center;">
                    <span>Bodybuilding System</span>
                    <div>
                        <span id="bb-refresh-btn" style="cursor: pointer; margin-left: 10px; font-size: 1.2em;">↻</span>
                        <span id="bb-close-btn" style="cursor: pointer; margin-left: 10px; font-size: 1.2em;">×</span>
                    </div>
                </h3>
            </div>
            <div class="content">
                <div class="activity-selector" style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button data-activity="resting" class="activity-btn" 
                            style="flex: 1; padding: 10px; border: none; border-radius: 8px; 
                                   background: #6082b6; color: white; cursor: pointer;">Resting</button>
                    <button data-activity="cardio" class="activity-btn" 
                            style="flex: 1; padding: 10px; border: none; border-radius: 8px; 
                                   background: #6082b6; color: white; cursor: pointer;">Cardio</button>
                    <button data-activity="training" class="activity-btn" 
                            style="flex: 1; padding: 10px; border: none; border-radius: 8px; 
                                   background: #6082b6; color: white; cursor: pointer;">Training</button>
                </div>
                
                <div class="stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div class="stat" style="background: #2c3e50; padding: 10px; border-radius: 8px;">
                        <div style="font-size: 0.9em; margin-bottom: 5px;">Muscle Level</div>
                        <div id="bb-muscle-level" style="font-size: 1.6em; font-weight: bold; text-align: center;">1</div>
                    </div>
                    
                    <div class="stat" style="background: #2c3e50; padding: 10px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between;">
                            <div style="font-size: 0.9em;">Workout Weight</div>
                            <button id="bb-change-weight" style="background: none; border: none; cursor: pointer; color: white;">✏️</button>
                        </div>
                        <div id="bb-workout-weight" style="font-size: 1.6em; font-weight: bold; text-align: center;">10kg</div>
                    </div>
                    
                    <div class="stat" style="background: #2c3e50; padding: 10px; border-radius: 8px;">
                        <div style="font-size: 0.9em; margin-bottom: 5px;">Max Lift</div>
                        <div id="bb-max-lift" style="font-size: 1.6em; font-weight: bold; text-align: center;">10kg</div>
                    </div>
                    
                    <div class="stat" style="background: #2c3e50; padding: 10px; border-radius: 8px;">
                        <div style="font-size: 0.9em; margin-bottom: 5px;">Stamina Level</div>
                        <div id="bb-stamina-level" style="font-size: 1.6em; font-weight: bold; text-align: center;">1</div>
                    </div>
                </div>
                
                <div class="progress-section" style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 5px;">Stamina: <span id="bb-stamina-text">80/100</span></h4>
                    <div style="height: 20px; background: #34495e; border-radius: 10px; overflow: hidden;">
                        <div id="bb-stamina-bar" style="height: 100%; width: 80%; background: #27ae60; transition: width 0.5s;"></div>
                    </div>
                </div>
                
                <div class="progress-section" style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 5px;">Muscle EXP: <span id="bb-muscle-text">50/100</span></h4>
                    <div style="height: 20px; background: #34495e; border-radius: 10px; overflow: hidden;">
                        <div id="bb-muscle-bar" style="height: 100%; width: 50%; background: #3498db; transition: width 0.5s;"></div>
                    </div>
                </div>
                
                <div id="bb-injury-warning" style="padding: 10px; background: rgba(235, 77, 75, 0.2); border-radius: 5px; display: none; margin-top: 10px;">
                    ⚠ Injury notification will appear here
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        return panel;
    }

    makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = element.querySelector('.draggable-header');

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

    updateButtonStates() {
        if (!this.domElement) return;
        const activities = ['resting', 'cardio', 'training'];
        
        activities.forEach(activity => {
            const btn = this.domElement.querySelector(`button[data-activity="${activity}"]`);
            if (btn) {
                if (this.manager.state.activity === activity) {
                    btn.style.backgroundColor = '#2ecc71';
                    btn.style.fontWeight = 'bold';
                } else {
                    btn.style.backgroundColor = '#6082b6';
                    btn.style.fontWeight = 'normal';
                }
            }
        });
    }

    update() {
        if (!this.domElement || !this.manager.character) return;
        
        // Update stats
        this.domElement.querySelector('#bb-muscle-level').textContent = this.manager.state.muscleLevel;
        this.domElement.querySelector('#bb-workout-weight').textContent = `${this.manager.state.workoutWeight}kg`;
        this.domElement.querySelector('#bb-max-lift').textContent = `${this.manager.getMaxLift()}kg`;
        this.domElement.querySelector('#bb-stamina-level').textContent = this.manager.state.staminaLevel;
        
        // Update bars
        const progress = this.manager.getProgress();
        this.domElement.querySelector('#bb-stamina-bar').style.width = `${progress.staminaPercent}%`;
        this.domElement.querySelector('#bb-stamina-text').textContent = 
            `${this.manager.state.currentStamina.toFixed(1)}/${this.manager.getMaxStamina()}`;
        
        this.domElement.querySelector('#bb-muscle-bar').style.width = `${progress.muscleExpPercent}%`;
        this.domElement.querySelector('#bb-muscle-text').textContent = 
            `${this.manager.state.muscleExp.toFixed(1)}/${this.manager.getRequiredExp('muscle')}`;
        
        // Update injury
        const warning = this.domElement.querySelector('#bb-injury-warning');
        if (this.manager.state.injured) {
            warning.textContent = `⚠ INJURY! ${this.manager.state.injuryDuration} days rest needed`;
            warning.style.display = 'block';
        } else {
            warning.style.display = 'none';
        }
        
        // Update buttons after data change
        this.updateButtonStates();
    }

    bindEvents() {
        // Activity buttons
        this.domElement.querySelectorAll('.activity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.manager.setActivity(btn.dataset.activity);
                this.updateButtonStates();
            });
        });
        
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
            const max = this.manager.getMaxLift();
            const weight = prompt(`Set workout weight (max: ${max}kg)`, this.manager.state.workoutWeight);
            if (weight !== null) {
                const newWeight = parseFloat(weight);
                if (!isNaN(newWeight)) {
                    this.manager.setWorkoutWeight(newWeight);
                    this.update();
                }
            }
        });
    }

    updateCharacter(name) {
        if (!this.domElement) return;
        const header = this.domElement.querySelector('.draggable-header span');
        if (header) header.textContent = `Bodybuilding: ${name}`;
        this.update();
    }

    toggle() {
        if (!this.domElement) {
            this.domElement = this.createPanel();
            this.makeDraggable(this.domElement);
            this.bindEvents();
            this.update();
        }
        
        this.isVisible = !this.isVisible;
        this.domElement.style.display = this.isVisible ? 'block' : 'none';
        
        if (this.isVisible && this.manager.character) {
            this.update();
        }
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
