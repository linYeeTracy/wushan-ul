/**
 * 权限注册管理
 */

/* eslint-disable new-cap */

const Acl = require('acl');
const { Role } = require('../db');
const debug = require('debug')('ex:server:utils');

debug.enabled = true;

const auth = {
  async init() {
    try {
      const data = await Role.getInfo({}, {
        name: 1,
        allows: 1
      });

      const aclConfig = [];
      const acl = new Acl(new Acl.memoryBackend());

      auth.acl = acl;

      data.forEach((m) => {
        aclConfig.push({
          roles: m._id.toString(),
          allows: m.allows || []
        });
        acl.addUserRoles(
          m._id.toString(),
          m._id.toString()
        );
      });
      acl.allow(aclConfig);

      // test
      // acl.isAllowed('5b875b042839ff7f08423e3d', '/admin2', 'get', (err, res) => {
      //   console.log(err, res);
      // });
      // acl.isAllowed('5b875b042839ff7f08423e2d', '/admin', 'get', (err, res) => {
      //   console.log(err, res);
      // });
    } catch (e) {
      debug(e);
    }
  }
};

module.exports = auth;
