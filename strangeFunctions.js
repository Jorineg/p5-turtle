let commandQueue = [];

// Globale Turtle-Instanz
let t;

// Internal implementations
function _strangeSquare(side, step = 5) {
    var x1 = t.x;
    var y1 = t.y;
    for (var x = x1; x < x1 + side; x += step) {
        for (var y = y1; y > y1 - side; y -= step) {
            t.goto(x, y);
            var a = random(0, 360);
            t.left(a);
            t.forward(5);
        }
    }
    t.angle(0);
    t.goto(x1, y1);
}

function _strangeGalaxy(radius) {
    var x1 = t.x;
    var y1 = t.y;
    for (var i = 0; i < 720; i++) {
        t.left(2);
        t.goto(x1, y1);
        t.penup();
        var a = random(0, radius);
        var r = random(0, 360);
        t.left(r);
        t.forward(a);
        t.right(r);
        t.pendown();
        t.forward(5);
    }
    t.angle(0);
    t.goto(x1, y1);
}

function _strangeCircle(radius) {
    var x1 = t.x;
    var y1 = t.y;
    for (var i = 0; i < 360; i++) {
        t.left(2);
        t.goto(x1, y1);
        t.penup();
        var a = random(radius - radius / 10, radius);
        var r = random(0, 360);
        t.left(r);
        t.forward(a);
        t.right(r);
        t.pendown();
        t.forward(5);
    }
    t.angle(0);
    t.goto(x1, y1);
}

function _strangeLine(length) {
    var l = 0;
    while (l < length) {
        var p = random(0, 2);
        var h = random(0, 5);
        t.width(h);
        t.forward(p);
        l += p;
    }
    t.width(1);
}

// Queue-based functions
function strangeSquare(side, step = 5) {
    side = checkArgument(1, 'number', side);
    step = checkArgument(2, 'number', step);
    commandQueue.push([() => _strangeSquare(side, step), [side, step]]);
}

function strangeGalaxy(radius) {
    radius = checkArgument(1, 'number', radius);
    commandQueue.push([() => _strangeGalaxy(radius), [radius]]);
}

function strangeCircle(radius) {
    radius = checkArgument(1, 'number', radius);
    commandQueue.push([() => _strangeCircle(radius), [radius]]);
}

function strangeLine(length) {
    length = checkArgument(1, 'number', length);
    commandQueue.push([() => _strangeLine(length), [length]]);
}