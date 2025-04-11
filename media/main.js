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
        jsonTheme.textContent =
          //JSON.stringify(message.json) +
          //JSON.stringify(message.colors) +
          "<br/><hr/> ****************" + JSON.stringify(message.colormaps);

        // Clear existing color inputs
        colors.innerHTML = "";

        // Generate input type color for each color in the array
        message.colors.forEach((color) => {
          const containerDiv = document.createElement("div");
          containerDiv.className = "container-div";
          const colorDiv = document.createElement("div");
          colorDiv.className = "color-div";

          const colorInput = document.createElement("input");
          colorInput.type = "color";
          colorInput.value = color;

          colorDiv.appendChild(colorInput);
          containerDiv.appendChild(colorDiv);
          colors.appendChild(containerDiv);
        });

        break;
    }
  });
})();
