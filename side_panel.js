displaySwitch();

let selectText = '';
let textUsePara = [];

let wordDiv = document.getElementById('word');
let summaryDiv = document.getElementById('summary');
let explainDiv = document.getElementById('explain');
let relatedList = document.getElementById('relatedList');
let historyList = document.getElementById('historyList');
let homonymList = document.getElementById("homonymList");

$('body').on('mousedown', deleteButton);

function buttonClick() { // 버튼 클릭시, chrome플러그인의 service_worker에 select한 단어의 정의를 요청하는 함수
    let requestData = {text:selectText, usePara:textUsePara};
    chrome.runtime.sendMessage({request : requestData, action:"wikiSearchPanel"},function (response) {
        if(response !== "error occurred") {
            deleteButton();
        }
    });
    selectText = '';
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
    $("#pluginButton").attr("src",'image/image_done.png');
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
        console.log(3333);
    }
}

function displaySwitch() {
    $("body").children().not($(".homonym")).not($(".related")).toggle();
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
        $(header).addClass("selectable");
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
    if(relatedVal != 'none' && relatedVal != '해당 단어가 존재하지 않습니다.') {
        $(".related").show();
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

function hyperLinkClick(event, data) {
    event.preventDefault(); // Prevent the default link behavior
    chrome.runtime.sendMessage({ request: data, action: "wikiSearchPanel" });
};

function displayHistory(history) {
    console.log("Received history:", history);  // 로그 추가
    historyList.innerHTML = '';
    history.forEach(hist => {
        let word = hist.text
        let li = document.createElement('LI');
        let link = document.createElement('a');
        link.href = '#';
        link.innerText = word;
        // link.onclick = function (event) {
        //     event.preventDefault(); // Prevent the default link behavior
        //     chrome.runtime.sendMessage({ request: hist, action: "wikiSearchPanel" });
        // };
        link.addEventListener('click', (event) => {
            hyperLinkClick(event, hist);
        });
        li.appendChild(link);
        historyList.appendChild(li);
    });
}

function displayHomonym(link_homonym) {
    if(link_homonym.length != 0) {
        $(".homonym").show();
        for(let link of link_homonym) {
            let linkLi = document.createElement('LI');
            let hyperLink = document.createElement('a');
            hyperLink.href = '#';
            hyperLink.innerText = link;
            let data = {text:link, usePara:[]}
            hyperLink.addEventListener('click',(event) => {
                hyperLinkClick(event, data);
            });
            linkLi.appendChild(hyperLink);
            homonymList.appendChild(linkLi);
        }
    }
}


function getHistory() {
    chrome.runtime.sendMessage({ action: "getHistory" }, (history) => {
        console.log(history)
        displayHistory(history);
    });
}

function putDataInDiv(json_data) {
    $(".homonym").hide();
    $(".related").hide();

    data = JSON.parse(json_data);

    wordDiv.innerText = data.word;

    let summaryP = document.createElement('p');
    $(summaryP).addClass('selectable');
    let summaryText = document.createTextNode(data.summary);
    summaryP.appendChild(summaryText);
    summaryDiv.appendChild(summaryP);
    
    let explainStr = data.explain;
    displayExplain(explainStr);
    
    let relatedStr = data.related;
    relatedList.innerHTML = ''; // Clear the previous related list
    displayRelated(relatedStr);
    
    getHistory();
    
    let homonymList = data.link_homonym;
    displayHomonym(homonymList);
    
    $(".selectable").on("mouseup", getTexts);

    displaySwitch();
}



function clearDataDiv() {
    wordDiv.innerText = "";
    summaryDiv.replaceChildren();
    explainDiv.replaceChildren();
    relatedList.replaceChildren();
    homonymList.replaceChildren();
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if(request.action === "fill") {
        let message = request.request;
        clearDataDiv();
        putDataInDiv(message);
    }else if(request.action === "loading") {
        $(".homonym").hide();
        $(".related").hide();
        displaySwitch()
    }
    return true;
});

addEventListener("beforeunload", (event) => {
    chrome.runtime.sendMessage({ action: "closeSideBar", request: false }, (response)=>{console.log('sidePanelClosed')});
});
