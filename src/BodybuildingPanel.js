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
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            border: 1px solid #3a6fca;
            border-radius: 12px;
            padding: 15px;
            z-index: 100;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            display: none;
            user-select: none;
            color: #ffffff;
        `;

        panel.innerHTML = `
            <div class="draggable-header" style="cursor: move; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.2); margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0;">Bodybuilding System</h3>
                <div>
                    <span id="bb-refresh-btn" style="cursor: pointer; margin-left: 10px; font-size: 1.2em;">↻</span>
                    <span id="bb-close-btn" style="cursor: pointer; margin-left: 10px; font-size: 1.2em;">×</span>
                </div>
            </div>
            <div class="content">
                <div class="activity-selector" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 15px;">
                    <button data-activity="idle" class="activity-btn">Idle</button>
                    <button data-activity="resting" class="activity-btn">Resting</button>
                    <button data-activity="cardio" class="activity-btn">Cardio</button>
                    <button data-activity="training" class="activity-btn">Training</button>
                </div>
                
                <div class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div class="stat-card" style="background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 8px; text-align: center;">
                        <div class="title" style="font-size: 0.85em; opacity: 0.9; margin-bottom: 5px;">Muscle Level</div>
                        <div id="bb-muscle-level" class="value" style="font-size: 1.4em; font-weight: bold; color: #62b4ff;">1</div>
                    </div>
                    
                    <div class="stat-card" style="background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 8px; text-align: center;">
                        <div style="display: flex; justify-content: space-between;">
                            <div class="title" style="font-size: 0.85em; opacity: 0.9;">Workout Weight</div>
                            <button id="bb-change-weight" style="background: none; border: none; color: #62b4ff; cursor: pointer; font-size: 1em; margin-left: 5px;">✏️</button>
                        </div>
                        <div id="bb-workout-weight" class="value" style="font-size: 1.4em; font-weight: bold; color: #62b4ff;">10kg</div>
                    </div>
                    
                    <div class="stat-card" style="background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 8px; text-align: center;">
                        <div class="title" style="font-size: 0.85em; opacity: 0.9; margin-bottom: 5px;">Max Lift</div>
                        <div id="bb-max-lift" class="value" style="font-size: 1.4em; font-weight: bold; color: #62b4ff;">10kg</div>
                    </div>
                    
                    <div class="stat-card" style="background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 8px; text-align: center;">
                        <div class="title" style="font-size: 0.85em; opacity: 0.9; margin-bottom: 5px;">Stamina Level</div>
                        <div id="bb-stamina-level" class="value" style="font-size: 1.4em; font-weight: bold; color: #62b4ff;">1</div>
                    </div>
                </div>
                
                <!-- Current Stamina -->
                <div class="progress-section" style="margin-bottom: 15px;">
                    <div class="header" style="display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: bold; font-size: 0.9em;">
                        <span>Stamina:</span>
                        <span id="bb-stamina-text">80/100</span>
                    </div>
                    <div class="progress-container" style="height: 20px; background: rgba(0,0,0,0.3); border-radius: 10px; overflow: hidden; position: relative;">
                        <div id="bb-stamina-bar" class="progress-fill" style="background: linear-gradient(90deg, #4caf50 0%, #8bc34a 100%);"></div>
                        <div class="progress-text" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 0.85em; font-weight: bold; text-shadow: 0 0 3px rgba(0,0,0,0.7);"></div>
                    </div>
                </div>
                
                <!-- Muscle EXP -->
                <div class="progress-section" style="margin-bottom: 15px;">
                    <div class="header" style="display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: bold; font-size: 0.9em;">
                        <span>Muscle EXP:</span>
                        <span id="bb-muscle-exp-text">0/100</span>
                    </div>
                    <div class="progress-container" style="height: 20px; background: rgba(0,0,0,0.3); border-radius: 10px; overflow: hidden; position: relative;">
                        <div id="bb-muscle-bar" class="progress-fill" style="background: linear-gradient(90deg, #2196f3 0%, #64b5f6 100%);"></div>
                        <div class="progress-text" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 0.85em; font-weight: bold; text-shadow: 0 0 3px rgba(0,0,0,0.7);"></div>
                    </div>
                </div>
                
                <!-- Stamina EXP -->
                <div class="progress-section" style="margin-bottom: 15px;">
                    <div class="header" style="display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: bold; font-size: 0.9em;">
                        <span>Stamina EXP:</span>
                        <span id="bb-stamina-exp-text">0/100</span>
                    </div>
                    <div class="progress-container" style="height: 20px; background: rgba(0,0,0,0.3); border-radius: 10px; overflow: hidden; position: relative;">
                        <div id="bb-stamina-exp-bar" class="progress-fill" style="background: linear-gradient(90deg, #9b59b6 0%, #8e44ad 100%);"></div>
                        <div class="progress-text" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 0.85em; font-weight: bold; text-shadow: 0 0 3px rgba(0,0,0,0.7);"></div>
                    </div>
                </div>
                
                <div id="bb-injury-warning" style="display: block; padding: 10px; background: rgba(229, 57, 53, 0.3); border-radius: 8px; margin-top: 15px; border-left: 3px solid #e53935; font-weight: bold; text-align: center; display: none;">
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
        const activities = ['idle', 'resting', 'cardio', 'training'];
        
        activities.forEach(activity => {
            const btn = this.domElement.querySelector(`button[data-activity="${activity}"]`);
            if (btn) {
                if (this.manager.state.activity === activity) {
                    btn.style.backgroundColor = 'rgba(46, 204, 113, 0.8)';
                    btn.style.boxShadow = '0 0 10px rgba(46, 204, 113, 0.5)';
                } else {
                    btn.style.backgroundColor = 'rgba(255,255,255,0.15)';
                    btn.style.boxShadow = 'none';
                }
            }
        });
    }

    update() {
        if (!this.domElement || !this.manager.character) return;
        
        // Update stats
        this.domElement.querySelector('#bb-muscle-level').textContent = this.manager.state.muscleLevel;
        const maxLift = this.manager.getMaxLift();
        this.domElement.querySelector('#bb-max-lift').textContent = `${maxLift.toFixed(1)}kg`;
        this.domElement.querySelector('#bb-workout-weight').textContent = `${this.manager.state.workoutWeight}kg`;
        this.domElement.querySelector('#bb-stamina-level').textContent = this.manager.state.staminaLevel;
        
        // Update progress bars
        const progress = this.manager.getProgress();
        
        // Stamina current
        this.domElement.querySelector('#bb-stamina-bar').style.width = `${progress.staminaPercent}%`;
        this.domElement.querySelector('#bb-stamina-text').textContent = 
            `${this.manager.state.currentStamina.toFixed(1)}/${this.manager.getMaxStamina().toFixed(1)}`;
        
        // Muscle EXP
        this.domElement.querySelector('#bb-muscle-bar').style.width = `${progress.muscleExpPercent}%`;
        this.domElement.querySelector('#bb-muscle-exp-text').textContent = 
            `${this.manager.state.muscleExp.toFixed(1)}/${progress.muscleMax.toFixed(1)}`;
        
        // Stamina EXP
        this.domElement.querySelector('#bb-stamina-exp-bar').style.width = `${progress.staminaExpPercent}%`;
        this.domElement.querySelector('#bb-stamina-exp-text').textContent = 
            `${this.manager.state.staminaExp.toFixed(1)}/${progress.staminaMax.toFixed(1)}`;
        
        // Update injury message
        const warning = this.domElement.querySelector('#bb-injury-warning');
        if (this.manager.state.injured) {
            if (this.manager.state.injuryTurns > 0) {
                warning.textContent = `⚠ INJURY! Rest for ${this.manager.state.injuryTurns} more turns`;
            }
            else {
                warning.textContent = '⚠ INJURY RECOVERED';
            }
            warning.style.display = 'block';
        } 
        else {
            warning.style.display = 'none';
        }
        
        // Update activity buttons
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
            const weight = prompt(`Set workout weight (max: ${max.toFixed(1)}kg)`, this.manager.state.workoutWeight);
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
        const header = this.domElement.querySelector('.draggable-header h3');
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

    updateIfVisible() {
        if (this.isVisible && this.domElement) {
            this.update();
        }
    }

    sendSystemMessage(message) {
        try {
            const chatInput = document.getElementById('send_textarea');
            if (!chatInput) return;
            
            chatInput.value = `/sys ${message}`;
            
            const sendButton = document.querySelector('#send_but');
            if (sendButton) {
                sendButton.click();
            } else {
                chatInput.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    bubbles: true
                }));
            }
        } catch (error) {
            console.error("Failed to send system message:", error);
        }
    }
}
