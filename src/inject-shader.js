(function () {
    
    var prefix = typeof(embeddedPrefix)==='undefined' ? "//shader.coronalabs.com/" : embeddedPrefix;
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(searchString, position) {
            position = position || 0;
            return this.lastIndexOf(searchString, position) === position;
        };
    }


    var styles = ["src/codemirror/css/codemirror.css",
        "src/codemirror/addon/fold/foldgutter.css",
        "src/codemirror/addon/dialog/dialog.css",
        "src/codemirror/addon/hint/show-hint.css",
        "src/codemirror/theme/monokai.css",
        //"css/coronastyle.css",
        "css/embedded.css"];

    var scripts = [
        "src/codemirror/addon/edit/matchbrackets.js",
        "src/codemirror/addon/edit/closebrackets.js",
        "src/codemirror/addon/comment/comment.js",
        "src/codemirror/addon/wrap/hardwrap.js",
        "src/codemirror/addon/fold/foldcode.js",
        "src/codemirror/addon/fold/brace-fold.js",
        "src/codemirror/keymap/sublime.js",
        "src/codemirror/addon/hint/show-hint.js",
        "src/codemirror/mode/clike.js",
        "src/glslCanvas.js"
        // "src/main.js"
        ];

    for (var i = 0; i < styles.length; i++) {
        var link = document.createElement('link');
        link.href = appendPrefix(styles[i]);
        link.type = 'text/css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    function appendScript() {
        var script = document.createElement('script');
        script.onload = function () {
            for(var i=0;i<scripts.length;i++) {
                var ss = document.createElement('script');
                ss.src = appendPrefix(scripts[i]);
                document.head.appendChild(ss);
            }
            window.addEventListener("load", injectCodeAndCanvas);
        };
        script.src = appendPrefix("src/codemirror.js");
        document.head.appendChild(script);
    }

    if(typeof CodeMirror === "undefined") {
        appendScript();
    } else {
        injectCodeAndCanvas();
    }


    function appendPrefix(e) {
        if (e.startsWith('http') || e.startsWith('//')) {
            return e;
        }
        return prefix+e;
    }

    function CreateSingleCodeAndCanvas(div, allDoneTracker) {

        var request = new XMLHttpRequest();

        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {
                var shader = request.responseText;
                var editor = document.createElement('div');
                editor.classList.add("editor");

                var canvas = document.createElement('canvas');
                canvas.setAttribute("data-fragment", shader);
                canvas.vertexData = JSON.parse(div.getAttribute('data-vertex') || "");
                var textures = (div.getAttribute('data-textures') || "")
                                    .split('&')
                                    .filter(function (e) { return !!e; })
                                    .map(appendPrefix)
                                    .join('&');
                canvas.setAttribute("data-textures", textures);

                div.appendChild(canvas);
                div.appendChild(editor);

                var cm = CodeMirror(editor, {
                    value: shader,
                    viewportMargin: 1000,
                    lineNumbers: true,
                    matchBrackets: true,
                    mode: "x-shader/x-fragment",
                    keyMap: "sublime",
                    autoCloseBrackets: true,
                    extraKeys: {"Ctrl-Space": "autocomplete"},
                    showCursorWhenSelecting: true,
                    lineWrapping: true,
                    indentUnit: 4
                });

                cm.on("change", function (cm) {
                    canvas.setAttribute("data-fragment", cm.getValue());
                    loadShaders();
                });

                editor.codeMirrorInstance = cm;
                canvas.codeMirrorInstance = cm;

                var openBtn = document.createElement('button');
                openBtn.textContent = "Open in Playground";
                openBtn.addEventListener("click", function () {
                    var obj = {
                        vdata: canvas.vertexData,
                        shader: btoa(canvas.getAttribute("data-fragment"))
                    };
                    var url = "https://shader.coronalabs.com/#" + textures + '&' + JSON.stringify(obj);
                    window.open(url);
                });
                div.appendChild(openBtn);

                div.classList.add("codeAttachedAndLoaded");
                allDoneTracker.doneTask();
            }
        };
        request.open('GET', appendPrefix(div.getAttribute('data-shader-file')));
        request.overrideMimeType("text/plain");
        request.send(null);
    }

    function injectCodeAndCanvas() {
        var containers = document.getElementsByClassName("shaderCodeAndCanvas");
        var allDoneTracker = {
            todo: 0,
            done: function() {
                CodeMirror.hintWords["x-shader/x-vertex"] = CodeMirror.hintWords["x-shader/x-vertex"].concat(coronaKeywords);
                loadShaders();
                renderShaders();
            },
            addTask: function() {
                this.todo++;
                return this;
            },
            doneTask: function() {
                this.todo--;
                if(this.todo==0) {
                    this.done();
                    this.done = undefined;
                }
            }
        };
        allDoneTracker.addTask();
        for (var i = 0; i < containers.length; i++) {
            if(!containers[i].classList.contains("codeAttached")) {
                containers[i].classList.add("codeAttached");
                CreateSingleCodeAndCanvas(containers[i], allDoneTracker.addTask());
            }
        }
        allDoneTracker.doneTask();
    }

})();
