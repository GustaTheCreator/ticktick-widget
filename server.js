const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.static('.'));
app.use(express.json());

// Servir o index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => {
  console.log(`Widget rodando em http://localhost:${PORT}`);
  console.log('Abra seu navegador em http://localhost:3000');
});
