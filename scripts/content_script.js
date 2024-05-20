let body = document.getElementsByTagName("body")[0];

let selectText = '';

$(body).on("mouseup", getUserSelectText);
$(body).on("mousedown", deleteButton);

function getUserSelectText(event) {
    let selectObj = window.getSelection();
    selectText = selectObj.toString();
    if(selectText !== '' && selectText !== " " && selectText !== "\n") {
        let pluginButton = document.createElement("img");
        pluginButton.src = chrome.runtime.getURL('image/icon.png')
        $(pluginButton).attr('id',"pluginButton");
        //chatGPT 생성 코드
        const range = selectObj.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        console.log(selectText);
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

function buttonClick() {
    console.log(1)
    chrome.runtime.sendMessage(selectText);
}

function deleteButton() {
    if(selectText !== '' && selectText !== " " && selectText !== "\n") {
        console.log(selectText);
        $('#pluginButton').remove();
        selectText = '';
    }
}

//단어 밑에 버튼을 생성
//버튼클릭시 사이드바 열리게
//버튼 클릭했을 때, 얻어온 단어를 background에 sendMessage()