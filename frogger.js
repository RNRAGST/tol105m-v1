
var canvas;
var gl;
var tileSize = 1;  
var points = 0;


// Núverandi staðsetning miðju ferningsins




let stopRendering = false;


var player = vec2( 0.0, -10.0 );
var program;


var playerDirection = true   // True = up,  False = down,
var playerVerticesUp = new Float32Array([-0.05, -0.05, 0.05, -0.05, 0.0, 0.025]);
var playerVerticesDown = new Float32Array([-0.05, 0.05, 0.05, 0.05, 0.0, -0.025]);

var bufferId; //player buffer




// car vertices  (square)
var enemies = []
var enemyProgram
var enemyCount = 3; //amount of enemies per lane
const enemySize = 0.1;
const halfSize = enemySize / 2.0;

const enemyVertices = new Float32Array([
    -halfSize, -halfSize,  
     halfSize, -halfSize,  
     halfSize,  halfSize,  
    -halfSize, -halfSize, 
     halfSize,  halfSize,  
    -halfSize,  halfSize,   
]);
// possible car colors
var enemyColors = [
    [1.0, 0.0, 0.0, 1.0],  
    [0.0, 1.0, 0.0, 1.0],  
    [1.0, 0.0, 1.0, 1.0], 
];


var enemyBufferId;

// y coords of the lanes
var lanePositions = [-5.0,-2.0, 1.0, 4.0,7.0];

//speeds of the cars in the lanes
var laneSpeeds  = [0.045,0.045,0.045,0.055,0.075];

//vertices of the lanes
const laneVertices = new Float32Array([
    -1.0, -0.1,
     1.0, -0.1,
     1.0,  0.05,
    -1.0,  0.05,
])
// vertices for 10 tally lines
var tallyVertices = new Float32Array([
    //1
    -0.85, 0.95, 
    -0.85, 0.85, 

    //2
    -0.8, 0.95, 
    -0.8, 0.85, 

    //3
    -0.75, 0.95, 
    -0.75, 0.85, 

    //4
    -0.7, 0.95, 
    -0.7, 0.85, 

    //5
    -0.65, 0.95, 
    -0.65, 0.85, 

    //6
    -0.6, 0.95,  
    -0.6, 0.85,  

    //7
    -0.55, 0.95,  
    -0.55, 0.85,  

    //8
    -0.5, 0.95,  
    -0.5, 0.85,  

    //9
    -0.45, 0.95,  
    -0.45, 0.85,  

    //10
    -0.4, 0.95,  
    -0.4, 0.85, 
]);


var tallyPos = []

function randomEnemyPos(min,max) { // rng between min and max
    return Math.random() * (max - min) + min;
}

//vertices of an "X"-Shape
var errorVertices = new Float32Array([
    -0.4, -0.4,  
     0.4,  0.4,  
    -0.4,  0.4,  
     0.4, -0.4,  
]);


function drawError() {  //draws an "X"-Shape
    var errorProgram = initShaders(gl, "error-vertex-shader", "error-fragment-shader");
    gl.useProgram(errorProgram);

    var errorVPosition = gl.getAttribLocation(errorProgram, "vErrorPosition");
    var errorBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, errorBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(errorVertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(errorVPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(errorVPosition);

    var errorLocColor = gl.getUniformLocation(errorProgram, "eColor");
    gl.uniform4fv(errorLocColor, [1.0, 0.0, 0.0, 1.0]); // Red color

    gl.drawArrays(gl.LINES, 0, errorVertices.length / 2);
}






function drawTally(tallyVertices,count) { // draws an count amount of tally lines up until 10

    var tallyProgram = initShaders(gl, "tally-vertex-shader", "tally-fragment-shader");
    gl.useProgram(tallyProgram);

    var tallyVPosition = gl.getAttribLocation(tallyProgram, "tallyPosition");
    tallyLocPlayer = gl.getUniformLocation(tallyProgram, "tallyPos");

    tallyLocColor = gl.getUniformLocation(tallyProgram, "tColor");

    var tallyBufferId = gl.createBuffer();


    
    for (var i = 0; i < (count*4); i += 4) {
        gl.bindBuffer(gl.ARRAY_BUFFER, tallyBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, tallyVertices.slice(i, i + 4), gl.STATIC_DRAW);

        gl.vertexAttribPointer(tallyVPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(tallyVPosition);

        // Set the position and color uniforms here if needed

        
        gl.uniform4fv(tallyLocColor, vec4(1.0, 0.0, 0.0, 1.0));

        // Draw eachsegment
        gl.drawArrays(gl.LINES, 0, 2);
    }
}

function drawLanes(laneVertices) { // draws lanes from lanePositions variable, one lane per value (one lane per y-coordinate)

        
        laneProgram = initShaders( gl, "lane-vertex-shader", "lane-fragment-shader" );


        gl.useProgram(laneProgram);
        laneVPosition = gl.getAttribLocation(laneProgram, "lanePosition");
    
        laneBufferId = gl.createBuffer();


        for (var i = 0; i < lanePositions.length; i++) {

            gl.bindBuffer( gl.ARRAY_BUFFER, laneBufferId );
            gl.bufferData( gl.ARRAY_BUFFER, flatten(laneVertices), gl.DYNAMIC_DRAW );
            gl.vertexAttribPointer( laneVPosition, 2, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( laneVPosition );
        
            laneLocPlayer = gl.getUniformLocation(laneProgram, "lanePos");
        
            laneLocColor = gl.getUniformLocation(laneProgram, "lColor");
            gl.uniform2fv( laneLocPlayer, flatten(vec2(0,lanePositions[i]+0.25)) );

            if(i%2 ==0) {
                gl.uniform4fv(laneLocColor, [0.0, 0.5, 1.0, 1.0]); 

            } else {
                gl.uniform4fv(laneLocColor, [0.0, 0.0, 0.0, 1.0]); 

            }
            gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );

        }

}

function fillEnemies(lanePositions,amount) { // fills an array with car objects with a position, speed and a color variable.
    for (var laneCount = 0; laneCount < lanePositions.length; laneCount++) {
        var enemyXPOS = [];

        for (var i = 0; i < amount; i++) {
            var curEnemyPos = randomEnemyPos(-9.4, 9.4);
            var found = false;

            for (var j = 0; j < enemyXPOS.length; j++) {
                if (Math.abs(curEnemyPos - enemyXPOS[j]) < 4.0) {
                    found = true;
                    break; 
                }
            }

            if (!found) {
                enemyXPOS.push(curEnemyPos);
                enemies.push({
                    position: vec2(curEnemyPos, lanePositions[laneCount]),
                    speed: laneSpeeds[laneCount], 
                    color: enemyColors[Math.floor(Math.random() * enemyColors.length)],
                });
            } else {
                i--;
            }
        }
    }

} 

fillEnemies(lanePositions,enemyCount) 



function detectCollision(obj1,obj2) {  //AABB collision detection/árekstrarskynjun
    var x1 = obj1[0] - obj1[2] / 2;  
    var y1 = obj1[1] - obj1[3] / 2;  
    var width1 = obj1[2];
    var height1 = obj1[3];

    var x2 = obj2[0] - obj2[2] / 2;  
    var y2 = obj2[1] - obj2[3] / 2; 
    var width2 = obj2[2];
    var height2 = obj2[3];

    var horizontalOverlap = x1 < x2 + width2 && x1 + width1 > x2;

    var verticalOverlap = y1 < y2 + height2 && y1 + height1 > y2;

    if (horizontalOverlap && verticalOverlap) {

        return true;
    } else {
        return false;
    }
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    canvas.width = 900;
    canvas.height = 900;
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );


    // initialize player

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(playerVerticesUp), gl.DYNAMIC_DRAW );


    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    locPlayer = gl.getUniformLocation( program, "playerPos" );
    locColor = gl.getUniformLocation(program, "fColor");

    enemyProgram = initShaders(gl, "enemy-vertex-shader", "enemy-fragment-shader");
   

    //initialize enemies/cars
    gl.useProgram(enemyProgram);
    enemyVPosition = gl.getAttribLocation(enemyProgram, "vEnemyPosition");

    enemyBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, enemyBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(enemyVertices), gl.DYNAMIC_DRAW );
    gl.vertexAttribPointer( enemyVPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( enemyVPosition );

    enemyLocPlayer = gl.getUniformLocation(enemyProgram, "enemyPos");

    enemyLocColor = gl.getUniformLocation(enemyProgram, "eColor");



    // Meðhöndlun örvalykla
    window.addEventListener("keydown", function(e){
        switch( e.keyCode ) {
            case 38:	// upp ör
                player[1] += tileSize;
                break;
            case 40:	// niður ör
                player[1] += -tileSize;
                break;
            case 37:	// vinstri ör
                player[0] += -tileSize;
                break;
            case 39:	// hægri ör
                player[0] += +tileSize;
                break;
        }
    } );

    render();
}


function render() {


    if (stopRendering) {    // stops further rendering once flagged
        return;
      }


    // Keeps player withing canvas bounds
    if (player[0] > 9.0){
        
        player[0] = 9.0;
    } else if(player[0] < -9.0) {
        player[0] = -9.0
    }
    //flips character,changes direction and increases point count once the player reaches the upper or lower bound
    if (player[1] > 8.0){   

        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(playerVerticesDown), gl.DYNAMIC_DRAW);
        if(playerDirection != false) {
            playerDirection = false
            points++;
        }   
        player[1] = 8.0;
    } else if(player[1] < -9.0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(playerVerticesUp), gl.DYNAMIC_DRAW);
        if(playerDirection != true) {
            playerDirection = true
            points++;
        }
        player[1] = -9.0
    }


    gl.clear( gl.COLOR_BUFFER_BIT );

    var playerAABB = [player[0], player[1], enemySize+1.9,enemySize+0.9];   // initialies the bounding box for the player

    //calls draw functions
    drawLanes(laneVertices)
    drawTally(tallyVertices,points)


    //draws player
    gl.useProgram( program );
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.uniform2fv( locPlayer, flatten(player) );
    gl.uniform4fv(locColor, [0.0, 0.6, 0.0, 1.0]); // Player color (green)

    gl.drawArrays( gl.TRIANGLES, 0, 3 );


    //draws enemies/cars
 
    for (var i = 0; i < enemies.length; i++) {
        var enemy = enemies[i];

        enemy.position[0] += enemy.speed;

        //enemies that touch the bounds come out on the other side (like pacman)
        if (enemy.position[0] > 10 + halfSize) {
            enemy.position[0] = -10 - halfSize; // Resets the car to the left side
        } else if (enemy[0] < -10 - halfSize) {
            enemy.position[0] = 10 + halfSize; // Resets the car right side
        }



        var enemyAABB = [enemy.position[0], enemy.position[1], enemySize,enemySize];   // initialies the bounding box for the enemy
        if(detectCollision(playerAABB,enemyAABB)) {
            gl.clearColor(0.1, 0.1, 0.1, 1.0); // changes background color
            gl.clear(gl.COLOR_BUFFER_BIT); 
            
            drawError(); // renders the "X" error shape
            stopRendering = true; // stops the program from rendering further
            return; // 
        }

        gl.useProgram(enemyProgram); 
        gl.bindBuffer(gl.ARRAY_BUFFER, enemyBufferId);
        gl.vertexAttribPointer(enemyVPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(enemyVPosition);
        gl.uniform2fv(enemyLocPlayer, flatten(enemy.position));
        gl.uniform4fv(enemyLocColor, enemy.color);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 6);

    }


    window.requestAnimFrame(render);
}

