const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/recommend', require('./routes/recommend'));
app.use('/api/calculate', require('./routes/calculate'));
app.use('/api/partners', require('./routes/partners'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Scheme Navigator API running on http://localhost:${PORT}`);
});
