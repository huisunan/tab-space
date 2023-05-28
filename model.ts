interface WorkSpace {
    name: string
    items: WorkSpaceItem[]
}

interface WorkSpaceItem {
    name: string
    domain: string
    active?: boolean
    tabIds?: []

}