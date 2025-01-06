console.log("executionLogic.js loaded");
let commandQueue = [];
let lastCommandTime = 0;
let commandDelay = 0; // 0 means instant execution
let orginalP5Functions = {};
let modifiedP5Functions = {};
let defaultColor;
const maxCommandsHistory = 200;
let commandHistoryDeletedCount = 0;
let commandQueueExecutionIndex = 0;

// Globale Turtle-Instanz
let t;

// Globale Funktionen
function forward(distance) {
    t._forward(distance);
    commandQueue.push([() => t.forward(distance), [distance]]);
}

function left(angle) {
    t._left(angle);
    commandQueue.push([() => t.left(angle), [angle]]);
}

function right(angle) {
    t._right(angle);
    commandQueue.push([() => t.right(angle), [angle]]);
}

function pendown() {
    commandQueue.push([() => t.pendown(), []]);
}

function penup() {
    commandQueue.push([() => t.penup(), []]);
}

function goto(x, y) {
    t._goto(x, y);
    commandQueue.push([() => t.goto(x, y), [x, y]]);
}

function color(...args) {
    commandQueue.push([() => t.color(...args), args]);
}

function width(w) {
    commandQueue.push([() => t.width(w), [w]]);
}

function angle(a) {
    commandQueue.push([() => t.angle(a), [a]]);
}

function showTurtle() {
    commandQueue.push([() => t.showTurtle(), []]);
    // t.showTurtle();
}

function hideTurtle() {
    commandQueue.push([() => t.hideTurtle(), []]);
    // t.hideTurtle();
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
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
        ctx.strokeStyle = "rgb(185, 185, 185)"
    } else {
        ctx.strokeStyle = '#646464';
    }
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

function updateGrid() {
    if (t.showingGrid) {
        drawGrid(t.gridSize);
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
    return t._x;
}

function getY() {
    return t._y;
}

// save translation and scale, scale to flip y axis
// restore translation and scale
function _text(text, ...args) {
    let [x, y] = [t.x, t.y];
    if (args.length === 2) {
        x = args[0];
        y = args[1];
    }
    orginalP5Functions["push"].apply(p5.instance);
    orginalP5Functions["translate"].apply(p5.instance, [x, y]);
    orginalP5Functions["scale"].apply(p5.instance, [1, -1]);
    p5.instance.useOriginal = true;
    orginalP5Functions["text"].apply(p5.instance, [text, 0, 0]);
    p5.instance.useOriginal = false;
    orginalP5Functions["pop"].apply(p5.instance);
}


function wrapP5Functions(p5Instance) {
    const functionsWithReturn = [
        // Calculation
        "abs", "ceil", "constrain", "dist", "exp", "floor", "lerp",
        "log", "mag", "map", "max", "min", "norm", "pow", "round",
        "sq", "sqrt",

        // Trigonometry
        "acos", "asin", "atan", "atan2", "cos", "sin", "tan",

        // Random
        "random", "randomGaussian", "randomSeed",

        // Creation/Loading
        "createCanvas", "createGraphics", "createImage", "createVector",
        "loadImage", "loadJSON", "loadStrings", "loadTable", "loadXML",

        // Color
        "color", "lerpColor", "get",

        // Type Conversion
        "boolean", "byte", "char", "float", "int", "str",

        // Array Functions
        "append", "concat", "reverse", "shorten", "shuffle", "sort",

        // String Functions
        "join", "match", "matchAll", "nf", "nfc", "nfp", "nfs", "split", "trim",

        // Systems
        "focused", "frameCount", "getFrameRate", "millis"
    ];

    const excludeFunctions = ["redraw", "callRegisteredHooksFor", "color", "resetMatrix", "text"]
    for (let key in p5Instance) {
        if (typeof p5Instance[key] === 'function' && !key.startsWith("_") && !excludeFunctions.includes(key) && !functionsWithReturn.includes(key)) {
            orginalP5Functions[key] = p5Instance[key];
            p5Instance[key] = function (...args) {
                if (p5Instance.useOriginal) {
                    orginalP5Functions[key].apply(p5Instance, args);
                } else {
                    commandQueue.push([() => orginalP5Functions[key].apply(p5Instance, args), args, key]);
                }
            };
            modifiedP5Functions[key] = p5Instance[key];
        }
    }

    // wrap text separately
    modifiedP5Functions["text"] = function (...args) {
        commandQueue.push([() => _text(...args), args, "text"]);
    }
    orginalP5Functions["text"] = p5Instance["text"];
    p5Instance["text"] = modifiedP5Functions["text"];

    // wrap resetMatrix separately
    modifiedP5Functions["resetMatrix"] = function (...args) {
        // do nothing...
    }
    orginalP5Functions["resetMatrix"] = p5Instance["resetMatrix"];
    p5Instance["resetMatrix"] = modifiedP5Functions["resetMatrix"];
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
    cmd[0]();
}

function getCommandString(cmd) {
    if (!cmd) return '';
    const funcStr = cmd[0].toString();
    const match = funcStr.match(/t\.(\w+)/);
    // iterate over args and add "" to str types
    let args = []
    for (let i = 0; i < cmd[1].length; i++) {
        if (typeof cmd[1][i] === 'string') {
            args.push(`"${cmd[1][i]}"`);
        } else {
            args.push(cmd[1][i]);
        }
    }
    if (match) {
        return `${match[1]}(${args.join(', ')})`;
    } else if (cmd[2]) {
        return `${cmd[2]}(${args.join(', ')})`;
    }
    return "Unknown Command";
}


function updateCommandDisplay() {
    const commandDisplay = document.getElementById('code-display');

    // Split command queue into executed and pending commands
    const executedCommands = commandQueue.slice(0, commandQueueExecutionIndex);
    const pendingCommands = commandQueue.slice(commandQueueExecutionIndex);

    // Handle executed commands display
    let executedCommandsDisplay = executedCommands;
    let executedHiddenCount = commandHistoryDeletedCount;
    if (executedCommandsDisplay.length > maxCommandsHistory) {
        executedHiddenCount += executedCommandsDisplay.length - maxCommandsHistory;
        executedCommandsDisplay = executedCommandsDisplay.slice(-maxCommandsHistory);
    }

    // Handle pending commands display
    let pendingCommandsDisplay = pendingCommands;
    let pendingHiddenCount = 0;
    if (pendingCommandsDisplay.length > maxCommandsHistory) {
        pendingHiddenCount = pendingCommandsDisplay.length - maxCommandsHistory;
        pendingCommandsDisplay = pendingCommandsDisplay.slice(0, maxCommandsHistory);
    }

    // Build display text
    const executedCommandsText = [
        executedHiddenCount > 0 ? `... (${executedHiddenCount} more commands)` : '',
        ...executedCommandsDisplay.map(cmd => getCommandString(cmd))
    ].filter(Boolean).join('\n');

    const pendingCommandsText = [
        ...pendingCommandsDisplay.map((cmd, index) => {
            const commandString = getCommandString(cmd);
            return index === 0 ? `<span class="code-line current">${commandString}</span>` : commandString;
        }),
        pendingHiddenCount > 0 ? `... (${pendingHiddenCount} more commands)` : ''
    ].filter(Boolean).join('\n');

    commandDisplay.innerHTML = `${executedCommandsText}\n${pendingCommandsText}`;
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

let currentScriptController = null;

function loadTurtleScript() {
    const scriptFileName = document.getElementById('script-file-name').getAttribute('data-filename');

    // Clean up any existing script
    if (currentScriptController) {
        currentScriptController.abort();
        // Clear any existing intervals/timeouts
        for (let i = setTimeout(function () { }, 0); i > 0; i--) {
            window.clearTimeout(i);
            window.clearInterval(i);
        }
    }

    // Create new abort controller
    currentScriptController = new AbortController();
    const signal = currentScriptController.signal;

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
                            // Add signal check in loop to allow interruption
                            const originalSetInterval = window.setInterval;
                            window.setInterval = (fn, delay, ...args) => {
                                const id = originalSetInterval(() => {
                                    if (currentScriptController.signal.aborted) {
                                        clearInterval(id);
                                        return;
                                    }
                                    fn(...args);
                                }, delay);
                                return id;
                            };
                            // if(draw && (typeof draw === 'function'){
                            //     setInterval(draw, )
                            // }

                            ${code}
                        } catch (error) {
                            const match = error.stack.match(/<anonymous>:([0-9]+):/);
                            const lineNumber = match ? match[1] - 2 : 'unknown';
                            console.error(\`Runtime error at line \${lineNumber}: \${error.message}\`);
                        }
                    })();
                `;

                // Add ability to remove script
                script.setAttribute('data-turtle-script', 'true');
                document.head.appendChild(script);

                // Listen for abort signal
                signal.addEventListener('abort', () => {
                    // Remove the script
                    script.remove();
                    // Restore original setInterval
                    window.setInterval = originalSetInterval;
                });

            } catch (error) {
                const lineNumber = error.lineNumber || 'unknown';
                console.error(`Syntax error at line ${lineNumber - 2}: ${error.message}`);
            }
        })
        .catch(error => {
            console.error('Failed to load script:', error.message);
        });
}

// Add a function to stop the current script
function stopTurtleScript() {
    if (currentScriptController) {
        currentScriptController.abort();
        // Remove any scripts we added
        document.querySelectorAll('script[data-turtle-script="true"]')
            .forEach(script => script.remove());
        console.log('Script execution stopped');
    }
}

function setInitP5Styles() {
    defaultColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
    orginalP5Functions["stroke"].apply(p5.instance, [defaultColor]);
    orginalP5Functions["strokeCap"].apply(p5.instance, [SQUARE]);
    orginalP5Functions["noFill"].apply(p5.instance);
    orginalP5Functions["clear"].apply(p5.instance);
    orginalP5Functions["frameRate"].apply(p5.instance, [120]);
    orginalP5Functions["strokeWeight"].apply(p5.instance, [1]);
    // resetMatrix(); // function not wrapped
    orginalP5Functions["resetMatrix"].apply(p5.instance);
    orginalP5Functions["translate"].apply(p5.instance, [t.canvasWidth / 2, t.canvasHeight / 2]);
    orginalP5Functions["scale"].apply(p5.instance, [1, -1]);
    // translation and scaling is applied in draw for every iteration. Not anymore...
    // text size and font
    orginalP5Functions["textFont"].apply(p5.instance, ["Segoe UI", 20]);
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

    document.getElementById('manualCommand').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            try {
                var result = eval(this.value); // Execute the command
                this.value = ''; // Clear input
            } catch (error) {
                console.error('Command error:', error.message);
            }
            if (result) console.log(result);
            e.preventDefault(); // Prevent form submission
        }
    });

    const scriptFileNameElement = document.getElementById('script-file-name');
    //add on change event listener to the script file name
    scriptFileNameElement.addEventListener('change', (e) => {
        initializeTurtleExecution();
    });

    // remove height property from main element
    document.querySelector('main').style.height = 'auto';

    setupCoordinateSystem();
    setupResizeObserver();

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
    wrapConsole();
    // setInitP5Styles();
}


// Optional: Draw-Funktion, wenn Animation gewünscht ist
function draw() {

    // I would like to have this in setup, but for some reason it does not work there...
    if (frameCount === 1) {
        setInitP5Styles();
    }

    Object.assign(globalThis, turtleFunctions);
    Object.assign(globalThis, modifiedP5Functions);

    const currentTime = new Date().getTime();
    // orginalP5Functions["translate"].apply(p5.instance, [t.canvasWidth / 2, t.canvasHeight / 2]);
    // orginalP5Functions["scale"].apply(p5.instance, [1, -1]);

    while (commandQueue.length > commandQueueExecutionIndex &&
        (commandDelay === 0 || currentTime - lastCommandTime >= commandDelay)) {
        const cmd = commandQueue[commandQueueExecutionIndex];
        executeCommand(cmd);
        lastCommandTime += commandDelay;
        commandQueueExecutionIndex++;
    }

    if (commandQueueExecutionIndex >= 3 * maxCommandsHistory) {
        const elementsToRemove = commandQueueExecutionIndex - maxCommandsHistory;
        commandQueue.splice(0, elementsToRemove);
        commandQueueExecutionIndex -= elementsToRemove;
        commandHistoryDeletedCount += elementsToRemove;
    }

    // translate back
    // orginalP5Functions["scale"].apply(p5.instance, [1, -1]);
    // orginalP5Functions["translate"].apply(p5.instance, [-t.canvasWidth / 2, -t.canvasHeight / 2]);


    updateCommandDisplay();
    if (frameCount === 1) {
        loadTurtleScript();
    }
}

function initializeTurtleExecution() {
    setInitP5Styles();
    t.setInitValues();
    lastCommandTime = new Date().getTime();
    executedCommands = [];
    commandQueue = [];
    commandHistoryDeletedCount = 0;
    commandQueueExecutionIndex = 0;
    resetConsoleDisplay();
    loadTurtleScript();
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
        // Clear localStorage
        localStorage.removeItem('canvasWidth');
        localStorage.removeItem('canvasHeight');

        location.reload();
    };
    return [parseInt(savedWidth), parseInt(savedHeight)];
}

function setupResizeObserver() {
    const canvasContainer = document.getElementById('canvasContainer');
    t.resizeObserver = new ResizeObserver(() => {
        t.updateCanvasRect();
        t.updateTurtleVisual();
        updateGrid();
    });
    t.resizeObserver.observe(canvasContainer);
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
        initializeTurtleExecution();
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
        nextCommandButton.disabled = commandDelay !== Infinity;

        // if commandQueue has 100000+ elements and commandDelay is 0,
        // reload script
        if (commandQueue.length > 100000 && commandDelay === 0) {
            initializeTurtleExecution();
        }
    });
}

function updateSpeedLabel(delay) {
    const speedSteps = [0, 0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, Infinity];

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
