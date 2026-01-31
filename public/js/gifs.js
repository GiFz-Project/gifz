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
                return requestAnimationFrame(() => {uploadGIF("No file selected")});
            }

            const tags = [...document.querySelectorAll(".tag-bubble")]
                .map(e => e.dataset.tag);

            if (!tags || tags.length === 0) {
                customPrompt.closePrompt();
                return requestAnimationFrame(() => {uploadGIF("No tags selected!")});
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

            if(response?.ok && response?.path){
                // navigate to it?
                showSystemMessage({
                    title: "Successfully uploaded!",
                    type: "success",
                })
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
        if(tagContainer.querySelectorAll(".tag-bubble").length >= Number("{{max_tags}}")) return;

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

async function diplayTrendingGIFs(timestamp = null, limit = null) {
    let gifResponse = await API.GIFS.getPopularGIFs(timestamp, limit);
    let gifs = gifResponse?.gifs;
    if(gifs?.length === 0) return;

    getContentContainer().innerHTML = `
        <h2>Popular GIFs</h2>
        <div class='trending-gifs-container'></div>`;

    let trendingContainer = getContentContainer().querySelector(".trending-gifs-container");

    for(let gif of gifs) {
        console.log(gif)
        trendingContainer.insertAdjacentHTML("beforeend", getGifEntryHTML(gif));
    }

    function getGifEntryHTML(gifObj){
        return `
        <img class="gif-entry" draggable="false" src="/upload/${gifObj.fileHash}_preview"></img>
        `
    }
}