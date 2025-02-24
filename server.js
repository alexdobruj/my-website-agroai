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
        <title>Мой сайт</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin: 50px; }
        </style>
      </head>
      <body>
        <h1>Добро пожаловать на мой сайт!</h1>
        <p>Этот сайт работает на Express.js и развернут на Render.</p>
      </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
