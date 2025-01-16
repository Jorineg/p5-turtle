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
        this._x = 0;
        this._y = 0;
        this.positionAngle = 0;
        this._positionAngle = 0;
        this.penIsDown = true;
        this.currentColor = [0, 0, 0];
        this.currentWidth = 1;
        this.drawingStarted = false;
        this.updateTurtleVisual();
    }

    _forward(distance) {
        this._x += Math.sin(this._positionAngle * PI / 180) * distance;
        this._y += Math.cos(this._positionAngle * PI / 180) * distance;
    }

    _left(angle) {
        this._positionAngle -= angle;
    }

    _right(angle) {
        this._positionAngle += angle;
    }

    _goto(x, y) {
        this._x = x;
        this._y = y;
    }

    createTurtleElement() {
        const turtle = document.createElement('div');
        turtle.className = 'turtle-marker';
        document.body.appendChild(turtle);
        return turtle;
    }

    updateTurtleVisual() {
        if (!this.turtleElement) return;
        let scale = this.canvasRect.width / this.canvasWidth;
        let left = this.canvasRect.left + this.canvasRect.width / 2 + this.x * scale;
        let top = this.canvasRect.top + this.canvasRect.height / 2 - this.y * scale;
        this.turtleElement.style.left = `${left}px`;
        this.turtleElement.style.top = `${top}px`;
        this.turtleElement.style.transform = `translate(-50%, -100%) rotate(${this.positionAngle % 360}deg)`;
        let positionIsInCanvas = left >= this.canvasRect.left && left <= this.canvasRect.right &&
            top >= this.canvasRect.top && top <= this.canvasRect.bottom;
        this.turtleElement.style.display = this.visible && positionIsInCanvas ? 'block' : 'none';
    }

    forward(distance) {
        if (this.penIsDown) {
            let newX = this.x + Math.sin(this.positionAngle * PI / 180) * distance;
            let newY = this.y + Math.cos(this.positionAngle * PI / 180) * distance;

            // originalP5Functions["line"].apply(p5.instance, [this.canvasWidth / 2 + this.x, this.canvasHeight / 2 - this.y,
            // this.canvasWidth / 2 + newX, this.canvasHeight / 2 - newY]);

            // assume p5 coordinates are in the center of the canvas
            originalP5Functions["line"].apply(p5.instance, [this.x, this.y, newX, newY]);
            this.x = newX;
            this.y = newY;
        } else {
            this.x += Math.sin(this.positionAngle * PI / 180) * distance;
            this.y += Math.cos(this.positionAngle * PI / 180) * distance;
        }
        this.drawingStarted = true;
        this.updateTurtleVisual();
    }

    left(angle) {
        this.positionAngle -= angle;
        this.updateTurtleVisual();
    }

    right(angle) {
        this.positionAngle += angle;
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

    color(color) {
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
        originalP5Functions["stroke"].apply(p5.instance, [this.currentColor]);
    }

    width(width) {
        this.currentWidth = width;
        originalP5Functions["strokeWeight"].apply(p5.instance, [this.currentWidth]);
    }

    angle(angle) {
        this.positionAngle = angle;
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
}