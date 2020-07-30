module.exports = {
  // 巡检计划分页列表
  testResponse: {
    code: { type: 'string', required: true, description: '状态码' },
    msg: { type: 'string', required: true, description: '错误描述' },
    data: { type: 'planData', required: true }
  },
  planData: {
    data: { type: 'string' }
  }
}
