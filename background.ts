import tabId = chrome.devtools.inspectedWindow.tabId;

export {}

let tempWindow;

//获取所有tabs
chrome.tabs.query({}).then(res => console.log(res))


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.action === 'getTempWindowId') {
        if (!tempWindow) {
            chrome.windows.create({
                focused: false,
                type: 'normal',
                url: message.url
            }).then(res => {

                tempWindow = res
                sendResponse(tempWindow.id)

            })
        } else {
            sendResponse(tempWindow.id)
        }
    }
})

chrome.windows.onRemoved.addListener(windowId => {
    if (tempWindow && tempWindow.id === windowId) {
        tempWindow = null;
    }
})