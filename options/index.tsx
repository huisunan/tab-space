import React from "react";

import {Button, Input, List, Modal, Tabs} from "antd"

interface State {
    tabs: chrome.tabs.Tab[]
    workSpaces: WorkSpace[]
    addModal?: boolean
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
        this.refreshTabs()
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


    async moveTabWindow(predicate: (tab: chrome.tabs.Tab) => boolean) {

        //获取临时窗口
        let location = window.location;
        chrome.runtime.sendMessage({
            action: "getTempWindowId",
            url: location + "?temp=true"
        }).then(tempWindowId => {
            //当前窗口id
            let index = 1
            chrome.windows.getCurrent().then(currentWindow => {
                //遍历所有tab
                this.state.tabs.filter(i => !i.url?.startsWith(location.origin)).forEach(tab => {
                    const move = predicate(tab);
                    chrome.tabs.move(tab.id, {
                        index: index++,
                        windowId: move ? currentWindow.id : tempWindowId
                    })
                })
            })
        })


    }

    render() {

        return (
            <div>
                <Button type="primary" onClick={() => this.unNameClick()}>未命名空间</Button>
                <Button type="primary" onClick={() => this.setState({addModal: true})}>新增</Button>
                <Modal title="新增工作空间" open={this.state.addModal}>
                </Modal>
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