// import _ from 'lodash';
const _ = require('lodash');
const moment = require('moment');
const upload = require('./upload');

const filter = {
  /**
   * 获取物料数组的过滤选项
   * @param {*物料数组} data
   */
  filterMeteriel(data) {
    const meterielFilterFields = {
      projects: [],
      styles: [],
      scenes: []
    };
    const {
      projects, styles, scenes
    } = meterielFilterFields;
    data.forEach((item) => {
      if (item.project && !_.find(projects, { _id: item.project._id.toString() })) {
        projects.push({ _id: item.project._id.toString(), name: item.project.name });
      }
      if (item.style && !_.find(styles, { _id: item.style._id.toString() })) {
        styles.push({ _id: item.style._id.toString(), name: item.style.name });
      }
      if (item.scene && !_.find(scenes, { _id: item.scene._id.toString() })) {
        scenes.push({ _id: item.scene._id.toString(), name: item.scene.name });
      }
    });
    return meterielFilterFields;
  },

  /**
   * 处理物料数组
   * 处理物料下载总量
   * 格式化更新时间
   * @param {*物料数组} data
   */
  formatDatas(data = [], isTemp) {
    return _.map(data, (v) => {
      if(v.birthday) {
        v.birthday = 'haha'
      }
      if(v.weddingday) {
        v.weddingday = moment(v.weddingday).format('YYYY-MM-DD')
      }
      console.log(v)
      return v;
    });
  },

  /**
   * 处理项目数组
   * 格式化更新时间
   * @param {*项目数组} data
   */
  procProjectDatas(data = []) {
    return _.map(data, (v) => {
      v.updateTime = moment(v.updateTime).format('YYYY-MM-DD hh:mm:ss');
      v.cover = upload.joinCoverAddr(v.cover);
      return v;
    });
  },

  /**
   * 用户排序
   * @param {*用户数组} data
   */
  sortUser(data = []) {
    if (!data.length) return;
    return data.sort((a, b) => b.role.type - a.role.type);
  }
};

module.exports = filter;
