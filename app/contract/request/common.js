module.exports = {
  synchRegionTreeRequest: {},
  asyncTreeRequest: {
    parentId: {
      type: 'string',
      required: true,
      description: '父级节点区域(组织)ID'
    },
    pageNo: {
      type: 'integer',
      description: '当前页码'
    },
    pageSize: {
      type: 'integer',
      description: '每页显示条数'
    }
  },

  getImageDetailRequest: {
    imgUrl: {
      type: 'string',
      required: true,
      description: '图片短连接'
    }
  },

  getUserInfoByUserIdsRequest: {
    userIds: {
      type: 'string',
      required: true,
      description: '用户id的字符串， 分割'
    }
  },

  asyncTreeSearchRequest: {
    searchName: {
      type: 'string',
      required: true,
      description: '模糊搜索关键字'
    },
    pageNo: {
      type: 'integer',
      description: '当前页码'
    },
    pageSize: {
      type: 'integer',
      description: '每页显示条数'
    }
  }
}
