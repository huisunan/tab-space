import tabId = chrome.devtools.inspectedWindow.tabId;

export {}

//获取所有tabs

chrome.tabs.query({}).then(res => console.log(res))


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.action === 'createTempWindow') {
        //获取所有tabs中是否有tempWindow

    }
})