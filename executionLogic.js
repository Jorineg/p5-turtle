let commandQueue = [];
let executedCommands = [];
let lastCommandTime = 0;
let commandDelay = 0; // 0 means instant execution
let orginalP5Functions = {};
let modifiedP5Functions = {};

// Globale Turtle-Instanz
let t;

// Globale Funktionen
function forward(distance) {
    commandQueue.push([() => t.forward(distance), [distance]]);
}

function left(angle) {
    commandQueue.push([() => t.left(angle), [angle]]);
}

function right(angle) {
    commandQueue.push([() => t.right(angle), [angle]]);
}

function pendown() {
    commandQueue.push([() => t.pendown(), []]);
}

function penup() {
    commandQueue.push([() => t.penup(), []]);
}

function goto(x, y) {
    commandQueue.push([() => t.goto(x, y), [x, y]]);
}

function color(...args) {
    commandQueue.push([() => t.color(...args), args]);
}

function width(w) {
    commandQueue.push([() => t.width(w), [w]]);
}

function clear() {
    commandQueue.push([() => background(255), []]);
}

function angle(a) {
    commandQueue.push([() => t.angle(a), [a]]);
}

function showTurtle() {
    // commandQueue.push([() => t.showTurtle(), []]);
    t.showTurtle();
}

function hideTurtle() {
    // commandQueue.push([() => t.hideTurtle(), []]);
    t.hideTurtle();
}

// Add new global functions
function drawGrid(size = 50) {
    // Remove existing grid if any
    const existingGrid = document.getElementById('gridCanvas');
    if (existingGrid) existingGrid.remove();

    // Create new canvas element
    const gridCanvas = document.createElement('canvas');
    gridCanvas.id = 'gridCanvas';

    // Match size with p5 canvas
    gridCanvas.width = t.canvasWidth;
    gridCanvas.height = t.canvasHeight;

    let scale = t.canvasRect.width / t.canvasWidth;

    // Position absolutely over p5 canvas
    gridCanvas.style.position = 'absolute';
    gridCanvas.style.pointerEvents = 'none'; // Allow clicks to pass through
    gridCanvas.style.zIndex = '1';

    // Insert after the p5 canvas
    const p5Canvas = document.querySelector('canvas');
    p5Canvas.parentNode.insertBefore(gridCanvas, p5Canvas.nextSibling);
    gridCanvas.style.left = p5Canvas.offsetLeft + 'px';
    gridCanvas.style.top = p5Canvas.offsetTop + 'px';
    gridCanvas.style.width = t.canvasRect.width + 'px';
    gridCanvas.style.height = t.canvasRect.height + 'px';

    const ctx = gridCanvas.getContext('2d');

    // Draw main axes
    ctx.strokeStyle = '#646464'; // rgb(100,100,100)
    ctx.lineWidth = 2;

    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(t.canvasWidth / 2, 0);
    ctx.lineTo(t.canvasWidth / 2, t.canvasHeight);
    ctx.stroke();

    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, t.canvasHeight / 2);
    ctx.lineTo(t.canvasWidth, t.canvasHeight / 2);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#C8C8C8'; // rgb(200,200,200)
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = size; x < t.canvasWidth / 2; x += size) {
        ctx.beginPath();
        ctx.moveTo(t.canvasWidth / 2 + x, 0);
        ctx.lineTo(t.canvasWidth / 2 + x, t.canvasHeight);
        ctx.moveTo(t.canvasWidth / 2 - x, 0);
        ctx.lineTo(t.canvasWidth / 2 - x, t.canvasHeight);
        ctx.stroke();
    }

    // Horizontal lines
    for (let y = size; y < t.canvasHeight / 2; y += size) {
        ctx.beginPath();
        ctx.moveTo(0, t.canvasHeight / 2 + y);
        ctx.lineTo(t.canvasWidth, t.canvasHeight / 2 + y);
        ctx.moveTo(0, t.canvasHeight / 2 - y);
        ctx.lineTo(t.canvasWidth, t.canvasHeight / 2 - y);
        ctx.stroke();
    }
}

function showGrid(size = 50) {
    t.gridSize = size;
    t.showingGrid = true;
    document.getElementById('showGrid').checked = true;
    drawGrid(size);
}

function hideGrid() {
    t.showingGrid = false;
    document.getElementById('showGrid').checked = false;
    const gridCanvas = document.getElementById('gridCanvas');
    if (gridCanvas) gridCanvas.remove();
}

function getX() {
    return t.x;
}

function getY() {
    return t.y;
}


function wrapP5Functions(p5Instance) {
    const excludeFunctions = ["redraw", "callRegisteredHooksFor", "color", "resetMatrix"]
    for (let key in p5Instance) {
        if (typeof p5Instance[key] === 'function' && !key.startsWith("_") && !excludeFunctions.includes(key)) {
            orginalP5Functions[key] = p5Instance[key];
            p5Instance[key] = function (...args) {
                commandQueue.push([() => orginalP5Functions[key].apply(p5Instance, args), args, key]);
            };
            modifiedP5Functions[key] = p5Instance[key];
        }
    }
}



// Statt einzelner window-Zuweisungen
const turtleFunctions = {
    forward,
    left,
    right,
    pendown,
    penup,
    goto,
    color,
    width,
    clear,
    angle,
    showTurtle,
    hideTurtle,
    showGrid,
    hideGrid,
    getX,
    getY
};

// Füge die Funktionen zum globalThis-Objekt hinzu
Object.assign(globalThis, turtleFunctions);


// Modify the command execution to set the flag
function executeCommand(cmd) {
    executedCommands.push(cmd);
    cmd[0]();
}

function getCommandString(cmd) {
    if (!cmd) return '';
    const funcStr = cmd[0].toString();
    const match = funcStr.match(/t\.(\w+)/);
    if (match) {
        const args = cmd[1];
        return `${match[1]}(${args.join(', ')})`;
    } else if (cmd[2]) {
        return `${cmd[2]}(${cmd[1].join(', ')})`;
    }
    return "Unknown Command";
}


function updateCommandDisplay() {
    const commandDisplay = document.getElementById('code-display');
    const executedCommandsText = executedCommands.map(cmd => getCommandString(cmd)).join('\n');
    const commandQueueText = commandQueue.map((cmd, index) => {
        const commandString = getCommandString(cmd);
        return index === 0 ? `<span class="code-line current">${commandString}</span>` : commandString;
    }).join('\n');

    commandDisplay.innerHTML = `${executedCommandsText}\n${commandQueueText}`;
}

function setSize(w, h) {
    commandQueue.push([() => {
        if (t.drawingStarted) {
            console.warn('Warning: setSize() clears the canvas. For best results, call setSize() before any drawing commands.');
        }
        orginalP5Functions["resizeCanvas"].apply(p5.instance, [w, h]);
        t.canvasWidth = w;
        t.canvasHeight = h;
        orginalP5Functions["background"].apply(p5.instance, [255]);

        // Update UI elements
        document.getElementById('canvasWidth').value = w;
        document.getElementById('canvasHeight').value = h;

        // Update localStorage
        localStorage.setItem('canvasWidth', w);
        localStorage.setItem('canvasHeight', h);
        adjustCanvasDisplay();
        t.updateCanvasRect();
    }, [w, h]]);
}

// Load the turtle script
function loadTurtleScript() {
    const scriptFileName = document.getElementById('script-file-name').getAttribute('data-filename');

    fetch(scriptFileName)
        .then(response => response.text())
        .then(code => {
            try {
                // First check for syntax errors
                new Function(code);

                const script = document.createElement('script');
                script.textContent = `
                    (function() { 
                        try {
                            ${code}
                        } catch (error) {
                            // Extract line number from stack trace
                            const match = error.stack.match(/<anonymous>:([0-9]+):/);
                            const lineNumber = match ? match[1] - 2 : 'unknown'; // Subtract 2 to account for the wrapper function
                            console.error(\`Runtime error at line \${lineNumber}: \${error.message}\`);
                        }
                    })();
                `;
                document.head.appendChild(script);
            } catch (error) {
                // For syntax errors, the line number is usually available in error.lineNumber
                const lineNumber = error.lineNumber || 'unknown';
                console.error(`Syntax error at line ${lineNumber - 2}: ${error.message}`);
            }
        })
        .catch(error => {
            console.error('Failed to load script:', error.message);
        });
}

function setThemeP5Styles() {
    const tertiaryColor = getComputedStyle(document.documentElement).getPropertyValue('--tertiary-color');
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
    orginalP5Functions["background"].apply(p5.instance, [tertiaryColor]);
    orginalP5Functions["stroke"].apply(p5.instance, [textColor]);
}

function adjustCanvasDisplay() {
    const canvas = document.querySelector('.p5Canvas');

    if (!canvas) return;
    const maxDimension = 650;

    // Get the actual canvas dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Calculate scale factor
    const scale = Math.min(1, maxDimension / Math.max(width, height));

    // Apply the scaled dimensions while maintaining aspect ratio
    canvas.style.width = (width * scale) + 'px';
    canvas.style.height = (height * scale) + 'px';
}


// p5.js Setup
function setup() {
    let [width, height] = setupSizeControls();
    createCanvas(width, height);
    adjustCanvasDisplay();
    background(255);
    strokeCap(SQUARE);
    frameRate(120);
    noFill();
    t = new Turtle(width, height);

    setupExportControls();

    // load current show state of turtle and grid
    if (t.showingGrid) {
        showGrid();
    } else {
        hideGrid();
    }
    if (t.visible) {
        showTurtle();
    } else {
        hideTurtle();
    }

    // Add turtle visibility checkbox handler
    document.getElementById('showTurtle').onchange = (e) => {
        if (e.target.checked) {
            t.showTurtle();
        } else {
            t.hideTurtle();
        }
    };

    // remove height property from main element
    document.querySelector('main').style.height = 'auto';

    setupCoordinateSystem();

    // Add grid checkbox handler
    document.getElementById('showGrid').onchange = (e) => {
        if (e.target.checked) {
            showGrid();
        } else {
            hideGrid();
        }
    };
    updateCommandDisplay();
    setupSpeedControl();
    lastCommandTime = new Date().getTime();
    wrapP5Functions(p5.instance);
    setThemeP5Styles();
    wrapConsole();
}


// Optional: Draw-Funktion, wenn Animation gewünscht ist
function draw() {
    Object.assign(globalThis, turtleFunctions);
    Object.assign(globalThis, modifiedP5Functions);

    const currentTime = new Date().getTime();
    orginalP5Functions["translate"].apply(p5.instance, [t.canvasWidth / 2, t.canvasHeight / 2]);
    orginalP5Functions["scale"].apply(p5.instance, [1, -1]);

    while (commandQueue.length > 0 &&
        (commandDelay === 0 || currentTime - lastCommandTime >= commandDelay)) {
        const cmd = commandQueue.shift();
        executeCommand(cmd);
        lastCommandTime += commandDelay;
    }

    updateCommandDisplay();
    if (frameCount === 1) {
        loadTurtleScript();
    }
}

function redrawExecutedCommands() {
    setThemeP5Styles();
    t.setInitValues();
    lastCommandTime = new Date().getTime();
    commandQueue = executedCommands.concat(commandQueue);
    executedCommands = [];
}

function setupExportControls() {
    document.getElementById('copyCanvas').onclick = async () => {
        try {
            const canvas = document.querySelector('canvas');

            // Convert canvas to blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });

            // Create ClipboardItem
            const item = new ClipboardItem({ 'image/png': blob });

            // Copy to clipboard
            await navigator.clipboard.write([item]);

            // Show success feedback
            const button = document.getElementById('copyCanvas');
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            // Show error feedback
            const button = document.getElementById('copyCanvas');
            const originalText = button.textContent;
            button.textContent = 'Copy failed';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        }
    };

    document.getElementById('downloadCanvas').onclick = () => {
        const dataUrl = document.querySelector('canvas').toDataURL();
        const link = document.createElement('a');
        link.download = 'turtle-drawing.png';
        link.href = dataUrl;
        link.click();
    };
}

function setupSizeControls() {
    // Load saved size from localStorage or use defaults
    const savedWidth = localStorage.getItem('canvasWidth') || 700;
    const savedHeight = localStorage.getItem('canvasHeight') || 700;

    // Set initial input values
    document.getElementById('canvasWidth').value = savedWidth;
    document.getElementById('canvasHeight').value = savedHeight;

    // Apply saved size on startup
    // setSize(parseInt(savedWidth), parseInt(savedHeight));
    // commandQueue.push(() => setSize(parseInt(savedWidth), parseInt(savedHeight)));

    // Handle apply button click
    document.getElementById('applySize').onclick = () => {
        const width = parseInt(document.getElementById('canvasWidth').value);
        const height = parseInt(document.getElementById('canvasHeight').value);

        // Save to localStorage
        localStorage.setItem('canvasWidth', width);
        localStorage.setItem('canvasHeight', height);

        // Reload the page to restart with new size
        location.reload();
    };

    // Handle reset button click
    document.getElementById('resetSize').onclick = () => {
        // const defaultWidth = 700;
        // const defaultHeight = 700;

        // // Update inputs
        // document.getElementById('canvasWidth').value = defaultWidth;
        // document.getElementById('canvasHeight').value = defaultHeight;

        // Clear localStorage
        localStorage.removeItem('canvasWidth');
        localStorage.removeItem('canvasHeight');

        location.reload();
    };
    return [parseInt(savedWidth), parseInt(savedHeight)];
}


// Add to setupExportControls or create new setup function
function setupCoordinateSystem() {
    const canvas = document.querySelector('canvas');
    const coordDisplay = document.createElement('div');
    coordDisplay.id = 'coordDisplay';
    coordDisplay.style.position = 'fixed';
    coordDisplay.style.padding = '5px';
    coordDisplay.style.background = 'rgba(0,0,0,0.7)';
    coordDisplay.style.color = 'white';
    coordDisplay.style.borderRadius = '4px';
    coordDisplay.style.fontSize = '12px';
    coordDisplay.style.display = 'none';
    coordDisplay.style.zIndex = '1000';
    document.body.appendChild(coordDisplay);

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();

        let scale = t.canvasWidth / rect.width;
        const x = Math.round((e.clientX - rect.left - rect.width / 2) * scale);
        const y = Math.round(-(e.clientY - rect.top - rect.height / 2) * scale);

        coordDisplay.textContent = `(${x}, ${y})`;
        coordDisplay.style.left = `${e.clientX + 10}px`;
        coordDisplay.style.top = `${e.clientY + 10}px`;
        coordDisplay.style.display = 'block';
    });

    canvas.addEventListener('mouseout', () => {
        coordDisplay.style.display = 'none';
    });

    canvas.addEventListener('click', () => {
        navigator.clipboard.writeText("goto" + coordDisplay.textContent)
            .then(() => {
                const originalText = coordDisplay.textContent;
                coordDisplay.textContent = 'Copied!';
                setTimeout(() => {
                    coordDisplay.textContent = originalText;
                }, 1000);
            });
    });
}

function setupSpeedControl() {
    const speedSlider = document.getElementById('speedSlider');
    const restartButton = document.getElementById('restartExecution');
    const nextCommandButton = document.getElementById('nextCommand');

    // Initial setup of next button state
    nextCommandButton.disabled = true;

    // Load saved speed from localStorage
    let savedDelay = localStorage.getItem('commandDelay') || '0';
    savedDelay = parseInt(savedDelay);
    speedSlider.value = savedDelay;
    commandDelay = updateSpeedLabel(savedDelay);

    // Update initial button state
    nextCommandButton.disabled = commandDelay !== Infinity;

    restartButton.addEventListener('click', () => {
        redrawExecutedCommands();
    });

    nextCommandButton.addEventListener('click', () => {
        lastCommandTime = -Infinity;
    });

    speedSlider.addEventListener('input', (e) => {
        if (commandDelay === Infinity) {
            lastCommandTime = new Date().getTime();
        }
        commandDelay = updateSpeedLabel(e.target.value);
        localStorage.setItem('commandDelay', e.target.value);

        // Update button state when speed changes
        nextCommandButton.disabled = commandDelay !== Infinity;
    });
}

function updateSpeedLabel(delay) {
    const speedSteps = [0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, Infinity];

    const index = parseInt(delay);
    const value = speedSteps[index];

    // Update the display
    if (value === 0) {
        speedValue.textContent = 'Instant';
    } else if (value === Infinity) {
        speedValue.textContent = 'Manual';
    } else {
        speedValue.textContent = value + 'ms';
    }
    return value;
}

// Add this at the beginning of the file
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
};

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
    messageContent.textContent = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

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
        while (consoleDisplay.children.length > 500) {
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
