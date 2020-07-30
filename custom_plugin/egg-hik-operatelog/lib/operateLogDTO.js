class OperateLogDTO {

  constructor() {
    // edit by lrx
    this.ignore = true;
  }

  /** 设置该条日志是否忽略 **/
  setIgnore(ignore) {
    this.ignore = ignore;
    return this;
  }

  /** 日志的创建时间，由日志提供方提供 **/
  setOperationTime(operationTime) {
    this.operationTime = operationTime;
    return this;
  }

  /** 组件标识 **/
  setComponentId(componentId) {
    this.componentId = componentId;
    return this;
  }

  /** 服务标识 **/
  setServiceId(serviceId) {
    this.serviceId = serviceId;
    return this;
  }

  /** 操作用户所属部门编号 **/
  setUserOrgId(userOrgId) {
    this.userOrgId = userOrgId;
    return this;
  }

  /** 操作用户所属的部门名称 **/
  setUserOrgName(userOrgName) {
    this.userOrgName = userOrgName;
    return this;
  }

  /** 用户编号 **/
  setUserId(userId) {
    this.userId = userId;
    return this;
  }

  /** 用户名 **/
  setUserName(userName) {
    this.userName = userName;
    return this;
  }

  /** 操作用户所在的IP **/
  setIp(ip) {
    this.ip = ip;
    return this;
  }

  /** 操作用户所在的MAC地址 **/
  setMac(mac) {
    this.mac = mac;
    return this;
  }

  /** 操作对象类型，USER、DEPARTMENT、CAMERA、CROSS等 **/
  setObjectType(objectType) {
    this.objectType = objectType;
    return this;
  }

  /** 操作对象编号(多个用“,”隔开) **/
  setObjectId(objectId) {
    this.objectId = objectId;
    return this;
  }

  /** 操作对象名称(多个用“,”隔开) **/
  setObjectName(objectName) {
    this.objectName = objectName;
    return this;
  }

  /**
     * 操作对象所属组织ID(多个用“,”隔开)
     */
  setObjectOrgId(objectOrgId) {
    this.objectOrgId = objectOrgId;
    return this;
  }

  /** 操作对象所属组织名称(多个用“,”隔开)**/
  setObjectOrgName(objectOrgName) {
    this.objectOrgName = objectOrgName;
    return this;
  }

  /** 具体操作模块的编号 **/
  setModuleId(moduleId) {
    this.moduleId = moduleId;
    return this;
  }

  /** 操作类型，登陆、查询、新增、修改、删除、预览等 **/
  setAction(action) {
    this.action = action;
    return this;
  }

  /** 操作的结果，1：成功，0：失败 **/
  setResult(result) {
    this.result = result;
    return this;
  }

  /** 具体的操作日志内容 **/
  setActionDetail(actionDetail) {
    this.actionDetail = actionDetail;
    return this;
  }

  /** actionDetail是否支持多语言，0不支持/1支持，此项若不填，默认值为0 **/
  setActionMultiLang(actionMultiLang) {
    this.actionMultiLang = actionMultiLang;
    return this;
  }

  /**  actionDetail支持多语言，写操作内容详情标识；不支持多语言，留空 **/
  setActionMessageId(actionMessageId) {
    this.actionMessageId = actionMessageId;
    return this;
  }

  /** 业务组件的终端标识，0表示web组件，1表示C/S客户端，2表示移动客户端  **/
  setTerminalType(terminalType) {
    this.terminalType = terminalType;
    return this;
  }

  /**  本次操作的业务号 **/
  setTraceId(traceId) {
    this.traceId = traceId;
    return this;
  }

  /** 存放与本次操作所关联其他业务操作的业务号 **/
  setRelationId(relationId) {
    this.relationId = relationId;
    return this;
  }

  /** 用户在核心服务中的关联人员编号 **/
  setPersonId(personId) {
    this.personId = personId;
    return this;
  }

  toString() {
    return `operationTime:"${this.operationTime || ''}",componentId:"${this.componentId || ''}",serviceId:"${this.serviceId || ''}",userOrgId:"${this.userOrgId || ''}",userOrgName:"${this.userOrgName || ''}",userId:"${this.userId || ''}",userName:"${this.userName || ''}",ip:"${this.ip || ''}",mac:"${this.mac || ''}",objectType:"${this.objectType || ''}",objectId:"${this.objectId || ''}",objectName:"${this.objectName || ''}",objectOrgId:"${this.objectOrgId || ''}",objectOrgName:"${this.objectOrgName || ''}",moduleId:"${this.moduleId || ''}",action:"${this.action || ''}",result:"${this.result || ''}",actionDetail:"${this.actionDetail || ''}",actionMultiLang:"${this.actionMultiLang || ''}",actionMessageId:"${this.actionMessageId || ''}",terminalType:"${this.terminalType || ''}",traceId:"${this.traceId || ''}",relationId:"${this.relationId || ''}",personId:"${this.personId || ''}"`;

  }
}

module.exports = OperateLogDTO;
