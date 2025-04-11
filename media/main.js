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

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case "themeChanged":
        themeName.textContent = message.theme;
        //jsonTheme.textContent = JSON.stringify(message.json);

        // Clear existing color inputs
        colors.innerHTML = "";

        // Generate accordion for each color
        message.colors.forEach((color) => {
          const accordion = document.createElement("div");
          accordion.className = "accordion";

          // Accordion header
          const header = document.createElement("div");
          header.className = "accordion-header";
          const colorPreview = document.createElement("span");
          colorPreview.className = "color-preview";
          colorPreview.style.backgroundColor = color;
          const headerText = document.createElement("span");
          headerText.textContent = color;
          header.appendChild(colorPreview);
          header.appendChild(headerText);
          accordion.appendChild(header);

          // Accordion content
          const content = document.createElement("div");
          content.className = "accordion-content";

          // Add keys from colorsMap
          if (message.colormaps.colorsMap[color]) {
            const ul = document.createElement("ul");
            message.colormaps.colorsMap[color].forEach((key) => {
              const li = document.createElement("li");
              li.textContent = key;
              ul.appendChild(li);
            });
            ul.style.marginBottom = "10px";
            content.appendChild(ul);
          }

          // Add keys from tokenColorsMap
          if (message.colormaps.tokenColorsMap[color]) {
            const ul = document.createElement("ul");
            message.colormaps.tokenColorsMap[color].scope.forEach((key) => {
              const li = document.createElement("li");
              li.textContent = key;
              ul.appendChild(li);
            });
            ul.style.marginBottom = "10px";
            content.appendChild(ul);
          }

          // Add keys from syntaxMap
          if (message.colormaps.syntaxMap[color]) {
            const ul = document.createElement("ul");
            message.colormaps.syntaxMap[color].forEach((key) => {
              const li = document.createElement("li");
              li.textContent = key;
              ul.appendChild(li);
            });
            ul.style.marginBottom = "10px";
            content.appendChild(ul);
          }

          accordion.appendChild(content);
          colors.appendChild(accordion);

          // Toggle accordion content visibility
          header.addEventListener("click", () => {
            content.classList.toggle("active");
          });
        });

        break;
    }
  });
})();
