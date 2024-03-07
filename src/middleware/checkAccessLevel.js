// middleware/checkAccessLevel.js
const checkAccessLevel = (requiredAccessLevel) => {
    return (req, res, next) => {
        // Проверка уровня доступа пользователя
        if (req.userAccessLevel && req.userAccessLevel >= requiredAccessLevel) {
            next(); // Пользователь имеет достаточный уровень доступа
        } else {
            res.status(403).send('Access Forbidden'); // Доступ запрещен
        }
    };
};

module.exports = checkAccessLevel;
