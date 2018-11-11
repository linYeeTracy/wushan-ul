/**
 * 上传管理
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

const { Project } = require('../db');

const {
  ip, port, coverServerDir, tempServerDir, uploadsServerDir, uploadsDir
} = config.server;

/**
 * 读取路径信息
 * @param {*string} path
 */
function getStat(dir) {
  return new Promise((resolve) => {
    fs.stat(dir, (err, stats) => {
      if (err) {
        resolve(false);
      } else {
        resolve(stats);
      }
    });
  });
}

/**
 * 创建路径
 * @param {*string} dir
 */
function mkdir(dir) {
  return new Promise((resolve) => {
    fs.mkdir(dir, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}


const upload = {
  /**
   * 若不存在目录则创建
   * @param {*目录名} dir
   * @param {*回调} cb
   */
  mkdirp(dir, cb) {
    const self = this;
    if (dir === '.') return cb();
    fs.stat(dir, (err) => {
      if (err === null) return cb();
      const parent = path.dirname(dir);
      self.mkdirp(parent, () => {
        process.stdout.write(`${dir.replace(/\/$/, '')}/\n`);
        fs.mkdir(dir, cb);
      });
    });
  },
  async exists(dir) {
    const isExists = await getStat(dir);
    if (isExists && isExists.isDirectory()) {
      return true;
    } else if (isExists) {
      return false;
    }
    const tempDir = path.parse(dir).dir;
    const status = await this.exists(tempDir);
    let mkdirStatus;
    if (status) {
      mkdirStatus = await mkdir(dir);
    }
    return mkdirStatus;
  },
  getUploadFileExt(name) {
    const ext = name.split('.');
    return ext[ext.length - 1];
  },
  getfile(filepath) {
    if (filepath) {
      return /([^<>/\\|:""*?]+)\.\w+$/.exec(filepath)[0];
    }
  },
  regDblSlash(str) {
    const publicPath = str.replace(/\\/g, '/');
    return `http://${ip}:${port}${publicPath}`;
  },
  /**
   * 通过cover拼接服务地址
   * @param {*项目名称} proName
   * @param {*物料种类} mtype
   * @param {*文件名称} filename
   */
  regDblSlashByName(proName, mtype, filename, isTemp) {
    const dir = isTemp ? tempServerDir : uploadsServerDir;
    const frontDir = isTemp ? 'front' : '前端';
    if (mtype === 1) {
      return `http://${ip}:${port}${dir}/${proName}/${frontDir}/cover/${filename}`;
    } else if (mtype === 2) {
      return `http://${ip}:${port}${dir}/${proName}/视觉/效果图/${filename}`;
    }
    return `http://${ip}:${port}${dir}/${proName}/交互/${filename}`;
  },
  joinCoverAddr(cover) {
    return `http://${ip}:${port}${coverServerDir}/${cover}`;
  },
  deleteFolderRec(dir) {
    const self = this;
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach((file) => {
        const curDir = path.join(dir, file);
        if (fs.statSync(curDir).isDirectory()) {
          self.deleteFolderRec(curDir);
        } else {
          fs.unlinkSync(curDir);
        }
      });

      fs.rmdirSync(dir);
    }
  },
  getInterSection(src, dest) {
    const destSet = new Set(dest);
    return Array.from(new Set(src.filter(v => destSet.has(v))));
  },
  convType(type) {
    if (type === 'front') {
      return 1;
    } else if (type === 'visual') {
      return 2;
    }
    return 3;
  },
  convCnameType(type) {
    if (type === '前端') {
      return 1;
    } else if (type === '视觉') {
      return 2;
    }
    return 3;
  },
  convNumType(type) {
    if (type === 1) {
      return '前端';
    } else if (type === 2) {
      return '视觉';
    }
    return '交互';
  },
  getServerPath(material) {
    const self = this;
    if (material) {
      const { type, cover, project } = material;
      // const regs = /(.+\/)(.+).(png|jpg)$/.exec(cover);
      const file = upload.getfile(cover).split('.')[0];
      if (type === 1) {
        material.serverPath = self.regDblSlash(`${uploadsServerDir}/${project.name}/前端/web/${file}.html`);
      } else if (type === 2) {
        material.serverPath = [];
        const reg = new RegExp(`^${file}[.|@|#]`);
        const pngFiles = fs.readdirSync(path.join(uploadsDir, project.name, '视觉', '效果图'));
        material.serverPath = pngFiles.filter(item => reg.test(item) && !item.includes('#'))
          .map(v => self.regDblSlash(`${uploadsServerDir}/${project.name}/视觉/效果图/${v}`));
      } else {
        material.serverPath = self.regDblSlash(`${uploadsServerDir}/${project.name}/交互/index.html`);
      }
      return material;
    }
  },
  async getProjectNameByID(_id) {
    const project = await Project.getInfo({
      _id
    });
    return project[0].name;
  }
};

module.exports = upload;
