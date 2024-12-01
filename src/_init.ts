

// const LEFT_BUTTON = 0;
// const MID_BUTTON = 1;
// const RIGHT_BUTTON = 2;

const MAX_STROKE_STAMPS = 2000;
const ATTRNUM = 4;

const PANEL_VERTICAL_GAP = 8;
const PANEL_HORIZONTAL_GAP = 8;

const NULL_DEFAULT = null;
const PANEL_ANIMATION_SPEED = 1;
const ELE_ANIMATION_SPEED = 2;
const initTime = performance.now();
const LEFT_BOTTOM_CORNER_HEIGHT = 80;

const _LAST_CLICK_T = "_lastClickT";

const PageBG = createDiv(PageRoot, `
position:absolute;
left:0px;
top:0px;
width:100%;
height:100%;
z-index:0;
opacity:0.05;
background-image:url("svg/bg4.png");
background-repeat:repeat;
background-size:30px 30px;
`);


document.body.appendChild(PageRoot);
document.body.style.touchAction = "none";
PageRoot.appendChild(PageBG);
PageRoot.style.touchAction = "none";
const TEXTEN = new TextEncoder();
const TEXTDE = new TextDecoder();

var TransScreenString = "Welcome to Xing";
var TransScreenTarPercent = 0;
var TransScreenCurPercent = 0;


const DPI = window.devicePixelRatio;


var VPVB = new Float32Array(16)



const OnFrameFuncs: Function[] = [];
function runOnFrame(func: Function) {
    OnFrameFuncs.push(func);
}
var test1 = null;
var test2 = null;
var test3 = null;
var test4 = null;




let pasteImgReloading = false;
//addBtnOnClickStyle(pasteImg)

runOnFrame(async (f) => {
    if (f % 100 == 0) {

        const response = await fetch("getClipboard");
        if (response.ok) {
            const contentType = response.headers.get('Content-Type');

            if (contentType.includes('image/png')) {
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                //pasteImg.src = imageUrl;
            } else if (contentType.includes('text/plain')) {
                const text = await response.text();
                Xlog(text);
            } else {
                console.error('Unsupported content type:', contentType);
            }
        }

    }
})


var MaskCopyCanvas: HTMLCanvasElement
var MaskCopyCtx: CanvasRenderingContext2D

enum OP {
    Idle,
    Drawing,
    ShortCut,
    ColorSampling,
    BucketFill,
    CanvasRotateScale,
    CanvasPinch,
    CameraPinch,
    CameraRotate,
    CanvasTranslate,
    RO_translate,
    RO_Rotate,
    RO_Pinch,
    RO_Resize,
}

var Gesture = OP.Idle

var CloudWS = null as XWS;
var LocalWS = null as XWS;

const stylus = {
    winx: 0,
    winy: 0,
    cvx: 0,
    cvy: 0,
    button: "none" as "none" | "left" | "right" | "middle",
    pressure: 0,
    smoothedPressure: 0,
    smoothFactor: 2,
    processBrush: function (a, b, c, d, e, f, g, h, i) { return 0; },
    end: function () { return 0; },
    texture: null,
    stampDataVB: null,
    stampColVB: null,
    newAllVB: null,
    endStroke: false
}



var animatedElements = []



MaskCopyCanvas = document.createElement('canvas');
MaskCopyCtx = MaskCopyCanvas.getContext('2d');


var frameCount = 0;



const SERVER_XING = 0
const SERVER_LOCAL = 1
//@ts-ignore
const App = {
    platform: getOperatingSystem(),
    server: SERVER_LOCAL,
    averageFrameTime: 100,
    fps: 60,
    measured: false,
    animationSpeed: 1,//measured, not the target
    measuredFrameTime: 0,
    fullscreen: false,
    inited: false,
    page: "gallery" as "gallery" | "painting" | "copilot",
    prevPage: "gallery" as "gallery" | "painting" | "copilot",
    touchLen: 0,
    debugMode: false,
    usingPen: false,
    ratio: 1,
    mode: "landscape" as "landscape" | "portrait",
}



window.addEventListener("load", (e) => {
    App.inited = true;
    delay(300, hidePageCover)
})



const screenCover = createDiv(PageRoot, `
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 99;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(5px);
    transition: backdrop-filter 0.3s, opacity 0.3s;
    `);
screenCover.onpointerdown = (e) => {
    if(e.target == screenCover){
        hideScreenCover();
    }
}
let lastTriggerScreenCoverTime = 0;
function hideScreenCover(opt=null) {
    if(performance.now()-lastTriggerScreenCoverTime<600 && opt!="force"){
        return;
    }
    lastTriggerScreenCoverTime = performance.now();
    screenCover.style.backdropFilter = "blur(0px)";
    screenCover.style.opacity = "0";
    delay(400,()=>{
        screenCover.style.display = "none";
    })
}
function showScreenCover() {
    if(performance.now()-lastTriggerScreenCoverTime<600){
        return;
    }
    lastTriggerScreenCoverTime = performance.now();
    screenCover.style.display = "block";
    delay(20,()=>{
        screenCover.style.opacity = "1";
        screenCover.style.backdropFilter = "blur(20px)";
    })
}

screenCover.style.display = "none";
screenCover.style.opacity = "0";