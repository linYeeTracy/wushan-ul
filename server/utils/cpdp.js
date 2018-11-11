/**
 * cpdp 模块
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const unzip = require('unzip');
const debug = require('debug')('ex:server:utils');
const config = require('../config');
const upload = require('./upload');
const yauzl = require('yauzl');
const AdmZip = require('adm-zip');
const fse = require('fs-extra');

const { uploadsDir, downloadsDir } = config.server;

debug.enabled = true;

const cpdp = {
  archiver({
    pss,
    vss,
    iss,
    fss,
    dest = path.join(downloadsDir),
    name
  }, cb) {
    const output = fs.createWriteStream(`${dest}/${name}.zip`);
    const archive = archiver('zip');
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        cb && cb();
        resolve();
      });

      archive.on('error', (e) => {
        cb && cb(e);
        reject(e);
        throw e;
      });
      archive.pipe(output);
      if (pss) {
        archive.directory(path.join(uploadsDir, pss), name);
      }
      if (vss) {
        !Array.isArray(vss) && (vss = [vss]);
        vss.forEach((v) => {
          const filename = upload.getfile(v);
          archive.file(v, { name: filename });
        });
      }
      if (iss) {
        archive.directory(path.join(uploadsDir, iss), name);
      }
      if (fss) {
        archive.directory(path.join(uploadsDir, fss), name);
      }
      archive.finalize();
    });
  },

  // 待详细考虑完善,不支持中文转码
  async unzip({
    src,
    dest = path.join(downloadsDir),
    type
  }) {
    if (fs.existsSync(path.join(dest, type))) {
      fse.emptyDirSync(path.join(dest, type));
    } else {
      fse.ensureDirSync(path.join(dest, type));
    }

    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(src);
      const unzipExtractor = unzip.Extract({ path: dest });
      readStream.pipe(unzipExtractor);
      unzipExtractor.on('close', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  },

  // 支持中文转码的解压包,实测不支持
  async unzip2({
    src,
    dest = path.join(downloadsDir),
    type
  }) {
    await upload.exists(dest);
    upload.deleteFolderRec(path.join(dest, type));

    return new Promise((resolve) => {
      yauzl.open(src, {
        lazyEntries: true,
        decodeStrings: true
      }, (err1, zipfile) => {
        if (err1) throw err1;
        zipfile.readEntry();
        zipfile.on('entry', (entry) => {
          if (/\/$/.test(entry.fileName)) {
            upload.mkdirp(path.join(dest, entry.fileName), () => {
              zipfile.readEntry();
            });
          } else {
            upload.mkdirp(path.dirname(path.join(dest, entry.fileName)), () => {
              zipfile.openReadStream(entry, (err, readStream) => {
                if (err) throw err;
                readStream.on('end', () => {
                  zipfile.readEntry();
                });
                const writeStream = fs.createWriteStream(path.join(dest, entry.fileName));
                readStream.pipe(writeStream);
              });
            });
          }
        });
        zipfile.on('close', () => {
          resolve(true);
        });
      });
    });
  },

  // 支持中文转码
  async unzip3({
    src,
    dest = path.join(downloadsDir),
    type
  }) {
    const _dest = path.join(dest, type);
    await upload.exists(_dest);
    upload.deleteFolderRec(_dest);

    const zip = new AdmZip(src);

    zip.extractAllTo(_dest, true);
  }
};

module.exports = cpdp;
