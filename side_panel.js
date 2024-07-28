let wordDiv = document.getElementById('word');
let summaryDiv = document.getElementById('summary');
let explainDiv = document.getElementById('explain');
let relatedList = document.getElementById('relatedList');
let historyList = document.getElementById('historyList');

function relateLi(relatedStr) {
    let relatedVals = relatedStr.replace(/^\[|\]$/g,'');
    relatedVals = relatedVals.split(',')
    for (let val of relatedVals) {
        let li = document.createElement('LI');
        let textNode = document.createTextNode(val);
        li.appendChild(textNode);
        relatedList.appendChild(li);
    }
}

function getHistory() {
    chrome.runtime.sendMessage({ action: "getHistory" }, (history) => {
        displayHistory(history);
    });
}

function putDataInDiv(json_data) {
    data = JSON.parse(json_data);
    wordDiv.innerText = data.word;
    summaryDiv.innerText = data.summary;
    explainDiv.innerText = data.explain;
    let relatedStr = data.related;
    relatedList.innerHTML = ''; // Clear the previous related list
    relateLi(relatedStr);
    getHistory();
}

function displayHistory(history) {
    console.log("Received history:", history);  // 로그 추가
    historyList.innerHTML = '';
    history.forEach(word => {
        let li = document.createElement('LI');
        let link = document.createElement('a');
        link.href = '#';
        link.innerText = word;
        link.onclick = function (event) {
            event.preventDefault(); // Prevent the default link behavior
            chrome.runtime.sendMessage({ request: word, action: "wikiSearch" }, function (response) {
                if (response !== "error occurred") {
                    putDataInDiv(response); // Update the side panel with the new data
                }
            });
        };
        li.appendChild(link);
        historyList.appendChild(li);
    });
}

function clearDataDiv() {
    wordDiv.innerText = "";
    summaryDiv.innerText = "";
    explainDiv.innerText = "";
    relatedList.replaceChildren();
}

chrome.runtime.sendMessage({action:"sideBarText"}, (response) => {
    putDataInDiv(response);
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    let message = request.request;
    if(request.action === "reFill") {
        clearDataDiv();
        putDataInDiv(message);
    }
    return true;
});

addEventListener("beforeunload", (event) => {
    chrome.runtime.sendMessage({ action: "closeSideBar" });
});
