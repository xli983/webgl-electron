const WS_BLOCKSIZE = 500000;

const XPROMISE_TIMEOUT = 300 * 1000;

class XPromise {
    /**
    during communication with workers and ws servers, the received messages is handeled outside the
    definition of Promise, so it is better to save the promise as an object and it will be solved if 
    result value is handed to it

    💻this can be used asynchronously as well as synchronously

    **/
    static pendingPromises = {} as { [key: string]: XPromise };
    _resolveFunc: Function;
    _rejectFunc: Function;
    promise: Promise<any>;
    promiseID: string;
    spawnTime: number = performance.now();
    header: string;

    constructor(header=null) {
        this._resolveFunc = null;
        //generate a 10 digit random number
        let random = Math.random() * 10000000000 + 10000000000;

        this.promiseID = random.toString().slice(0, 10)
        this.promise = new Promise((resolve, reject) => {
            this._resolveFunc = resolve;
            this._rejectFunc = reject;
        });
        XPromise.pendingPromises[this.promiseID] = this;
        this.header = header;

        Object.keys(XPromise.pendingPromises).forEach((key) => {
            let promise = XPromise.pendingPromises[key]
            if (promise != null) {
                if (promise.spawnTime + XPROMISE_TIMEOUT < performance.now()) {
                    promise._rejectFunc("timeout");
                    delete XPromise.pendingPromises[key];
                }
            } else {
                delete XPromise.pendingPromises[key];
            }
        });
    }

    static getById(id) {
        return XPromise.pendingPromises[id];
    }

    static resolveById(id, value) {
        if (XPromise.pendingPromises[id] == null) {
            debugger;
            XlogError("illegal request: " + id);
        }
        XPromise.pendingPromises[id].resolve(value);
        XPromise.pendingPromises[id] = null;
    }

    resolve(value) {
        //use this function to resolve the promise
        this._resolveFunc(value);//async
        delete XPromise.pendingPromises[this.promiseID];
    }

    nativePromise() {//for async/await
        return this.promise;
    }

}

var localIP = ""
var availableIPs = [];
class XWS {
    static ALL = [];
    ws = null
    anyReceived = false;
    dataBlocks = [];
    recvBuffer = {};
    isRequestInProgress = false;

    constructor(wsip: string, promiseResolve = null) {
        this.ws = new WebSocket(wsip);
        //Xlog("connecting to " + wsip)
        XWS.ALL.push(this);
        this.ws.onopen = async function () {
            //setup init function
            //Xlog("service connected");
            if (promiseResolve) {
                promiseResolve(true);
            }

            if (wsip.endsWith("app/")) {
                //Xlog("云服务请求成功")
                let loginmsg = "login     " + "0000000000alpha.alpha";
                this.ws.send(TEXTEN.encode(loginmsg));
            }
        }.bind(this)

        this.ws.onmessage = async function (e) {
            this.anyReceived = true;
            //we do not use promise because we cannot control the order of received messages
            this.serverLastReceivedTime = performance.now();
            let array;
            if (e.data instanceof Blob) {
                array = await blob2ArrayBuffer(e.data) as ArrayBuffer;
            } else {
                array = e.data
            }

            let header = TEXTDE.decode(new Uint8Array(array.slice(0, 10)));
            let taskID = TEXTDE.decode(new Uint8Array(array.slice(10, 20)));
            let data = array.slice(20);

            if (header == "login succ") {  
                //XlogSuccess("云服务登录成功")
                return;
            }

            if (header.substring(0, 5) == "error") {
                let errorCode = header.substring(5, 8);
                let errorMsg;
                switch (errorCode) {
                    case "001":
                        errorMsg = "No service under this account";
                        break;
                    case "002":
                        errorMsg = "暂无生图服务";
                        break;
                    case "003":
                        errorMsg = "登录失败";
                        break;
                    case "004":
                        errorMsg = "请求非法";
                        break;
                    default:
                        errorMsg = errorCode;
                        break;
                }
                Xlog(LNG.requestFailed + errorMsg, 5000);
                if(taskID!="0000000000"){
                    XPromise.resolveById(taskID, header);
                }
                return;
            }

            if (header.substring(0, 5) == "queue") {
                let xpromise = XPromise.getById(taskID);
                if (xpromise == null) {//already resolved
                    return;
                }
                let resImg = xpromise["_outImg"] as HTMLImageElement;
                let queueLength = parseInt(header.substring(5, 10));
                let queueMsg = "排队：" + queueLength;
                resImg.src = MyImageData.textImgDataUrl(queueMsg, 200, 50,40,"white");
                return;
            }

            if (this.recvBuffer[taskID] == null) {
                this.recvBuffer[taskID] = []
            }

            if (header.substring(0, 5) == "block") {
                let blockIdx = parseInt(header.substring(5, 10));
                this.recvBuffer[taskID].push({ idx: blockIdx, data: array.slice(20) });
                if(App.debugMode){
                    Xlog("DEBUG MODE: block " + blockIdx + " for " + taskID);
                }
                return;
            } else if (header.substring(0, 8) == "progress") {
                let xpromise = XPromise.getById(taskID);
                let resImg = xpromise["_outImg"] as HTMLImageElement;
                let string = TEXTDE.decode(new Uint8Array(data));
                resImg["_lastUpdate"] = performance.now();
                if (string == "start") {
                    resImg.src = i2iGeneratingTextDataUrl;
                    resImg["_started"] = true;
                    return;
                }
                let progress = parseFloat(string);
                progress = Math.round(progress * 100);
                // if (xpromise.header == "i2i") {
                //     PosBubbleContainer.style.backgroundColor = `linear-gradient(70deg, ${Theme.normalBubbleColor} ${progress}%, ${Theme.slightDark} ${progress}%)`
                // }
                resImg.style.backgroundImage = progressCircleCss(progress);
                
                //Xlog("任务进度：" + progress + "% for " + taskID)
                return;
            } else {
                if(App.debugMode){
                    //Xlog("DEBUG MODE: " + header + " " + taskID);
                }
                this.recvBuffer[taskID].push({ idx: 99999, data: array.slice(20) });
                let byteLength = data.byteLength;
                let printData = byteLength > 20 ? data.byteLength + " bytes" : TEXTDE.decode(new Uint8Array(data))
                console.log("received" + header + " " + taskID + " " + printData);
                let sorted = this.recvBuffer[taskID].sort((a, b) => a.idx - b.idx);
                sorted = sorted.map(x => x.data);
                XPromise.resolveById(taskID, concatArrayBuffers(sorted));

                this.recvBuffer[taskID] = null;
                return;
            }

        }.bind(this);

        this.ws.onclose = async function (e) {
            promiseResolve(false);
            if (this == CloudWS) {
                CloudWS = null;
            }
            if (this == LocalWS) {
                LocalWS = null;
            }
            this.anyReceived = false;
            Xlog("连接失效", 5000);
        }
    }

    sendAndGet(header: string, data) {
        if (typeof data == "string") {
            data = TEXTEN.encode(data);
        }
        if (data instanceof ArrayBuffer) {
            data = new Uint8Array(data);
        }
        //this.recvBuffer = [];
        let promise = new XPromise(header);//create a promise
        let pid = promise.promiseID;//get promise id
        if (pid.length != 10) {
            XlogFatal("illegal ID");
        }

        let length = data.byteLength;
        let pointer = 0;
        let blockIdx = 0;
        while (length - pointer > WS_BLOCKSIZE * 2) {
            let slice = data.slice(pointer, pointer + WS_BLOCKSIZE);
            let blockStr = "block00000";
            blockStr = blockStr.substring(0, 10 - blockIdx.toString().length) + blockIdx;
            this._send(blockStr, pid, slice);
            blockIdx++;
            pointer += WS_BLOCKSIZE;
        }

        let finalSlice = data.slice(pointer, length);
        this._send(header, pid, finalSlice);

        return promise;
    }

    _send(header: string, pid: string, data: Uint8Array) {
        //we require all sent data to have response
        if (pid.length != 10) {
            XlogFatal("illegal ID");
        }
        if (header.length < 10) {
            header = header + "          ".slice(0, 10 - header.length);
        }
        let headerBytes = new Uint8Array(10);
        headerBytes.set(TEXTEN.encode(header));

        let pidBytes = new Uint8Array(10);
        pidBytes.set(TEXTEN.encode(pid));

        let sendBuffer = new Uint8Array(20 + data.length);
        sendBuffer.set(headerBytes, 0);
        sendBuffer.set(pidBytes, 10);
        sendBuffer.set(data, 20);

        this.ws.send(sendBuffer);
    }

    static checkIfAnyConnectingAndCleanUp() {
        let connecting = false;
        for (let xws of XWS.ALL) {
            if (xws.ws.readyState == 0) {
                connecting = true;
            }
            if (xws.ws.readyState == 1 && xws != CloudWS && xws != LocalWS) {
                //close all other connections
                xws.ws.close();
            }
        }
        return connecting;
    }

    static async ensureCloudWS() {
        lastLoginTryTime = performance.now();
        if (CloudWS != null && (CloudWS.ws.readyState == 3 || CloudWS.ws.readyState == 2)) {
            CloudWS = null;
        }
        if (CloudWS == null) {
            let xws = null;
            let res = await new Promise((resolve, reject) => {
                xws = new XWS("wss://www.xing.art/app/", resolve)
            });
            if (res == false) {
                CloudWS = null;
                LoginFailCount++;
                Xlog("登录失败，重试：" + LoginFailCount);
            } else {
                CloudWS = xws;
            }
        }
        return CloudWS != null;
    }
    static async ensureLocalWS() {
        if (LocalWS != null && (LocalWS.ws.readyState == 3 || LocalWS.ws.readyState == 2)) {
            LocalWS = null;
        }
        if (LocalWS == null && availableIPs.length > 0) {
            let xws = null;
            let res = await new Promise((resolve, reject) => {
                xws = new XWS(`ws://${availableIPs[0]}:8088`, resolve)
            });
            if (res == false) {
                LocalWS = null;
            } else {
                LocalWS = xws;
            }
        }
        return LocalWS != null;
    }
}

var lastLoginTryTime = 0;
var LoginFailCount = 0;

var I2IinProgressImg = []

async function checkConnection() {
    if (CloudWS != null && CloudWS.anyReceived == true) {
        CloudWS._send("check", "0000000000", new Uint8Array(0));
        I2IinProgressImg = I2IinProgressImg.filter(item => item.parentNode != null && item["_ready"]!=true);
        if(I2IinProgressImg.length>0){
            I2IinProgressImg.forEach(item => {
                CloudWS._send("check", item["_xpromiseId"], new Uint8Array(0));
            });
        }
    }
}


