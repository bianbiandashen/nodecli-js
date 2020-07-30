'use strict'

const fs = require('fs')
const path = require('path')
const folderPath = path.join('./', 'app/schema')
const uuidv1 = require('uuid/v1')
const md5 = require('md5')
const helper = require('../../extend/helper')
// 请在createDb文件中定义需要创建表的名称
const createDb = require('../createDb')
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const files = fs.readdirSync(folderPath)

      // 初始化数据库

      for (const fileName of files) {
        console.log(path.join('../app/schema/', fileName))
        const filePath = path.join(__dirname, `../../schema/${fileName}`)
        const schema = require(filePath)({
          Sequelize
        })
        await queryInterface.createTable(fileName.replace('.js', ''), schema)
      }
      // for (const name of createDb) {
      //   const filePath = path.join(__dirname, `../../schema/${name}`);
      //   console.log('filePath', filePath)

      //   const schema = require(filePath)({
      //     Sequelize
      //   });
      //   console.log('schema', schema)
      //   await queryInterface.createTable(name.replace('.js', ''), schema);
      // }

      // 添加管理员
      // let salt = helper.getRandomText(16)
      // await queryInterface.bulkInsert('admin', [{
      //   uuid: uuidv1(),
      //   lastModifiedTime: new Date(),
      //   createdTime: new Date(),
      //   name: '超级管理员',
      //   passwordTime: new Date(),
      //   email: 'zhengjie7@hikvision.com',
      //   phone: '18100194710',
      //   username: 'admin',
      //   salt,
      //   password: md5('Abc12345++' + salt),
      //   level: 'super',
      //   version: '1.0'
      // }]);
      // await queryInterface.bulkInsert('updateCycle', [{
      //   id: uuidv1(),
      //   lastModifiedTime: new Date(),
      //   createdTime: new Date(),
      //   day: '90',
      //   version: '1.0'
      // }]);
    } catch (e) {
      console.log(e)
    }
  },

  down: async queryInterface => {
    // 删除所有表
    await queryInterface.dropAllTables()
  }
}
