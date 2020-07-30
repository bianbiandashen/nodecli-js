let api = {
  requestParamsHasEspecialWord: '参数不能含有特殊字符！',
  patrolPlanIdEmpty: '缺少计划patrolPlanId参数',
  planTaskSplitNoResponseData: '调用任务拆分接口无返回数据',
  planTaskSplitNoResponsError: '调用任务拆分接口返回异常',
  planTaskSplitSendError: '调用任务拆分接口失败',
  queryOperateLog1: '巡检任务',
  queryOperateLogSuccess: '查询巡检任务列表成功_全部列表',
  queryOperateLogError: '查询巡检任务列表失败_全部列表',
  getPointListOperateLogSuccess: '获取监控点坐标信息成功',
  getPointListOperateLogError: '获取监控点坐标信息失败',
  queryQuestionOperateLog: '获取问题管理列表',
  nextStepOperateLogSuccess: '更新问题状态成功',
  nextStepOperateLogError: '更新问题状态失败',
  nextStepOperateLogDebug: '巡检结论创建成功，准备发送待办和消息的MQ，结论提交后返回结果为：',
  getQuestionTransOperateLog: '问题处理流程',
  getQuestionTransOperateLogSuccess: '获取问题流程详情成功',
  getQuestionTransOperateLogError: '获取问题流程详情失败',
  getDetailByTaskIdLogSuccess: '查询巡检任务详情成功_部分详情',
  getDetailByTaskIdLogError: '查询巡检任务详情失败_部分详情',
  createConclusionByBSOperateLog: '巡检结论创建',
  createConclusionByBSOperateLogSuccess: '创建巡检结论成功',
  createConclusionByBSOperateLogError: '创建巡检结论失败'
}

module.exports = api
