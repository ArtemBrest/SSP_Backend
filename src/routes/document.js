// routes/documents.js
const express = require('express');
const router = express.Router();
const { pool, connectDB } = require('../utils/db'); // Исправлено на импорт pool и connectDB из db.js

// Эндпоинт для получения всех документов
router.get('/api/documents', async (req, res) => {
    try {
        // Подключаемся к базе данных перед выполнением запроса
        await connectDB();

        //const result = await pool.request().query('SELECT * FROM Documents');
        const result = await pool.request().query(`
            SELECT
                D.DocumentID,
                DT.TypeName AS DocumentType,
                S.UserName AS SenderUser,
                S.UserID AS SenderUserID,
                R.UserName AS ReceiverUser,
                R.UserID AS ReceiverUserID, -- Добавляем столбец ReceiverUserID
                DS.StatusName AS DocumentStatus,
                D.DocumentContent,
                D.CreationDate
            FROM
                Documents D
                    INNER JOIN DocumentTypes DT ON D.DocumentTypeID = DT.DocumentTypeID
                    INNER JOIN Users S ON D.SenderUserID = S.UserID
                    INNER JOIN Users R ON D.ReceiverUserID = R.UserID
                    INNER JOIN DocumentStatus DS ON D.DocumentStatusID = DS.StatusID
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Ошибка при получении данных из базы данных:', error.message);
        res.status(500).send('Ошибка сервера');
    }
});
// Эндпоинт для получения документа по ID
router.get('/api/documents/:id', async (req, res) => {
    try {
        // Подключаемся к базе данных перед выполнением запроса
        await connectDB();

        const { id } = req.params;
        const result = await pool.request().input('id', id).query(`
        SELECT
            D.DocumentID,
            DT.TypeName AS DocumentType,
            S.UserName AS SenderUser,
            S.UserID AS SenderUserID,
            R.UserName AS ReceiverUser,
            R.UserID AS ReceiverUserID, -- Добавляем столбец ReceiverUserID
            DS.StatusName AS DocumentStatus,
            D.DocumentContent,
            D.CreationDate
        FROM
            Documents D
            INNER JOIN DocumentTypes DT ON D.DocumentTypeID = DT.DocumentTypeID
            INNER JOIN Users S ON D.SenderUserID = S.UserID
            INNER JOIN Users R ON D.ReceiverUserID = R.UserID
            INNER JOIN DocumentStatus DS ON D.DocumentStatusID = DS.StatusID
        WHERE
            D.DocumentID = @id;
        `);

        if (result.recordset.length === 0) {
            return res.status(404).send('Документ не найден');
        }
        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Ошибка при получении данных из базы данных:', error.message);
        res.status(500).send('Ошибка сервера');
    }
});
/*
// Эндпоинт для создания нового документа
router.post('/api/documents/new', async (req, res) => {
    try {
        // Подключаемся к базе данных перед выполнением запроса
        await connectDB();

        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).send('Пожалуйста, заполните заголовок и содержимое документа');
        }
        const result = await pool.request()
            .input('title', title)
            .input('content', content)
            .query('INSERT INTO Documents (Title, Content) VALUES (@title, @content); SELECT @@IDENTITY AS DocumentID;');
        const newDocumentId = result.recordset[0].DocumentID;
        res.status(201).json({ id: newDocumentId, title, content });
    } catch (error) {
        console.error('Ошибка при создании нового документа:', error.message);
        res.status(500).send('Ошибка сервера');
    }
});
*/

// Эндпоинт для отправки документа на подпись
router.post('/api/documents/:id/send-for-signing', async (req, res) => {
    try {
        const { id } = req.params;
        const currentDate = new Date().toISOString();

        // Проверяем, есть ли пользователь в req
        if (!req.user || !req.user.id) {
            return res.status(401).send('Пользователь не аутентифицирован');
        }

        // Добавляем запись о подписи документа в таблицу DocumentSignatures
        await pool.request()
            .input('documentId', id)
            .input('signerUserId', req.user.id)
            .input('signatureDate', currentDate)
            .query('INSERT INTO DocumentSignatures (DocumentID, SignerUserID, SignatureDate) VALUES (@documentId, @signerUserId, @signatureDate)');

        // Добавляем запись в историю действий с документами
        await pool.request()
            .input('documentId', id)
            .input('actionDescription', 'Документ отправлен на подпись')
            .input('actionDate', currentDate)
            .query('INSERT INTO DocumentHistory (DocumentID, ActionDescription, ActionDate) VALUES (@documentId, @actionDescription, @actionDate)');

        // Изменяем статус документа на "На подписи"
        await pool.request()
            .input('id', id)
            .query('UPDATE Documents SET DocumentStatusID = 1 WHERE DocumentID = @id');

        res.status(200).send('Документ успешно отправлен на подпись');
    } catch (error) {
        console.error('Ошибка при отправке документа на подпись:', error.message);
        res.status(500).send('Ошибка сервера');
    }
});


// Эндпоинт для подписания документа
router.post('/api/documents/:id/sign', async (req, res) => {
    try {
        const { id } = req.params;
        // Выполнить логику подписания документа в базе данных
        // Например, можно изменить статус документа на "Подписан"
        await pool.request().input('id', id).query('UPDATE Documents SET DocumentStatusID = 2 WHERE DocumentID = @id');
        res.status(200).send('Документ успешно подписан');
    } catch (error) {
        console.error('Ошибка при подписании документа:', error.message);
        res.status(500).send('Ошибка сервера');
    }
});

// Эндпоинт для отклонения документа
router.post('/api/documents/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        // Выполнить логику отклонения документа в базе данных
        // Например, можно изменить статус документа на "Отклонен"
        await pool.request().input('id', id).query('UPDATE Documents SET DocumentStatusID = 3 WHERE DocumentID = @id');
        res.status(200).send('Документ успешно отклонен');
    } catch (error) {
        console.error('Ошибка при отклонении документа:', error.message);
        res.status(500).send('Ошибка сервера');
    }
});


module.exports = router;
