(function()
{

var editorElement;
var v_dataElements;
var tintColorElement;
var tintAlphaElement;
var bgColorElement;
var bgAlphaElement;
var canvasElement;
var shareLinkElement;

document.addEventListener("DOMContentLoaded", function() {
    editorElement = document.getElementById("editor");
    v_dataElements = [document.getElementById("v_data0"), document.getElementById("v_data1"), document.getElementById("v_data2"), document.getElementById("v_data3")];
    tintColorElement = document.getElementById("tintColor");
    tintAlphaElement =  document.getElementById("tintAlpha");
    bgColorElement = document.getElementById("bgColor");
    bgAlphaElement = document.getElementById("bgAlpha");
    canvasElement = document.getElementById("canvas");
    shareLinkElement = document.getElementById("shaderLink");
});

function getCM() { return editorElement.CodeMirror; }


window.addEventListener("hashchange", function () {
    //loadTag()
}, false);

var imgs = [];

function removeElementsByClass(className){
    var elements = document.getElementsByClassName(className);
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
}

function loadTag(){
    var fragShader = "";
    var fragFile = "";

    while(imgs.length > 0) {
        imgs.pop();
    }

    removeElementsByClass("CodeMirror");

    if( window.location.hash ) {
        var hashes = location.hash.split('&');

        for(var i in hashes){
            var name = decodeURIComponent(hashes[i]);
            // Extract hash if is present
            if(name.search("#") === 0){
                name = name.substr(1);
            }
            if(name[0] == '{' || name[0] == '[') {
                var hashfragShader = updateInputValues(name);
                if(hashfragShader) {
                    fragFile = "Shader Playground";
                    fragShader = hashfragShader;
                }
                continue;
            }

            var ext = name.substr(name.lastIndexOf('.') + 1);


            if(ext == "frag"){
                fragFile = name;
                fragShader = fetchHTTP(fragFile);
            } else if (ext == "png" || ext == "jpg" || ext == "PNG" || ext == "JPG" ){
                imgs.push(name);
            }
        }
    }

    if( !fragShader ) {
        fragShader = "\nP_COLOR vec4 FragmentKernel( P_UV vec2 texCoord ){\n\
	P_COLOR vec4 ret = vec4(texCoord.x, texCoord.y, \n\
							abs(sin(CoronaTotalTime)), 1);\n\
	return CoronaColorScale(ret);    \n\
}\n\n";
    }

    var demoTitle = document.getElementById("title");
    if(demoTitle){
        demoTitle.textContent = fragFile;
    }

    var demoCanvas = document.getElementById("canvas");
    if(demoCanvas && fragShader !== ""){
        demoCanvas.setAttribute("data-fragment", fragShader);
        console.log("data-fragment: " + fragFile);

        if(imgs.length > 0){
            var textureList = "";
            for(i in imgs){
                textureList += imgs[i];
                textureList += (i < imgs.length-1)?"&":"";
            }
            demoCanvas.setAttribute("data-textures",textureList);
            console.log("data-textures: " + textureList);
        }
        loadShaders();
    }

    var demoEditor = document.getElementById("editor");
    if(demoEditor){
        var editor = CodeMirror(demoEditor,{
            value: fragShader,
            lineNumbers: true,
            matchBrackets: true,
            mode: "x-shader/x-fragment",
            keyMap: "sublime",
            autoCloseBrackets: true,
            extraKeys: {"Ctrl-Space": "autocomplete"},
            showCursorWhenSelecting: true,
			//theme: "monokai",
            indentUnit: 4,
            viewportMargin: Infinity,
            lineWrapping:true
        });

        CodeMirror.hintWords["x-shader/x-vertex"] = CodeMirror.hintWords["x-shader/x-vertex"].concat(coronaKeywords);

        editor.on("change", function() {
            demoCanvas.setAttribute("data-fragment", editor.getValue());
            loadShaders();
        });
        demoEditor.codeMirrorInstance = editor;
        demoCanvas.codeMirrorInstance = editor;
    }
}

window.onload = function () {
    loadTag();
    renderShaders();

    for (var i = 0; i <= 1; i++) {
        var fn = (imgs[i] || "").split('\\').pop().split('/').pop();
        if(fn) {
            var samplerSelect = document.getElementById("sampler"+i);
            samplerSelect.value = fn;
        }
    };
};

var useHdTextures = false;

window.samplerChange = function(event, num) {
    var reload = true;
    if(num>imgs.length) {
        reload = false;
    }
    var img = event.target.value;
    if(img){
        if(useHdTextures) {
            img = "textures/1024/"+img;
        }else {
            img = "textures/512/"+img;
        }
    }else {
        img = ""
    }
    imgs[num] = img;
    if(reload) {
        document.getElementById("canvas").setAttribute("data-textures", imgs.join("&"));
        loadShaders();
    }
}

var lastShareLink = '';
var loadedGapiShortener = false;
window.fetchShortLink = function(event) {
    var button = event.target
    button.disabled = true;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=AIzaSyBw817hMmmTddLdF7SnISeH1oOKJp_DvqE", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function () {
        button.disabled = false;
        if (this.readyState == 4 && this.status == "200") {
            var link = JSON.parse(this.responseText).shortLink;
            button.textContent = "Update Link";
            var edit = document.getElementById("urlGoesHere");
            edit.style.visibility = "visible";
            lastShareLink = link;
            edit.value = lastShareLink;
            var shareButtonsDiv = document.getElementById("share-buttons");
            var t = '<a href="https://plus.google.com/share?url=URL_PLACEHOLDER" target="_blank"><img src="/shareButtons/google.png" alt="Google" /></a><a href="http://www.facebook.com/sharer.php?u=URL_PLACEHOLDER" target="_blank"><img src="/shareButtons/facebook.png" alt="Facebook" /></a><a href="http://twitter.com/share?url=URL_PLACEHOLDER&text=Check out my shader on Corona Shader Playground&hashtags=coronasdk" target="_blank"><img src="/shareButtons/twitter.png" alt="Twitter" /></a><a href="http://www.digg.com/submit?url=URL_PLACEHOLDER" target="_blank"><img src="/shareButtons/diggit.png" alt="Digg" /></a><a href="http://reddit.com/submit?url=URL_PLACEHOLDER&title=Check out my shader on Corona Shader Playground" target="_blank"><img src="/shareButtons/reddit.png" alt="Reddit" /></a><a href="http://www.linkedin.com/shareArticle?mini=true&url=URL_PLACEHOLDER" target="_blank"><img src="/shareButtons/linkedin.png" alt="LinkedIn" /></a><a href="http://www.stumbleupon.com/submit?url=URL_PLACEHOLDER&title=Check out my shader on Corona Shader Playground" target="_blank"><img src="/shareButtons/stumbleupon.png" alt="StumbleUpon" /></a><a href="mailto:?Subject=My shader at Corona Shader Playground&Body=Check out my shader on Corona Shader Playground URL_PLACEHOLDER"><img src="/shareButtons/email.png" alt="Email" /></a>';
            t = t.replace(/URL_PLACEHOLDER/g, lastShareLink);
            shareButtonsDiv.innerHTML = t;
        }
    }
    xhr.send(JSON.stringify({
        "dynamicLinkInfo" : {
            "dynamicLinkDomain" : "f25j6.app.goo.gl",
            "link":getShareUrl(),
            "socialMetaTagInfo": {
                "socialTitle": "Corona Shader Playgroud",
                "socialDescription": "Fragment shaders live coding with Corona GLSL dialect in your browser!",
                "socialImageLink": "//logo.png"
            }
        },
        "suffix": {
            "option": "SHORT"
        }
    }));
}



function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}


window.updateInputValues = function(jso) {
    var obj;
    try
    {
        obj = JSON.parse(jso);
    }
    catch(err){
        console.log("Error while parsing data json" + err);
    }

    if(obj instanceof Array) {
        vertexData = obj;
        for(var i=0;i<4;i++) {
            v_dataElements[i].value = vertexData[i];
        }
    }else if(obj) {
        if (obj.vdata && obj.vdata.length == 4) {
            for(var i=0;i<4;i++) {
                v_dataElements[i].value = obj.vdata[i];
            }
        }
        if (obj.tint) {
            tintColorElement.value = obj.tint;
        }
        if (obj.tint_a) {
            tintAlphaElement.value = obj.tint_a;
        }
        if (obj.bg) {
            bgColorElement.value = obj.bg;
        }
        if (obj.bg_a) {
            bgAlphaElement.value = obj.bg_a;
        }
        valuesFromControls();
        var ret;
        try{
            ret = atob(obj.shader);
        }catch(err){}
        return ret;
    }
};

function getHashUniformObject(includeShader) {
    var obj = {
        vdata:vertexData,
        tint:tintColorElement.value,
        tint_a:tintAlphaElement.value,
        bg:bgColorElement.value,
        bg_a:bgAlphaElement.value
    };
    if(includeShader) {
        obj.shader = btoa(canvasElement.getAttribute("data-fragment"));
    }
    return JSON.stringify(obj);
}

function getShareUrl() {
    return location.href.split(location.hash||"#")[0] + "#" + canvasElement.getAttribute("data-textures") + "&" + getHashUniformObject(true);
}

var vertexData = [0,0,0,0];
var colorTint = [1,1,1,1];

window.valuesFromControls = function() {
    var hex = bgColorElement.value;
    var r = hexToR(hex);
    var g = hexToG(hex);
    var b = hexToB(hex);
    var a = bgAlphaElement.value;
    canvasElement.style.backgroundColor='rgba('+r+','+g+','+b+','+a+')';

    //tint
    hex = tintColorElement.value;
    a = tintAlphaElement.value;
    colorTint = [hexToR(hex)/255.0,hexToG(hex)/255.0,hexToB(hex)/255.0,a];

    //user vertex data
    for(var i=0;i<4;i++) {
        vertexData[i] =  + v_dataElements[i].value;
    }

    canvasElement.vertexData = vertexData;
    canvasElement.colorTint = colorTint;
}


})();