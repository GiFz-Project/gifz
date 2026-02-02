function registerAccountContext(){
    ContextMenu.registerClickEvent(
        "account-nav-loader",
        [
            "#accountPopup .nav details button",
        ],
        async (data) => {
            let page = data.element.getAttribute("data-view");
            if(page) loadPageContent(page, getAccountContentElement())
        }
    )

    ContextMenu.registerClickEvent(
        "account popup closer",
        [
            "#accountPopup",
        ],
        async (data) => {
            if(getAccountLayoutElement().contains(data.element)) return;
            hideAccountPopup()
        }
    )
}

async function showAccountPopup(page = "account"){
    getAccountPopupElement().innerHTML =
        `
        <div class="account-layout">
            <div class="nav">${getAccountNavHTML()}</div>        
            <div class="content"></div>
        </div>
        `

    if(page){
        await loadPageContent(page, getAccountContentElement());
    }

    getAccountPopupElement().style.display = "flex";
    getAccountLayoutElement().style.display = "flex"

    requestAnimationFrame(function(){
        getAccountPopupElement().classList.add("open");
        getAccountLayoutElement().classList.add("open");
    })
}

function getAccountNavHTML(){
    return `
        <details open>
            <summary>Overview</summary>
            <ul>
                <li><button type="button" data-view="account">My Account</button></li>
            </ul>
        </details>
        
        <details open>
            <summary>General</summary>
            <ul>
                <li><button type="button" data-view="resources">Media Resources</button></li>
                <li><button type="button" data-view="users">User Accounts</button></li>
                <li><button type="button" data-view="stats">Stats</button></li>
            </ul>
        </details>
        
        <details open>
            <summary>Network</summary>
            <ul>
                <li><button type="button" data-view="dsync-events">Node Events</button></li>
                <li><button type="button" data-view="dsync-servers">Servers</button></li>
            </ul>
        </details>

        <details open>
            <summary>Server Settings</summary>
            <ul>
                <li><button type="button" data-view="storage">Storage</button></li>
                <li><button type="button" data-view="gif-search">GIF Search</button></li>
                <li><button type="button" data-view="gif-uploads">GIF Uploads</button></li>
                <li><button type="button" data-view="gif-access">GIF Access</button></li>
            </ul>
        </details>
    `;
}


function hideAccountPopup(){
    getAccountPopupElement().classList.remove("open");
    getAccountLayoutElement().classList.remove("open");

    setTimeout(() => {
        getAccountPopupElement().style.display = "none";
        getAccountLayoutElement().style.display = "none";
    }, 200);
}

function getAccountLayoutElement(){
    return getAccountPopupElement().querySelector(".account-layout")
}

function getAccountContentElement(){
    return getAccountPopupElement().querySelector(".account-layout .content")
}


function getAccountPopupElement(){
    let accountPopup = document.getElementById("accountPopup");
    if(!accountPopup) {
        accountPopup = document.createElement("div")
        accountPopup.id = "accountPopup";
        document.body.appendChild(accountPopup);
    }

    return accountPopup;
}

let currentpage;
const pageJsPromises = {};

async function loadPageContent(page = "account", container) {
    //if (currentpage === page) return;
    currentpage = page;

    const content = container;
    const cacheBust = Date.now();

    content.style.transition = "opacity 150ms ease";
    content.style.opacity = "0";
    await new Promise(r => setTimeout(r, 160));

    content.innerHTML = "";
    document.querySelectorAll("link[data-page]").forEach(l => l.remove());

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = `/page/${page}/${page}.css?v=${cacheBust}`;
    css.dataset.page = page;

    await new Promise(res => {
        css.onload = res;
        document.head.appendChild(css);
    });

    const html = await fetch(`/page/${page}/${page}.html?v=${cacheBust}`).then(r => r.text());
    content.innerHTML = html;

    if (!pageJsPromises[page]) {
        pageJsPromises[page] = new Promise(res => {
            const js = document.createElement("script");
            js.src = `/page/${page}/${page}.js`;
            js.onload = res;
            document.body.appendChild(js);
        });
    }

    await pageJsPromises[page];

    document.dispatchEvent(
        new CustomEvent("pagechange", { detail: { page } })
    );

    requestAnimationFrame(() => {
        content.style.opacity = "1";
    });
}