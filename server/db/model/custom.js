/**
 * user 客户模型
 */

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const customSchema = new Schema({
  name: {
    type: String,
    required: true,
    comment: '客户姓名'
  },
  phone: {
    type: String,
    required: true,
    comment: '客户手机号'
  },
  gender: {
    type: String,
    required: true,
    comment: '客户性别'
  },
  birthday: {
    type: Date,
    comment: '客户生日'
  },
  isRemind: {
    type: Boolean,
    comment: '是否对生日进行百日提醒'
  },
  weddingday: {
    type: Date,
    comment: '结婚纪念日'
  },
  introducer: {
    type: String,
    comment: '介绍人'
  },
  email: {
    type: String,
    comment: '邮箱'
  },
  address: {
    type: String,
    comment: '家庭住址'
  },
  comment: {
    type: String,
    comment: '备注'
  },
  point: {
    type: String,
    comment: '积分'
  }
}, {
  versionKey: false,
  timestamps: {
    createdAt: 'createTime',
    updatedAt: 'updateTime'
  }
});

customSchema.statics.getAsCnName = () => '客户表';

module.exports = mongoose.model('custom', customSchema, 'custom');
