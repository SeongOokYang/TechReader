chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) { // content_script의 요청을 받으면 요청받은 단어를 python기반 wiki검색 서버에 전달
                                                                          // 검색 결과를 받으면 side_panel에 검색 결과를 채워서 제공
        postData('http://127.0.0.1:8888/', request).then((response) => {
            if(typeof(response) === 'string') {
                sendResponse(response);
            }else {
                sendResponse("not string");
            }
        }).catch((error) => {
            console.error("Error:", error);
            sendResponse("error occurred");
        });

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