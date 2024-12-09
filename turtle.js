let commandQueue = [];
let executedCommands = [];
let lastCommandTime = 0;
let commandDelay = 0; // 0 means instant execution

class Turtle {
    constructor(w, h) {
        this.canvasWidth = w;
        this.canvasHeight = h;
        this.visible = true;
        this.turtleElement = this.createTurtleElement();
        this.canvasRect = document.querySelector('canvas').getBoundingClientRect();
        this.gridSize = 50;
        this.showingGrid = false;
        this.setInitValues();
    }

    updateCanvasRect() {
        this.canvasRect = document.querySelector('canvas').getBoundingClientRect();
    }

    setInitValues() {
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.penIsDown = true;
        this.currentColor = [0, 0, 0];
        this.currentWidth = 1;
        this.drawingStarted = false;
        this.updateTurtleVisual();
    }

    createTurtleElement() {
        const turtle = document.createElement('div');
        turtle.className = 'turtle-marker';
        document.querySelector('main').appendChild(turtle);
        return turtle;
    }

    updateTurtleVisual() {
        if (!this.turtleElement) return;

        console.log("rect", this.canvasRect.left, this.canvasRect.top);
        console.log("canvas", this.canvasWidth, this.canvasHeight);

        this.turtleElement.style.left = `${this.canvasRect.left + this.canvasWidth / 2 + this.x}px`;
        this.turtleElement.style.top = `${this.canvasRect.top + this.canvasHeight / 2 - this.y}px`;
        this.turtleElement.style.transform = `translate(-50%, -100%) rotate(${this.angle}deg)`;
        this.turtleElement.style.display = this.visible ? 'block' : 'none';
    }

    forward(distance) {
        if (this.penIsDown) {
            stroke(this.currentColor);
            strokeWeight(this.currentWidth);
            let newX = this.x + sin(this.angle * PI / 180) * distance;
            let newY = this.y + cos(this.angle * PI / 180) * distance;
            line(this.canvasWidth / 2 + this.x, this.canvasHeight / 2 - this.y,
                this.canvasWidth / 2 + newX, this.canvasHeight / 2 - newY);
            this.x = newX;
            this.y = newY;
        } else {
            this.x += sin(this.angle * PI / 180) * distance;
            this.y += cos(this.angle * PI / 180) * distance;
        }
        this.drawingStarted = true;
        this.updateTurtleVisual();
    }

    left(angle) {
        this.angle -= angle;
        this.updateTurtleVisual();
    }

    right(angle) {
        this.angle += angle;
        this.updateTurtleVisual();
    }

    pendown() {
        this.penIsDown = true;
    }

    penup() {
        this.penIsDown = false;
    }

    goto(x, y) {
        this.x = x;
        this.y = y;
        this.updateTurtleVisual();
    }

    setColor(color) {
        if (typeof color === 'string') {
            // Für benannte Farben und Hex-Codes
            this.currentColor = color;
        } else if (Array.isArray(color)) {
            // Für RGB-Arrays
            this.currentColor = color;
        } else if (arguments.length >= 3) {
            // Für RGB als separate Parameter
            this.currentColor = [arguments[0], arguments[1], arguments[2]];
        } else if (arguments.length === 1 && typeof color === 'number') {
            // Für einzelnen Grauwert
            this.currentColor = [color, color, color];
        }
    }

    setWidth(width) {
        this.currentWidth = width;
    }

    setAngle(angle) {
        this.angle = angle;
    }

    showTurtle() {
        this.visible = true;
        this.updateTurtleVisual();
        document.getElementById('showTurtle').checked = true;
    }

    hideTurtle() {
        this.visible = false;
        this.updateTurtleVisual();
        document.getElementById('showTurtle').checked = false;
    }

    drawGrid() {
        if (!this.showingGrid) return;

        push();
        // Draw main axes with thicker lines
        stroke(100);
        strokeWeight(2);
        // Vertical center line
        line(this.canvasWidth / 2, 0, this.canvasWidth / 2, this.canvasHeight);
        // Horizontal center line
        line(0, this.canvasHeight / 2, this.canvasWidth, this.canvasHeight / 2);

        // Draw grid lines
        strokeWeight(0.5);
        stroke(200);

        // Vertical lines
        for (let x = this.gridSize; x < this.canvasWidth; x += this.gridSize) {
            line(this.canvasWidth / 2 + x, 0, this.canvasWidth / 2 + x, this.canvasHeight);
            line(this.canvasWidth / 2 - x, 0, this.canvasWidth / 2 - x, this.canvasHeight);
        }

        // Horizontal lines
        for (let y = this.gridSize; y < this.canvasHeight; y += this.gridSize) {
            line(0, this.canvasHeight / 2 + y, this.canvasWidth, this.canvasHeight / 2 + y);
            line(0, this.canvasHeight / 2 - y, this.canvasWidth, this.canvasHeight / 2 - y);
        }
        pop();
    }
}

// Globale Turtle-Instanz
let t;

// Globale Funktionen
function forward(distance) {
    commandQueue.push(() => t.forward(distance));
}

function left(angle) {
    commandQueue.push(() => t.left(angle));
}

function right(angle) {
    commandQueue.push(() => t.right(angle));
}

function pendown() {
    commandQueue.push(() => t.pendown());
}

function penup() {
    commandQueue.push(() => t.penup());
}

function goto(x, y) {
    commandQueue.push(() => t.goto(x, y));
}

function color(...args) {
    commandQueue.push(() => t.setColor(...args));
}

function width(w) {
    commandQueue.push(() => t.setWidth(w));
}

function clear() {
    commandQueue.push(() => background(255));
}

function angle(a) {
    commandQueue.push(() => t.setAngle(a));
}

function showTurtle() {
    commandQueue.push(() => t.showTurtle());
}

function hideTurtle() {
    commandQueue.push(() => t.hideTurtle());
}

// Modify the command execution to set the flag
function executeCommand(cmd) {
    executedCommands.push(cmd);
    cmd();
}

function setSize(w, h) {
    commandQueue.push(() => {
        if (t.drawingStarted) {
            console.warn('Warning: setSize() clears the canvas. For best results, call setSize() before any drawing commands.');
        }
        resizeCanvas(w, h);
        t.canvasWidth = w;
        t.canvasHeight = h;
        background(255);

        // Update UI elements
        document.getElementById('canvasWidth').value = w;
        document.getElementById('canvasHeight').value = h;

        // Update localStorage
        localStorage.setItem('canvasWidth', w);
        localStorage.setItem('canvasHeight', h);
        t.updateCanvasRect();
    });
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
    hideTurtle
};

// Füge die Funktionen zum globalThis-Objekt hinzu
Object.assign(globalThis, turtleFunctions);

// p5.js Setup
function setup() {
    let [width, height] = setupSizeControls();
    createCanvas(width, height);
    background(255);
    strokeCap(SQUARE);
    frameRate(120);
    t = new Turtle(width, height);

    setupExportControls();

    // Draw grid before executing commands
    t.drawGrid();

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

    setupSpeedControl();
}

// Optional: Draw-Funktion, wenn Animation gewünscht ist
function draw() {
    Object.assign(globalThis, turtleFunctions);

    const currentTime = millis();
    
    while (commandQueue.length > 0 && 
        (commandDelay === 0 || currentTime - lastCommandTime >= commandDelay)) {
        const cmd = commandQueue.shift();
        executeCommand(cmd);
        lastCommandTime = currentTime;
    }
}

function redrawExecutedCommands() {
    background(255);
    t.setInitValues();
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

// Add new global functions
function showGrid(size = 50) {
    // commandQueue.push(() => {
    t.gridSize = size;
    t.showingGrid = true;
    document.getElementById('showGrid').checked = true;
    t.drawGrid();
    // });
}

function hideGrid() {
    // commandQueue.push(() => {
    t.showingGrid = false;
    document.getElementById('showGrid').checked = false;
    redrawExecutedCommands();
    // });
}

function getX() {
    return t.x;
}

function getY() {
    return t.y;
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
    document.body.appendChild(coordDisplay);

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left - canvas.width / 2);
        const y = Math.round(-(e.clientY - rect.top - canvas.height / 2));

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
    const speedValue = document.getElementById('speedValue');
    const restartButton = document.getElementById('restartExecution');
    
    // Load saved speed from localStorage
    const savedDelay = localStorage.getItem('commandDelay') || '0';
    commandDelay = parseInt(savedDelay);
    speedSlider.value = commandDelay;
    updateSpeedLabel(commandDelay);

    restartButton.addEventListener('click', () => {
        redrawExecutedCommands();
    });
    
    speedSlider.addEventListener('input', (e) => {
        commandDelay = parseInt(e.target.value);
        updateSpeedLabel(commandDelay);
        localStorage.setItem('commandDelay', commandDelay);
    });
}

function updateSpeedLabel(delay) {
    const speedValue = document.getElementById('speedValue');
    if (delay === 0) {
        speedValue.textContent = 'Instant';
    } else {
        speedValue.textContent = `${delay}ms`;
    }
}
