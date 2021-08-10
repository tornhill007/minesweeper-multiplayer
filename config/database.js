const {Sequelize} = require('sequelize');
require('dotenv').config();


// module.exports = new Sequelize('mines', 'andrewkomar', '12345', {
//   host: 'localhost',
//   dialect: 'postgres',
//   define: {
//     timestamps: false
//   },
// });

module.exports = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  define: {
    timestamps: false
  },
});
