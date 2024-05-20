chrome.runtime.onMessage.addListener((message, sender,sendResponse) => {
    chrome.sidePanel.open({windowId : chrome.tabs.windowId})
})

//send된 단어를 받아서 파이썬 코드(wikipedia 검색 코드)에 넘겨주고 검색 결과를 받음
//side panel open 후 검색 결과를 창에 출력