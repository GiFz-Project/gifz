document.addEventListener("pagechange", e => {
    console.log(e.detail.page);
    if (e.detail.page !== "resources") return;

    initResourceList();
});

async function getResources(timestamp = null){
    let response = await fetch(`/resources/list${timestamp ? `/${timestamp}` : ""}`);
    if(response.status === 200){
        let json = await response.json();
        return json.resources;
    }
    else{
        console.log(response);
        return null
    }
}

async function initResourceList(){
    let resources = await getResources();
    console.log(resources)
    if(resources) renderResourceRow(resources);
}

function renderResourceRow(resources){
    if (!resources || !resources.length) return;

    let html = `
        <div>
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
            <tr>
                <td>${truncateString(resource.fileHash, 10)}</td>
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
        </div>
    `;

    getAccountContentElement().innerHTML += html;
}

