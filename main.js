'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let sphere;
let userPoint;
let angle;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iVertexTextureBuffer = gl.createBuffer();
    this.count = 0;
    this.textureCount = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }
    this.TextureBufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.textureCount = vertices.length / 2;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertexTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertexTexture);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
    }
    this.DrawSphere = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    this.iAttribVertexTexture = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.iTMU = -1;
    this.iUserPoint = -1;
    this.iAngle = 0;
    this.iTranslateSphere = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0., 0., 0., 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI / 8, 1, 8, 12);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    gl.uniform1i(shProgram.iTMU, 0);
    gl.enable(gl.TEXTURE_2D);
    gl.uniform2fv(shProgram.iUserPoint, [userPoint.x, userPoint.y]);
    gl.uniform1f(shProgram.iAngle, angle);
    gl.uniform1f(shProgram.iB, -1);

    gl.uniform3fv(shProgram.iTranslateSphere, [-0., -0., -0.])
    surface.Draw();
    let translate = corSphere(map(userPoint.x, 0, 1, 0, Math.PI * 2), map(userPoint.y, 0, 1, 0, Math.PI / 2))
    gl.uniform3fv(shProgram.iTranslateSphere, [translate.x, translate.y, translate.z])
    gl.uniform1f(shProgram.iB, 1);
    sphere.DrawSphere();
}

function CreateSurfaceData() {
    let vertexList = [];
    let uMax = Math.PI * 2
    let vMax = Math.PI / 2
    let uStep = uMax * 0.005;
    let vStep = vMax * 0.005;
    for (let u = 0; u <= uMax; u += uStep) {
        for (let v = 0; v <= vMax; v += vStep) {

            let vert = corSphere(u, v)
            let avert = corSphere(u + uStep, v)
            let bvert = corSphere(u, v + vStep)
            let cvert = corSphere(u + uStep, v + vStep)

            vertexList.push(vert.x, vert.y, vert.z)
            vertexList.push(avert.x, avert.y, avert.z)
            vertexList.push(bvert.x, bvert.y, bvert.z)

            vertexList.push(avert.x, avert.y, avert.z)
            vertexList.push(cvert.x, cvert.y, cvert.z)
            vertexList.push(bvert.x, bvert.y, bvert.z)
        }
    }

    return vertexList;
}
function map(val, f1, t1, f2, t2) {
    let m;
    m = (val - f1) * (t2 - f2) / (t1 - f1) + f2
    return Math.min(Math.max(m, f2), t2);
}
function CreateSurfaceTextureData() {
    let vertexTextureList = [];
    let uMax = Math.PI * 2
    let vMax = Math.PI / 2
    let uStep = uMax * 0.005;
    let vStep = vMax * 0.005;
    let uStepMap = map(uStep,0,uMax,0,1)
    let vStepMap = map(vStep,0,vMax,0,1)
    for (let u = 0; u <= uMax; u += uStep) {
        for (let v = 0; v <= vMax; v += vStep) {
            let u1 = map(u,0,uMax,0,1);
            let v1 = map(v,0,vMax,0,1);
            vertexTextureList.push(u1,v1);
            vertexTextureList.push(u1+uStepMap,v1);
            vertexTextureList.push(u1,v1+vStepMap);
            vertexTextureList.push(u1+uStepMap,v1);
            vertexTextureList.push(u1+uStepMap,v1+vStepMap);
            vertexTextureList.push(u1,v1+vStepMap);
        }
    }

    return vertexTextureList;
}

const R = 1;
const n = 6;
const a = 0.24;
function corSphere(u, v) {
    let x = (R * Math.cos(v) - a * (1 - Math.sin(v)) * Math.abs(Math.cos(n * u))) * Math.cos(u);
    let y = (R * Math.cos(v) - a * (1 - Math.sin(v)) * Math.abs(Math.cos(n * u))) * Math.sin(u);
    let z = R * Math.sin(v);
    return {
        x: x,
        y: y,
        z: z
    };
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribVertexTexture = gl.getAttribLocation(prog, "vertexTexture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iTMU = gl.getUniformLocation(prog, 'TMU');
    shProgram.iUserPoint = gl.getUniformLocation(prog, 'userPoint');;
    shProgram.iAngle = gl.getUniformLocation(prog, 'rotate');
    shProgram.iTranslateSphere = gl.getUniformLocation(prog, 'translateSphere');
    shProgram.iB = gl.getUniformLocation(prog, 'b');

    LoadTexture()
    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    surface.TextureBufferData(CreateSurfaceTextureData());
    sphere = new Model('Sphere');
    sphere.BufferData(CreateSphereSurface())

    gl.enable(gl.DEPTH_TEST);
}

function CreateSphereSurface(r = 0.05) {
    let vertexList = [];
    let lon = -Math.PI;
    let lat = -Math.PI * 0.5;
    while (lon < Math.PI) {
        while (lat < Math.PI * 0.5) {
            let v1 = sphereSurfaceDate(r, lon, lat);
            let v2 = sphereSurfaceDate(r, lon + 0.5, lat);
            let v3 = sphereSurfaceDate(r, lon, lat + 0.5);
            let v4 = sphereSurfaceDate(r, lon + 0.5, lat + 0.5);
            vertexList.push(v1.x, v1.y, v1.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v4.x, v4.y, v4.z);
            vertexList.push(v3.x, v3.y, v3.z);
            lat += 0.5;
        }
        lat = -Math.PI * 0.5
        lon += 0.5;
    }
    return vertexList;
}

function sphereSurfaceDate(r, u, v) {
    let x = r * Math.sin(u) * Math.cos(v);
    let y = r * Math.sin(u) * Math.sin(v);
    let z = r * Math.cos(u);
    return { x: x, y: y, z: z };
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    userPoint = { x: 0.5, y: 0.5 }
    angle = 0.0;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
}

function LoadTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.crossOrigin = 'anonymus';

    image.src = "https://raw.githubusercontent.com/Fllemeth/LabsVGGI/CGV/512x512_Dissolve_Noise_Texture.png";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        draw()
    }
}

onmousemove = (e) => {
    angle = map(e.clientX, 0, window.outerWidth, 0, Math.PI)
    draw()
};
window.onkeydown = (e) => {
    switch (e.keyCode) {
        case 87:
            userPoint.y -= 0.01;
            break;
        case 83:
            userPoint.y += 0.01;
            break;
        case 65:
            userPoint.x += 0.01;
            break;
        case 68:
            userPoint.x -= 0.01;
            break;
    }
    userPoint.x = Math.max(0.01, Math.min(userPoint.x, 0.999))
    userPoint.y = Math.max(0.01, Math.min(userPoint.y, 0.999))
    draw();
}