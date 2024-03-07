// utils/db.js
const sql = require('mssql');

const config = {
    server: "DESKTOP-CT2L84D/SQLEXPRESS",
    database: 'SPP_BD',
    authentication: {
        type: 'default',
        options: {
            userName: 'ArtemAdmin', // Изначально оставляем пустыми
            password: '1515',
        },
    },
    options: {
        encrypt: true,
        trustServerCertificate: true,
        port: 1433, // Добавляем явное указание порта
    },
};

const pool = new sql.ConnectionPool(config);

const connectDB = async (username, password) => {
    try {
        // Обновляем данные в config перед подключением
        config.authentication.options.userName = username;
        config.authentication.options.password = password;

        await pool.connect();
        console.log('Успешное подключение к базе данных');
    } catch (error) {
        console.error('Ошибка при подключении к базе данных:', error.message);
        throw error;
    }
};

module.exports = { pool, connectDB, config };
