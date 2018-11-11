/**
 * 用户管理
 */

const router = require('koa-router')();
const { Custom } = require('../db');
const { mongo } = require('../utils');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const moment = require('moment')
const { util } = require('../utils');

// const config = require('../config');

// const { uploadsAvatar } = config.server;

// 获取全部用户信息
router.get('/', async (ctx) => {
  try {
    console.log(1)
    const {byDate} = ctx.request.query
    if(byDate) {
      const currDate = moment(new Date()).format('L');
      const weekDayList = []
      // weekDayList.reduce((arr, next)=> {})
      for(let i=-1; i<6; i++) {
        weekDayList.push(i)
      }
      const weekWarns = await Promise.all(weekDayList.map(v => {
        return Custom.getInfo({
          $or: [
            {
              weddingday: {
                  $gte: moment().add(v, 'days'),
                  $lte: moment().add(v+1, 'days')
              }
            },
            {
              birthday: {
                $gte: moment().add(v, 'days'),
                $lte: moment().add(v+1, 'days')
              }
            }
          ]
        })
      }))
      const reminds = await Custom.getInfo({
        isRemind: true
      })
      reminds.forEach((v, i)=> {
        const warnday = moment(v.birthday).add('100', 'days');
        const diffday = warnday.diff(moment(), 'days')
        if(diffday>= 0 && diffday <=6) {
          weekWarns[diffday].push(v)
        }
      });
      ctx.resp.success(weekWarns);
      return; 
    }
    const data = await Custom.getInfo({});
    ctx.resp.success(util.formatDatas(data));
  } catch (e) {
    ctx.resp.fail();
  }
});

// 新增客户信息
router.post('/', async (ctx) => {
  try {
    const data = await Custom.create(ctx.request.body);
    ctx.resp.success(data);
  } catch (e) {
    // debug(e)
    ctx.resp.fail();
  }
});

// 更新客户信息
router.put('/:customID', async (ctx) => {
  const { customID } = ctx.params;
  try {
    await Custom.update(
      {
        _id: customID
      },
      ctx.request.body
    );
    ctx.resp.success({});

  } catch (e) {
    ctx.resp.fail();
  }
});

// 删除客户信息
router.delete('/:customID', async (ctx) => {
  const { customID } = ctx.params;
  try {
    await Custom.delete({
      _id: customID
    });
    ctx.resp.success({});
  } catch (e) {
    ctx.resp.fail();
  }
});

module.exports = router;
