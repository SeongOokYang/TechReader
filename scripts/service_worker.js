let searchOutcome = "";
// let isSidePanelOpen = false;
let isDrag = false;
let searchHistory = [];
const url = 'http://127.0.0.1:8888/'

chrome.storage.local.get(['searchHistory']).then((result) => {
    if(result.searchHistory !== undefined) {
        searchHistory = result.searchHistory;
    }
});

function makeHistory(response, request) {
    responseParse = JSON.parse(response);
    word = responseParse.word;
    history = {text: word, usePara: request.request.usePara};
    return history;
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if(info.menuItemId === "wikiSearcher") {
        chrome.sidePanel.open({ tabId: tab.id });
        isDrag = false;
        // isSidePanelOpen = true;
    }
});

chrome.runtime.onInstalled.addListener(()=> {
    chrome.contextMenus.create({
        title: "wikiSearcher",
        id: 'wikiSearcher'
        }
    );
});

// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//     if(request.action === "closeSideBar") {
//         isSidePanelOpen = request.request;
//         sendResponse(isSidePanelOpen);
//     }
// });

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    let message = { request: request.request };
    if (request.action === "wikiSearch") {
        // if(!isSidePanelOpen) {
        //     chrome.sidePanel.open({ tabId: sender.tab.id });
        //     isSidePanelOpen = true;
        //     postData(url, message).then((response) => {
        //         if (typeof(response) === 'string') {
        //             searchOutcome = response;
        //             history = makeHistory(response, request);
        //             addToSearchHistory(history);
        //             chrome.runtime.sendMessage({ request: searchOutcome, action: "fill" });
        //         } else {
        //             sendResponse("error occurred in service-worker");
        //         }
        //     }).catch((error) => {
        //         sendResponse("error occurred");
        //     });
        // }else {
            chrome.sidePanel.open({ tabId: sender.tab.id });
            isDrag = true;
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
        // }
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
    }else if(request.action == "isDrag") {
        sendResponse(isDrag);
    }else if(request.action == 'delHistory') {
        let delTargetHist = request.request;
        console.log(delTargetHist);
        searchHistory = searchHistory.filter((history) => history.text !== delTargetHist);
        chrome.storage.local.set({'searchHistory': searchHistory}, function() {
            console.log(searchHistory);
        })
    }else if(request.action == "delAllHistory") {
        chrome.storage.local.clear();
        searchHistory = [];
    }

    return true;
});


function addToSearchHistory(word) {
    const includesArray = (hist, comp) => {
        return hist.some(item => item.text === comp.text);
    }
    console.log(searchHistory);
    if (!includesArray(searchHistory,word)) {
        searchHistory.push(word);
        chrome.storage.local.set({'searchHistory': searchHistory}, function() {
            console.log(searchHistory);
        });
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
