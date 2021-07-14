const {Sequelize} = require('sequelize');

module.exports = new Sequelize('mines', 'andrewkomar', '12345', {
  host: 'localhost',
  dialect: 'postgres',
  define: {
    timestamps: false
  },
});
