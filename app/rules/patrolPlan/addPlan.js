'use strict';

const rule = {
  patrolPlanName:[{
    required:true,
    message:'巡检计划名称不能为空'
  }],
  patrolPlanTempId:[{
    required:true,
    message:'巡检计划模板id不能为空'
  },{
    type:'string',
    message:'巡检计划模板id为string类型'
  }],
  taskExecuteMode:[{
    type:'number',
    message:'任务执行方式为number类型'
  }]
  // {
  //   validator(rule, value, callback, source, options) {
  //     console.log('======================value========================')
  //     console.log(value)
  //     const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^]{8,16}$/;
  //     if (pattern.test(value)) {
  //       callback(); // 验证通过
  //       return;
  //     }
  //     callback({ message: '密码最少包含一个大小写字母、数字并且为8-16位' }); // 验证不通过
  //   }
  // }
}

module.exports = rule;