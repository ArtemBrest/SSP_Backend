// routes/auth.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { pool, connectDB, config } = require('../utils/db');
const checkAccessLevel = require('../middleware/checkAccessLevel');

// Middleware для получения уровня доступа пользователя
const getUserAccessLevel = async (req, res, next) => {
    try {
        // Открываем подключение к базе данных
        await pool.connect();

        // Извлекаем уровень доступа пользователя из базы данных
        const { username } = req.body;

        const userResult = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT AccessLevel FROM Users WHERE Username = @username');

        const user = userResult.recordset[0];

        if (user) {
            req.userAccessLevel = user.AccessLevel;
            next();
        } else {
            res.status(401).send('Invalid username or password');
        }
    } catch (error) {
        console.error('Error getting user access level:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Маршрут для авторизации с применением уровней доступа
router.post('/login', getUserAccessLevel, async (req, res, next) => {
    const { username, password } = req.body;

    try {
        // Обновляем данные в config перед подключением
        config.authentication.options.userName = username;
        config.authentication.options.password = password;

        // Подключение к базе данных при авторизации
        await connectDB(username, password);

        // Ищем пользователя по имени
        console.log(`Пытаюсь найти пользователя по имени пользователя: ${username}`);
        const userResult = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM Users WHERE Username = @username');

        console.log('Результат пользователя:', userResult.recordset);

        const user = userResult.recordset[0];

        let employee = null;  // Инициализация перед блоком if

        // Если пользователь найден, проверяем пароль
        if (user) {
            console.log('Пользователь найден. Проверка пароля...');

            // Пароль не хешируется, сравниваем как есть
            if (password === user.Password) {
                console.log('Пароль совпал. Получение информации о сотруднике...');
                const employeeResult = await pool.request()
                    .input('userID', sql.Int, user.UserID)
                    .query('SELECT * FROM Employees WHERE UserID = @userID');

                console.log('Результат сотрудника:', employeeResult.recordset);

                employee = employeeResult.recordset[0];

                // Проверка уровня доступа пользователя
                const accessLevel = user?.AccessLevel || 0; // Значение по умолчанию

                // Определяем права доступа в зависимости от уровня
                let permissions = [];
                if (accessLevel === 1) {
                    // Администратор: может делать всё
                    permissions = ['read', 'write', 'delete', 'update'];
                } else if (accessLevel === 2) {
                    // Менеджер: может читать, записывать и обновлять
                    permissions = ['read', 'write', 'update'];
                } else if (accessLevel === 3) {
                    // Пользователь: может только читать
                    permissions = ['read'];
                }

                // Здесь можно использовать переменную employee и permissions
                res.json({
                    employeeID: employee ? employee.EmployeeID : null,
                    roleID: employee ? employee.RoleID : null,
                    permissions,
                    accessLevel: req.userAccessLevel,
                });
            } else {
                console.log('неверный пароль.');
                return res.status(401).send('Неправильное имя пользователя или пароль');
            }
        } else {
            console.log('Пользователь не найден.');
            return res.status(401).send('Неправильное имя пользователя или пароль');
        }

    } catch (error) {
        console.error('Ошибка при авторизации:', error.message);
        res.status(500).send('Ошибка сервера');
    } finally {
        // Закрываем подключение
        await pool.close();
    }
});

module.exports = router;
