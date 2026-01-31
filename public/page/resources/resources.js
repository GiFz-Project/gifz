document.addEventListener("pagechange", e => {
    console.log(e.detail.page);
    if (e.detail.page !== "banlist") return;

    initResourceList();
});

async function initResourceList(){

}

function renderResourceRow(resource){
    if (!resource) return "";

    return `
        <table class="sql-table">
            <tbody>
                <tr>
                    <td>Row ID</td>
                    <td>${resource.rowId}</td>
                </tr>
                <tr>
                    <td>File Hash</td>
                    <td>${resource.fileHash}</td>
                </tr>
                <tr>
                    <td>Type</td>
                    <td>${resource.type}</td>
                </tr>
                <tr>
                    <td>Status</td>
                    <td>${resource.status}</td>
                </tr>
                <tr>
                    <td>Views</td>
                    <td>${resource.views}</td>
                </tr>
                <tr>
                    <td>Tags</td>
                    <td>${resource.tags}</td>
                </tr>
                <tr>
                    <td>Blocked</td>
                    <td>${resource.isBlocked ? "Yes" : "No"}</td>
                </tr>
                <tr>
                    <td>NSFW</td>
                    <td>${resource.isNSFW ? "Yes" : "No"}</td>
                </tr>
                <tr>
                    <td>Sensitive</td>
                    <td>${resource.isSensitive ? "Yes" : "No"}</td>
                </tr>
                <tr>
                    <td>Account ID</td>
                    <td>${resource.accountId ?? "Guest"}</td>
                </tr>
                <tr>
                    <td>Host</td>
                    <td>${resource.host ?? "-"}</td>
                </tr>
                <tr>
                    <td>Created</td>
                    <td>${new Date(resource.created).toLocaleString()}</td>
                </tr>
            </tbody>
        </table>
    `;
}
