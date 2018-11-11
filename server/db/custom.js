/**
 * user 用户模型 操作方法
 */

const { customModel } = require('./model');

const Custom = {
  /**
   * 获取用户基本信息
   * @param {...rest} cond
   * @return {Promise}
   */
  getInfo(...cond) {
    return customModel
      .find(...cond)
      .exec();
  },

  /**
   * 获取用户详细信息
   * @param {Array[Object]} cond
   * @return {Promise}
   */
  getDetailInfo(cond = []) {
    const pipeline = [
      {
        $lookup: {
          from: 'role',
          localField: 'roleID',
          foreignField: '_id',
          as: 'role'
        }
      },
      { $unwind: '$role' },
      {
        $lookup: {
          from: 'group',
          localField: 'groupID',
          foreignField: '_id',
          as: 'group'
        }
      },
      { $unwind: '$group' },
      {
        $lookup: {
          from: 'project',
          localField: '_id',
          foreignField: 'members',
          as: 'projects'
        }
      },
      {
        $lookup: {
          from: 'material',
          localField: '_id',
          foreignField: 'designerID',
          as: 'materials'
        }
      },
      ...cond
    ];

    return customModel
      .aggregate(pipeline)
      .exec();
  },

  /**
   * 执行aggregate条件
   * @param {Array[Object]} cond
   * @return {Promise}
   */
  evalAggregate(cond = []) {
    return customModel
      .aggregate(cond)
      .exec();
  },

  /**
   * 新增用户
   * @param {...rest} cond
   * @return {Promise}
   */
  create(cond) {
    return customModel
      .create(cond);
  },

  /**
   * 更新用户
   * @param {...rest} cond
   * @return {Promise}
   */
  update(...cond) {
    return customModel
      .update(...cond);
  },

  /**
   * 删除用户
   * @param {...rest} cond
   * @return {Promise}
   */
  delete(...cond) {
    return customModel
      .remove(...cond);
  }
};

module.exports = Custom;
