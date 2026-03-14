export const generateOutput = (html, css, js) => {
    // We add a hidden timestamp comment so the string is always unique
    const nonce = ``;

    return `
    <html>
      <head>
        ${nonce}
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>
          const originalLog = console.log;
          console.log = (...args) => {
            window.parent.postMessage({ type: 'CONSOLE_LOG', payload: args }, '*');
            originalLog(...args);
          };
          
          try {
            ${js}
          } catch (err) {
            console.log("Error: " + err.message);
          }
        </script>
      </body>
    </html>
  `;
};