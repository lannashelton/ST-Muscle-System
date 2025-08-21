import { registerSlashCommand } from '../../../slash-commands.js';
import { BodybuildingManager } from './src/BodybuildingManager.js';
import { BodybuildingPanel } from './src/BodybuildingPanel.js';
import { getContext, extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

export const MODULE_NAME = 'bodybuilding_system';

const manager = new BodybuildingManager();
const panel = new BodybuildingPanel(manager);
let isInitialized = false;

function getCurrentCharacter() {
    const context = getContext();
    return context.characters[context.characterId] || null;
}

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
    eventSource.on(event_types.APP_READY, () => {
        if (!isInitialized) {
            isInitialized = true;
            initSettings();
            createSettingsUI();
            updateCharacter();
        }
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
}

function initSettings() {
    extension_settings[MODULE_NAME] = extension_settings[MODULE_NAME] || {
        enableSysMessages: true,
        riskOfInjury: true
    };
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

    $("#bb-sys-toggle").on("input", function() {
        extension_settings[MODULE_NAME].enableSysMessages = $(this).prop('checked');
        saveSettingsDebounced();
    });

    $("#bb-injury-toggle").on("input", function() {
        extension_settings[MODULE_NAME].riskOfInjury = $(this).prop('checked');
        saveSettingsDebounced();
    });
}

// Register slash command
registerSlashCommand('body', () => {
    const character = getCurrentCharacter();
    if (!character) {
        toastr.info("Please select a character first");
        return;
    }
    panel.toggle();
}, [], 'Toggle bodybuilding system panel', true, true);

// Initialize extension
$(document).ready(() => {
    try {
        setupEventListeners();
        console.log("[BodybuildingSystem] Extension initialized");
    } catch (error) {
        console.error("Bodybuilding init error", error);
    }
});
