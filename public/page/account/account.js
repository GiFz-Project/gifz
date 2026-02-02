document.addEventListener("pagechange", e => {
    console.log(e.detail.page);
    if (e.detail.page !== "account") return;

    initAccountPage();
});

function initAccountPageContext() {
    if (window.registeredResourcePageContext) return;

    ContextMenu.registerClickEvent(
        "view",
        [
            "#",
        ],
        async (data) => {

        }
    )

    window.registeredResourcePageContext = true;
}

function initAccountPage() {
    populateAccountPanels();
}

async function populateAccountPanels() {
    let panelContainer = getAccountContentElement().querySelector(".account-panels");
    let account = await User.Auth.getAccount();
    if(!account) return console.warn("You are not logged in");

    panelContainer.innerHTML = getPanelHTML("Upload Limit", `${account.upload_limit} MB`);
    panelContainer.innerHTML += getPanelHTML("Search Rate Limit", "50 req/min");
    panelContainer.innerHTML += getPanelHTML("File Access Rate Limit", "200 req/min");
    panelContainer.innerHTML += getPanelHTML("Upload Rate Limit", "50 req/min");

    function getPanelHTML(name, value) {
        return `   
           <div class="panel">
                <h2>${name}</h2>
                <p>${value}</p>
            </div>`
    }
}