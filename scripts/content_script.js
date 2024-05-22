let body = document.getElementsByTagName("body")[0]; // DOM의 body를 가져옴

let selectText = ''; // 유저가 드래그(user-select)한 단어가 들어갈 공간

$(body).on("mouseup", getUserSelectText); // 플러그인 실행을 위한 버튼을 생성하는 이벤트리스너
$(body).on("mousedown", deleteButton); // 외부 클릭 시(user-select취소) 박스를 없애는 이벤트리스너

function getUserSelectText(event) { // 플러그인 버튼 생성 함수
    let selectObj = window.getSelection();
    selectText = selectObj.toString();
    if(selectText !== '' && selectText !== " " && selectText !== "\n") {
        let pluginButton = document.createElement("img");
        pluginButton.src = chrome.runtime.getURL('image/icon.png')
        $(pluginButton).attr('id',"pluginButton");
        //chatGPT 생성 코드
        const range = selectObj.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        pluginButton.style.position = 'absolute';
        pluginButton.style.left = `${rect.left}px`;
        pluginButton.style.top = `${rect.bottom + window.scrollY}px`;
        //
        pluginButton.style.color = 'black'
        pluginButton.style.width = '30px'
        pluginButton.style.height = '30px'
        pluginButton.style.border = "3px solid black"
        document.body.appendChild(pluginButton)
        $(pluginButton).on("mousedown", buttonClick);
    }
}

function buttonClick() { // 버튼 클릭시, chrome플러그인의 service_worker에 select한 단어의 정의를 요청하는 함수
    chrome.runtime.sendMessage({request : selectText, action:"wikiSearch"},function (response) {
        if(response !== "error occurred") {
            console.log(response);
            requestOpenSideBar();
        }
    });
}

function requestOpenSideBar() {
    chrome.runtime.sendMessage({request : selectText, action:"openSideBar"})
}

function deleteButton() { //버튼을 없애는 함수
    if(selectText !== '' && selectText !== " " && selectText !== "\n") {
        console.log(selectText);
        $('#pluginButton').remove();
        selectText = '';
    }
}

//단어 밑에 버튼을 생성
//버튼클릭시 사이드바 열리게
//버튼 클릭했을 때, 얻어온 단어를 background에 sendMessage()