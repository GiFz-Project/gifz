class InputHint {
    static _cssInjected = false;

    static _injectCSS() {
        if (this._cssInjected) return;
        this._cssInjected = true;

        const style = document.createElement("style");
        style.textContent = `
            .ih-highlight {
                border-width: 1px !important;
                border-style: solid !important;
            }
            .ih-error { border-color: #e74c3c !important; }
            .ih-warn  { border-color: #f39c12 !important; }
            .ih-info  { border-color: #3498db !important; }
            .ih-success  { border-color: #45ba0f !important; }

            .ih-hint {
                font-size: 12px;
                margin-top: 4px;
                display: none;
            }
            .ih-error   + .ih-hint { color: #e74c3c; }
            .ih-warn    + .ih-hint { color: #f39c12; }
            .ih-info    + .ih-hint { color: #3498db; }
            .ih-success + .ih-hint { color: #45ba0f; }
        `;
        document.head.appendChild(style);
    }

    static highlight(el, type, text = "") {
        this._injectCSS();

        this.clear(el);

        el.classList.add("ih-highlight", `ih-${type}`);

        let hint = el.nextElementSibling;
        if (!hint || !hint.classList.contains("ih-hint")) {
            hint = document.createElement("div");
            hint.className = "ih-hint";
            el.after(hint);
        }

        hint.textContent = text;
        hint.style.display = text ? "block" : "none";
    }

    static clear(el) {
        if (!el || !el.classList)  return;
        el.classList.remove("ih-highlight", "ih-error", "ih-warn", "ih-info", "ih-success");

        const hint = el?.nextElementSibling;
        if (hint && hint.classList.contains("ih-hint")) {
            hint.textContent = "";
            hint.style.display = "none";
        }
    }
}
