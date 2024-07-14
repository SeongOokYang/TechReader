let wordDiv = document.getElementById('word');
let summaryDiv = document.getElementById('summary');
let explainDiv = document.getElementById('explain');
let relatedList = document.getElementById('relatedList');

function relateLi(relatedStr) {
    let relatedDict = relatedStr.replace(/^({|})+|({|})+$/g, '');
    relatedDict = relatedDict.split('),')
    for (let val of relatedDict) {
        val = val+')'
        let li = document.createElement('LI');
        let textNode = document.createTextNode(val);
        li.appendChild(textNode);
        relatedList.appendChild(li);
    }   
}

function putDataInDiv(json_data) {
    data = JSON.parse(json_data);
    wordDiv.innerText = data.word;
    summaryDiv.innerText = data.summary;
    explainDiv.innerText = data.explain;
    let relatedStr = data.related;
    relateLi(relatedStr);
}

chrome.runtime.sendMessage({action:"sideBarText"}, (response) => {
    putDataInDiv(response);
})
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) { 
    let message = request.request;
    if(request.action === "reFill") {
        putDataInDiv(message);
    }
    
    return true;
});

addEventListener("beforeunload", (event) => {
    chrome.runtime.sendMessage({action:"closeSideBar"})
});