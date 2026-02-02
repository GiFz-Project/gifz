document.addEventListener("DOMContentLoaded", function(e) {
    let searchTimeout = null;
    getSearchInput().addEventListener('input', function(){
        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(async () => {
            let search = getSearchInput()?.value?.trim();
            let tags = search?.length === 0 ? null : search.split(',');

            if(tags) searchByTag(tags)
            if(!tags) displayTrendingGIFs();
        }, 500)
    })
})

function registerGifContext(){
    ContextMenu.registerClickEvent(
        "gif-viewer",
        [
            ".layout .content .gif-entry-wrapper",
            ".layout .content .gif-entry-wrapper span",
        ],
        async (data) => {
            let hash = findAttributeUp(data.element, "data-hash", 3);
            console.log(data.element)
            if (!hash) return console.error("Couldnt show gif because hash wasnt found")
            viewGIF(hash);
        }
    )

    ContextMenu.registerClickEvent(
        "tagSearch",
        [
            ".tag",
        ],
        async (data) => {
            let tag = data.element.innerText;
            if(tag) {
                searchByTag([tag])
            }
        }
    )
}

async function searchByTag(tag){
    if(!tag) return console.warn("No tags supplied in search")
    let searchResult = await API.GIFS.searchPopularGIFs(tag);
    displayTrendingGIFs(searchResult.gifs)
    getSearchInput().value = tag
}

async function uploadGIF(error = null) {
    customPrompt.showPrompt(
        "Upload GIF",
        `

        ${error ? `<span id="error">${error}</span>` : ''}

        <div id="gif-drop">
            Drag & Drop GIF here or click
            <input id="gif-input" type="file" accept="image/gif">
        </div>

        <img id="gif-preview">

        <div id="tag-container"></div>
        <input id="tag-input" type="text" placeholder="type tag and press enter">
        <label id="tag-length-info"></label>
        `,
        async () => {
            const input = document.getElementById("gif-input");
            const file = input.files[0];

            if (!file) {
                customPrompt.closePrompt();
                return requestAnimationFrame(() => {
                    uploadGIF("No file selected")
                });
            }

            const tags = [...document.querySelectorAll(".tag-bubble")]
                .map(e => e.dataset.tag);

            if (!tags || tags.length === 0) {
                customPrompt.closePrompt();
                return requestAnimationFrame(() => {
                    uploadGIF("No tags selected!")
                });
            }

            // now we gonna do some visual shit for showing upload progress
            let gifDrop = document.getElementById("gif-drop");
            await PageRenderer.renderHTML(gifDrop,
                `<h1>Uploading file..</h1>
                       <div id="upload-loader" style="width: 100%;"></div>
            `)


            let progressElement = document.getElementById("upload-loader");
            ElementLoader.start(progressElement)

            let response = await FileManager.uploadFile(file, {
                onProgress: async (percent) => {
                    ElementLoader.setValue(progressElement, percent);
                },
                params: {
                    tags: tags.join(",")
                }
            });

            if (response?.ok && response?.path) {
                // navigate to it?
                if (response?.exists) {
                    showSystemMessage({
                        title: "Already exists!",
                        type: "error",
                    })
                } else {
                    showSystemMessage({
                        title: "Successfully uploaded!",
                        type: "success",
                    })
                }
            }
            console.log(response)
        },
        ["Upload!", "success"],
        null
    );

    const drop = document.getElementById("gif-drop");
    const input = document.getElementById("gif-input");
    const preview = document.getElementById("gif-preview");

    const tagInput = document.getElementById("tag-input");
    const tagContainer = document.getElementById("tag-container");

    drop.onclick = e => {
        if (e.target === input) return;
        input.click();
    };

    drop.ondragover = e => e.preventDefault();

    drop.ondrop = e => {
        e.preventDefault();

        const file = e.dataTransfer.files[0];
        if (!file) return;

        input.files = e.dataTransfer.files;

        const reader = new FileReader();
        reader.onload = () => preview.src = reader.result;
        reader.readAsDataURL(file);
    };

    input.onchange = () => {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => preview.src = reader.result;
        reader.readAsDataURL(file);

        tagInput.focus()
    };


    tagInput.addEventListener("keydown", e => {
        if (e.key !== "Enter") return;
        e.preventDefault();

        const value = tagInput.value.trim();
        if (!value) return;

        // if we used all tags dont add them to the ui
        if (tagContainer.querySelectorAll(".tag-bubble").length >= Number("{{max_tags}}")) return;

        // update hint
        document.getElementById("tag-length-info").innerText =
            `${tagContainer.querySelectorAll(".tag-bubble").length + 1} / ${Number("{{max_tags}}")} tags used`;

        // duplicates
        if (tagContainer.querySelector(`[data-tag="${value}"]`)) {
            tagInput.value = "";
            return;
        }

        const el = document.createElement("span");
        el.className = "tag-bubble";
        el.dataset.tag = value;
        el.textContent = value;

        el.onclick = () => el.remove();

        tagContainer.appendChild(el);
        tagInput.value = "";
    });
}

async function displayNewGIFs(){
    let newGifResponse = await API.GIFS.getNewGIFs();
    if(!newGifResponse?.gifs) throw new Error("No GIFs found");
    displayTrendingGIFs(newGifResponse.gifs, "New GIFs");
}

async function displayTrendingGIFs(suppliedGifs = null, headline = "Popular GIFs", timestamp = null, limit = null) {
    let gifResponse = suppliedGifs ? null : await API.GIFS.getPopularGIFs(timestamp, limit);
    let gifs = suppliedGifs || gifResponse?.gifs;
    if (gifs?.length === 0) return console.warn("Gifs length was 0");

    getContentContainer().innerHTML = `
        <h2>${headline}</h2>
        <div class='trending-gifs-container'></div>`;

    let trendingContainer = getContentContainer().querySelector(".trending-gifs-container");

    for (let gif of gifs) {
        trendingContainer.insertAdjacentHTML("beforeend", getGifEntryHTML(gif));
    }

    function getGifEntryHTML(gifObj) {

        return `
            <div class="gif-entry-wrapper" data-hash="${gifObj.fileHash}">
                ${gifObj.isNSFW ? `<span class="notice ${gifObj.isNSFW ? `nsfw` : ""}">NSFW</span>` : ""}
                ${gifObj.isSensitive && !gifObj.isNSFW ? `<span class="notice ${gifObj.isSensitive ? `sensitive` : ""}">Sensitive</span>` : ""}
                
                <img data-hash="${gifObj.fileHash}" 
                    class="gif-entry ${gifObj.isNSFW ? `nsfw` : ""} ${gifObj.isSensitive ? `sensitive` : ""}" 
                    draggable="false" src="/upload/${gifObj.fileHash}_preview">
            </div>
        `
    }
}

async function viewGIF(hash) {
    if(!hash) throw new Error("hash is missing");

    let gif = await API.RESOURCES.Get(hash);
    console.log(gif)

    let uploaderId = Number(gif.accountId);

    let isAnonymous = uploaderId === 0
    let isAdmin = (await API.ACCOUNT.PERMISSION.check("*")).check;
    let isNSFW = gif?.isNSFW === 1;
    let isSensitive = gif?.isSensitive === 1;
    let isBlocked = gif?.isBlocked === 1;

    customPrompt.showPrompt(
        "View GIF",
        `
            <div class="gif-view-container">
                <div class="gif-view">
                    <img data-hash="${hash}" src="${await API.RESOURCES.GetUploadURL(`${hash}_medium`)}"></img>
                </div>          
                
                <div class="gif-info-container">                        
                    <div>
                        <span class="media_variants_hint">Copy Link</span>            
                        <div class="media_variants">
                            <button class="original" onclick="changeGifPreviewFromViewer(this)">Original</button>
                            <button class="medium" onclick="changeGifPreviewFromViewer(this)">Medium</button>
                            <button class="preview" onclick="changeGifPreviewFromViewer(this)">Preview</button>
                        </div>
                    </div>
                
                    <div class="uploader">
                        <p>Uploaded by: ${isAnonymous ? "Guest" : "User"}</p>
                        ${
                            gif?.ip ? `<span>${gif.ip}</span>` : ""
                        }
                        ${
                            gif?.country_code ? `<span>${gif.country_code}</span>` : ""
                        }
                    </div>
                    
                    <div>
                        <p style="margin-bottom: 2px;">Tags:</p>
                        <div class="tags">                        
                            ${gif.tags
                                    .split(",")
                                    .map(tag => `<span class="tag">${tag}</span>`)
                                    .join("")
                                }
                        </div>
                    </div>
                    
                    <div class="flags">
                        ${gif?.isNSFW ? `<span class="nsfw">NSFW</span>` : ""}
                        ${gif?.isSensitive ? `<span class="sensitive">Sensitive</span>` : ""}
                        ${gif?.isBlocked ? `<span class="blocked">Blocked</span>` : ""}
                    </div>
                    
                    
                    ${isAdmin === true ? `
                        <div class="admin-actions">
                            <details open id="admin-controls">     
                                <summary>Admin</summary>
                                    <div class="quick-actions-buttons">
                                        <button class="nsfw" onclick="viewGIF.setNSFW(${!isNSFW})">${isNSFW ? "Unmark" : "Mark"} as NSFW</button>
                                        <button class="sensitive" onclick="viewGIF.setSensitive(${!isSensitive})">${isSensitive ? "Unmark" : "Mark"} as Sensitive</button>
                                        <button class="blocked" onclick="viewGIF.setBlocked(${!isBlocked})">${isBlocked ? "Unblock" : "Block"} this resource</button>
                                        <button onclick="viewGIF.deleteResource('${hash}')">Delete from storage</button>
                                    </div>
                                    
                                
                                    <div class="tag-editor">
                                        <label>Edit Tags</label>
                                        <div id="tag-container" style="width: 100%;"></div>
                                        <input id="tag-input" type="text" placeholder="type tag and press enter">
                                        <label id="tag-length-info"></label><br>
                                        <button id="saveTags">Save tags</button>
                                    </div>
                            </details>
                        </div>`
                    : ""}
                </div>      
            
            </div>
        `,
        null,
            ["Close", "normal"]
        )

    // used for tags
    if (isAdmin) {
        const tagInput = customPrompt.modal.querySelector("#tag-input");
        const tagContainer = customPrompt.modal.querySelector("#tag-container");
        const tagInfo = customPrompt.modal.querySelector("#tag-length-info");
        const saveTags = customPrompt.modal.querySelector("#saveTags");

        gif.tags.split(",").forEach(t => addTagBubble(t));
        saveTags.onclick = () => {
            updateTagsOnServer();
        }

        tagInput.addEventListener("keydown", e => {
            if (e.key !== "Enter") return;
            e.preventDefault();

            const value = tagInput.value.trim();
            if (!value) return;
            if (tagContainer.querySelector(`[data-tag="${value}"]`)) {
                tagInput.value = "";
                return;
            }

            addTagBubble(value);
            tagInput.value = "";
            updateTagInfo();
        });

        function addTagBubble(tag) {
            const el = document.createElement("span");
            el.className = "tag-bubble";
            el.dataset.tag = tag;
            el.textContent = tag;
            el.onclick = () => {
                el.remove();
            };
            tagContainer.appendChild(el);
            updateTagInfo();
        }

        async function updateTagsOnServer() {
            const tags = [...tagContainer.querySelectorAll(".tag-bubble")]
                .map(e => e.dataset.tag)
                .join(",");

            await API.RESOURCES.Update(hash, "tags", tags);
            refreshView()
        }

        function updateTagInfo() {
            tagInfo.innerText =
                `${tagContainer.querySelectorAll(".tag-bubble").length} tags`;
        }
    }


    viewGIF.setNSFW = async function(bool){
        if(typeof bool !== "boolean") throw new Error("Boolean must be supplied");

        await API.RESOURCES.Update(hash, "isNSFW", Number(bool));
        await refreshView();
    }
    viewGIF.setSensitive = async function(bool){
        if(typeof bool !== "boolean") throw new Error("Boolean must be supplied");

        await API.RESOURCES.Update(hash, "isSensitive", Number(bool));
        await refreshView();
    }
    viewGIF.setBlocked = async function(bool){
        if(typeof bool !== "boolean") throw new Error("Boolean must be supplied");

        await API.RESOURCES.Update(hash, "isBlocked", Number(bool));
        await refreshView();
    }
    viewGIF.deleteResource = async function(hash){
        if(!hash) throw new Error("Hash must be supplied");

        let decision = confirm("Are you sure you want to delete this resource?");
        if(decision){
            await API.RESOURCES.Delete(hash);
            customPrompt.closePrompt();
            displayTrendingGIFs();
        }
    }

    async function refreshView(){
        await viewGIF(hash);
    }
}

function changeGifPreviewFromViewer(element){
    let gifViewContainer = element.closest(".gif-view-container")
    if(!gifViewContainer) return console.error("Didnt find parent container");

    let imagePreview = gifViewContainer.querySelector(".gif-view img")
    if(!imagePreview) return console.error("Didnt find image");

    let hash = findAttributeUp(imagePreview, "data-hash", 3);
    if(!hash) return console.error("Didnt find hash");

    imagePreview.src = getGifMediaVariantUrl(hash, element.classList[0]);

    try{
        navigator.clipboard.writeText(window.location.origin + getGifMediaVariantUrl(hash, element.classList[0]));
        showSystemMessage({
            title: "Link saved to clipboard!",
            text: `Using ${element.classList[0]} quality`,
            type: "success"
        })
    }
    catch(err){
        showSystemMessage({
            title: "Couldnt copy url :/",
        })
    }
}

function getGifMediaVariantUrl(hash, variant){
    if(!hash) throw new Error("hash is missing");

    if(variant === "medium") return `/upload/${hash}_medium`;
    if(variant === "preview") return `/upload/${hash}_preview`;
    if(variant === "original") return `/upload/${hash}`;
}