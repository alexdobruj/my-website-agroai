const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="shortcut icon" class="favicon-tab" type="image/png" href="/favicon.ico" />
        <style>
          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            -webkit-font-smoothing: antialiased;
          }
          #dora-root {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
          }
        </style>
        <style>
          #loading {
            position: fixed;
            width: 100%;
            height: 100%;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            display: flex;
            justify-content: center;
            align-content: center;
            flex-wrap: wrap;
          }
          #loading img {
            width: 58px;
            height: 58px;
          }
        </style>
        <script>
          window.__ENV = {"RELEASE_VERSION":"e65471df","BUILD_COMMIT_SHA":"e65471df80d76b3ceaaf6dbea52532fafe1a43ad","TARGET":"online"};
          window.__ASSET_PREFIX = 'https://cdn-static-e.dora.run/dora_runner_web';
        </script>
        <script src="https://cdn-static-e.dora.run/dora_runner_web/threed_renderer.e578ddea/build/runner.js"></script>
        <script type="module" crossorigin src="https://cdn-static-e.dora.run/dora_runner_web/public/previewer.3d926f51.js"></script>
        <link rel="stylesheet" crossorigin href="https://cdn-static-e.dora.run/dora_runner_web/public/previewer.d2c4671b.css" />
      </head>
      <body>
        <div id="loading"></div>
        <div id="dora-root"></div>
        <script>
          var loading = document.getElementById('loading');
          if (loading) {
            loading.style.display = 'flex';
            loading.style.zIndex = 100;
            var url = window.__ASSET_PREFIX + '/public/loading.6330c237.gif';
            loading.innerHTML = '<picture><img src="' + url + '" alt="loading" style="opacity: 1;"></picture>';
          }
        </script>
      </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
