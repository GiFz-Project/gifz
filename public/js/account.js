function showAccountPopup(){
    getAccountPopupElement().innerHTML =
        `
        <div class="account-layout">
            <div class="nav">${getAccountNavHTML()}</div>
        
            <div class="content">
            
            </div>
        </div>
        `

    getAccountPopupElement().style.display = "flex";
    getAccountContentElement().style.display = "flex"

    requestAnimationFrame(function(){
        getAccountPopupElement().classList.add("open");
        getAccountContentElement().classList.add("open");
    })
}

function getAccountNavHTML(){
    return `
        <details open>
            <summary>Overview</summary>
            <ul class="nav-list">
                <li><button type="button" data-view="account">My Account</button></li>
            </ul>
        </details>

        <details open>
            <summary>Server Settings</summary>
            <ul class="nav-list">
                <li><button type="button" data-view="storage">Storage</button></li>
                <li><button type="button" data-view="gif-search">GIF Search</button></li>
                <li><button type="button" data-view="gif-uploads">GIF Uploads</button></li>
                <li><button type="button" data-view="resource-access">Resource Access</button></li>
            </ul>
        </details>
    `;
}


function hideAccountPopup(){
    getAccountPopupElement().classList.remove("open");
    getAccountContentElement().classList.remove("open");

    setTimeout(() => {
        getAccountPopupElement().style.display = "none";
        getAccountContentElement().style.display = "none";
    }, 200);
}

function getAccountContentElement(){
    return getAccountPopupElement().querySelector(".account-layout")
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