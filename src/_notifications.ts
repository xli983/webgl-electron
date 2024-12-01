//this file implements the notifications system which will display notification
//in the center of the screen
//the notifications will be displayed for a certain amount of time and then fade out
class XNotification {
    static liveNotifications: HTMLElement[] = [];
    static disappearTime = 0;
    static root = createDiv(PageRoot, `
    position: absolute;
    left: 50%;
    max-width: 70%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    z-index: 999;
    gap: 8px;
    transition: top 0.3s, transform 0.3s;
    bottom: 20px;
    `);
    spawnTime: number = 0;

    static animate() {
        // for each live notifications, animate it and fade it out
        let newList = [];
        let now = performance.now();
        for (let n = 0; n < XNotification.liveNotifications.length; n++) {
            let ntf = XNotification.liveNotifications[n];
            let ifremove =XNotification.disappearTime < now
            if(ifremove){
                ntf.style.opacity = "0";
                delay(500,()=>{
                    ntf.remove();
                });
            }else{
                newList.push(ntf);
            }
        }
        XNotification.liveNotifications = newList;
    }

    static add(src: string, liveTime = 3000, bgColor = "rgba(0,0,0,0.5)", order = 10) {
        //first estimate the width of display text
        //liveTime*=1000
        let newntf = true;
        for (let n = 0; n < XNotification.liveNotifications.length; n++) {
            let ntf = XNotification.liveNotifications[n];
            XNotification.disappearTime = performance.now() + liveTime;
            if(ntf["_orgmsg"] == src){
                ntf.style.opacity = "1";
                ntf["_repeat"]++;
                ntf.innerHTML = src+" × "+ntf["_repeat"];
                newntf = false
            }
        }
        if(!newntf){
            return;
        }
        let element = createDiv(XNotification.root, `
        position:relative;
        width: auto;
        padding: 2px 20px;
        height: 24px;
        font-size: 16px;
        font-weight: 300;
        border-radius: 16px;
        z-index:99;
        background: ${bgColor}; 
        display:flex;
        white-space:nowrap;
        justify-content:center;
        align-items:center;
        color: white;
        overflow: hidden;
        transition: opacity 0.5s, transform 0.5s;
        opacity: 1;
        order: `+ order + `;
        `);
        element["_orgmsg"] = src;
        element["_repeat"] = 1;
        element.innerHTML = src;
        // element["_endTime"] = performance.now() + liveTime;
        // element["_startTime"] = performance.now();
        showup(element,"flex");

        XNotification.liveNotifications.push(element);
    }
}

//function files
var fetchFailCount = 0;

function Xlog(string:string, lifeTime = 2000) {
    XNotification.add(string, lifeTime);
    console.log(string)
}

function XlogError(string: string, lifeTime = 6000) {
    XNotification.add(string, lifeTime, "rgba(100,0,0,0.5)",0);
    console.error(string);
}

function XlogFatal(string: string, lifeTime = 10000) {
    XNotification.add(string, lifeTime, "rgba(0,0,100,0.5)",0);
    console.error(string);
}

function XlogDebug(string: string) {
    if(App.debugMode){
        XNotification.add(string, 3000, "rgba(100,0,100,0.5)",2);
        console.debug(string);
    }
}

function XlogSuccess(string: string, lifeTime = 3000) {
    XNotification.add(string, lifeTime, "rgba(0,100,0,0.5)",3);
    console.log(string);
}
function XlogWarning(string: string) {
    XNotification.add(string, 5000, "rgba(100,100,0,0.5)",1);
    console.warn(string);
}

function Clog(...args: any[]): void {
    const concatenatedString = args.join(' ');
    const stack = new Error().stack;  // Get the current stack trace

    let str = concatenatedString
    console.log(args);
    if (fetchFailCount < 10) {
    }
}

//const Clog=console.log;
