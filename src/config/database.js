module.exports = {
  dialect: 'postgres',
  host: 'localhost',
  port: '5433',
  username: 'postgres',
  password: 'docker',
  database: 'gobarber',
  define: {
    timestramps: true,
    underscored: true,
    underscoredAll: true,
  },
};
