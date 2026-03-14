export const generateOutput = (html, css, js) => {
    return `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>
          // Overriding console.log to send messages back to the IDE
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