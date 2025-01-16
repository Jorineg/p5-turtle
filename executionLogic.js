let lastCommandTime = 0;
let commandDelay = 0; // 0 means instant execution
let originalP5Functions = {};
let modifiedP5Functions = {};
let defaultColor;
const maxCommandsHistory = 200;
let commandHistoryDeletedCount = 0;
let commandQueueExecutionIndex = 0;
let numberCodeLinesInjected = 0;
let canvasWidth;
let canvasHeight;
const speedSteps = [0, 0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, Infinity];


class TurtleArgumentError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TurtleArgumentError';
    }
}

const nName = {
    1: 'erste',
    2: 'zweite',
    3: 'dritte',
    4: 'vierte',
}


function checkNumberArgument(n, arg) {
    if (typeof arg !== 'number') {
        let number = Number(arg);
        if (Number.isNaN(number)) {
            const error = new TurtleArgumentError(`Das ${nName[n]} Argument muss eine Zahl sein. '${arg}' ist vom Typ ${typeof arg} und konnte nicht in eine Zahl umgewandelt werden.`);
            throw error;
        }else{
            console.warn(`Das ${nName[n]} Argument ist vom Typ ${typeof arg} und wurde automatisch in eine Zahl umgewandelt.`);
            return number;
        }
    } else if (Number.isNaN(arg)) {
        const error = new TurtleArgumentError(`Das ${nName[n]} Argument ist NaN`);
        throw error;
    } else if (arg === Infinity) {
        const error = new TurtleArgumentError(`Das ${nName[n]} Argument ist Infinity`);
        throw error;
    } else if (arg === -Infinity) {
        const error = new TurtleArgumentError(`Das ${nName[n]} Argument ist -Infinity`);
        throw error;
    }   
    return arg;
}

function checkStringArgument(n, arg) {
    if (typeof arg !== 'string') {
        console.warn(`Das ${nName[n]} Argument ist vom Typ ${typeof arg} und wurde automatisch in einen String umgewandelt.`);
        return String(arg);
    }
    return arg;
}

function checkArgument(n, type, arg) {
    if (arg === undefined) {
        const error = new TurtleArgumentError(`Das ${nName[n]} Argument ist undefined`);
        throw error;
    }else if (arg === null) {
        const error = new TurtleArgumentError(`Das ${nName[n]} Argument ist null`);
        throw error;
    }
    
    if (type === 'number') {
        return checkNumberArgument(n, arg);
    } else if (type === 'string') {
        return checkStringArgument(n, arg);
    }
    return arg;
}

// Globale Funktionen
function forward(distance) {
    distance = checkArgument(1, 'number', distance);
    t._forward(distance);
    commandQueue.push([() => t.forward(distance), [distance]]);
}

function left(angle) {
    angle = checkArgument(1, 'number', angle);
    t._left(angle);
    commandQueue.push([() => t.left(angle), [angle]]);
}

function right(angle) {
    angle = checkArgument(1, 'number', angle);
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
    x = checkArgument(1, 'number', x);
    y = checkArgument(2, 'number', y);
    t._goto(x, y);
    commandQueue.push([() => t.goto(x, y), [x, y]]);
}

function color(...args) {
    if (args.length === 0) {
        throw new TurtleArgumentError('Das Farbe-Argument ist leer');
    }
    // check if any of the arguments is undefined or null
    if (args.some(arg => arg === undefined || arg === null)) {
        throw new TurtleArgumentError('Das Farbe-Argument enthält undefined oder null');
    }
    
    // check if string and in simpleColors object
    // if (args.length === 1 && typeof args[0] === 'string' && simpleColors.hasOwnProperty(args[0])) {
        // args = [simpleColors[args[0]]];
    // }

    commandQueue.push([() => t.color(...args), args]);
}

function width(w) {
    w = checkArgument(1, 'number', w);
    commandQueue.push([() => t.width(w), [w]]);
}

function angle(a) {
    a = checkArgument(1, 'number', a);
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

function randomColor_h(){
    let [r, g, b] = [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
    commandQueue.push([() => t.color(r, g, b), [r, g, b]]);
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
// use like drawEmoji("1F929",50); 
function drawEmoji(unicode, size=20){
    commandQueue.push([() => {
        let [x, y] = [t.x, t.y];
        let currentTextSize = originalP5Functions["textSize"].apply(p5.instance);   
        originalP5Functions["textSize"].apply(p5.instance, [size]);
        // convert hex string to number
        let unicodeNumber = parseInt(unicode, 16);
        let currentTextAlign = originalP5Functions["textAlign"].apply(p5.instance);
        const translateY = -size/2.85;
        originalP5Functions["translate"].apply(p5.instance, [0, translateY]);
        originalP5Functions["textAlign"].apply(p5.instance, [CENTER]);
        let text;
        try {
            text = String.fromCodePoint(unicodeNumber);
        } catch (error) {
            text = unicode;
        }
        _text(text, x, y);
        originalP5Functions["textAlign"].apply(p5.instance, [currentTextAlign["horizontal"], currentTextAlign["vertical"]]);
        originalP5Functions["translate"].apply(p5.instance, [0, -translateY]);
        originalP5Functions["textSize"].apply(p5.instance, [currentTextSize]);
    }, [unicode, size], "drawEmoji"]);
}

// save translation and scale, scale to flip y axis
// restore translation and scale
function _text(text, ...args) {
    let [x, y] = [t.x, t.y];
    if (args.length === 2) {
        x = args[0];
        y = args[1];
    }
    originalP5Functions["push"].apply(p5.instance);
    originalP5Functions["translate"].apply(p5.instance, [x, y]);
    originalP5Functions["scale"].apply(p5.instance, [1, -1]);
    p5.instance.useOriginal = true;
    originalP5Functions["text"].apply(p5.instance, [text, 0, 0]);
    p5.instance.useOriginal = false;
    originalP5Functions["pop"].apply(p5.instance);
}

function _image(image, ...args) {
    let [x, y] = [t.x, t.y];
    if (args.length >= 2) {
        x = args[0];
        y = args[1];
        args[0] = 0;
        args[1] = 0;
    }

    originalP5Functions["push"].apply(p5.instance);
    originalP5Functions["translate"].apply(p5.instance, [x, y]);
    originalP5Functions["scale"].apply(p5.instance, [1, -1]);
    p5.instance.useOriginal = true;
    originalP5Functions["image"].apply(p5.instance, [image, ...args]);
    p5.instance.useOriginal = false;
    originalP5Functions["pop"].apply(p5.instance);
}

// if only one argument is given, use turtle postion as center
function _circle(...args) {
    if (args.length === 1) {
        args.unshift(t.x, t.y);
    }
    originalP5Functions["circle"].apply(p5.instance, args);
}

function _ellipse(...args) {
    if (args.length <= 2) {
        args.unshift(t.x, t.y);
    }
    originalP5Functions["ellipse"].apply(p5.instance, args);
}

function _rect(...args) {
    if (args.length <= 2) {
        args.unshift(t.x, t.y);
    }
    originalP5Functions["rect"].apply(p5.instance, args);
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

    const excludeFunctions = ["redraw", "callRegisteredHooksFor", "color", "resetMatrix", "text", "image", "circle"]
    const deleteFuntions = ["red", "green", "blue"]
    for (let key in p5Instance) {
        if (typeof p5Instance[key] === 'function' && !key.startsWith("_") && !excludeFunctions.includes(key) && !functionsWithReturn.includes(key) && !deleteFuntions.includes(key)) {
            originalP5Functions[key] = p5Instance[key];
            p5Instance[key] = function (...args) {
                if (p5Instance.useOriginal) {
                    originalP5Functions[key].apply(p5Instance, args);
                } else {
                    commandQueue.push([() => originalP5Functions[key].apply(p5Instance, args), args, key]);
                }
            };
            modifiedP5Functions[key] = p5Instance[key];
        }
    }

    // wrap text separately
    modifiedP5Functions["text"] = function (...args) {
        commandQueue.push([() => _text(...args), args, "text"]);
    }
    originalP5Functions["text"] = p5Instance["text"];
    p5Instance["text"] = modifiedP5Functions["text"];

    // wrap image separately
    modifiedP5Functions["image"] = function (...args) {
        commandQueue.push([() => _image(...args), args, "image"]);
    }
    originalP5Functions["image"] = p5Instance["image"];
    p5Instance["image"] = modifiedP5Functions["image"];

    // wrap resetMatrix separately
    modifiedP5Functions["resetMatrix"] = function (...args) {
        // do nothing...
    }
    originalP5Functions["resetMatrix"] = p5Instance["resetMatrix"];
    p5Instance["resetMatrix"] = modifiedP5Functions["resetMatrix"];

    // wrap circle separately
    modifiedP5Functions["circle"] = function (...args) {
        commandQueue.push([() => _circle(...args), args, "circle"]);
    }
    originalP5Functions["circle"] = p5Instance["circle"];
    p5Instance["circle"] = modifiedP5Functions["circle"];

    for (let name of deleteFuntions) {
        originalP5Functions[name] = p5Instance[name];
        delete p5Instance[name];
        delete window[name];
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
    angle,
    showTurtle,
    hideTurtle,
    showGrid,
    hideGrid,
    getX,
    getY,
    strangeCircle,
    strangeLine,
    strangeGalaxy,
    strangeSquare,
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
        } else if (typeof cmd[1][i] === 'number' && !Number.isInteger(cmd[1][i])) {
            // round number to 2 decimals
            args.push(cmd[1][i].toFixed(2));
        } else {
            args.push(cmd[1][i]);
        }
    }
    
    if (cmd[2]) {
        return `${cmd[2]}(${args.join(', ')})`;
    }else if (match) {
        return `${match[1]}(${args.join(', ')})`;
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
        originalP5Functions["resizeCanvas"].apply(p5.instance, [w, h]);
        t.canvasWidth = w;
        t.canvasHeight = h;
        canvasWidth = w;
        canvasHeight = h;
        setInitP5Styles();

        updateVisibleCanvasSize();

        // Update UI elements
        document.getElementById('canvasWidth').value = w;
        document.getElementById('canvasHeight').value = h;

        // Update localStorage
        localStorage.setItem('canvasWidth', w);
        localStorage.setItem('canvasHeight', h);
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
        .then(response => { if (!response.ok) throw new Error(response.statusText); return response.text(); })
        .then(code => {
            try {
                // First check for syntax errors
                new Function(code);

                const script = document.createElement('script');
                script.id = 'turtleScript';

                // Important! change number depending on line number
                // start counting lines at 1, not 0
                numberCodeLinesInjected = 20;
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
                                    try {
                                        fn(...args);
                                    } catch (error) {
                                        console.error(error);
                                    }
                                }, delay);
                                return id;
                            };
// make indentation 0.
${code}
                        } catch (error) {
                            console.error(error);
                        }
                    })();
                    //# sourceURL=${scriptFileName}
                `;

                // Add global error handler for this script context
                //window.addEventListener('error', function(event) {
                //    console.error(`Runtime error: ${event.error?.message || event.message}`);
                //    event.preventDefault();
                //});

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
                console.error(`Syntax error at line ${lineNumber - numberCodeLinesInjected}: ${error.message}`);
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
    originalP5Functions["stroke"].apply(p5.instance, [defaultColor]);
    originalP5Functions["strokeCap"].apply(p5.instance, [SQUARE]);
    originalP5Functions["noFill"].apply(p5.instance);
    originalP5Functions["clear"].apply(p5.instance);
    originalP5Functions["frameRate"].apply(p5.instance, [120]);
    originalP5Functions["strokeWeight"].apply(p5.instance, [1]);
    // resetMatrix(); // function not wrapped
    originalP5Functions["resetMatrix"].apply(p5.instance);
    originalP5Functions["translate"].apply(p5.instance, [t.canvasWidth / 2, t.canvasHeight / 2]);
    originalP5Functions["scale"].apply(p5.instance, [1, -1]);
    // translation and scaling is applied in draw for every iteration. Not anymore...
    // text size and font
    originalP5Functions["textFont"].apply(p5.instance, ["Segoe UI", 20]);
}

// p5.js Setup
function setup() {

    let [width, height] = setupSizeControls();
    createCanvas(width, height);
    t = new Turtle(width, height);
    canvasWidth = width;
    canvasHeight = height;
    updateVisibleCanvasSize();

    setupExportControls();

    // load current show state of turtle and grid
    if (t.showingGrid) {
        showGrid();
    } else {
        hideGrid();
    }

    if (t.visible) {
        t.showTurtle();
    } else {
        t.hideTurtle();
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
    //wrapConsole();
    // setInitP5Styles();
}

function setupCanvasControls() {
    const canvas = document.querySelector('#defaultCanvas0'); // p5.js default canvas ID
    const controls = document.querySelector('.canvas-controls');
    
    if (canvas && controls) {
        let isHovering = false;
        
        canvas.addEventListener('mouseenter', () => {
            isHovering = true;
            const canvasRect = canvas.getBoundingClientRect();
            controls.style.top = `${canvasRect.bottom - controls.offsetHeight}px`;
            controls.style.left = `${canvasRect.right - controls.offsetWidth}px`;
            controls.style.opacity = '1';
        });
        
        controls.addEventListener('mouseenter', () => {
            isHovering = true;
            controls.style.opacity = '1';
        });
        
        canvas.addEventListener('mouseleave', () => {
            isHovering = false;
            setTimeout(() => {
                if (!isHovering) {
                    controls.style.opacity = '0';
                }
            }, 100);
        });
        
        controls.addEventListener('mouseleave', () => {
            isHovering = false;
            setTimeout(() => {
                if (!isHovering) {
                    controls.style.opacity = '0';
                }
            }, 100);
        });
    }
}

// Call setupCanvasControls after p5.js setup is complete
document.addEventListener('scriptsLoaded', () => {
    const checkCanvas = setInterval(() => {
        if (document.querySelector('#defaultCanvas0')) {
            setupCanvasControls();
            clearInterval(checkCanvas);
        }
    }, 100);
});

// Optional: Draw-Funktion, wenn Animation gewünscht ist
function draw() {

    // I would like to have this in setup, but for some reason it does not work there...
    if (frameCount === 1) {
        setInitP5Styles();
    }

    Object.assign(globalThis, turtleFunctions);
    Object.assign(globalThis, modifiedP5Functions);

    const currentTime = new Date().getTime();
    // originalP5Functions["translate"].apply(p5.instance, [t.canvasWidth / 2, t.canvasHeight / 2]);
    // originalP5Functions["scale"].apply(p5.instance, [1, -1]);

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
    // originalP5Functions["scale"].apply(p5.instance, [1, -1]);
    // originalP5Functions["translate"].apply(p5.instance, [-t.canvasWidth / 2, -t.canvasHeight / 2]);


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
    // Copy canvas button
    document.getElementById('copyDrawing').onclick = async () => {
        try {
            // Get the canvas element
            const canvas = document.querySelector('.p5Canvas');
            
            // Convert the canvas to a blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve));
            
            // Create a ClipboardItem
            const item = new ClipboardItem({ "image/png": blob });
            
            // Write to clipboard
            await navigator.clipboard.write([item]);
            
            console.log('Canvas copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy canvas:', err);
        }
    };

    // Download canvas button
    document.getElementById('downloadDrawing').onclick = () => {
        // Get the canvas element
        const canvas = document.querySelector('.p5Canvas');
        
        // Create a temporary link element
        const link = document.createElement('a');
        link.download = 'turtle-drawing.png';
        link.href = canvas.toDataURL("image/png");
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

function setupSizeControls() {
    const savedWidth = localStorage.getItem('canvasWidth') || 700;
    const savedHeight = localStorage.getItem('canvasHeight') || 700;

    const widthInput = document.getElementById('canvasWidth');
    const heightInput = document.getElementById('canvasHeight');

    // Set initial input values
    widthInput.value = savedWidth;
    heightInput.value = savedHeight;

    // Add tooltips
    widthInput.title = 'Canvas Width';
    heightInput.title = 'Canvas Height';

    // Handle enter key press
    const handleEnterKey = (e) => {
        if (e.key === 'Enter') {
            const width = parseInt(widthInput.value);
            const height = parseInt(heightInput.value);

            // Save to localStorage
            localStorage.setItem('canvasWidth', width);
            localStorage.setItem('canvasHeight', height);

            // Reload the page to restart with new size
            location.reload();
        }
    };

    widthInput.addEventListener('keypress', handleEnterKey);
    heightInput.addEventListener('keypress', handleEnterKey);

    // Handle reset button click
    document.getElementById('resetSize').onclick = () => {
        // Clear localStorage
        localStorage.removeItem('canvasWidth');
        localStorage.removeItem('canvasHeight');

        location.reload();
    };

    return [parseInt(savedWidth), parseInt(savedHeight)];
}

// always keep aspect ratio of visible canvas same as internal canvas dimensions
// set canvas height max viewport height
// except this would result in a width that is greater than what is available
// in that case set canvas width to max available width and height so that aspect ratio is kept 
function updateVisibleCanvasSize() {
    const canvas = document.getElementById('defaultCanvas0');
    const canvasContainer = document.getElementById('canvasContainer');
    const bottomControls = document.querySelector('.bottom-controls');
    
    // Get the actual dimensions including padding and borders
    const containerRect = canvasContainer.getBoundingClientRect();
    const bottomControlsRect = bottomControls.getBoundingClientRect();
    
    // Get computed styles to account for margins
    const containerStyle = window.getComputedStyle(canvasContainer);
    const bottomControlsStyle = window.getComputedStyle(bottomControls);
    const canvasStyle = window.getComputedStyle(canvas);
    
    // Calculate available space accounting for padding and margins
    const availableWidth = containerRect.width - 
        parseFloat(containerStyle.paddingLeft) - 
        parseFloat(containerStyle.paddingRight);
    
    const availableHeight = containerRect.height - 
        bottomControlsRect.height -
        parseFloat(containerStyle.paddingTop) - 
        parseFloat(containerStyle.paddingBottom) -
        parseFloat(bottomControlsStyle.marginTop) -
        parseFloat(bottomControlsStyle.marginBottom) -
        parseFloat(canvasStyle.marginTop) -
        parseFloat(canvasStyle.marginBottom)-
        4; // 2px for border, 2px for idk...

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const aspectRatio = canvasWidth / canvasHeight;
    let newWidth = availableWidth;
    let newHeight = newWidth / aspectRatio;
    if (newHeight > availableHeight) {
        newHeight = availableHeight;
        newWidth = newHeight * aspectRatio;
    }
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
}


function setupResizeObserver() {
    const canvasContainer = document.getElementById('canvasContainer');
    const canvas = document.querySelector('canvas');
    const controls = document.querySelector('.canvas-controls');
    t.resizeObserver = new ResizeObserver(() => {
        updateVisibleCanvasSize();
        t.updateCanvasRect();
        t.updateTurtleVisual();
        updateGrid();
        const canvasRect = canvas.getBoundingClientRect();
        controls.style.top = `${canvasRect.bottom - controls.offsetHeight}px`;
        controls.style.left = `${canvasRect.right - controls.offsetWidth}px`;
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

// turtle funtions
function setSpeed(speed){
    const nextCommandButton = document.getElementById('nextCommand');
    const speedSlider = document.getElementById('speedSlider');

    // Update slider position
    
    if (commandDelay === Infinity) {
        lastCommandTime = new Date().getTime();
    }
    
    // find closest value in speedSteps
    let closestIndex = 0;
    let closestValue = Infinity;
    for (let i = 0; i < speedSteps.length; i++) {
        const value = speedSteps[i];
        if (Math.abs(value - speed) < closestValue) {
            closestValue = Math.abs(value - speed);
            closestIndex = i;
        }
    }

    speedSlider.value = closestIndex;

    if(speed != speedSteps[closestIndex]){
        console.warn(`Warning: ${speed} is not a valid option for 'setSpeed'. Using closest value: ${speedSteps[closestIndex]}`);
    }
    
    commandDelay = updateSpeedLabel(closestIndex);
    nextCommandButton.disabled = commandDelay !== Infinity;
}


function redrawOnMove(...args){
    // do nothing. for compatibility only...
}

// for compatibility
colour = color;

function degToRad(deg) {
    return deg * (Math.PI / 180);
}

function radToDeg(rad) {
    return rad * (180 / Math.PI);
}

function updateSpeedLabel(delay) {
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
