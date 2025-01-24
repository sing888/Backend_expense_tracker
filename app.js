const express = require('express');
const db = require('./db'); // Optional: Import database connection if needed
const indexRouter = require('./routes/index'); // Router file

const app = express();
app.use(express.json()); // Parse JSON requests

app.use('/', indexRouter); // Use the index router for all routes

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
