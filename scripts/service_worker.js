let searchOutcome = "";
let isSidePanelOpen = false;
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) { // content_script의 요청을 받으면 요청받은 단어를 python기반 wiki검색 서버에 전달
                                                                          // 검색 결과를 받으면 side_panel에 검색 결과를 채워서 제공
    let message = {request:request.request};
    if(request.action === "wikiSearch") {
        postData('http://127.0.0.1:8888/', message).then((response) => {
            if(typeof(response) === 'string') {
                sendResponse(response);
                searchOutcome = response;
            }else {
                sendResponse("error occurred in service-worker");
            }
            }).catch((error) => {
            sendResponse("error occurred");
        });
    }else if(request.action === "openSideBar"){
        if(!isSidePanelOpen) {
            chrome.sidePanel.open({tabId : sender.tab.id})
            isSidePanelOpen = true;
        }else {
            chrome.runtime.sendMessage({request: searchOutcome, action: "reFill"})
        }
    }else if(request.action === "sideBarText") {
        sendResponse(searchOutcome);
    }

    return true;
});

async function postData(url = "", data = {}){
    const response = await fetch(url, {
        method:"POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
            "Content-Type":"application/json"
            },
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify(data)
    });
        
    return response.text();
}


//send된 단어를 받아서 파이썬 코드(wikipedia 검색 코드)에 넘겨주고 검색 결과를 받음
//side panel open 후 검색 결과를 창에 출력