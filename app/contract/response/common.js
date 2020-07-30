module.exports = {
  asyncTreeResponse: {
    code: { type: 'string', required: true },
    data: {
      type: 'asyncTreeData',
      required: true
    },
    msg: { type: 'string', required: true, description: 'success' }
  },
  asyncTreeData: {
    lastPage: { type: 'string', description: '是否是最后一页' },
    pageNo: { type: 'string', description: '当前页码' },
    pageSize: { type: 'string', description: '每页显示条数' },
    total: { type: 'string', description: '总条数' },
    rows: {
      type: 'array',
      itemType: 'asyncTreeDataList'
    }
  },
  asyncTreeDataList: {
    parentRegionId: { type: 'string', description: '父级区域ID' },
    regionId: { type: 'string', description: '区域ID' },
    regionName: { type: 'string', description: '区域名称' },
    regionPath: { type: 'string', description: '区域全路径' },
    description: { type: 'string', description: '描述' },
    createTime: { type: 'string', description: '创建时间' },
    updateTime: { type: 'string', description: '更新时间' }
  },
  asyncOrgTreeResponse: {
    code: { type: 'string', required: true },
    data: {
      type: 'asyncOrgTreeData',
      required: true
    },
    msg: { type: 'string', required: true, description: 'success' }
  },
  asyncOrgTreeData: {
    lastPage: { type: 'string', description: '是否是最后一页' },
    pageNo: { type: 'string', description: '当前页码' },
    pageSize: { type: 'string', description: '每页显示条数' },
    total: { type: 'string', description: '总条数' },
    rows: {
      type: 'array',
      itemType: 'asyncOrgTreeDataList'
    }
  },
  asyncOrgTreeDataList: {
    parentOrgId: { type: 'string', description: '父级组织ID' },
    orgId: { type: 'string', description: '组织ID' },
    orgCode: { type: 'string', description: '组织编码' },
    orgName: { type: 'string', description: '组织名称' },
    createTime: { type: 'string', description: '创建时间' },
    updateTime: { type: 'string', description: '更新时间' }
  },
  imgUploadResponse: {
    code: { type: 'string', required: true },
    data: { type: 'string', description: '图片路径' },
    msg: { type: 'string', required: true, description: '接口处理信息' }
  }
}
