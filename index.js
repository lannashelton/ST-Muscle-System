import { getContext, extension_settings } from "../../extensions.js";
import { saveSettingsDebounced, SlashCommandParser, SlashCommand, ARGUMENT_TYPE } from "../../../script.js";
import { toastr } from "../../../toast.js";

export const MODULE_NAME = 'bodybuilding_system';

console.log("[BodybuildingSystem] Starting extension loading...");

function getCurrentCharacter() {
    const context = getContext();
    return context.characters[context.characterId] || null;
}

function registerSlashCommand(panel) {
    try {
        // Use the new slash command registration method
        SlashCommandParser.addCommandObject(SlashCommand.fromProps({
            name: 'body',
            callback: async (namedArgs, unnamedArgs) => {
                const character = getCurrentCharacter();
                if (!character) {
                    toastr.info("Please select a character first");
                    return;
                }
                panel.toggle();
            },
            returns: 'nothing',
            description: 'Toggles bodybuilding system panel',
            helpString: 'Opens/closes the bodybuilding management interface',
            isDirect: true
        }));
        console.log("[BodybuildingSystem] Slash command '/body' registered");
    } catch (e) {
        console.error("[BodybuildingSystem] Slash command registration failed", e);
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
                    return;
                }
                manager.setCharacter(character);
                panel.updateCharacter(character.name);
            } catch (error) {
                console.error("Character update failed", error);
            }
        }

        function setupEventListeners() {
            const { eventSource, event_types } = getContext();

            eventSource.on(event_types.CHAT_CHANGED, updateCharacter);
            eventSource.on(event_types.CHARACTER_CHANGED, updateCharacter);
            eventSource.on(event_types.APP_READY, updateCharacter);

            eventSource.on(event_types.MESSAGE_RECEIVED, () => {
                const character = getCurrentCharacter();
                if (!character || !manager.state.enabled || manager.state.activity === 'idle') return;
                
                const sysMessage = manager.processActivity();
                if (sysMessage && extension_settings[MODULE_NAME]?.enableSysMessages) {
                    panel.sendSystemMessage(sysMessage);
                }
                
                panel.updateIfVisible();
            });
        }

        function initSettings() {
            extension_settings[MODULE_NAME] = extension_settings[MODULE_NAME] || {
                enableSysMessages: true,
                riskOfInjury: true
            };
        }

        function createSettingsUI() {
            try {
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

                const $settingsContainer = $("#extensions_settings");
                if ($settingsContainer.length) {
                    // Remove any existing instance
                    $settingsContainer.find(".bodybuilding-extension-settings").remove();
                    $settingsContainer.append(settingsHtml);

                    $("#bb-sys-toggle").on("input", function() {
                        extension_settings[MODULE_NAME].enableSysMessages = $(this).prop('checked');
                        saveSettingsDebounced();
                    });

                    $("#bb-injury-toggle").on("input", function() {
                        extension_settings[MODULE_NAME].riskOfInjury = $(this).prop('checked');
                        saveSettingsDebounced();
                    });
                    
                    console.log("[BodybuildingSystem] Settings UI loaded");
                } else {
                    console.error("[BodybuildingSystem] Settings container not found");
                }
            } catch (e) {
                console.error("[BodybuildingSystem] Failed to create settings UI", e);
            }
        }

        initSettings();
        registerSlashCommand(panel);
        setupEventListeners();
        createSettingsUI();
        updateCharacter();

        console.log("[BodybuildingSystem] Initialization complete");

    } catch (error) {
        console.error("Bodybuilding init error", error);
        toastr.error("Bodybuilding system failed to initialize", "Extension Error");
    }
}

// Ensure jQuery is available
if (window.jQuery) {
    $(initializeExtension);
} else {
    console.error("[BodybuildingSystem] jQuery not available yet. Waiting...");
    window.addEventListener('DOMContentLoaded', () => {
        $(initializeExtension);
    });
}
