class ScriptSelector {
    constructor() {
        this.input = document.getElementById('scriptNameInput');
        this.select = document.getElementById('scriptSelect');
        this.customScriptsKey = 'customScripts';
        this.lastScriptKey = 'lastSelectedScript';

        this.predefinedScripts = [
            'welcome.js',
            'turtle.js',
            // Add more predefined scripts from manifest.json here
        ];

        this.initialize();
    }

    initialize() {
        this.loadCustomScripts();
        this.populateSelect();
        this.loadLastScript();
        this.setupEventListeners();
    }

    loadCustomScripts() {
        this.customScripts = JSON.parse(localStorage.getItem(this.customScriptsKey) || '[]');
    }

    saveCustomScripts() {
        localStorage.setItem(this.customScriptsKey, JSON.stringify(this.customScripts));
    }

    populateSelect() {
        // Clear existing options (except the first placeholder)
        this.select.innerHTML = '<option value="" disabled>Select a script...</option>';

        // Add predefined scripts group
        if (this.predefinedScripts.length > 0) {
            const predefinedGroup = document.createElement('optgroup');
            predefinedGroup.label = 'Predefined Scripts';
            this.predefinedScripts.forEach(script => {
                const option = document.createElement('option');
                option.value = script;
                option.textContent = script;
                predefinedGroup.appendChild(option);
            });
            this.select.appendChild(predefinedGroup);
        }

        // Add custom scripts group
        if (this.customScripts.length > 0) {
            const customGroup = document.createElement('optgroup');
            customGroup.label = 'Custom Scripts';
            this.customScripts.forEach(script => {
                const option = document.createElement('option');
                option.value = script;
                option.textContent = script;
                customGroup.appendChild(option);
            });
            this.select.appendChild(customGroup);
        }
    }

    loadLastScript() {
        const lastScript = localStorage.getItem(this.lastScriptKey) || 'testSketch.js';
        this.select.value = lastScript;
        if (!this.select.value) {
            this.input.value = lastScript;
        }
        this.updateScriptFileName(lastScript);
    }

    setupEventListeners() {
        this.select.addEventListener('change', () => {
            const scriptName = this.select.value;
            localStorage.setItem(this.lastScriptKey, scriptName);
            this.updateScriptFileName(scriptName);
            this.input.value = ''; // Clear input when select is used
        });

        this.input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const value = this.input.value.trim();
                if (!value) return;

                const scriptName = value.endsWith('.js') ? value : `${value}.js`;

                // Try to fetch the script first
                try {
                    const response = await fetch(scriptName);
                    if (!response.ok) {
                        console.error(`Script "${scriptName}" not found (${response.status})`);
                        return;
                    }

                    // Only proceed if script exists
                    if (!this.predefinedScripts.includes(scriptName) &&
                        !this.customScripts.includes(scriptName)) {
                        this.customScripts.push(scriptName);
                        this.saveCustomScripts();
                        this.populateSelect();
                    }

                    localStorage.setItem(this.lastScriptKey, scriptName);
                    this.updateScriptFileName(scriptName);
                    this.select.value = scriptName;
                    this.input.value = '';
                } catch (error) {
                    console.error(`Error fetching script "${scriptName}":`, error);
                }
            }
        });
    }

    updateScriptFileName(filename) {
        const scriptFileElement = document.getElementById('script-file-name');
        scriptFileElement.dataset.filename = filename;
        // call on change event listener
        scriptFileElement.dispatchEvent(new Event('change'));
        if (window.executionManager) {
            window.executionManager.loadScript();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.scriptSelector = new ScriptSelector();
}); 