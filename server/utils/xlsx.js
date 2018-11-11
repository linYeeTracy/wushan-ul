/**
 * xlsx 模块
 */

const fs = require('fs');
const _ = require('lodash');
const nodeXlsx = require('node-xlsx');
const model = require('../db/model');
const debug = require('debug')('ex:server:utils');
const { xlsx: xlsxConfig } = require('../config');

debug.enabled = true;

const xlsx = {
  importExcelToDb(filePath) {
    const nameMap = {};
    const xlsxData = nodeXlsx.parse(filePath);

    _.forEach(xlsxConfig, (n, key) => {
      nameMap[key] = n.name;
    });

    const nameInvertMap = _.invert(nameMap);

    try {
      xlsxData.forEach((n) => {
        const tempData = [];
        const name = nameInvertMap[n.name];
        const label = xlsxConfig[name].label;
        const tKeys = _.keys(label);
        n.data.slice(1).forEach((m) => {
          const tempObj = {};
          m.forEach((v, vIndex) => {
            if (
              tKeys[vIndex] === 'createTime' ||
              tKeys[vIndex] === 'updateTime'
            ) {
              tempObj[tKeys[vIndex]] = new Date(1900, 0, v - 1);
            } else {
              tempObj[tKeys[vIndex]] = v;
            }
          });
          tempData.push(tempObj);
        });
        model[`${name}Model`].create(tempData);
      });
    } catch (e) {
      debug(e);
    }
  },
  async exportDbToExcel(filePath) {
    const xlsxData = [];
    try {
      for (const key in model) {
        if (key === 'projectModel') {
          const findResult = await model[key].find().exec();
          const matchResult = key.match('(.*)Model');
          let tempData = null;
          if (matchResult && findResult && findResult.length > 0) {
            const { name, label } = xlsxConfig[matchResult[1]];
            const tKeys = _.keys(label);
            const tValues = _.values(label);
            tempData = {
              name,
              data: [tValues]
            };
            _(findResult).forEach((n) => {
              const tCells = [];
              _(tKeys).forEach((m) => {
                tCells.push(n[m]);
              });
              tempData.data.push(tCells);
            });
          }
          tempData && xlsxData.push(tempData);
        }
      }
      fs.writeFile(filePath, nodeXlsx.build(xlsxData), (err) => {
        if (err) {
          debug(err);
        }
      });
    } catch (e) {
      debug(e);
    }
  }
};

// test
// xlsx.importExcelToDb('db/xlsx/db.xlsx');
xlsx.exportDbToExcel('db/xlsx/db.xlsx');

module.exports = xlsx;
