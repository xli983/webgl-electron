

class Delay {
    static timeOuts = new Set<Delay>();
    time: number;
    func: Function;
    startTime: number;
    constructor(func: Function, time: number) {
        this.func = func;
        this.time = time;
        this.startTime = performance.now();
        Delay.timeOuts.add(this);
    }

    static checkAll() {
        Delay.timeOuts.forEach((t) => {
            if (performance.now() - t.startTime > t.time) {
                t.func();
                Delay.timeOuts.delete(t);
            }
        });
    }
}

function delay(time: number, func: Function) {
    return new Delay(func, time);
}

function normalize(x, y) {
    var length = Math.sqrt(x * x + y * y)
    return [x / length, y / length, length]
}

// function win2canvas(x, y) {

//     let dx=x-CV.originX
//     let dy=y-CV.originY

//     let nx=normalize(CV.unitXaxisX,CV.unitXaxisY)
//     let ny=normalize(CV.unitYaxisX,CV.unitYaxisY)

//     var projectedScreenX = dx * nx[0] + dy * nx[1]
//     var projectedScreenY = dx * ny[0] + dy * ny[1]

//     return [projectedScreenX/nx[2], projectedScreenY/ny[2]]
// }

function getDocumentStyleZoom() {
    //@ts-ignore
    let zoom = document.body.style.zoom
    return zoom == "" ? 1 : parseFloat(zoom)
}
function setDocumentStyleZoom(v: number) {
    //@ts-ignore
    document.body.style.zoom = "" + v
}

// function angleAndRatioBetween2DVectors(A, B) {
//     // Compute the dot product
//     let dot = A[0] * B[0] + A[1] * B[1];

//     // Compute the "cross product" (z-component)
//     let cross = A[0] * B[1] - A[1] * B[0];

//     // Compute the magnitudes of A and B
//     let magA = Math.sqrt(A[0] * A[0] + A[1] * A[1]);
//     let magB = Math.sqrt(B[0] * B[0] + B[1] * B[1]);

//     // Calculate the cosine of the angle
//     let cosTheta = dot / (magA * magB);

//     // Clamp the value between [-1, 1] to handle potential floating point inaccuracies
//     cosTheta = Math.min(Math.max(cosTheta, -1.0), 1.0);

//     // Compute the angle in radians. Adjust based on the sign of the cross product.
//     let angle;
//     if (cross > 0) {
//         angle = 2 * Math.PI - Math.acos(cosTheta);
//     } else {
//         angle = Math.acos(cosTheta);
//     }

//     // Compute the length ratio
//     let ratio = magB / magA;

//     return { angle: angle, ratio: ratio };
// }


function int(x) {
    return Math.floor(x);
}

function downSampleArray(array: Uint8Array | Uint8ClampedArray, srcW, srcH, dstW, dstH): ImageData {
    let imgData = new ImageData(dstW, dstH);
    for (let y = 0; y < dstH; y++) {
        for (let x = 0; x < dstW; x++) {
            let srcIndex = int((y / dstH) * srcH) * srcW + int((x / dstW) * srcW);
            let dstIndex = y * dstW + x;
            imgData.data[dstIndex * 4] = array[srcIndex * 4];
            imgData.data[dstIndex * 4 + 1] = array[srcIndex * 4 + 1];
            imgData.data[dstIndex * 4 + 2] = array[srcIndex * 4 + 2];
            imgData.data[dstIndex * 4 + 3] = array[srcIndex * 4 + 3];
        }
    }
    return imgData;
}
function offsetClipper(array, srcW, srcH, left, top, width, height) {
    let imgData = new ImageData(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Calculate the corresponding source coordinates
            let srcX = x + left;
            let srcY = y + top;

            // Check if the source coordinates are within the bounds of the source image
            if (srcX >= 0 && srcX < srcW && srcY >= 0 && srcY < srcH) {
                let srcIndex = Math.floor(srcY * srcW + srcX) * 4;
                let dstIndex = Math.floor(y * width + x) * 4;

                // Copy pixel data from source to destination
                imgData.data[dstIndex] = array[srcIndex];
                imgData.data[dstIndex + 1] = array[srcIndex + 1];
                imgData.data[dstIndex + 2] = array[srcIndex + 2];
                imgData.data[dstIndex + 3] = array[srcIndex + 3];
            } else {
                // If outside bounds, set pixel to transparent black
                let dstIndex = (y * width + x) * 4;
                imgData.data[dstIndex] = 0;
                imgData.data[dstIndex + 1] = 0;
                imgData.data[dstIndex + 2] = 0;
                imgData.data[dstIndex + 3] = 0;
            }
        }
    }
    return imgData;
}


function clamp(x, min, max) {
    if (x < min) {
        return min;
    }
    if (x > max) {
        return max;
    }
    return x;
}

function openFullscreen() {
    var elem = PageRoot;
    if (!App.fullscreen) {
        App.fullscreen = true;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
            //@ts-ignore
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            //@ts-ignore
            elem.webkitRequestFullscreen();
            //@ts-ignore
        } else if (elem.msRequestFullscreen) { /* IE11 */
            //@ts-ignore
            elem.msRequestFullscreen();
        }
    } else {
        App.fullscreen = false;
        if (document.exitFullscreen) {
            document.exitFullscreen();
            //@ts-ignore
        } else if (document.webkitExitFullscreen) { /* Safari */
            //@ts-ignore
            document.webkitExitFullscreen();
            //@ts-ignore
        } else if (document.msExitFullscreen) { /* IE11 */
            //@ts-ignore
            document.msExitFullscreen();
        }
    }
}

async function blob2ArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}

/*-------------------css2element-------------------*/


function addCss(element: HTMLElement, cssStr: string) {
    element.style.cssText += cssStr;
}
function setCss(element: HTMLElement, cssStr: string) {
    element.style.cssText = cssStr;
}





// function overWriteStyleDict(org, new_style) {
//     // Create a new object by copying the properties of the org object
//     const result = { ...org };

//     // Iterate over the properties of the new_style object
//     for (const key in new_style) {
//         // Overwrite the properties in the result object with the new_style properties
//         if (result[key] == undefined) {
//             Clog("key not found:" + key);
//         }
//         result[key] = new_style[key];
//     }

//     // Return the result object with the overwritten properties
//     return result;
// }

function preventDefaultFUNC(e) {
    if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
    }
}

const HIDE_SCROLLBAR_WIDTH = 17;
function createiFrame(parent: HTMLElement, style: string, onload: (body) => void = null) {
    let frame = document.createElement("iframe") as HTMLIFrameElement;
    frame.style.overflow = "hidden";
    frame.style.border = "none";
    frame.style.boxSizing = "border-box";
    frame.ontouchstart = function (e) {
        preventDefaultFUNC(e);
    }
    frame.style.touchAction = "none";
    if (onload != null) {
        frame.onload = () => {
            frame.contentDocument.head.innerHTML = `
            <style>
                * {
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                font-family: -apple-system, system-ui, BlinkMacSystemFont;
                font-weight: 400;
                font-size: 17px;
                border-radius: 10px;
                color: #C9C9C9;
                /* backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important; */
                transition: left 0.15s cubic-bezier(0.666, 0.0, 0.333, 1.0), 
                            top 0.15s cubic-bezier(0.666, 0.0, 0.333, 1.0), 
                            right 0.15s cubic-bezier(0.666, 0.0, 0.333, 1.0), 
                            bottom 0.15s cubic-bezier(0.666, 0.0, 0.333, 1.0),
                            height 0.15s cubic-bezier(0.666, 0.0, 0.333, 1.0),
                            width 0.15s cubic-bezier(0.666, 0.0, 0.333, 1.0),
                            transform 0.15s cubic-bezier(0.666, 0.0, 0.333, 1.0),
                            opacity 0.15s cubic-bezier(0.666, 0.0, 0.333, 1.0);
                }
            </style>
            `;
            frame.ontouchend = function (e) {
                preventDefaultFUNC(e);
            }
            frame.contentDocument.addEventListener("touchend", function (e) {//prevent double tap to zoom
                preventDefaultFUNC(e)
            });
            const hideScrollBarContainer = document.createElement('div');
            hideScrollBarContainer.style.overflow = 'hidden';
            hideScrollBarContainer.style.width = '100%';//hide the scrollbar
            hideScrollBarContainer.style.height = '100%';
            frame.contentDocument.body.appendChild(hideScrollBarContainer);
            frame.contentDocument.body.style.margin = '0px';
            const scrollContainer = document.createElement('div');
            hideScrollBarContainer.appendChild(scrollContainer);
            scrollContainer.style.overflowY = 'scroll';
            scrollContainer.style.overflowX = 'hidden';
            scrollContainer.style.width = `calc(100% + ${HIDE_SCROLLBAR_WIDTH}px)`;//hide the scrollbar
            scrollContainer.style.height = '100%';
            let container = createDiv(scrollContainer, `
                position: relative; 
                height: calc(100% + 1px);
                padding-right: ${HIDE_SCROLLBAR_WIDTH}px;
                max-width: 100%;`);

            container.style.display = "flex";
            container.style.flexDirection = "column";
            //to keep the container always scrollable
            // Hide scrollbar (for WebKit browsers)
            //scrollContainer.style.backgroundColor = 'rgba(0,0,0,0.1)'
            //@ts-ignore
            scrollContainer.style.WebkitOverflowScrolling = 'touch'; // Optional for smooth scrolling
            //@ts-ignore
            scrollContainer.style.msOverflowStyle = 'none';  // For IE and Edge
            //@ts-ignore
            scrollContainer.style.scrollbarWidth = 'none';   // For Firefox
            // Specific for WebKit browsers
            //@ts-ignore
            scrollContainer.style.WebkitScrollbar = 'none';  // Hides scrollbar in Chrome, Safari, and Edge
            onload(container);
        };
    }
    addCss(frame, style);
    parent.appendChild(frame);
    return frame;
}

function createDiv(parent: HTMLElement, style: string,textContent = null) {
    let element = document.createElement("div") as HTMLDivElement;
    element.style.position = "absolute";//default
    element.style.userSelect = "none";
    element.draggable = false;
    //element.style.touchAction = "none";//dont do this, will break frame scrolling
    element.style.webkitUserSelect = "none";
    addCss(element, style);
    if (parent != null)
        parent.appendChild(element);
    if(textContent!=null){
        element.textContent=textContent;
    }
    return element;
}


const btnTransitionCss = "transition: transform 0.1s, opacity 0.1s, background 0.2s;";
const btnOnClickCss = "transform: scale(0.8); opacity: 0.5;";
const cdbtnOnClickCss = "transform: scale(0.95); opacity: 0.5;";
const btnOnReleaseCss = "transform: scale(1); opacity: 1;";

function addBtnOnClickStyle(ele) {
    addCss(ele, btnTransitionCss);
    addOnClickStyle(ele, btnOnClickCss, btnOnReleaseCss);
}

function addOnClickStyle(ele, onStyle, offStyle, callback = null, prevent_propagation = true, ) {
    ele._onClickStyle = onStyle;
    ele._onReleaseStyle = offStyle;
    ele._prevent_propagation = prevent_propagation;
    if (callback != null) {
        ele._btnStyleCallback = callback;
    }
}

var clickedElement = null;


function createCDBtn(parent: HTMLElement, src: string, style: string, onClick: () => void, delaytime = 300) {
    let CD: Delay
    let element = createSimpleBtn(parent, src, style, null, false);
    addCss(element, btnTransitionCss)
    let CDFunc = () => {
        if (CD == null) {
            onClick();
            CD = new Delay(() => { CD = null, addCss(element, btnOnReleaseCss) }, delaytime);
        }
    }
    element.onpointerdown = () => { addCss(element, cdbtnOnClickCss) };
    element.onpointerup = CDFunc;
    return element;
}

function createSimpleBtn(parent: HTMLElement, src: string, style: string, onClick: () => void, onClieckEffect = true) {
    let type;
    let element: HTMLElement;
    if (src != null) {
        if (src.startsWith("img:")||src.startsWith("svg/")) {
            type = "img";
            src = src.replace("img:", "");
        } else {
            type = "div";
        }
    } else {
        type = "div";
    }

    if (type == "div") {
        element = document.createElement("div") as HTMLDivElement;
        if (src != null) {
            element.innerHTML = src;
        }
    } else if (type == "img") {
        element = createImg_(src);
    } else {
        throw new Error("Invalid element type");
    }
    element["_btn_onClick"] = onClick;
    // sometimes the pointerup event is not triggered, but the global one is triggered
    // element.addEventListener("pointerup", function () {
    //     onClick();
    // });
    addCss(element, style);
    if (parent != null)
        parent.appendChild(element);

    if (onClieckEffect) {
        addBtnOnClickStyle(element);
    }
    element["_prevent_propagation"] = true;
    element.ondragstart = function () { return false; };
    return element;
}

const simpleBtn2ClickedSet = new Set();

function createSimpleBtn2(parent: HTMLElement, src: string, style: string, onClick: () => void, onClieckEffect = true) {
    //simpleBtn independent of Xelement
    let type;
    let element: HTMLElement;
    if (src != null) {
        if (src.startsWith("img:")||src.startsWith("svg/")) {
            type = "img";
            src = src.replace("img:", "");
        } else {
            type = "div";
        }
    } else {
        type = "div";
    }

    if (type == "div") {
        element = document.createElement("div") as HTMLDivElement;
        if (src != null) {
            element.innerHTML = src;
        }
    } else if (type == "img") {
        element = createImg_(src);
    } else {
        throw new Error("Invalid element type");
    }
    element.onpointerdown = () => {
        addCss(element, btnOnClickCss);
        simpleBtn2ClickedSet.add(element);
    }
    setCss(element, style);
    element["_2style"] = style;
    element["_2onClick"] = onClick;
    if (parent != null)
        parent.appendChild(element);

    element.ondragstart = function () { return false; };
    return element;
}
document.addEventListener("pointerup", function () {
    simpleBtn2ClickedSet.forEach((ele:HTMLElement) => {
        setCss(ele, ele["_2style"]);
        ele["_2onClick"]();
    });
    simpleBtn2ClickedSet.clear();
})

var lastSOOpenTime = 0;
const SOcloseTime = 300;
var SOelement = null;
var SOSelected = null;

function showup(element: HTMLElement, displayMode: "block" | "flex" = "block", opacity = 1) {
    if(parseFloat(element.style.opacity)>0.01 && element.style.display==displayMode){
        return;
    }
    element.style.opacity="0";
    element.style.transform="scale(0.9)";
    element.style.display=displayMode;
    delay(10,() => {        element.style.opacity="" + opacity;
        element.style.transform="scale(1)";
    });
}

function toggleSO(x, y, ele, op: "open" | "close") {
    if (op == "open") {

        if(ele["_xpromiseId"]!=null && !ele["_ready"]){//for ximage and cpoutput
            return;
        }
        
        let list = []
        SecOptions.childNodes.forEach((ele) => {
            list.push(ele);
        });
        list.forEach((ele) => {
            ele.remove();
        });

        lastSOOpenTime = performance.now();
        SecOptions.style.opacity = "0";
        SecOptions.style.transform = "translate(-50%, 0px) scale(0.9)";
        SecOptions.style.display = "block";
        delay(10,() => {SecOptions.style.opacity = "1"; SecOptions.style.transform = "translate(-50%, 0px) scale(1)";});
        SOelement = ele;
        ele["_options"].forEach((option) => {
            let optionEle = createDiv(SecOptions, `
            position: relative;
            width: auto;
            height: ${BAR_HEIGHT}px;
            ${Theme.buttonStyle1}
            background-color: ${Theme.dark};
            border-radius: 4px;
            overflow: hidden;
            white-space: nowrap;
            padding: 0px 44px;
            gap: 20px;
            `);
            optionEle.innerHTML = option;
            optionEle.onpointerdown = () => {
                optionEle.style.backgroundColor = Theme.mid;
            }
            optionEle.onpointerup = () => {//default apply
                SOSelected = option;
                ele.innerHTML = option;
                toggleSO(0, 0, null, "close");
            }
        });

        x += 0;
        x = Math.min(x, PageRoot.offsetWidth - 100);
        x = Math.max(x, 100);

        SecOptions.style.left = x + "px";
        if (y < PageRoot.offsetHeight / 2) {
            let boundingBox = ele.getBoundingClientRect();
            SecOptions.style.top = boundingBox.y+boundingBox.height + 6 + "px";
            SecOptions.style.bottom = "auto";
        } else {
            SecOptions.style.top = "auto";
            SecOptions.style.bottom = PageRoot.offsetHeight - y + 20 + "px";
        }

    } else if (op == "close" && SOelement != null && SecOptions.style.display != "none") {
        if (performance.now() - lastSOOpenTime < SOcloseTime) {
            return
        }
        if (SOSelected != null && SOelement["_options"].includes(SOSelected)) {
            SOelement.innerHTML = SOSelected;
            let text = SOSelected;
            if (SOSelected.includes("<img")) {
                text = SOSelected.split(">")[1]
            }
            if (SOelement["_optionCallback"] != null) {
                SOelement["_optionCallback"](text);
            }
        }
        SOSelected = null;
        SecOptions.style.display = "none";
    }
}

function multiInnerHTML(imgSrc, imgSize = 20) {
    // Construct the HTML string
    const innerHTML = `<img src="svg/${imgSrc}" alt="Image" onerror="this.style.display='none'" style="width: ${imgSize}px; height: ${imgSize}px; border-radius:unset;">`;
    return innerHTML;
}

function optionBtnOnClick(x, y, ele) {
    if (SecOptions.style.display == "none" || SOelement!=ele) {
        toggleSO(x, y, ele, "open");
    } else {
        toggleSO(0, 0, null, "close");
    }
}


function setSOBtn(ele: HTMLElement, options: Array<string>, callback: (option: string) => void, mode:"default"|"doubleClick"="default") {
    ele[_LAST_CLICK_T] = 0;
    if(mode=="doubleClick"){
        ele.onpointerdown = (e) => {
            let curTime = performance.now();
            if (curTime - ele[_LAST_CLICK_T] < 500) {
                optionBtnOnClick(e.clientX, e.clientY, ele)
            }
            ele[_LAST_CLICK_T] = curTime;
        }
    }else{
        ele.onpointerdown = (e) => {
            optionBtnOnClick(e.clientX, e.clientY, ele)
        }
    }
    ele["_options"] = options;
    ele["_optionCallback"] = callback;
}


function createImg_(src){
    let img = document.createElement("img");
    img.src = src;
    let errorCount = 0;
    img.onerror = function () {
        if(errorCount<5){
        img.src = "svg/frame_dot.png";
        errorCount++;
        }else{
            XlogError("image not found:"+src);
        }
    }
    return img;
}

function createImg(parent, src, sty: string) {
    var img = createImg_(src);
    if (parent != null)
        parent.appendChild(img);
    addCss(img, sty);
    return img;
}

/**
 * create input box
 * @param parent
 * @param {string} CSSProperties
 * @param {type} "text"
 * @param {string} value
 */
function createTextInput(parent, css, value = "") {
    var input = document.createElement("input");
    input.style.position = "absolute";
    input.style.border = "none";
    input.style.outline = "none";
    input.style.padding = "0px";
    input.type = "text";
    input.value = value;
    input.draggable = false;
    input.ondragstart = function () { return false; };
    if(parent!=null)
    parent.appendChild(input);
    addCss(input, css);
    return input;
}

//this textarea can automatically grow
function createTextAreaSty(parent, str, placeholder = "") {
    var textarea = document.createElement("textarea");
    textarea.style.position = "absolute";
    textarea.placeholder = placeholder;
    parent.appendChild(textarea);
    addCss(textarea, str);
    textarea.rows = 1;
    textarea.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    return textarea;
}

async function askForImg() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    let result = new Promise((resolve) => {
        input.onchange = function (e) {//@ts-ignore
            resolve(e.target.files[0]);
        };
    });
    input.click();
    PageRoot.appendChild(input);
    return result;

}
function injection(v) {
    if (v != 15 && v != 10 && v != 0)
        Clog("injection");
}


function appendChildren(parent, children) {
    for (var i = 0; i < children.length; i++) {
        parent.appendChild(children[i]);
    }
}


function hsv2rgb(h, s, v): [number, number, number] {
    let r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            r = v, g = t, b = p;
            break;
        case 1:
            r = q, g = v, b = p;
            break;
        case 2:
            r = p, g = v, b = t;
            break;
        case 3:
            r = p, g = q, b = v;
            break;
        case 4:
            r = t, g = p, b = v;
            break;
        case 5:
            r = v, g = p, b = q;
            break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function rgb2hsv(r, g, b) {
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, v];
}



function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, curr) => acc + curr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const array of arrays) {
        result.set(array, offset);
        offset += array.length;
    }
    return result;
}

function getInverseMatrix(matrix) {
    const [a, c, b, d,] = matrix;
    const det = a * d - b * c;
    return [
        d / det,
        -b / det,
        -c / det,
        a / det,
    ];
}

function applyMatrixToPoint(matrix, x, y) {
    const [a, b, c, d] = matrix;
    const newX = a * x + c * y;
    const newY = b * x + d * y;
    return [newX, newY];
}
function apply3DMatrixToPoint(matrix, x, y) {
    const [a, b, _, c, d, e, __, f] = matrix;
    const newX = a * x + b * y + c;
    const newY = d * x + e * y + f;
    return [newX, newY];
}

function InverseSimpleTransform(matrix: number[], parentX, parentY) {
    /**
     * used to map a point from parent scope to child scope
     */
    const shiftX = matrix[4];
    const shiftY = matrix[5];
    let rx = parentX - shiftX;
    let ry = parentY - shiftY;

    const inverseMatrix = getInverseMatrix(matrix);
    let res = applyMatrixToPoint(inverseMatrix, rx, ry);

    return res;
}



function concatArrayBuffers(arrayBuffers) {
    // Calculate the total length of the concatenated ArrayBuffer
    const totalLength = arrayBuffers.reduce((acc, arrayBuffer) => acc + arrayBuffer.byteLength, 0);

    // Create a new Uint8Array with the total length
    const concatenatedUint8Array = new Uint8Array(totalLength);

    // Iterate through the list of ArrayBuffer objects and copy their contents
    let offset = 0;
    for (const arrayBuffer of arrayBuffers) {
        concatenatedUint8Array.set(new Uint8Array(arrayBuffer), offset);
        offset += arrayBuffer.byteLength;
    }

    // Create a new ArrayBuffer from the concatenated Uint8Array

    return concatenatedUint8Array;
}

function serializeTreeToJsonUint8Array(obj) {
    let parts = [];
    let pngs = [];
    let pngNum = 0;

    function serialize(obj) {
        if (obj instanceof ArrayBuffer || obj instanceof Uint8Array) {
            // Convert ArrayBuffer to Uint8Array
            let size = obj.byteLength;
            let headerBuffer = TEXTEN.encode("ssssssssssssssssssss");

            let headerUint8Array = TEXTEN.encode("" + size);
            let pngId = TEXTEN.encode("png" + pngNum);
            headerBuffer.set(headerUint8Array, 0);
            headerBuffer.set(pngId, 10);
            // Convert the original ArrayBuffer to Uint8Array
            let dataUint8Array = new Uint8Array(obj);
            // Push the header, then the data
            pngs.push(headerBuffer);
            pngs.push(dataUint8Array);
            parts.push(TEXTEN.encode(`${pngNum}`));
            pngNum++;
        } else if (typeof obj === 'object' && obj !== null) {
            parts.push(new Uint8Array([123])); // '{' character

            let keys = Object.keys(obj);
            keys.forEach((key, index) => {
                // Serialize key
                let keyString = `"${key}":`;
                let keyUint8Array = new TextEncoder().encode(keyString);
                parts.push(keyUint8Array);

                // Serialize value
                serialize(obj[key]);

                // If it's not the last key, add a comma
                if (index < keys.length - 1) {
                    parts.push(new Uint8Array([44])); // ',' character
                }
            });

            parts.push(new Uint8Array([125])); // '}' character
        } else {
            // Convert other types (e.g., numbers, null, boolean) to JSON string and then to bytes
            let jsonString = JSON.stringify(obj);
            let jsonUint8Array = new TextEncoder().encode(jsonString);
            parts.push(jsonUint8Array);
        }
    }

    serialize(obj);

    // Calculate the total length
    let totalLength = parts.reduce((acc, part) => acc + part.length, 0);
    let dict = new Uint8Array(totalLength);

    // Copy all parts into the result
    let offset = 0;
    for (let part of parts) {
        dict.set(part, offset);
        offset += part.length;
    }

    return { dict: dict, data: concatArrayBuffers(pngs) };
}

function decodeBinaryStringToUint8Array(binaryString) {
    const raw = atob(binaryString);
    const rawLength = raw.length;
    let array = new Uint8Array(new ArrayBuffer(rawLength));

    for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
}

function lineIntersection(p0: [number, number], p1: [number, number], q0: [number, number], q1: [number, number]): [number, number] | null {
    const det = (p1[0] - p0[0]) * (q1[1] - q0[1]) - (p1[1] - p0[1]) * (q1[0] - q0[0]);

    // If det is zero, the lines are parallel
    if (det === 0) return null;

    const t = ((p0[1] - q0[1]) * (q1[0] - q0[0]) - (p0[0] - q0[0]) * (q1[1] - q0[1])) / det;
    const u = -((p0[1] - q0[1]) * (p1[0] - p0[0]) - (p0[0] - q0[0]) * (p1[1] - p0[1])) / det;

    // Check if the intersection point lies within the line segments

    return [
        p0[0] + t * (p1[0] - p0[0]),
        p0[1] + t * (p1[1] - p0[1])
    ];
}

function color2rgb(word) {
    //if start with rgb(, then return
    if (word.startsWith("rgb(")) {
        return word
    }
    switch (word) {
        case "red":
            return "rgb(255,0,0)";
        case "green":
            return "rgb(0,255,0)";
        case "blue":
            return "rgb(0,0,255)";
        case "black":
            return "rgb(0,0,0)";
        case "white":
            return "rgb(255,255,255)";
        case "yellow":
            return "rgb(255,255,0)";
        case "cyan":
            return "rgb(0,255,255)";
        case "magenta":
            return "rgb(255,0,255)";
        case "gray":
            return "rgb(128,128,128)";
        case "grey":
            return "rgb(128,128,128)";
        case "orange":
            return "rgb(255,165,0)";
        case "purple":
            return "rgb(128,0,128)";
        case "pink":
            return "rgb(255,192,203)";
        case "brown":
            return "rgb(165,42,42)";
    }
    Xlog("color not found:" + word, 5000);
}

function solvePolynomial(points) {
    const n = points.length;
    // Create the augmented matrix for the system of equations
    const matrix = points.map(([x, y]) => {
        const row = [];
        for (let i = n - 1; i >= 0; i--) {
            row.push(Math.pow(x, i));
        }
        row.push(y);
        return row;
    });

    for (let i = 0; i < n; i++) {
        let max = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(matrix[j][i]) > Math.abs(matrix[max][i])) {
                max = j;
            }
        }

        [matrix[max], matrix[i]] = [matrix[i], matrix[max]];

        for (let j = i + 1; j < n; j++) {
            const factor = matrix[j][i] / matrix[i][i];
            for (let k = i; k < n + 1; k++) {
                matrix[j][k] -= factor * matrix[i][k];
            }
        }
    }

    const solution = Array(4).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) {
            sum += matrix[i][j] * solution[j];
        }
        solution[i] = (matrix[i][n] - sum) / matrix[i][i];
    }

    return {
        a: solution[0] || 0,
        b: solution[1] || 0,
        c: solution[2] || 0,
        d: solution[3] || 0
    };
}



function _printArchitecture(list: any[], depth: number = 0): string {
    let result = "";

    // Add indentation for better visualization
    const indentation = "  ".repeat(depth);

    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (Array.isArray(item)) {
            // If the item is an array, print its architecture recursively
            result += `${indentation}[\n`;
            result += _printArchitecture(item, depth + 1);
            result += `${indentation}]\n`;
        } else {
            // If the item is not an array, stringify it
            if (typeof item === "object") {
                result += `${indentation}"${item.name}"\n`;
            } else {
                result += `${indentation}Mode: ${item}\n`;
            }
        }
    }

    return result;
}

// function _printTree(node: compositeNode | TextureNode, depth: number = 0): string {
//     let result = "";
//     const indentation = "  ".repeat(depth); // Indentation for visualization

//     if (node instanceof TextureNode) {
//         result += `${indentation}normalLayerNode: ${node.name}\n`;
//     } else if (node instanceof GroupLayerNode) {
//         result += `${indentation}GroupLayerNode:\n`;
//         for (const leaf of node.leaves) {
//             result += _printTree(leaf, depth + 1);
//         }
//     } else if (node instanceof FilterNode) {
//         result += `${indentation}CompositeNode (Mode: ${node.compositeMode}):\n`;
//         result += _printTree(node.leaves[0], depth + 1);
//         result += _printTree(node.leaves[1], depth + 1);
//     }

//     return result;
// }

// function printTree(node: compositeNode | TextureNode) {
//     console.log(_printTree(node));
// }

function printArray(list) {
    Clog(_printArchitecture(list));
}

function findCoefficients(p1, p2, p3, p): [number, number] | null {
    // Calculate vectors
    const v1 = [p2[0] - p1[0], p2[1] - p1[1]];
    const v2 = [p3[0] - p1[0], p3[1] - p1[1]];
    const vp = [p[0] - p1[0], p[1] - p1[1]];

    // Solving the system of linear equations
    // a * v1[0] + b * v2[0] = vp[0]
    // a * v1[1] + b * v2[1] = vp[1]
    const determinant = v1[0] * v2[1] - v2[0] * v1[1];

    if (determinant === 0) {
        // The vectors are linearly dependent, no unique solution exists
        return null;
    }

    const a = (vp[0] * v2[1] - v2[0] * vp[1]) / determinant;
    const b = (v1[0] * vp[1] - vp[0] * v1[1]) / determinant;

    return [a, b];
}





function getOperatingSystem() {
    //@ts-ignore
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/win/i.test(userAgent)) {
        return "Win";
    }

    if (userAgent.indexOf("Mac") != -1) {
        return "Apple";
    }

    // Others (add more checks if needed)
    return "unknown";
}


function compareLists(a, b) {
    if (a.length != b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] != b[i]) {
            return false;
        }
    }
    return true;
}

const TOOL_BAG_IDLE_OPACITY = 0.25;
const MIN_CANVAS_STEP = 8;
const PADDING = 9;
const CP_PADDING = 16;
const BTN_PADDING = 4;
const SGAP = 7;
const M_BTN_HEIGHT = 34;
const L_BTN_HEIGHT = 36;
const S_BTN_HEIGHT = 32;
const BAR_HEIGHT = 44;
const CANVAS_MAX_WIDTH = 3840;
const CANVAS_MIN_SIZE = 16;
const CANVAS_MAX_HEIGHT = 2160;
var toolBackGroundColor = "44, 122, 211"
enum Theme {
    dark = "#101010",
    glass = "background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);",
    black = "#101010",
    slightDark = "#1A1A1A",
    transBlack = "rgba(0,0,0,0.3)",
    outline = "#101010",
    base2 = "#202020",
    grey = "#202020",
    mid = "#222222",
    base = "#202020",
    btnColor = "#292929",
    light = "#444444",
    greyFont = "color: #636363;",
    handle = "#9D9D9D",
    bright = "#999999",
    highlight = "white",
    normalBubbleColor = "#444444",
    border = "#2E2E2E",
    inputIdle = "rgb(15,15,15)",
    inputActive = "rgb(10,10,10)",
    colorBorder = "#2F2A22",
    outLineStyle = "outline: 2px solid " + Theme.outline + "; outline-offset: -1px;",
    outLineStyle2 = "outline: 2px solid #252525; outline-offset: -1px;",
    panelTransition = "transition: background 0.5s, transform 0.15s,width 0.15s,height 0.15s;",
    panel = "border-radius: 5px; background: " + Theme.base + ";",
    testFontSyle = "font-style: italic;",
    buttonStyle1 = `background-color: ${Theme.dark};
                    align-items: center;
                    justify-content: center;
                    display: flex;`,
    themeColor = "#3975cc",
    themeColor2 = "#572617",

    translucent = "background: rgba(32,32,32,0.8); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);",

    error = "color: #FF3333",
    option = `
            border-radius: 100px;
            box-sizing:border-box;
            background: ${Theme.slightDark};
            ${Theme.greyFont}
            display: flex;
            align-items: center;
            justify-content: center;
            `
}


function getColorFilter(r, g, b) {
    // Normalize the target RGB values to [0, 1] range
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;

    // Filter values based on some approximation for RGB adjustments
    const invert = 1 - (red + green + blue) / 3;
    const sepia = 1;
    const saturate = 500;
    const hueRotate = Math.round((Math.atan2(green - red, blue - green) * (180 / Math.PI)) % 360);
    
    // Return CSS filter string
    return `invert(${invert}) sepia(${sepia}) saturate(${saturate}%) hue-rotate(${hueRotate}deg)`;
}

const PageOffset = 14;

var lastDragOverTime = 0;
const PageRoot = createDiv(document.body, `
    position:fixed;
    left:${PageOffset}px;
    top:0px;
    right:0px;
    height:100%;
    overflow:hidden;
    z-index:0;
    background:#141414;
    border-radius:unset;
    `);


const PageCover = createDiv(PageRoot, `
    position:absolute;
    left:0px;
    top:0px;
    width:100%;
    height:100%;
    z-index:99;
    background-color:${Theme.dark};
    transition: background 0.3s, opacity 0.3s;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 50px;
    ;
    `);

function hidePageCover() {
    PageCover.style.opacity = "0";
    delay(500, () => {
        PageCover.style.display = "none"
    })
}


const ImagesRoot = createDiv(PageRoot, `
    position: absolute;
    width: auto;
    height: auto;
    left: 5px;
    bottom: 5px;
    z-index: 2;
    display: flex;
    flex-wrap: nowrap;
    gap: 5px;
`);

const XImgDockerRoot = createDiv(PageRoot,`
    position: absolute;
    width: auto;
    height: auto;
    right: 5px;
    bottom: 5px;
    z-index: 2;
    display: flex;
    flex-wrap: nowrap;
    gap: 5px;
    padding: 5px;
    opacity: 0.8;
    background: ${Theme.base};
    `
)
XImgDockerRoot.style.display = "none";

const MAX_XIMG_NUM = 10;


function getFormattedDate() {
    const now = new Date();
    const month = now.getMonth() + 1; // Months are zero-based
    const day = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();

    // Pad with leading zeros if necessary
    const formatWithZero = (value) => (value < 10 ? `0${value}` : value);

    // Format as 5-10-07-50-21
    return `${formatWithZero(month)}${formatWithZero(day)}-${formatWithZero(hour)}${formatWithZero(minute)}${formatWithZero(second)}`;
}



const SecOptions = createDiv(PageRoot, `
    position: absolute;
    width: auto;
    min-width: 120px;
    height: auto;
    z-index: 999;
    overflow: hidden;
    transition: unset;
    transform: translate(-50%, 0px);
    background: ${Theme.dark};
    transition: opacity 0.1s, transform 0.1s;
    `);
SecOptions.style.display = "none";

class MyImageData {
    static resizeCanvas = document.createElement('canvas');
    static loadCanvas = document.createElement('canvas');
    static loadCtx = MyImageData.loadCanvas.getContext('2d');
    static resizeCtx = MyImageData.resizeCanvas.getContext('2d');

    /**
     * return RGBA Image from a image element, return FullImgdata if image is null
     * @param imgElement 
     * @returns 
     */
    static ImgDataFromImgEle(imgElement: HTMLImageElement): ImageData {
        if (imgElement == null || imgElement.naturalWidth == 0 || imgElement.naturalHeight == 0) {
            console.error("image is not valid")
            return null;
        }
        MyImageData.resizeCanvas.width = imgElement.naturalWidth
        MyImageData.resizeCanvas.height = imgElement.naturalHeight
        MyImageData.resizeCtx.clearRect(0, 0, imgElement.naturalWidth, imgElement.naturalHeight)
        MyImageData.resizeCtx.drawImage(imgElement, 0, 0)
        return MyImageData.resizeCtx.getImageData(0, 0, imgElement.naturalWidth, imgElement.naturalHeight)
    }
    static composeToImgData(base: HTMLImageElement | HTMLCanvasElement, layer: HTMLImageElement | HTMLCanvasElement): ImageData {
        if (!base || !layer) {
            console.error("Base or layer is not valid");
            return null;
        }
        let w,h
        if(base instanceof HTMLImageElement){
            w = base.naturalWidth;
            h = base.naturalHeight;
        }else{
            w = base.width;
            h = base.height;
        }
        MyImageData.resizeCanvas.width = w;
        MyImageData.resizeCanvas.height = h;
        MyImageData.resizeCtx.clearRect(0, 0, MyImageData.resizeCanvas.width, MyImageData.resizeCanvas.height);
    
        // Draw the base image onto the canvas
        MyImageData.resizeCtx.drawImage(base, 0, 0);
    
        // Set blending mode to 'source-over' to overlay the layer on top of the base
        MyImageData.resizeCtx.globalCompositeOperation = 'source-over';
    
        // Draw the layer image onto the canvas
        MyImageData.resizeCtx.drawImage(layer, 0, 0);
    
        // Reset the blending mode to default
        MyImageData.resizeCtx.globalCompositeOperation = 'source-over';
    
        // Return the resulting ImageData
        return MyImageData.resizeCtx.getImageData(0, 0, MyImageData.resizeCanvas.width, MyImageData.resizeCanvas.height);
    }


    static ImgDataFromCanvasEle(canvasElement: HTMLCanvasElement): ImageData {
        if (canvasElement == null || canvasElement.width == 0 || canvasElement.height == 0) {
            console.error("image is not valid")
            return null;
        }
        MyImageData.resizeCanvas.width = canvasElement.width
        MyImageData.resizeCanvas.height = canvasElement.height
        MyImageData.resizeCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
        MyImageData.resizeCtx.drawImage(canvasElement, 0, 0)
        return MyImageData.resizeCtx.getImageData(0, 0, canvasElement.width, canvasElement.height)
    }

    static DataUrlFromImgEle(imgElement: HTMLImageElement): string {
        if (imgElement == null || imgElement.naturalWidth == 0 || imgElement.naturalHeight == 0) {
            console.error("image is not valid")
            return null;
        }
        MyImageData.resizeCanvas.width = imgElement.naturalWidth
        MyImageData.resizeCanvas.height = imgElement.naturalHeight
        MyImageData.resizeCtx.clearRect(0, 0, imgElement.naturalWidth, imgElement.naturalHeight)
        MyImageData.resizeCtx.drawImage(imgElement, 0, 0)
        return MyImageData.resizeCanvas.toDataURL()
    }

    static DataUrlFromImgData(imgData: ImageData): string {
        MyImageData.resizeCanvas.width = imgData.width
        MyImageData.resizeCanvas.height = imgData.height
        MyImageData.resizeCtx.putImageData(imgData, 0, 0)
        return MyImageData.resizeCanvas.toDataURL()
    }

    static async BlobArrayBufferFromImgData(imgData: ImageData, quality = 1.0): Promise<ArrayBuffer> {
        MyImageData.resizeCanvas.width = imgData.width
        MyImageData.resizeCanvas.height = imgData.height
        MyImageData.resizeCtx.clearRect(0, 0, imgData.width, imgData.height)
        MyImageData.resizeCtx.putImageData(imgData, 0, 0)
        return new Promise((resolve) => {
            MyImageData.resizeCanvas.toBlob((blob) => {
                blob.arrayBuffer().then((buffer) => {
                    resolve(buffer)
                })
            }, 'image/jpeg', quality);
        })
    }

    static _resizeDraw(ele: HTMLImageElement | HTMLCanvasElement, dstW: number, dstH: number) {
        MyImageData.resizeCanvas.width = dstW;
        MyImageData.resizeCanvas.height = dstH;
        MyImageData.resizeCtx.clearRect(0, 0, dstW, dstH);
        MyImageData.resizeCtx.drawImage(ele, 0, 0, ele.width, ele.height, 0, 0, dstW, dstH);
    }

    static _loadImgDataToLoadCanvas(imgData: ImageData) {
        MyImageData.loadCanvas.width = imgData.width;
        MyImageData.loadCanvas.height = imgData.height;
        MyImageData.loadCtx.putImageData(imgData, 0, 0);
    }

    static resizeImgData(imgData: ImageData, dstW: number, dstH: number): ImageData {
        // Load the ImageData to the temporary canvas
        MyImageData._loadImgDataToLoadCanvas(imgData);
        // Draw the image from the temporary canvas to the main canvas with resizing
        MyImageData._resizeDraw(MyImageData.loadCanvas, dstW, dstH);
        // Return the resized ImageData
        return MyImageData.resizeCtx.getImageData(0, 0, dstW, dstH);
    }

    static resizeAndGetImgData(img: HTMLImageElement|HTMLCanvasElement, dstW: number, dstH: number): ImageData {
        // Draw the image from the temporary canvas to the main canvas with resizing
        MyImageData._resizeDraw(img, dstW, dstH);
        // Return the resized ImageData
        return MyImageData.resizeCtx.getImageData(0, 0, dstW, dstH);
    }

    static cropImgData(imgData: ImageData, left: number, top: number, w: number, h: number): ImageData {
        // Load the ImageData to the temporary canvas
        MyImageData._loadImgDataToLoadCanvas(imgData);
        // Draw the image from the temporary canvas to the main canvas with resizing
        MyImageData.resizeCanvas.width = w;
        MyImageData.resizeCanvas.height = h;
        MyImageData.resizeCtx.clearRect(0, 0, MyImageData.resizeCanvas.width, MyImageData.resizeCanvas.height);
        MyImageData.resizeCtx.drawImage(MyImageData.loadCanvas, left, top, w, h, 0, 0, w, h);
        // Return the resized ImageData
        return MyImageData.resizeCtx.getImageData(0, 0, w, h);
    }

    static resizeFrom(element: HTMLImageElement | HTMLCanvasElement, dstW: number, dstH: number): ImageData {
        // Draw the image from the temporary canvas to the main canvas with resizing
        MyImageData._resizeDraw(element, dstW, dstH);
        // Return the resized ImageData
        return MyImageData.resizeCtx.getImageData(0, 0, dstW, dstH);
    }

    static textImgDataUrl(str: string, width: number, height: number, fontSize: number, color: string): string {
        // Set up the canvas
        MyImageData.resizeCanvas.width = width;
        MyImageData.resizeCanvas.height = height;
        const ctx = MyImageData.resizeCtx;
    
        // Clear the canvas
        ctx.clearRect(0, 0, width, height);
    
        // Set text properties
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
    
        // Draw the text in the center of the canvas
        ctx.fillText(str, width / 2, height / 2);
    
        // Convert the canvas content to a data URL
        return MyImageData.resizeCanvas.toDataURL();
    }

    static resizeToDataURL(imgData: ImageData, dstW: number, dstH: number): string {
        // Load the ImageData to the temporary canvas
        MyImageData._loadImgDataToLoadCanvas(imgData);
        // Draw the image from the temporary canvas to the main canvas with resizing
        MyImageData._resizeDraw(MyImageData.loadCanvas, dstW, dstH);
        // Return the resized ImageData
        return MyImageData.resizeCanvas.toDataURL();
    }

}


const i2iGeneratingTextDataUrl = MyImageData.textImgDataUrl(LNG.generating, 400, 100, 80, "white");
const i2iQueueingTextDataUrl = MyImageData.textImgDataUrl(LNG.queueing, 400, 100, 80, "white");

var FrameBasedEventQueue: Function[] = [];
function executeOnNextFrame(f){
    FrameBasedEventQueue.push(f);
}

//hideScreenCover("force")

function progressCircleCss(percentage) {
    // Ensure the percentage is between 0 and 100
    percentage = Math.min(100, Math.max(0, percentage));
    // Calculate the angle of the gradient based on the percentage
    const angle = percentage * 3.6; // 360° full circle, 3.6° per 1%

    // Create the CSS radial gradient
    const gradient = `conic-gradient(
        ${Theme.bright} 0deg ${angle}deg,
        ${Theme.base} ${angle}deg 360deg
    )`;

    // Apply the gradient as the background of the image element's container
    return gradient;
}