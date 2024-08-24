let searchOutcome = "";
let isSidePanelOpen = false;
let searchHistory = [];
const url = 'http://127.0.0.1:8888/'

function makeHistory(response, request) {
    responseParse = JSON.parse(response);
    word = responseParse.word;
    history = {text: word, usePara: request.request.usePara};
    return history;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if(request.action === "closeSideBar") {
        isSidePanelOpen = request.request;
        sendResponse(isSidePanelOpen);
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    let message = { request: request.request };
    if (request.action === "wikiSearch") {
        if(!isSidePanelOpen) {
            console.log(10);
            chrome.sidePanel.open({ tabId: sender.tab.id });
            isSidePanelOpen = true;
            postData(url, message).then((response) => {
                if (typeof(response) === 'string') {
                    searchOutcome = response;
                    history = makeHistory(response, request);
                    addToSearchHistory(history);
                    chrome.runtime.sendMessage({ request: searchOutcome, action: "fill" });
                } else {
                    sendResponse("error occurred in service-worker");
                }
            }).catch((error) => {
                sendResponse("error occurred");
            });
        }else {
            console.log(20);
            chrome.sidePanel.open({ tabId: sender.tab.id });
            chrome.runtime.sendMessage({action: "loading"});
            postData(url, message).then((response) => {
                if (typeof(response) === 'string') {
                    sendResponse(response);
                    searchOutcome = response;
                    history = makeHistory(response, request);
                    addToSearchHistory(history);
                    chrome.runtime.sendMessage({ request: searchOutcome, action: "fill" });
                } else {
                    sendResponse("error occurred in service-worker");
                }
            }).catch((error) => {
                sendResponse("error occurred");
            });
        }
    } else if(request.action === "get_text") {
        postData('http://127.0.0.1:8888/get_text', message).then((response) => {
            sendResponse(response)
        });
    } else if (request.action === "getHistory") {
        console.log("Sending history:", searchHistory);  // 로그 추가
        sendResponse(searchHistory);
    } else if(request.action === "wikiSearchPanel") {
        chrome.runtime.sendMessage({action: "loading"});
        postData(url, message).then((response) => {
            if (typeof(response) === 'string') {
                searchOutcome = response;
                history = makeHistory(response, request);
                addToSearchHistory(history);
                chrome.runtime.sendMessage({ request: searchOutcome, action: "fill" });
            } else {
                sendResponse("error occurred in service-worker");
            }
        }).catch((error) => {
            sendResponse("error occurred");
        });
    }

    return true;
});


function addToSearchHistory(word) {
    const includesArray = (hist, comp) => {
        return hist.some(item => item.text === comp.text);
    }
    if (!includesArray(searchHistory,word)) {
        searchHistory.push(word);
    }
}

async function postData(url = "", data = {}) {
    const response = await fetch(url, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json"
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify(data),
    });
    
    return response.text();
    
}
