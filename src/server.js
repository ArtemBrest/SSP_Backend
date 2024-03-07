const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth');
const documentsRouter = require('./routes/document');
const usersRouter = require('./routes/users'); // Добавлен импорт

const app = express();

app.use(cors());
app.use(express.json());

app.use(authRouter);
app.use(documentsRouter);
app.use(usersRouter); // Добавлен маршрут для пользователей

const PORT = 3031;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
