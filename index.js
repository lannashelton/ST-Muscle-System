import { getContext, extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

export const MODULE_NAME = 'bodybuilding_system';

console.log("[BodybuildingSystem] Starting extension loading...");

function getCurrentCharacter() {
    const context = getContext();
    return context.characters[context.characterId] || null;
}

function registerSlashCommand(panel) {
    try {
        console.log("[BodybuildingSystem] Attempting to register /body command");
        const { registerSlashCommand } = getContext();
        
        registerSlashCommand('body', async () => {
            console.log("[BodybuildingSystem] /body command triggered");
            const character = getCurrentCharacter();
            if (!character) {
                toastr.info("Please select a character first");
                return;
            }
            panel.toggle();
        }, [], 'Toggle bodybuilding system panel', true, true);
        
        console.log("[BodybuildingSystem] /body command registered successfully");
    } catch (error) {
        console.error("[BodybuildingSystem] Failed to register command:", error);
    }
}

async function initializeExtension() {
    try {
        console.log("[BodybuildingSystem] Initializing extension...");
        
        const { BodybuildingManager } = await import("./src/BodybuildingManager.js");
        const { BodybuildingPanel } = await import("./src/BodybuildingPanel.js");

        const manager = new BodybuildingManager();
        const panel = new BodybuildingPanel(manager);

        function updateCharacter() {
            try {
                const character = getCurrentCharacter();
                if (!character) {
                    manager.setCharacter(null);
                    console.log("[BodybuildingSystem] No character selected");
                    return;
                }
                manager.setCharacter(character);
                panel.updateCharacter(character.name);
                console.log(`[BodybuildingSystem] Updated character: ${character.name}`);
            } catch (error) {
                console.error("[BodybuildingSystem] Character update failed", error);
            }
        }

        function setupEventListeners() {
            try {
                console.log("[BodybuildingSystem] Setting up event listeners");
                const { eventSource, event_types } = getContext();

                eventSource.on(event_types.CHAT_CHANGED, updateCharacter);
                eventSource.on(event_types.CHARACTER_CHANGED, updateCharacter);
                eventSource.on(event_types.APP_READY, () => {
                    console.log("[BodybuildingSystem] APP_READY received");
                    updateCharacter();
                });

                eventSource.on(event_types.MESSAGE_RECEIVED, () => {
                    const character = getCurrentCharacter();
                    if (!character || !manager.state.enabled || manager.state.activity === 'idle') return;
                    
                    const sysMessage = manager.processActivity();
                    if (sysMessage && extension_settings[MODULE_NAME]?.enableSysMessages) {
                        panel.sendSystemMessage(sysMessage);
                    }
                    
                    panel.updateIfVisible();
                });

                console.log("[BodybuildingSystem] Event listeners set");
            } catch (error) {
                console.error("[BodybuildingSystem] Event setup failed", error);
            }
        }

        function initSettings() {
            extension_settings[MODULE_NAME] = extension_settings[MODULE_NAME] || {
                enableSysMessages: true,
                riskOfInjury: true
            };
            console.log("[BodybuildingSystem] Settings initialized");
        }

        function createSettingsUI() {
            const settingsHtml = `
            <div class="bodybuilding-extension-settings">
                <div class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>Bodybuilding Settings</b>
                        <div class="inline-drawer-icon down"></div>
                    </div>
                    <div class="inline-drawer-content">
                        <div class="flex-container" style="margin-bottom: 10px;">
                            <label for="bb-sys-toggle" style="flex-grow: 1;">System messages</label>
                            <input type="checkbox" id="bb-sys-toggle" ${extension_settings[MODULE_NAME].enableSysMessages ? 'checked' : ''}>
                        </div>
                        <div class="flex-container">
                            <label for="bb-injury-toggle" style="flex-grow: 1;">Injury risk</label>
                            <input type="checkbox" id="bb-injury-toggle" ${extension_settings[MODULE_NAME].riskOfInjury ? 'checked' : ''}>
                        </div>
                    </div>
                </div>
            </div>`;

            $("#extensions_settings").append(settingsHtml);
            console.log("[BodybuildingSystem] Settings UI added");

            $("#bb-sys-toggle").on("input", function() {
                extension_settings[MODULE_NAME].enableSysMessages = $(this).prop('checked');
                saveSettingsDebounced();
            });

            $("#bb-injury-toggle").on("input", function() {
                extension_settings[MODULE_NAME].riskOfInjury = $(this).prop('checked');
                saveSettingsDebounced();
            });
        }

        // Initialize components in proper order
        initSettings();
        setupEventListeners();
        registerSlashCommand(panel); // Register command BEFORE updateCharacter
        updateCharacter();

        console.log("[BodybuildingSystem] Initialization complete");
    } catch (error) {
        console.error("[BodybuildingSystem] Init error", error);
    }
}

$(async () => {
    console.log("[BodybuildingSystem] Document ready");
    try {
        await initializeExtension();
    } catch (error) {
        console.error("[BodybuildingSystem] Main initialization failed", error);
    }
});
