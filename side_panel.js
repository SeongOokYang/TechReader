let outcomeDiv = document.getElementById("searchOutCome");
chrome.runtime.sendMessage({action:"sideBarText"}, (response) => {
    outcomeDiv.innerText = response;
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