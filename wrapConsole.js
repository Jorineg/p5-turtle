// Add this at the beginning of the file
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
};

function resetConsoleDisplay() {
    const consoleDisplay = document.getElementById('consoleDisplay');
    if (consoleDisplay) {
        consoleDisplay.innerHTML = '';
    }
}

function createConsoleDisplay() {
    const consoleDisplay = document.createElement('div');
    consoleDisplay.id = 'consoleDisplay';
    consoleDisplay.className = 'console-display';

    // Find the right panel content div
    const rightPanelContent = document.querySelector('.side-panel-right .panel-content');
    rightPanelContent.appendChild(consoleDisplay);

    return consoleDisplay;
}

function formatConsoleMessage(type, ...args) {
    const timestamp = new Date().toLocaleTimeString();
    const messageDiv = document.createElement('div');
    messageDiv.className = `console-message console-${type}`;

    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'console-timestamp';
    timestampSpan.textContent = `[${timestamp}] `;

    const messageContent = document.createElement('span');
    messageContent.className = 'console-content';
    messageContent.textContent = args.map(arg => {
        if (arg instanceof Error) {
            let position = arg.stack;
            const scriptFileName = document.getElementById('script-file-name').getAttribute('data-filename');
            const turtleScript = document.getElementById('turtleScript');
            if (!turtleScript) {
                return arg.stack;
            }
            const numberCodeLinesInjected = parseInt(turtleScript.getAttribute('data-number-code-lines-injected'));
            const scriptContent = document.getElementById('turtleScript').textContent;

            // start stacktrace at first occurence of '@scriptFileName'
            const startIndex = position.indexOf(`@${scriptFileName}:`);
            if (startIndex === -1) {
                return arg.stack;
            }
            position = position.slice(startIndex);
            position = position.split('\n')[0];
            let [, line, column] = position.split(':');
            line = parseInt(line);
            column = parseInt(column);
            const originalLine = scriptContent.split('\n')[line - 1].trim();
            line -= numberCodeLinesInjected;
            return `${arg.name} im Befehl: ${originalLine} (${scriptFileName}, Zeile ${line}, Spalte ${column})\n\nFehlernachricht: ${arg.message}`;
        }
        return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
    }).join(' ');

    messageDiv.appendChild(timestampSpan);
    messageDiv.appendChild(messageContent);
    return messageDiv;
}

function wrapConsole() {
    const consoleDisplay = createConsoleDisplay();

    function appendMessage(type, ...args) {
        const messageElement = formatConsoleMessage(type, ...args);
        consoleDisplay.appendChild(messageElement);
        consoleDisplay.scrollTop = consoleDisplay.scrollHeight;

        // Limit the number of messages (keep last 100)
        while (consoleDisplay.children.length > 200) {
            consoleDisplay.removeChild(consoleDisplay.firstChild);
        }
    }

    // Wrap each console method
    console.log = (...args) => {
        originalConsole.log.apply(console, args);
        appendMessage('log', ...args);
    };

    console.error = (...args) => {
        originalConsole.error.apply(console, args);
        appendMessage('error', ...args);
    };

    console.warn = (...args) => {
        originalConsole.warn.apply(console, args);
        appendMessage('warn', ...args);
    };

    console.info = (...args) => {
        originalConsole.info.apply(console, args);
        appendMessage('info', ...args);
    };

    console.debug = (...args) => {
        originalConsole.debug.apply(console, args);
        appendMessage('debug', ...args);
    };
}

// dom should be loaded before this
wrapConsole();
