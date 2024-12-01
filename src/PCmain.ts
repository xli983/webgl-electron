const PCTopBar = createDiv(PageRoot,`
    position: absolute;
    left: 0;
    width: 100%;
    top: 0;
    height: 44px;
    background: ${Theme.base}`)

const PCSideBar = createDiv(PageRoot,`
    position: absolute;
    left: 0;
    width: 380px;
    top: 44px;
    bottom: 0;
    background: ${Theme.slightDark}`)

const PCVizHeight = 400;
const PCVizPadding = 40;
const PCViz = createImg(PCSideBar,null,`
    position: absolute;
    left: 0px;
    top: 0px;
    width: 100%;
    height: ${PCVizHeight}px;
    object-fit: contain;
    border-radius: unset;
    background: ${Theme.black}`);
const PCItemName = createDiv(PCSideBar,`
    position: absolute;
    left: ${PCVizPadding}px;
    top: ${PCVizHeight+PCVizPadding}px;
    width: 100%;
    height: 36px;
    font-size: 30px;
    `)
const PCItemInfo = createDiv(PCSideBar,`
    position: absolute;
    left: ${PCVizPadding}px;
    top: ${PCVizHeight+PCVizPadding+44}px;
    width: 100%;
    display: flex;
    color: ${Theme.light};
    `)

const PCContainer = createDiv(PageRoot,`
    position: absolute;
    left: 380px;
    width: calc(100% - 380px);
    max-height: calc(100% - 44px);
    top: 44px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    padding: 20px;
    box-sizing: border-box;
    `)

const PCitemWidth = 100;

function createPCItem(src:string,name:string){
    let base = createSimpleBtn2(PCContainer,null,`
        position: relative;
        width: ${PCitemWidth}px;
        height: 100px;
        `,()=>{//click to view the image
            PCViz.src = img.src;
            PCItemName.innerHTML = name;
            PCItemInfo.innerHTML = img.src
        })
    let img = createImg(base,src,`
        width: 100%;
        height: calc(100% - 20px);
        `)
    let text = createDiv(base,`
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 20px;
        text-align: center;
        line-height: 20px;
        `,name)
}

for(let i = 0; i < 10; i++){
    createPCItem(`svg/example.png`,"item "+i)
}


function PCmain() {
    frameCount++;
    let res = 0
    let numPerRow = Math.floor(PCContainer.offsetWidth / 130);
    let horizontalGap = (PCContainer.offsetWidth - numPerRow * PCitemWidth-20*2) / (numPerRow - 1);
    PCContainer.style.gap = `20px ${horizontalGap}px `;
    res += framworkStep();
}

setInterval(PCmain, 9);