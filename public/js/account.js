function showAccountPopup(){


    getAccountPopupElement().innerHTML =
        `
        <div class="account-layout">
            <div class="nav">${getAccountNavHTML()}</div>
        
        </div>
        `

    getAccountPopupElement().style.display = "flex";
    requestAnimationFrame(function(){
        getAccountPopupElement().style.opacity = "1"
    })
}

function getAccountNavHTML(){
    return `
        <details open>
            <summary>Overview</summary>
            <ul>
                <a href="#">
                    <li>
                        Niggerlicious
                    </li>
                </a>
            </ul>
        </details>
    `
}

function hideAccountPopup(){
    getAccountPopupElement().style.opacity = 0;
    setTimeout(() => {
        getAccountPopupElement().style.display = "none"
    },200);
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