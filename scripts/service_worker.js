let searchOutcome = "";
let isSidePanelOpen = false;
let searchHistory = [];
const url = 'http://127.0.0.1:8888/'

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    let message = { request: request.request };
    if (request.action === "wikiSearch") {
        if(!isSidePanelOpen) {
            chrome.sidePanel.open({ tabId: sender.tab.id });
            isSidePanelOpen = true;
            postData(url, message).then((response) => {
                if (typeof(response) === 'string') {
                    sendResponse(response);
                    searchOutcome = response;
                    addToSearchHistory(request.request);
                    if (isSidePanelOpen) {
                        chrome.runtime.sendMessage({ request: searchOutcome, action: "reFill" });
                    }
                } else {
                    sendResponse("error occurred in service-worker");
                }
            }).catch((error) => {
                sendResponse("error occurred");
            });
        }else {
            postData(url, message).then((response) => {
                if (typeof(response) === 'string') {
                    sendResponse(response);
                    searchOutcome = response;
                    addToSearchHistory(request.request);
                    if (isSidePanelOpen) {
                        chrome.runtime.sendMessage({ request: searchOutcome, action: "reFill" });
                    }
                } else {
                    sendResponse("error occurred in service-worker");
                }
            }).catch((error) => {
                sendResponse("error occurred");
            });
            chrome.runtime.sendMessage({ request: searchOutcome, action: "reFill" });
        }
    } else if(request.action === "get_text") {
        postData('http://127.0.0.1:8888/get_text', message).then((response) => {
            sendResponse(response)
        })
    // }else if (request.action === "openSideBar") {
    //     chrome.sidePanel.open({ tabId: sender.tab.id });
    //     if (!isSidePanelOpen) {
    //         isSidePanelOpen = true;
    //     } else {
    //         chrome.runtime.sendMessage({ request: searchOutcome, action: "reFill" });
    //     }
    } else if (request.action === "sideBarText") {
        sendResponse(searchOutcome);
    } else if (request.action === "closeSideBar") {
        isSidePanelOpen = false;
    } else if (request.action === "getHistory") {
        console.log("Sending history:", searchHistory);  // 로그 추가
        sendResponse(searchHistory);
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
    const controller = new AbortController();
    const signal = controller.signal;

    const timeoutID = setTimeout(() => {
        controller.abort();
    }, 180000);

    try {
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
            signal
        });
        
        clearTimeout(timeoutID)
        return response.text();
    } catch(error) {
        if(error.name === 'AbortError') {
            throw new Error('Request Time Out');
        }
        throw error;
    }
    
}
