import { getContext, extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

console.log("[BodybuildingSystem] Starting extension loading...");

export const MODULE_NAME = 'bodybuilding_system';

try {
    async function initializeExtension() {
        console.log("[BodybuildingSystem] Importing modules...");

        const { BodybuildingManager } = await import("./src/BodybuildingManager.js");
        const { BodybuildingPanel } = await import("./src/BodybuildingPanel.js");

        const MODULE_NAME = 'bodybuilding_system';
        const manager = new BodybuildingManager();
        const panel = new BodybuildingPanel(manager);

        function getCurrentCharacter() {
            const context = getContext();
            return context.characters[context.characterId] || null;
        }

        function updateCharacter() {
            try {
                const character = getCurrentCharacter();
                if (!character) return;

                manager.setCharacter(character);
                panel.updateCharacter(character.name);
                console.log(`[BodybuildingSystem] Character set: ${character.name}`);
            } catch (error) {
                console.error("[BodybuildingSystem] Character update failed", error);
            }
        }

        function registerBodybuildingCommand() {
            try {
                const { registerSlashCommand } = SillyTavern.getContext();
                registerSlashCommand('body', () => panel.toggle(),
                    [], 'Toggle bodybuilding system panel', true, true);
                console.log("[BodybuildingSystem] Slash command registered");
            } catch (error) {
                console.error("[BodybuildingSystem] Command registration failed", error);
            }
        }

        function setupEventListeners() {
            try {
                const { eventSource, event_types } = getContext();

                eventSource.on(event_types.CHAT_CHANGED, () => {
                    manager.resetDailyStats();
                    updateCharacter();
                });
                
                eventSource.on(event_types.CHARACTER_CHANGED, updateCharacter);
                eventSource.on(event_types.APP_READY, updateCharacter);

                eventSource.on(event_types.MESSAGE_RECEIVED, () => {
                    const character = getCurrentCharacter();
                    if (!character || !manager.state.enabled) return;
                    
                    const sysMessage = manager.processActivity();
                    if (sysMessage && extension_settings[MODULE_NAME]?.enableSysMessages) {
                        panel.sendSystemMessage(sysMessage);
                    }
                    
                    panel.update();
                });

                console.log("[BodybuildingSystem] Event listeners set up");
            } catch (error) {
                console.error("[BodybuildingSystem] Event listener setup failed", error);
            }
        }

        function initSettings() {
            if (!extension_settings[MODULE_NAME]) {
                extension_settings[MODULE_NAME] = {
                    enableSysMessages: true,
                    riskOfInjury: true
                };
                saveSettingsDebounced();
            }
        }

        function createSettingsUI() {
            const settingsHtml = `
            <div class="bodybuilding-extension-settings">
                <div class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>Bodybuilding Settings</b>
                        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                    </div>
                    <div class="inline-drawer-content">
                        <div class="flex-container">
                            <label for="bb-sys-toggle">Enable system messages</label>
                            <input type="checkbox" id="bb-sys-toggle"
                                   ${extension_settings[MODULE_NAME].enableSysMessages ? 'checked' : ''}>
                        </div>
                        <div class="flex-container">
                            <label for="bb-injury-toggle">Enable injury risk</label>
                            <input type="checkbox" id="bb-injury-toggle"
                                   ${extension_settings[MODULE_NAME].riskOfInjury ? 'checked' : ''}>
                        </div>
                    </div>
                </div>
            </div>
            `;

            $("#extensions_settings").append(settingsHtml);

            $("#bb-sys-toggle").on("input", function() {
                extension_settings[MODULE_NAME].enableSysMessages = $(this).prop('checked');
                saveSettingsDebounced();
            });

            $("#bb-injury-toggle").on("input", function() {
                extension_settings[MODULE_NAME].riskOfInjury = $(this).prop('checked');
                saveSettingsDebounced();
            });
        }

        initSettings();
        registerBodybuildingCommand();
        setupEventListeners();
        createSettingsUI();
        // Initialize immediately
        updateCharacter();

        console.log("[BodybuildingSystem] Extension loaded successfully");
    }

    $(document).ready(() => {
        try {
            initializeExtension();
        } catch (error) {
            console.error("[BodybuildingSystem] Initialization failed", error);
        }
    });
    
} catch (loadingError) {
    console.error("[BodybuildingSystem] Critical loading error", loadingError);
}
