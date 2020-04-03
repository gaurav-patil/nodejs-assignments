const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-sql-integration', 'root', 'Gaurav123#', {
    dialect: 'mysql',
    host: 'localhost',
});

module.exports = sequelize;