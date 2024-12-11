fill(defaultColor);
noStroke();
textAlign(CENTER);
goto(0, 260);
text("Welcome to");
textSize(40);
goto(0, 210);
text("Turtle Graphics Studio");

// turtle emoji
textSize(100);
text("🐢", 0, 100);

stroke(defaultColor);
line(-288, 107, -97, -12);
push();
translate(-288, 107);
rotate(-1.35);
translate(288, -107);
triangle(-288, 107, -288, 127, -268, 107);
pop();

noStroke();
fill(defaultColor);

textSize(15);
text("Select the script file to load in the top left corner", -97, -30);

hideTurtle();
console.log("This is the console. All console.log statements and errors will be displayed here.");
