import React from "react";

import {Button, List, Tabs} from "antd"

interface State {
    tabs: chrome.tabs.Tab[]
    workSpaces: WorkSpace[]
    tempWindow?: chrome.windows.Window
}

class Options extends React.Component<any, State> {


    constructor(props) {
        super(props);
        this.state = {
            tabs: [],
            workSpaces: [{
                name: "测试",
                items: [{
                    name: "百度",
                    domain: "https://www.baidu.com",
                }, {
                    name: "tapd",
                    domain: "https://www.tapd.cn",
                }]
            }, {
                name: "正式",
                items: [{
                    name: "nas",
                    domain: "http://nas.hsn99.top"
                }, {
                    name: "ttrss",
                    domain: "http://ttrss.hsn99.top"
                }]
            }]
        }
    }

    componentDidMount() {
        //获取tabs
        //注册事件
        chrome.tabs.onCreated.addListener(tabId => this.refreshTabs())
        chrome.tabs.onUpdated.addListener(tabId => this.refreshTabs())
        chrome.tabs.onRemoved.addListener(tabId => this.refreshTabs())
        this.refreshTabs().then(() => {
            //获取当前tab的地址
            chrome.tabs.query({
                active: true,
                lastFocusedWindow: true
            }).then(nowTabs => {
                const nowTab = nowTabs[0]
                if (!nowTab.pinned) {
                    chrome.tabs.update(nowTab.id, {pinned: true})
                }
                const tempTabUrl = nowTab.url + "?temp=true";
                const tempTab = this.state.tabs.find(i => i.url === tempTabUrl);
                if (tempTab) {
                    chrome.windows.get(tempTab.windowId).then(tempWindow => {
                        this.setState({
                            tempWindow
                        })
                    })
                } else {
                    //创建临时
                    chrome.windows.create({
                        focused: false,
                        state: 'normal',
                        type: 'normal',
                        url: tempTabUrl
                    }).then(tempWindow => {
                        this.setState({
                            tempWindow
                        })
                    })
                }
            })
        })

    }


    private refreshTabs() {
        return chrome.tabs.query({}).then(tabs => {
            this.state.workSpaces.flatMap(i => i.items).forEach(item => {
                item.active = !!tabs.find(tab => tab.url?.startsWith(item.domain))
            })
            this.setState({
                workSpaces: this.state.workSpaces,
                tabs
            })
        })
    }

    handleItemClick(workItem: WorkSpaceItem) {
        if (workItem?.active) {
            chrome.tabs.query({}).then(tabs => {
                const targetTab = tabs.find(tab => tab.url?.startsWith(workItem.domain));
                if (targetTab) {
                    chrome.tabs.update(targetTab.id, {
                        active: true
                    })
                }
            })
        } else {
            chrome.tabs.create({
                url: workItem.domain,
                active: true
            })
        }
    }

    unNameClick() {
        //获取所有domain
        const domains = this.state.workSpaces.flatMap(i => i.items).map(i => i.domain);
        this.moveTabWindow((tab) => {
            return !domains.find(i => tab.url?.startsWith(i));
        })

    }

    tabChange(key) {
        const domains = this.state.workSpaces.filter(i => i.name === key)
            .flatMap(i => i.items)
            .map(i => i.domain)
        this.moveTabWindow((tab) => {
            return !!domains.find(domain => tab.url?.startsWith(domain));
        });
    }


    private moveTabWindow(predicate: (tab: chrome.tabs.Tab) => boolean) {
        //当前窗口id
        chrome.windows.getCurrent().then(currentWindow => {

            //遍历所有tab
            this.state.tabs.forEach(tab => {
                if (tab.windowId === currentWindow.id && tab.active) {
                    return;
                }
                const move = predicate(tab);
                chrome.tabs.move(tab.id, {
                    index: 1,
                    windowId: move ? currentWindow.id : this.state.tempWindow.id
                })
            })
        })
    }

    render() {

        return (
            <div>
                <Button type="primary" onClick={() => this.unNameClick()}>未命名空间</Button>
                <Tabs tabPosition="left"
                      onChange={(key) => this.tabChange(key)}
                      items={
                          this.state.workSpaces.map(i => {
                              return {
                                  label: i.name,
                                  key: i.name,

                                  children: <List
                                      dataSource={i.items}
                                      renderItem={(item) => (
                                          <List.Item>
                                              <div onClick={() => this.handleItemClick(item)}>
                                                  {item.name} ： {this.state.tabs.find(i => i.url?.startsWith(item.domain)) ? "已激活" : "未激活"}
                                              </div>
                                          </List.Item>
                                      )}
                                  />
                              }
                          })
                      }/>
            </div>
        )
    }
}

export default Options