// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
  const vscode = acquireVsCodeApi();

  const oldState = /** @type {{ count: number} | undefined} */ (
    vscode.getState()
  );

  // const counter = /** @type {HTMLElement} */ (
  //   document.getElementById("lines-of-code-counter")
  // );
  const themeName = /** @type {HTMLElement} */ (
    document.getElementById("theme-name")
  );
  const jsonTheme = /** @type {HTMLElement} */ (
    document.getElementById("theme-json")
  );
  const colors = /** @type {HTMLElement} */ (document.getElementById("colors"));

  console.log("Initial state", oldState);

  // let currentCount = (oldState && oldState.count) || 0;
  // counter.textContent = `${currentCount}`;

  // setInterval(() => {
  //     counter.textContent = `${currentCount++} `;

  //     // Update state
  //     vscode.setState({ count: currentCount });

  //     // Alert the extension when the cat introduces a bug
  //     if (Math.random() < Math.min(0.001 * currentCount, 0.05)) {
  //         // Send a message back to the extension
  //         vscode.postMessage({
  //             command: 'alert',
  //             text: '🐛  on line ' + currentCount
  //         });
  //     }
  // }, 100);

  const createTokenColorsContainer = (titleText, linkHref) => {
    const container = document.createElement("div");
    container.className = "type-container";

    const title = document.createElement("h4");
    title.textContent = titleText;

    const link = document.createElement("a");
    link.href = linkHref;
    link.textContent = "More Info";

    container.appendChild(title);
    container.appendChild(link);

    return container;
  };
  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case "themeChanged":
        themeName.textContent = message.theme;
        //jsonTheme.textContent = JSON.stringify(message.json);

        // Clear existing color inputs
        colors.innerHTML = "";

        message.colors.forEach((color) => {
          const accordion = document.createElement("div");
          accordion.className = "accordion";

          const header = document.createElement("div");
          header.className = "accordion-header";

          const colorPreview = document.createElement("span");
          colorPreview.className = "color-preview";
          colorPreview.style.backgroundColor = color;

          const colorInfo = document.createElement("div");

          const colorText = document.createElement("span");
          colorText.textContent = color;

          const badge = document.createElement("span");
          badge.className = "badge";
          const badgeCount =
            (message.colormaps.colorsMap[color]
              ? message.colormaps.colorsMap[color].length
              : 0) +
            (message.colormaps.tokenColorsMap[color]
              ? message.colormaps.tokenColorsMap[color].scope.length
              : 0) +
            (message.colormaps.syntaxMap[color]
              ? message.colormaps.syntaxMap[color].length
              : 0);
          badge.textContent = badgeCount;

          colorInfo.appendChild(colorText);
          colorInfo.appendChild(badge);

          header.appendChild(colorPreview);
          header.appendChild(colorInfo);

          const content = document.createElement("div");
          content.className = "accordion-content";

          if (message.colormaps.colorsMap[color]) {
            const ul = document.createElement("ul");
            message.colormaps.colorsMap[color].forEach((key) => {
              const li = document.createElement("li");
              li.textContent = key;
              ul.appendChild(li);
            });
            const container = createTokenColorsContainer(
              "Colors",
              "https://code.visualstudio.com/api/references/theme-color"
            );
            content.appendChild(container);
            content.appendChild(ul);
          }

          if (message.colormaps.tokenColorsMap[color]) {
            const ul = document.createElement("ul");
            message.colormaps.tokenColorsMap[color].scope.forEach((key) => {
              const li = document.createElement("li");
              li.textContent = key;
              ul.appendChild(li);
            });

            const container = createTokenColorsContainer(
              "Token Colors",
              "https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide"
            );
            content.appendChild(container);
            content.appendChild(ul);
          }

          if (message.colormaps.syntaxMap[color]) {
            const ul = document.createElement("ul");
            message.colormaps.syntaxMap[color].forEach((key) => {
              const li = document.createElement("li");
              li.textContent = key;
              ul.appendChild(li);
            });
            const container = createTokenColorsContainer(
              "Syntax Colors",
              "https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide"
            );

            content.appendChild(container);
            content.appendChild(ul);
          }

          accordion.appendChild(header);
          accordion.appendChild(content);
          colors.appendChild(accordion);
        });

        // Add event listeners for accordion toggle
        document.querySelectorAll(".accordion-header").forEach((header) => {
          header.addEventListener("click", () => {
            const content = header.nextElementSibling;
            content.classList.toggle("active");
          });
        });

        break;
    }
  });
})();
