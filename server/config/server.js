/**
 * 服务配置
 */

const path = require('path');

const config = {
  ip: process.env.serverIp || 'localhost',
  port: process.env.serverPort || 6677,
  session: {
    key: 'ex:sess',
    maxAge: 24 * 60 * 60 * 1000,
    overwriter: true,
    httpOnly: true,
    signed: true,
    rolling: true,
    renew: false
  },
  coverServerDir: '/covers',
  tempServerDir: '/temp',
  tempDir: path.join(__dirname, '../public/temp'),
  uploadsServerDir: '/uploads',
  uploadsDir: path.join(__dirname, '../public/uploads'),
  downloadsServerDir: '/downloads',
  downloadsDir: path.join(__dirname, '../public/downloads'),
  coversDir: path.join(__dirname, '../public/covers'),
  uploadsAvatar: {
    accept: 'png,jpeg,jpg',
    maxSize: 2 * 1024 * 1024
  }
};

module.exports = config;
