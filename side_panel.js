let wordDiv = document.getElementById('word');
let summaryDiv = document.getElementById('summary');
let explainDiv = document.getElementById('explain');
let relatedList = document.getElementById('relatedList');
let historyList = document.getElementById('historyList');

function displayExplain(explainVal) {
    let strVals = explainVal.replace(/^\[|\]$/g,''); //문장의 처음과 끝의 []를 제거하는 정규식
    strVals = strVals.split('|-|');
    strVals.shift();
    for (let val of strVals) {
        console.log(val)
        let vals = val.split('|');
        sectionDept = vals[0]
        sectionTitle = vals[1]
        sectionText = vals[2]
        console.log(sectionDept)
        let header = document.createElement('H'+sectionDept);
        let titleText = document.createTextNode(sectionTitle);
        header.appendChild(titleText);
        let textP = document.createElement('P');
        let textText = document.createTextNode(sectionText);
        textP.appendChild(textText);
        explainDiv.appendChild(header);
        explainDiv.appendChild(textP);
    }
}

function displayRelated(relatedVal) {
    let vals = relatedVal.split('|');
    sectionText = vals[2];
    section_Texts = sectionText.split("\n");
    for(text of section_Texts) {
        if(text.trim() !== ''){
            let li = document.createElement('LI');
            let textNode = document.createTextNode(text);
            li.appendChild(textNode);
            relatedList.appendChild(li);
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
    data = JSON.parse(json_data);
    wordDiv.innerText = data.word;
    summaryDiv.innerText = data.summary;
    let explainStr = data.explain;
    displayExplain(explainStr);
    let relatedStr = data.related;
    relatedList.innerHTML = ''; // Clear the previous related list
    displayRelated(relatedStr);
    getHistory();
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
            chrome.runtime.sendMessage({ request: hist, action: "wikiSearch" }, function (response) {
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
