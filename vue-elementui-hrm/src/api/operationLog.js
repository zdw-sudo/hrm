import request from '../utils/request'

const url = '/operation-log'

/**
 * 分页查询操作日志
 * @param params { current, size, module, operator }
 */
export const list = (params) => {
  return request({
    url: url,
    method: 'get',
    params
  })
}
