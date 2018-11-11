/**
 * xlsx 配置
 */

const model = require('../db/model');

const config = {};

registerConfig(model);

function registerConfig(mModel) {
  for (const mKey in mModel) {
    const matchResult = mKey.match('(.*)Model');
    if (matchResult) {
      const tName = matchResult[1];
      const schemaObj = mModel[mKey].schema.obj;
      config[tName] = {
        name: mModel[mKey].getAsCnName(),
        label: {
          _id: '标识'
        }
      };
      for (const sKey in schemaObj) {
        config[tName].label[sKey] = schemaObj[sKey].comment;
      }
      config[tName].label.createTime = '创建时间';
      config[tName].label.updateTime = '更新时间';
    }
  }
}

module.exports = config;
