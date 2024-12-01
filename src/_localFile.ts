


function localOrRemoteUrl(folder: string, name: string) {
    if (RemoteFile.find(folder, name) != null) {
        return `local/_user/${folder}/${name}`;
    } else {
        return `/${folder}/${name}`;
    }
}

function localOrRemoteUrlF(fullpath: string) {
    if (RemoteFile.findF(fullpath) != null) {
        return `local/${fullpath}`;
    } else {
        return `/${fullpath}`;
    }
}

let getinputErrorCount = 0;
let touchDict = {}
let lastSwiftPencilTime = 0;


async function _loadFromServer(fullPath) {
    return new Promise((resolve) => {
        fetch('/local/' + fullPath, { cache: 'no-store' })
            .then(response => {
                let fileName = fullPath.split("/").pop();
                if (!response.ok) {
                    XlogError(fileName + '读取失败1', 3000)
                    resolve(null);
                } else {
                    response.blob().then(data => {
                        data.arrayBuffer().then((arraybuffer) => {
                            resolve(arraybuffer);
                        });
                    })
                        .catch(error => {
                            XlogError(fileName + '读取失败2');
                        });
                }
            })
    })
}

const MAX_FAIL_COUNT = 3;

class RemoteFile {
    static All: RemoteFile[] = [];
    static directoryDict = {} as { [directory: string]: RemoteFile[] };
    directory: string;
    dateTime: Date;
    name: string;
    type: string;
    protected data: any;
    promise: Promise<any>;
    needSave: boolean;
    failTime = 0;
    constructor(path, date) {
        path = path.split("/");
        let fileName = path.pop();
        fileName = fileName.split(".");
        this.dateTime = date;
        this.type = fileName[1]
        this.name = fileName[0];
        this.directory = path.join("/");
        if (!(this.directory in RemoteFile.directoryDict)) {
            RemoteFile.directoryDict[this.directory] = [];
        }
        RemoteFile.directoryDict[this.directory].push(this);

        RemoteFile.All.push(this);
    }

    delete(){
        //skip local delete for now, only remove here
        fetch('del/' + this.fullPath())
        Xlog("file deleted: " + this.fullPath());
        let idx = RemoteFile.All.indexOf(this);
        RemoteFile.All.splice(idx,1);//remove from all
        let dir = RemoteFile.directoryDict[this.directory];
        let idx2 = dir.indexOf(this);
        dir.splice(idx2,1);//remove from directory
        this.data = "deleted";
    }

    forceGet() {
        return this.data;
    }

    ifLoaded() {
        return this.data != null;
    }

    forceSet(data) {
        this.data = data;
    }

    setIfNewer(date: Date, data) {
        if (date >= this.dateTime) {
            this.dateTime = date;
            this.data = data;
        }
    }

    markNeedSave() {
        this.needSave = true;
    }

    fullPath() {
        return this.directory + "/" + this.name + "." + this.type;
    }

    async get() {
        if (!this.ifLoaded()) {
            return await this.load(null);
        } else {
            return this.data;
        }
    }

    async load(dateTime) {
        if(this.failTime > MAX_FAIL_COUNT){
            this.delete();
            //console.log("load failed too many times");
            return;
        }
        if (dateTime != null) {//if null then maintain the current date
            if (this.dateTime > dateTime) {
                Xlog("unexpected date");
            }
            this.dateTime = dateTime;
        }
        let fullPath = this.fullPath();
        if (this instanceof RemoteImgFile) {
            if (this.promise != null) {
                await this.promise;
            } else {
                await this.overwriteImgSrc("local/" + fullPath);
            }
        } else {
            if (this.type == "json") {
                this.promise = _loadFromServer(fullPath)
                let data = await this.promise as ArrayBuffer;
                if (data == null){
                    this.failTime++;
                    return "failed"
                }
                this.forceSet(JSON.parse(TEXTDE.decode(new Uint8Array(data))));
            } else if (this.type == "txt") {
                this.promise = _loadFromServer(fullPath)
                let data = await this.promise as ArrayBuffer;
                if (data == null){
                    this.failTime++;
                    return "failed"
                }
                this.forceSet(JSON.parse(TEXTDE.decode(new Uint8Array(data))));

                if (this.name == "proj") {
                    const ProjectDir = this.directory;
                    let snapviewFile = RemoteFile.find(ProjectDir, "render.png") as RemoteImgFile;

                    if (snapviewFile == null) {
                        console.error("no snapview file");
                    }

                    let img = await snapviewFile.get() as HTMLImageElement;
                }
            } else {
                debugger;
                XlogError("not supported type: " + this.type);
            }
        }
        console.log("loaded: " + fullPath);
        this.failTime = 0;
        this.promise = null;
        return this.data;
    }



    unload() {
        if (this instanceof RemoteImgFile) {
            this.unloadImg();
        }
        this.data = null;
    }

    save() {
        let data = null;
        if (this.type == "json" || this.type == "txt") {
            data = TEXTEN.encode(JSON.stringify(this.data));
        } else {
            debugger;
            XlogError("not supported type: " + this.type);
            return
        }
        let fullPath = this.fullPath();
        return fetch('/local/' + fullPath, {
            method: 'POST',
            body: data,
            cache: 'no-store'
        })
            .then(response => {
                if (response.ok) {
                    Xlog(this.name + " 已保存");
                    this.needSave = false;
                    this.dateTime = new Date(Date.now() + 2000);
                    //to avoid immediate reload from server, add 2 seconds for saving time
                } else {
                    XlogWarning(this.name + " 保存失败");
                    this.failTime++;
                }
            })
            .catch(error => Xlog("saved error: " + error));
    }

    static forDirectory(directory) {
        return RemoteFile.All.filter((rf) => rf.directory == directory);
    }

    static forType(type) {
        return RemoteFile.All.filter((rf) => rf.type == type);
    }

    static forName(name) {
        return RemoteFile.All.filter((rf) => rf.name == name);
    }

    static findF(fullPath) {
        let name = fullPath.split("/").pop();
        let directory = fullPath.split("/").slice(0, -1).join("/");
        return RemoteFile.find(directory, name);
    }

    static registerToLocalStorage() {
        let data = RemoteFile.All.map((rf) => {
            return rf.fullPath() + " - " + rf.dateTime.getTime() / 1000;
        }
        ).join("\n");
        localStorage.setItem("_remoteFiles", data);
    }

    static loadFromLocalStorage() {
        let data = localStorage.getItem("_remoteFiles");
        if (data == null) {
            return;
        }
        let pathsAndDate = data.split("\n");
        pathsAndDate.forEach((p) => {
            let [path, dateStr] = p.split(" - ");
            let dateInSec = parseFloat(dateStr);
            let date = new Date(dateInSec * 1000);
            //console.log(path);
            let ext = path.split(".").pop();
            if (ext == "png") {
                RemoteImgFile.reg(path, date);
            } else {
                RemoteFile.reg(path, date);
            }
        })
    }

    static find(directory, fileName) {
        let name = fileName.split(".")[0];
        let type = fileName.split(".")[1];
        let files = RemoteFile.directoryDict[directory];
        if (files == null) {
            return null;
        }
        for (let i = 0; i < files.length; i++) {
            if (files[i].name == name && files[i].type == type) {
                return files[i];
            }
        }
        return null;
    }

    static ensureLoadDirs = ["_user/brushes", "_user/grains", "_user/stamps"] as string[];
    static ensureLoadExts = ["json", "txt"] as string[];
    static ensureLoadNames = ["render", "proj"] as string[];
    static ensureLoad() {
        //only for load check, not update
        RemoteFile.ensureLoadDirs.forEach((dir) => {
            RemoteFile.forDirectory(dir).forEach((rf) => {
                if (!rf.ifLoaded()) {
                    rf.get();
                    //Xlog("ensure load: " + rf.fullPath());
                }
            })
        })
        RemoteFile.ensureLoadExts.forEach((ext) => {
            RemoteFile.forType(ext).forEach((rf) => {
                if (!rf.ifLoaded()) {
                    rf.get();
                    //Xlog("ensure load: " + rf.fullPath());
                }
            })
        })
        RemoteFile.ensureLoadNames.forEach((name) => {
            RemoteFile.forName(name).forEach((rf) => {
                if (!rf.ifLoaded()) {
                    rf.get();
                    //Xlog("ensure load: " + rf.fullPath());
                }
            })
        })
    }

    static sync() {
        RemoteFile.All.forEach((file) => {
            if(file.failTime>=MAX_FAIL_COUNT){
                file.needSave = false;
            }
            if (file.needSave) {
                file.save();
            }
        })
    }

    static printAll() {
        RemoteFile.All.sort((a, b) => {
            return a.fullPath() > b.fullPath() ? 1 : -1;
        })
        RemoteFile.All.forEach((file) => {
            if (file.type != null) {
                console.log(file.directory + "/" + file.name + "." + file.type);
            } else {
                console.error("file not loaded")
            }
        })
    }

    static _reg(path: string, date: Date) {//register everything here
        let testPath = path.split("/");
        let fileName = testPath.pop();
        let fileNameSeg = fileName.split(".");
        if (fileNameSeg.length > 2) {
            XlogFatal("file name error: " + path);
            return;
        }
        //be sure to check the validity of the path before creating remote files
        if (path.endsWith(".png")) {
            return new RemoteImgFile(path, date);
        } else {
            return new RemoteFile(path, date);
        }
    }

    static reg(path: string, date = new Date(0), renameIfExist = false) {
        let existing = RemoteFile.findF(path);
        if (existing != null) {
            if (renameIfExist) {
                let pathNoType = path.split(".").slice(0, -1).join(".");
                let dupNum = 1;
                while (RemoteFile.findF(pathNoType + "_" + dupNum + "." + existing.type) != null) {
                    dupNum++;
                }
                path = pathNoType + "_" + dupNum + "." + existing.type;
                console.warn("file renamed to: " + path, " should avoid in the future")
                return RemoteFile._reg(path, date);
            } else {
                if (date > existing.dateTime) {
                    existing.load(date);
                    console.warn("file already exists: " + path + ", reloading");
                }
                return existing;
            }
        } else {
            return RemoteFile._reg(path, date);
        }
    }
}

const imgSavingLockers = new Set();
function _save2png(path, imgData: ImageData) {
    let imgName = path.split("/").pop();
    imgSavingLockers.add(path);
    fetch('/local/array2png/' + imgData.width + "/" + imgData.height + "/" + path, {
        method: 'POST',
        body: imgData.data,
        cache: 'no-store'
    }).then(response => {
        if (response.ok) {
            XlogSuccess('图片保存成功', 3000);
            imgSavingLockers.delete(path);
        } else {
            XlogError('图片保存失败');
            imgSavingLockers.delete(path);
        }
    }).catch(error => {
        XlogError("图片保存请求失败")
        imgSavingLockers.delete(path);
    });
}

class RemoteImgFile extends RemoteFile {
    static AllImg: RemoteImgFile[] = [];
    data: HTMLImageElement;
    constructor(path, date: Date) {
        super(path, date);
        RemoteImgFile.AllImg.push(this);
    }

    static unloadAllProjectImgs() {
        RemoteImgFile.AllImg.forEach((rf) => {
            if (rf.directory.endsWith(".proj") && rf.name != "render") {
                //so usually layers are already unloaded once the project is opened
                //just in case for stability
                rf.unloadImg();//unload all project imgs except render.png
            }
        })
    }
    getImg() {
        return this.data;
    }

    ifLoaded() {
        if (this.data == null) {
            return false;
        } else {
            return this.data.complete;
        }
    }

    toImgData() {
        return MyImageData.ImgDataFromImgEle(this.forceGetImg());
    }

    unloadImg() {
        if (this.data instanceof HTMLImageElement) {
            this.data.src = "";
        }
        this.data = null;
    }

    forceGetImg() {
        if (this.data instanceof Promise) {
            debugger;
            XlogFatal("img not loaded");
            return null;
        } else {
            return this.data;
        }
    }

    async overwriteImgSrc(src: string) {
        let img = this.data
        if (img == null) {
            img = createImg_(null)
        }

        img.src = src + "?nocache=" + new Date().getTime()
        console.log("start loading img " + src)
        this.promise = new Promise((resolve) => {
            img.onload = () => {
                resolve(null);
                this.forceSet(img);
                console.log("img " + src + " loaded");
            }
            img.onerror = (e) => {
                if (img.src.endsWith(".png") || img.src.startsWith("data:")) {
                    console.error("img " + src + " load error");
                    resolve("error");
                } else {
                    console.log(e);
                    console.log(this.name + " img src cleared with: " + img.src);
                }
            }
        });
        await this.promise;
        this.promise = null;
    }

    forceSet(data: HTMLImageElement) {
        this.data = data;
    }

    saveImg() {
        let data = MyImageData.ImgDataFromImgEle(this.forceGetImg());
        if(data == null){
            console.error("img data is null, perhaps shape is not valid");
            return;
        }
        this.saveImgData2Png(data);
    }


    saveImgData2Png(imgData: ImageData) {
        if (this.type != "png") {
            debugger;
            XlogError("not supported type: " + this.type);
            return;
        }
        let path = this.directory + "/" + this.name// + ".png";
        _save2png(path, imgData);
        imgSavingLockers.add(path);
    }

    static reg(path: string, date = new Date(0), renameIfExist = false) {
        let rf = RemoteFile.reg(path, date, renameIfExist);
        if(rf == null){
            XlogError("failed to register: " + path);
            return null;
        }
        if (rf instanceof RemoteImgFile) {
            return rf;
        } else {
            debugger;
            XlogFatal("not img file");
            return null;
        }
    }
}

let lastLoadTime = -99999;
let loadFailCount = 0;

const ignoreDir = [".Trash"]
function loadLocal() {
    lastLoadTime = performance.now();
    if (loadFailCount > 5) {
        return;
    }
    fetch("/getAllFiles", { cache: 'no-store' }).then((response) => {
        if (!response.ok) {
            loadFailCount++;
            console.error('cannot read remote files');
        } else {
            response.body.getReader().read().then((data) => {
                let string = TEXTDE.decode(data.value);
                console.log("file list: \n" + string);
                let pathsAndDate = string.split("\n");
                pathsAndDate.forEach((p) => {
                    try{
                        let [path, dateStr] = p.split(" - ");
                        for (let i = 0; i < ignoreDir.length; i++) {
                            if (path.startsWith(ignoreDir[i])) {
                                return;
                            }
                        }
                        let dateInSec = parseFloat(dateStr);
                        let date = new Date(dateInSec * 1000);
                        console.log(path);
                        let ext = path.split(".").pop();
                        if (ext == "png") {
                            RemoteImgFile.reg(path, date);
                        } else {
                            console.log("registering: " + path);
                            RemoteFile.reg(path, date);
                        }
                    }catch(e){
                        console.error(e);
                    }
                })
                RemoteFile.registerToLocalStorage();
            })
        }
    })
}

RemoteFile.loadFromLocalStorage();
