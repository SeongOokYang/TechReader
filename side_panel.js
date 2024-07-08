let wordDiv = document.getElementById('word');
let summaryDiv = document.getElementById('summary');
let explainDiv = document.getElementById('explain');
let relatedDiv = document.getElementById('related');
function putDataInDiv(json_data) {
    data = JSON.parse(json_data);
    wordDiv.innerText = data.word;
    summaryDiv.innerText = data.summary;
    explainDiv.innerText = data.explain;
    relatedDiv.innerText = data.related;
}

chrome.runtime.sendMessage({action:"sideBarText"}, (response) => {
    putDataInDiv(response);
})
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) { 
    let message = request.request;
    if(request.action === "reFill") {
        outcomeDiv.innerText = message;
    }
    
    return true;
});

addEventListener("beforeunload", (event) => {
    chrome.runtime.sendMessage({action:"closeSideBar"})
});