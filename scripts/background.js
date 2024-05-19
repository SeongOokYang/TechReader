chrome.tabs.addEventListener('create', getReady);

function getReady(event) {
    chrome.scripting.executeScript({
        target:{tabId : event.id},
        files:["content_script.js"]
    });
}

//send된 단어를 받아서 파이썬 코드(wikipedia 검색 코드)에 넘겨주고 검색 결과를 받은 후 결과를 content_script에 다시 전달