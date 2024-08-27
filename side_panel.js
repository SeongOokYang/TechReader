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
    selectText = selectObj.toString().trim();
    
    if(selectText !== '' && selectText !== " " && selectText !== "\n") {
        makeButton(selectObj);
        let pNodes = $("p").get();
        let textNodes = []
        pNodes.forEach(function(pNode) {
            textNodes.push($(pNode).text());
        });
        textUsePara = findUsePara(selectNode, textNodes, selectText);
        changeButton();
    }
}


function loadingOn() {
    $("body").children().not($(".homonym")).not($(".related")).hide();
    $("#loading").show();
}

function loadingFin() {
    $("body").children().not($(".homonym")).not($(".related")).show();
    $("#loading").hide();
}

function readyToType() {
    chrome.runtime.sendMessage({action: "isDrag"}, (response) => {
        if(!response) {
            $("#loading").hide();
            $(".userText").show();
            $("#word").show();
            $("#history").show();
            $("#historyDiv").show();
            $("#deleteAllButton").show();
        }
    })
    
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

function hyperLinkClick(event, data) {
    event.preventDefault(); // Prevent the default link behavior
    chrome.runtime.sendMessage({ request: data, action: "wikiSearchPanel" });
};

function getTextAfter(relatedLinks) {
    let textAfter = []
    relatedLinks.forEach(link => {
        let text = "<a href='#'>"+link+"</a>";
        textAfter.push(text);
    });
    
    return textAfter;
}

function displayRelated(relatedLinks) {
    if(relatedLinks != 'none' && relatedLinks != '해당 단어가 존재하지 않습니다.') {
        $(".related").show();
        
        let pNodes = $("p").get();
        let pNodesText = [];
        pNodes.forEach(function(pNode) {
            pNodesText.push($(pNode).text());
        });
        let textAfter = getTextAfter(relatedLinks)
        textAfter.forEach(text => {
            let li = document.createElement('LI');
            $(li).html(text);
            relatedList.appendChild(li);
        });
        let relatedListAs = $(relatedList).find('a');
        for(let relatedA of relatedListAs) {
            let related = $(relatedA).text();
            let data = {text: related, usePara: pNodesText};
            relatedA.addEventListener('click', (event) => {
                hyperLinkClick(event, data);
            });
        }
    }
}


function displayHistory(history) {
    console.log("Received history:", history);  // 로그 추가
    historyList.innerHTML = '';
    history.forEach(hist => {
        let word = hist.text
        let li = document.createElement('LI');
        let spanLink = document.createElement('span');
        let spanX = document.createElement('span');
        $(spanX).addClass('delButton');
        $(spanX).text('X');
        spanX.addEventListener('click', delHistory)
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
        spanLink.appendChild(link);
        li.appendChild(spanLink);
        li.appendChild(spanX);
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

function delHistory(event) {
    let targetButton = event.target;
    let history = $(targetButton).prev().children().eq(0).text();
    $(targetButton).parent().remove();
    chrome.runtime.sendMessage({action: "delHistory", request: history});
}

function delAllHistory() {
    chrome.runtime.sendMessage({action: "delAllHistory"});
    $("#historyList").empty();
}

function putDataInDiv(json_data) {
    $(".homonym").hide();
    $(".related").hide();
    $("#userTextInput").val("");

    data = JSON.parse(json_data);

    wordDiv.innerText = data.word;

    let summaryP = document.createElement('p');
    $(summaryP).addClass('selectable');
    let summaryText = document.createTextNode(data.summary);
    summaryP.appendChild(summaryText);
    summaryDiv.appendChild(summaryP);
    
    let explainStr = data.explain;
    displayExplain(explainStr);
    
    let relatedLinks = data.related;
    relatedList.innerHTML = ''; // Clear the previous related list
    displayRelated(relatedLinks);
    
    getHistory();
    
    let homonymList = data.link_homonym;
    displayHomonym(homonymList);
    
    $(".selectable").on("mouseup", getTexts);

    loadingFin();
}



function clearDataDiv() {
    wordDiv.innerText = "";
    summaryDiv.replaceChildren();
    explainDiv.replaceChildren();
    relatedList.replaceChildren();
    homonymList.replaceChildren();
}

function userTypeSearch(text) {
    usePara = [];
    data = {text: text, usePara: usePara}
    chrome.runtime.sendMessage({ request: data, action: "wikiSearchPanel" });
}

function getSearchText(){
    let text = $("#userTextInput").val().trim();
    if(text != "") {
        userTypeSearch(text);
    }
}

function enterKeySearchText(event) {
    if(event.keyCode == 13) {
        let text = $("#userTextInput").val().trim();
        if(text != "") {
            userTypeSearch(text);
        }
    }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if(request.action === "fill") {
        let message = request.request;
        clearDataDiv();
        putDataInDiv(message);
    }else if(request.action === "loading") {
        $(".homonym").hide();
        $(".related").hide();
        loadingOn();
    }
    return true;
});

// addEventListener("beforeunload", (event) => {
//     chrome.runtime.sendMessage({ action: "closeSideBar", request: false }, (response)=>{console.log('sidePanelClosed')});
// });
loadingOn();

getHistory();

let selectText = '';
let textUsePara = [];

let wordDiv = document.getElementById('wordDiv');
let summaryDiv = document.getElementById('summaryDiv');
let explainDiv = document.getElementById('explainDiv');
let relatedList = document.getElementById('relatedList');
let historyList = document.getElementById('historyList');
let homonymList = document.getElementById("homonymList");
let userTextInput = document.getElementById("userTextInput");
let textSendButton = document.getElementById("textSendButton");
let allHistoryDelete = document.getElementById("deleteAllButton");
userTextInput.addEventListener('keypress', enterKeySearchText);
textSendButton.addEventListener('click', getSearchText);
allHistoryDelete.addEventListener('click', delAllHistory);

$('body').on('mousedown', deleteButton);

$(document).ready(readyToType());