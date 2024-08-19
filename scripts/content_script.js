let body = document.getElementsByTagName("body")[0]; // DOM의 body를 가져옴

let selectText = ''; // 유저가 드래그(user-select)한 단어가 들어갈 공간
let textUsePara = [];

$(body).on("mouseup", getTextNode); // 플러그인 실행을 위한 버튼을 생성하는 이벤트리스너
$(body).on("mousedown", deleteButton); // 외부 클릭 시(user-select취소) 박스를 없애는 이벤트리스너

function makeButton(selectObj) {
    let pluginButton = document.createElement("img");
    pluginButton.src = chrome.runtime.getURL('image/image_ready.png');
    $(pluginButton).attr('id',"pluginButton");
    //chatGPT 생성 코드
    const range = selectObj.getRangeAt(0);
    const rect = range.getBoundingClientRect();
        
    pluginButton.style.position = 'absolute';
    pluginButton.style.left = `${rect.left}px`;
    pluginButton.style.top = `${rect.bottom + window.scrollY}px`;
    pluginButton.style.color = 'black'
    pluginButton.style.width = '30px'
    pluginButton.style.height = '30px'
    //
    document.body.appendChild(pluginButton)
}

function changeButton() {
    $("#pluginButton").attr("src",chrome.runtime.getURL('image/image_done.png'));
    $("#pluginButton").on("mousedown", buttonClick);
}

function findUsePara(selectNode,textNodes, text) {
    let usePara = [];
    usePara.push(selectNode.trim());
    let allTexts = textNodes.split('\n');
    console.log(allTexts);
    allTexts.forEach(function(textValue) {
        if(textValue.includes(text)) {
            usePara.push(textValue.trim());
        }
    });
    return usePara;
}

//chatGPT 생성코드

function getTextNode(event) {
    let textNodes = "";
    let url = window.location.href;
    let selectObj = window.getSelection();
    let selectNode = selectObj.anchorNode.nodeValue;
    selectText = selectObj.toString().trim();
    
    console.log(selectNode);
    if(selectText !== '' && selectText !== " " && selectText !== "\n") {
        makeButton(selectObj);
        chrome.runtime.sendMessage({request : url, action : 'get_text'}, function(response) {
            textNodes = response;
            getUserSelectText(selectNode ,textNodes);
        });
    }
}
//

function getUserSelectText(selectNode,textNodes) { // 플러그인 버튼 생성 함수
    textUsePara = findUsePara(selectNode, textNodes, selectText);
    changeButton();
}


function buttonClick() { // 버튼 클릭시, chrome플러그인의 service_worker에 select한 단어의 정의를 요청하는 함수
    let requestData = {text:selectText, usePara:textUsePara};
    console.log(textUsePara);
    chrome.runtime.sendMessage({request : requestData, action:"wikiSearch"},function (response) {
        if(response !== "error occurred") {
            console.log(response);
            // requestOpenSideBar();
            deleteButton();
        }
    });
}

// function requestOpenSideBar() {
//     chrome.runtime.sendMessage({request : selectText, action:"openSideBar"})
// }

function deleteButton() { //버튼을 없애는 함수
    $('#pluginButton').remove();
}

//단어 밑에 버튼을 생성
//버튼클릭시 사이드바 열리게
//버튼 클릭했을 때, 얻어온 단어를 background에 sendMessage()