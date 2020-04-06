/*
The MIT License (MIT)

Copyright (c) 2015 Patricio Gonzalez Vivo ( http://www.patriciogonzalezvivo.com )

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var timeLoad = Date.now();
var mouse = {x: 0, y: 0};
var billboards = [];

var errorLineOffset = 10;

var coronaKeywords = ["CoronaColorScale", "CoronaContentScale", "CoronaDeltaTime", "CoronaSampler0",
    "CoronaSampler1", "CoronaTexCoord", "CoronaTexelSize", "CoronaTotalTime", "CoronaVertexUserData",
    "P_DEFAULT", "P_RANDOM", "P_POSITION", "P_NORMAL", "P_UV" ,"P_COLOR"];


function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function nextHighestPowerOfTwo(x) {
    --x;
    for (var i = 1; i < 32; i <<= 1) {
        x = x | x >> i;
    }
    return x + 1;
}

function loadTexture(_gl, _texture) {
	_gl.bindTexture(_gl.TEXTURE_2D, _texture);
	_gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);
	_gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, _texture.image);
	if (isPowerOf2(_texture.image.width) && isPowerOf2(_texture.image.height) ) {
		_gl.generateMipmap(_gl.TEXTURE_2D);
		_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
		_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR_MIPMAP_LINEAR);
	} else {
		_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
		_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
		_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR);
	}
	_gl.bindTexture(_gl.TEXTURE_2D, null);
}

function getMousePos(_canvas, _evt) {
	var rect = _canvas.getBoundingClientRect();
	return {
		x: _evt.clientX - rect.left,
		y: _evt.clientY - rect.top
	};
}

function ClearErrors(canvas) {
	var cm = canvas.codeMirrorInstance;
	if(cm) {
		canvas.errorHintWidgets = canvas.errorHintWidgets || [];
		for (var i = 0; i < canvas.errorHintWidgets.length; ++i)
			cm.removeLineWidget(canvas.errorHintWidgets[i]);
		canvas.errorHintWidgets.length = 0;
	}
}

function loadShaders() {

	var list = document.getElementsByTagName("canvas");

	// Load canvas and WebGLContexta
	for(var i = 0; i < list.length; i++){

		var shaderSrc = { vertURL: null, vertSTR: null,
						  fragURL: null, fragSTR: null };

		if( list[i].hasAttribute("data-fragment") ){
			shaderSrc.fragSTR = list[i].getAttribute('data-fragment');
		} else if( list[i].hasAttribute("data-fragment-url") ){
			shaderSrc.fragURL = list[i].getAttribute('data-fragment-url');
		} else {
			continue;
		}

		var canvas = list[i];
		var gl;

		if( !billboards[i] || !billboards[i].gl){
			console.log("Creating WebGL context");
			gl = setupWebGL(list[i]);
		} else {
			gl = billboards[i].gl
		}
		if(!gl) {
			billboards[i] = {};
			continue;
		}
		ClearErrors(canvas);
		var program = loadShader(gl, shaderSrc, canvas);

		if(!program){
			if(billboards[i].program){
				program = billboards[i].program;
			} else {
				billboards[i] = null;
				return;
			}
		} else if ( billboards[i] && billboards[i].program ){
			billboards[i].gl.deleteProgram(billboards[i].program);
		}

		var vbo = [];
		if ( !billboards[i] || !billboards[i].vbo){
			console.log("Creating Vbo");

			// Define UVS buffer
			var uvs;
			var texCoordLocation = gl.getAttribLocation(program, "a_texcoord");
			uvs = gl.createBuffer();
			gl.bindBuffer( gl.ARRAY_BUFFER, uvs);
			gl.bufferData( gl.ARRAY_BUFFER, new Float32Array([0.0,  0.0,
															0.0,  1.0,
															1.0,  0.0,
															1.0,  1.0,
															]), gl.STATIC_DRAW);
			gl.enableVertexAttribArray( texCoordLocation );
			gl.vertexAttribPointer( texCoordLocation, 2, gl.FLOAT, false, 0, 0);
			vbo.push(uvs);

			// Define Vertex buffer
			var vertices;
			var positionLocation = gl.getAttribLocation(program, "a_position");
			vertices = gl.createBuffer();
			gl.bindBuffer( gl.ARRAY_BUFFER, vertices);
			gl.bufferData( gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0,
															-1.0, 1.0,
															1.0,  -1.0,
															1.0,  1.0,
															]), gl.STATIC_DRAW);
			gl.enableVertexAttribArray( positionLocation );
			gl.vertexAttribPointer( positionLocation , 2, gl.FLOAT, false, 0, 0);
			vbo.push(vertices);
		} else {
			vbo = billboards[i].vbo;
		}

		// Clean texture
		var textures = [];

		// Need to load textures
		var bLoadTextures = list[i].hasAttribute('data-textures');
		if ( billboards[i] && billboards[i].textures && bLoadTextures){
			var nImages = canvas.getAttribute('data-textures').split('&');

			if (nImages.length === billboards[i].textures.length){
				bLoadTextures = false;
				for(var j in nImages){
					if( billboards[i].textures[j].image.getAttribute("src") !== nImages[j] ){
						bLoadTextures = true;
						break;
					}
				}
			}

			if (!bLoadTextures){
				textures = billboards[i].textures;
			}
		}

		if( bLoadTextures ){
			// Clean the texture array
			while(textures.length > 0) {
				console.log("Deleting texture: " + (textures.length-1));
				gl.deleteTexture(textures[textures.length-1]);
    			textures.pop();
			}

			var imgList = list[i].getAttribute('data-textures').split('&');
			for(var nImg in imgList){
				if(!imgList[nImg])
					continue;

				console.log("Loading texture: " + imgList[nImg]);

				textures.push(gl.createTexture());

				gl.bindTexture(gl.TEXTURE_2D, textures[nImg]);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 0, 255])); // red

				textures[nImg].image = new Image();
				textures[nImg].image.crossOrigin = "anonymous";
				textures[nImg].image.onload = function(_gl,_tex) {
					return function() {
						loadTexture(_gl, _tex);
					};
				}(gl,textures[nImg]);
	  			textures[nImg].image.src = imgList[nImg];
			}
		}

		// Assign canvas, gl context, shader, UV/Verts buffers and animate boolean to billboard
		billboards[i] = {	canvas: canvas,
							gl: gl,
							program: program,
							vbo: vbo,
							textures: textures,
							mouse: mouse };
	}
}

function renderShaders(){
	for(var i = 0; i < billboards.length; i++){
		// If there is something on the billboard
		if(billboards[i]){
			renderShader( billboards[i] );
		}
	}
	window.requestAnimFrame(renderShaders);
}

/**
 * Creates the HTLM for a failure message
 * @param {string} canvasContainerId id of container of th
 *        canvas.
 * @return {string} The html.
 */
var makeFailHTML = function(msg) {
  return '' +
	'<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
	'<td align="center">' +
	'<div style="display: table-cell; vertical-align: middle;">' +
	'<div style="">' + msg + '</div>' +
	'</div>' +
	'</td></tr></table>';
};

/**
 * Mesasge for getting a webgl browser
 * @type {string}
 */
var GET_A_WEBGL_BROWSER = '' +
  'This page requires a browser that supports WebGL.<br/>' +
  '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';

/**
 * Mesasge for need better hardware
 * @type {string}
 */
var OTHER_PROBLEM = '' +
  "It doesn't appear your computer can support WebGL.<br/>" +
  '<a href="http://get.webgl.org/troubleshooting/">Click here for more information.</a>';

/**
 * Creates a webgl context. If creation fails it will
 * change the contents of the container of the <canvas>
 * tag to an error message with the correct links for WebGL.
 * @param {Element} canvas. The canvas element to create a
 *     context from.
 * @param {WebGLContextCreationAttirbutes} opt_attribs Any
 *     creation attributes you want to pass in.
 * @return {WebGLRenderingContext} The created context.
 */
function setupWebGL (_canvas, _opt_attribs) {

  function showLink(str) {
	var errDiv = document.createElement("div");
	var container = _canvas.parentNode;
	if (container) {
		errDiv.innerHTML = makeFailHTML(str);
	    container.insertBefore(errDiv, _canvas);
	}
  };

  if (!window.WebGLRenderingContext) {
	showLink(GET_A_WEBGL_BROWSER);
	return null;
  }

  var context = create3DContext(_canvas, _opt_attribs);
  if (!context) {
	showLink(OTHER_PROBLEM);
  }
  return context;
};

/**
 * Creates a webgl context.
 * @param {!Canvas} canvas The canvas tag to get context
 *     from. If one is not passed in one will be created.
 * @return {!WebGLContext} The created context.
 */
function create3DContext(_canvas, _opt_attribs) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var ii = 0; ii < names.length; ++ii) {
	try {
	  context = _canvas.getContext(names[ii], _opt_attribs);
	} catch(e) {}
	if (context) {
	  break;
	}
  }
  return context;
}

/**
 * Loads a shader.
 * @param {!WebGLContext} gl The WebGLContext to use.
 * @param {string} shaderSource The shader source.
 * @param {number} shaderType The type of shader.
 * @param {function(string): void) opt_errorCallback callback for errors.
 * @return {!WebGLShader} The created shader.
 */
function createProgram(gl, shaders, opt_attribs, opt_locations) {
  var program = gl.createProgram();
  for (var ii = 0; ii < shaders.length; ++ii) {
	gl.attachShader(program, shaders[ii]);
  }
  if (opt_attribs) {
	for (var ii = 0; ii < opt_attribs.length; ++ii) {
	  gl.bindAttribLocation(
		  program,
		  opt_locations ? opt_locations[ii] : ii,
		  opt_attribs[ii]);
	}
  }
  gl.linkProgram(program);

  // Check the link status
  var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
	  // something went wrong with the link
	  lastError = gl.getProgramInfoLog (program);
	  console.log("Error in program linking:" + lastError);

	  gl.deleteProgram(program);
	  return null;
  }
  return program;
};

/*
 *	Fetch for files
 */
function fetchHTTP(url, methood){
	var request = new XMLHttpRequest(), response;

	request.onreadystatechange = function () {
		if (request.readyState === 4 && request.status === 200) {
			response = request.responseText;
		}
	}
	request.open(methood ? methood : 'GET', url, false);
	request.overrideMimeType("text/plain");
	request.send();
	return response;
}

/*
 *	Create a Vertex of a specific type (gl.VERTEX_SHADER/)
 */
function createShader(_gl, _source, _type, canvas) {
	var shader = _gl.createShader( _type );
	_gl.shaderSource(shader, _source);
	_gl.compileShader(shader);

	var compiled = _gl.getShaderParameter(shader, _gl.COMPILE_STATUS);

	if (!compiled) {
		// Something went wrong during compilation; get the error
		var lastError = _gl.getShaderInfoLog(shader);
		if(!canvas.codeMirrorInstance) {
	        console.error("*** Error compiling shader:" + lastError);
		}else {
			var errs = lastError.split('\n');
			//danger! this code depends a lot on how errors are produced by GL
			for (var i = 0; i < errs.length; i++) {
				var matches = errs[i].match(/:(\d+): (.+)/);
				if (!matches)
					continue;
				var errLine = +matches[1];
				if (errLine == errLine) {
					var msg = document.createElement("div");
					var icon = msg.appendChild(document.createElement("span"));
					icon.innerHTML = "&#9940;";
					icon.className = "lint-error-icon";
					msg.appendChild(document.createTextNode(matches[2]));
					msg.className = "lint-error";
					canvas.errorHintWidgets.push(canvas.codeMirrorInstance.addLineWidget(errLine - errorLineOffset, msg, {
						coverGutter: false,
						noHScroll: true
					}));
				}
			}
		}
		_gl.deleteShader(shader);
		return null;
	}

	return shader;
}

/*
 *	Loads the vert/frag Shaders
 */
function loadShader( _gl, _shaderSrc, canvas ) {

	var vertString = "";

	if(_shaderSrc.vertURL){
		vertString = fetchHTTP( _shaderSrc.vertURL );
	} else {
            vertString =
"attribute mediump vec2 a_position;\n\
attribute mediump vec2 a_texcoord;\n\
varying mediump vec2 CoronaTexCoord;\n\
void main() {\n\
gl_Position = vec4(a_position, 0.0, 1.0);\n\
CoronaTexCoord = a_texcoord;\n\
}\n\
";
	}

	var fragString = "\
#define P_DEFAULT highp\n\
#define P_RANDOM highp\n\
#define P_POSITION mediump\n\
#define P_NORMAL mediump\n\
#define P_UV mediump\n\
#define P_COLOR lowp\n\
#define FRAGMENT_SHADER_SUPPORTS_HIGHP 1\n\
varying mediump vec2 CoronaTexCoord; uniform P_RANDOM vec4 v_ColorScale; uniform P_RANDOM vec4 CoronaVertexUserData; uniform highp vec2 u_full_resolution;uniform sampler2D CoronaSampler0;uniform sampler2D CoronaSampler1;uniform highp vec2 u_mouse;uniform highp float CoronaTotalTime; \
highp vec4 CoronaColorScale(highp vec4 c) { return v_ColorScale*c; } P_DEFAULT float CoronaDeltaTime=0.02; uniform P_UV vec4 CoronaTexelSize; P_POSITION vec2 CoronaContentScale = vec2(1.0,1.0); \n\
P_COLOR vec4 FragmentKernel( P_UV vec2 position );\nvoid main(){gl_FragColor = FragmentKernel(CoronaTexCoord);}\n";

	errorLineOffset = fragString.split(/\r\n|\r|\n/).length


    if (_shaderSrc.fragSTR){
		fragString += _shaderSrc.fragSTR;
	} else if(_shaderSrc.fragURL){
		fragString += fetchHTTP( _shaderSrc.fragURL );
	} else {
		fragString += "P_COLOR vec4 FragmentKernel( P_UV vec2 texCoord ){P_COLOR vec4 ret = vec4(texCoord.x, texCoord.y, abs(sin(CoronaTotalTime)), 1); return CoronaColorScale(ret);}";
	}

	var vertexShader = createShader(_gl, vertString, _gl.VERTEX_SHADER, canvas);
	var fragmentShader = createShader(_gl, fragString , _gl.FRAGMENT_SHADER, canvas);

	if(!fragmentShader){
		fragmentShader = createShader(_gl, "void main(){\n\
	gl_FragColor = vec4(1.0);\n\
}" , _gl.FRAGMENT_SHADER, canvas);
	}

	// Create and use program
	var program = createProgram( _gl, [vertexShader, fragmentShader]);
	_gl.useProgram(program);

	// Delete shaders
	// _gl.detachShader(program, vertexShader);
 //    _gl.detachShader(program, fragmentShader);
 //    _gl.deleteShader(vertexShader);
 //    _gl.deleteShader(fragmentShader);

	return program;
}

function FormatNumberLength(_num, _length) {
    var r = "" + _num;
    while (r.length < _length) {
        r = "0" + r;
    }
    return r;
}

/*
 *	Render loop of shader in a canvas
 */
function renderShader( _billboard ) {
	if (!_billboard.gl) {
		return;
	}
	if(typeof valuesFromControls !== 'undefined') {
	    valuesFromControls();
	}

	// set the time uniform
	var timeFrame = Date.now();
	var time = (timeFrame-timeLoad) / 1000.0;
	var timeLocation = _billboard.gl.getUniformLocation(_billboard.program, "CoronaTotalTime");
    if(timeLocation) {
        _billboard.gl.uniform1f(timeLocation, time);
    }

    var tint = _billboard.canvas.colorTint || [1,1,1,1];
	if(tint) {
		var colorScale = _billboard.gl.getUniformLocation(_billboard.program, "v_ColorScale");
		if (colorScale) {
			_billboard.gl.uniform4fv(colorScale, tint);
		}
	}

	if(_billboard.canvas.vertexData) {
		var userVertexLoc = _billboard.gl.getUniformLocation(_billboard.program, "CoronaVertexUserData");
		if (userVertexLoc) {
			_billboard.gl.uniform4fv(userVertexLoc, _billboard.canvas.vertexData);
		}
	}

	// set the mouse uniform
	var rect = _billboard.canvas.getBoundingClientRect();
	if( mouse.x >= rect.left &&
		mouse.x <= rect.right &&
		mouse.y >= rect.top &&
		mouse.y <= rect.bottom){

		var mouseLocation = _billboard.gl.getUniformLocation(_billboard.program, "u_mouse");
		_billboard.gl.uniform2f(mouseLocation,mouse.x-rect.left,_billboard.canvas.height-(mouse.y-rect.top));
	}

	// set the resolution uniform
	var resolutionLocation = _billboard.gl.getUniformLocation(_billboard.program, "u_full_resolution");
	_billboard.gl.uniform2f(resolutionLocation, _billboard.canvas.width, _billboard.canvas.height);

	for (var i = 0; i < _billboard.textures.length; ++i){
		if(!_billboard.textures[i])
			continue;
		
		_billboard.gl.uniform1i( _billboard.gl.getUniformLocation( _billboard.program, "CoronaSampler"+i) , i);
		var tsx = 1.0/_billboard.textures[i].image.width;
		var tsy = 1.0/_billboard.textures[i].image.height;

		_billboard.gl.uniform4f( _billboard.gl.getUniformLocation( _billboard.program, "CoronaTexelSize"), tsx, tsy,tsx, tsy);

		_billboard.gl.activeTexture(_billboard.gl.TEXTURE0+i);
		_billboard.gl.bindTexture(_billboard.gl.TEXTURE_2D, _billboard.textures[i]);

	}

	// Draw the rectangle.
	_billboard.gl.drawArrays(_billboard.gl.TRIANGLE_STRIP, 0, 4);
}

document.addEventListener('mousemove', function(e){
    mouse.x = e.clientX || e.pageX;
    mouse.y = e.clientY || e.pageY
}, false);

/**
 * Provides requestAnimationFrame in a cross browser way.
 */
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
            return window.setTimeout(callback, 1000/60);
         };
})();

/**
 * Provides cancelRequestAnimationFrame in a cross browser way.
 */
window.cancelRequestAnimFrame = (function() {
  return window.cancelCancelRequestAnimationFrame ||
         window.webkitCancelRequestAnimationFrame ||
         window.mozCancelRequestAnimationFrame ||
         window.oCancelRequestAnimationFrame ||
         window.msCancelRequestAnimationFrame ||
         window.clearTimeout;
})();


