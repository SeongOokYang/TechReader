displaySwitch();

let selectText = '';
let textUsePara = [];

let wordDiv = document.getElementById('word');
let summaryDiv = document.getElementById('summary');
let explainDiv = document.getElementById('explain');
let relatedList = document.getElementById('relatedList');
let historyList = document.getElementById('historyList');

$('body').on('mousedown', deleteButton);

function buttonClick() { // 버튼 클릭시, chrome플러그인의 service_worker에 select한 단어의 정의를 요청하는 함수
    let requestData = {text:selectText, usePara:textUsePara};
    chrome.runtime.sendMessage({request : requestData, action:"wikiSearchPanel"},function (response) {
        if(response !== "error occurred") {
            deleteButton();
        }
    });
}

function makeButton(selectObj) {
    let pluginButton = document.createElement("img");
    $(pluginButton).attr('src','image/image_ready.png');
    $(pluginButton).attr('id',"pluginButton");
    //chatGPT 생성 코드
    const range = selectObj.getRangeAt(0);
    const rect = range.getBoundingClientRect();
        
    pluginButton.style.position = 'absolute';
    pluginButton.style.left = `${rect.left}px`;
    pluginButton.style.top = `${rect.bottom + window.scrollY}px`;
    pluginButton.style.color = 'black'
    pluginButton.style.width = '30px'
    pluginButton.style.height = '30px'
    //
    document.body.appendChild(pluginButton);
}

function changeButton() {
    $("#pluginButton").attr("src",chrome.runtime.getURL('image/image_done.png'));
    $("#pluginButton").on("mousedown", buttonClick);
}

function deleteButton() { //버튼을 없애는 함수
    $('#pluginButton').remove();
}

function findUsePara(selectNode,textNodes, text) {
    let usePara = [];
    usePara.push(selectNode.trim());
    textNodes.forEach(function(textValue) {
        if(textValue.includes(text)) {
            usePara.push(textValue.trim());
        }
    });
    return usePara;
}

function getTexts(){
    let selectObj = window.getSelection();
    let selectNode = selectObj.anchorNode.nodeValue;
    console.log(selectObj);
    selectText = selectObj.toString().trim();
    
    if(selectText !== '' && selectText !== " " && selectText !== "\n") {
        makeButton(selectObj);
        let pNodes = $("p").get();
        let textNodes = []
        pNodes.forEach(function(pNode) {
            textNodes.push($(pNode).text());
        });
        console.log(textNodes);
        textUsePara = findUsePara(selectNode, textNodes, selectText);
        console.log(textUsePara);
        changeButton();
    }
}

function displaySwitch() {
    $("body").children().toggle();
}

function displayExplain(explainVal) {
    let strVals = explainVal.split('|-|');

    for (let val of strVals) {
        console.log(val)
        let vals = val.split('|');
        sectionDept = Number(vals[0])
        sectionTitle = vals[1]
        sectionText = vals[2]
        console.log(sectionDept)
        let header = document.createElement('H'+sectionDept);
        let titleText = document.createTextNode(sectionTitle);
        header.appendChild(titleText);
        let textP = document.createElement('P');
        $(textP).addClass("selectable");
        let textText = document.createTextNode(sectionText);
        textP.appendChild(textText);
        explainDiv.appendChild(header);
        explainDiv.appendChild(textP);
    }
}

function displayRelated(relatedVal) {
    if(relatedVal != 'none') {
        let vals = relatedVal.split('|');
        sectionText = vals[2];
        section_Texts = sectionText.split("\n");
        for(text of section_Texts) {
            if(text.trim() !== ''){
                let li = document.createElement('LI');
                let textNode = document.createTextNode(text);
                $(li).addClass("selectable");
                li.appendChild(textNode);
                relatedList.appendChild(li);
            }
        }
    }
}

function displayHistory(history) {
    console.log("Received history:", history);  // 로그 추가
    historyList.innerHTML = '';
    history.forEach(hist => {
        let word = hist.text
        let li = document.createElement('LI');
        let link = document.createElement('a');
        link.href = '#';
        link.innerText = word;
        link.onclick = function (event) {
            event.preventDefault(); // Prevent the default link behavior
            chrome.runtime.sendMessage({ request: hist, action: "wikiSearch" });
        };
        li.appendChild(link);
        historyList.appendChild(li);
    });
}


function getHistory() {
    chrome.runtime.sendMessage({ action: "getHistory" }, (history) => {
        console.log(history)
        displayHistory(history);
    });
}

function putDataInDiv(json_data) {
    console.log(json_data);
    data = JSON.parse(json_data);
    wordDiv.innerText = data.word;
    summaryDiv.innerText = data.summary;
    let explainStr = data.explain;
    displayExplain(explainStr);
    let relatedStr = data.related;
    relatedList.innerHTML = ''; // Clear the previous related list
    displayRelated(relatedStr);
    getHistory();
    $(".selectable").on("mouseup", getTexts);

    displaySwitch();
}



function clearDataDiv() {
    wordDiv.innerText = "";
    summaryDiv.innerText = "";
    explainDiv.innerText = "";
    relatedList.replaceChildren();
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if(request.action === "fill") {
        let message = request.request;
        clearDataDiv();
        putDataInDiv(message);
    }else if(request.action === "loading") {
        displaySwitch()
    }
    return true;
});

addEventListener("beforeunload", (event) => {
    chrome.runtime.sendMessage({ action: "closeSideBar", request: false }, (response)=>{console.log('sidePanelClosed')});
});
