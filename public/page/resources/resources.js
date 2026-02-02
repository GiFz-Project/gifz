document.addEventListener("pagechange", e => {
    console.log(e.detail.page);
    if (e.detail.page !== "resources") return;

    initResourceList();
});

function registerResourcePageContext(){
    if(window.registeredResourcePageContext) return;

    ContextMenu.registerClickEvent(
        "view resource row in page",
        [
            "#accountPopup .content #resourcePageTable tr",
        ],
        async (data) => {
            let hash = findAttributeUp(data.element, "data-hash", 3);
            console.log(data.element)

            if (!hash) return console.error("Couldnt show gif because hash wasnt found")
            viewGIF(hash);
        }
    )

    window.registeredResourcePageContext = true;
}

function initResourceSearchHandler(){
    if(window.didInitPageResourceSearch) return;

    let searchTimeout = null;
    getResourcePageSearchElement().addEventListener('input', function(){
        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(async () => {
            let search = getResourcePageSearchElement()?.value?.trim();
            if(search) await initResourceList(await API.RESOURCES.Search(search));
        }, 500)
    })

    window.didInitPageResourceSearch = true;
}

function getResourcePageSearchElement(){
    return getAccountContentElement().querySelector("#resource-search");
}

async function initResourceList(data = null){
    initResourceSearchHandler();
    registerResourcePageContext();

    let response = await API.RESOURCES.List();
    let resources = data?.resource || response.resources;
    console.log(resources, data);
    if(resources) renderResourceRow(resources);
}

function renderResourceRow(resources){
    if (!resources || !resources.length) return;

    let html = `
            <table class="sql-table">
                <thead>
                    <tr>
                        <th>File Hash</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Host</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
    `;

    for (let resource of resources) {
        html += `
            <tr data-hash="${resource.fileHash}">
                <td>${truncateString(resource.fileHash, 20)}</td>
                <td>${resource.type}</td>
                <td>${resource.status}</td>
                <td>${resource.host ?? "-"}</td>
                <td>&times;</td>
            </tr>
        `;
    }

    html += `
                </tbody>
            </table>
    `;

    getAccountContentElement().querySelector("#resourcePageTable").innerHTML = html;
}

