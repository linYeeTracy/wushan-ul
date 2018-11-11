/**
 * mongoose 模块
 */

const mongoose = require('mongoose');

const mongo = {
  ObjectId(id) {
    if (typeof id === 'string') {
      return mongoose.Types.ObjectId(id);
    }
    return id;
  },
  createObjectId() {
    return new mongoose.Types.ObjectId().toString();
  }
};

module.exports = mongo;
