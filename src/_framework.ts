setDocumentStyleZoom(1);

var UIStepOnAnimateFrame = false;
var IdleFrame = 0;
var lastOnframeTime = 0;
var requestAnimationFrameNum = 0;


function framworkStep() {
    let a1 = 0;
    let now = performance.now();
    if (now - lastOnframeTime > 1000) {
        Xlog("session restored", 500);
        LoginFailCount = 0;//reset login fail count
    }

    if (performance.now() - lastLoadTime > 5000) {
        loadLocal();
    }

    OnFrameFuncs.forEach((func) => {
        func(frameCount);
    });


    if (now - lastLoginTryTime > 3000 && LoginFailCount < 5) {
        XWS.ensureCloudWS();
    }
    lastOnframeTime = now;
    if (Gesture == OP.Idle) {
        IdleFrame++;
        if (frameCount % 1000 == 0) {
            RemoteFile.ensureLoad();
        }
    } else {
        IdleFrame = 0;
    }



    //flipped canvas element is better for rendering and exporting
    if (frameCount % (60 * 5) == 0) {
        checkConnection()
    }

    if (FrameBasedEventQueue.length > 0) {
        FrameBasedEventQueue.shift()();
    }

    if (App.inited && frameCount % 10 == 0) {
        Delay.checkAll();
        // if (0 && App.platform != "Windows") {
        //     console.debug(timePrint)
        //     let printTime = performance.now() - now;
        //     //Xlog("UIstep time: "+printTime,true);
        //     if (printTime > 3) {
        //         if (!firstPrint) {
        //             fetch("/t")
        //             window.location.reload();
        //         }
        //         firstPrint = false;
        //         //window.close();
        //     }
        // }

        XNotification.animate();
    }

    //displayTransitionBlock();
    return a1
}



// function PCmain() {
//     // let x = Math.sin(performance.now() / 100) * 300;

//     // testElement.style.transform = "translate(" + x + "px,0px)";
//     frameCount++;
//     let res = 0

//     res += framworkStep();

//     if (res > 0) {
//         requestAnimationFrameNum = 3;
//     }
//     if (requestAnimationFrameNum > 0 || res > 0 || XElement.animatingEles.size > 0) {
//         UIStepOnAnimateFrame = true;
//     } else {
//         UIStepOnAnimateFrame = false;
//     }
//     requestAnimationFrameNum--;
// }

// setInterval(PCmain, 9);
RemoteFile.ensureLoad();
// PageRoot.style.display = "block";