<template>
  <div class="manage">
    <el-dialog title="操作详情" :visible.sync="detailDialog.isShow" width="720px">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="模块">{{ detailDialog.data.module }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ detailDialog.data.action }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detailDialog.data.operator }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ detailDialog.data.operatorIp }}</el-descriptions-item>
        <el-descriptions-item label="请求路径" :span="2">{{ detailDialog.data.requestUri }}</el-descriptions-item>
        <el-descriptions-item label="方法签名" :span="2">{{ detailDialog.data.method }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detailDialog.data.duration }} ms</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailDialog.data.status === 1 ? 'success' : 'danger'" size="mini">
            {{ detailDialog.data.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="时间" :span="2">{{ detailDialog.data.createTime }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre class="params-pre">{{ formatParams(detailDialog.data.params) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailDialog.isShow = false">关闭</el-button>
      </div>
    </el-dialog>

    <div class="manage-header">
      <el-form label-width="auto" :model="searchForm.formData" :inline="true" size="mini">
        <el-form-item label="模块" prop="module">
          <el-input
            placeholder="如：登录、请假"
            v-model.trim="searchForm.formData.module"
            prefix-icon="el-icon-search"
            clearable
          />
        </el-form-item>
        <el-form-item label="操作人" prop="operator">
          <el-input
            placeholder="工号"
            v-model.trim="searchForm.formData.operator"
            prefix-icon="el-icon-search"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button v-permission="['system:operation-log:list']" type="primary" @click="search" size="mini">
            搜索 <i class="el-icon-search"/>
          </el-button>
          <el-button type="danger" @click="reset" size="mini">
            重置 <i class="el-icon-refresh-left"/>
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="common-table">
      <el-table
        :data="table.tableData"
        height="85%"
        border
        stripe
        row-key="id"
        :header-cell-style="{
          background: '#eef1f6',
          color: '#606266',
          textAlign: 'center',
          fontWeight: 'bold',
          borderWidth: '3px'
        }"
      >
        <el-table-column prop="module" label="模块" min-width="80" align="center"/>
        <el-table-column prop="action" label="操作" min-width="90" align="center"/>
        <el-table-column prop="operator" label="操作人" min-width="90" align="center"/>
        <el-table-column prop="operatorIp" label="IP" min-width="120" align="center"/>
        <el-table-column prop="requestUri" label="请求路径" min-width="160" align="center" show-overflow-tooltip/>
        <el-table-column prop="duration" label="耗时(ms)" min-width="90" align="center"/>
        <el-table-column prop="status" label="状态" min-width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="mini">
              {{ scope.row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="操作时间" min-width="160" align="center"/>
        <el-table-column label="详情" width="90" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="handleDetail(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pager"
        layout="total,sizes,prev,pager,next,jumper"
        :page-size="table.pageConfig.size"
        :page-sizes="[5, 10, 15, 20]"
        :total="table.pageConfig.total"
        :current-page.sync="table.pageConfig.current"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script>
import { list } from '@/api/operationLog'

export default {
  name: 'OperationLog',
  data () {
    return {
      searchForm: {
        formData: {
          module: '',
          operator: ''
        }
      },
      table: {
        tableData: [],
        pageConfig: {
          total: 0,
          current: 1,
          size: 10
        }
      },
      detailDialog: {
        isShow: false,
        data: {}
      }
    }
  },
  methods: {
    search () {
      list({
        current: this.table.pageConfig.current,
        size: this.table.pageConfig.size,
        module: this.searchForm.formData.module,
        operator: this.searchForm.formData.operator
      }).then(response => {
        if (response.code === 200) {
          this.table.tableData = response.data.list
          this.table.pageConfig.total = response.data.total
        } else {
          this.$message.error(response.message)
        }
      })
    },
    reset () {
      this.searchForm.formData = { module: '', operator: '' }
      this.table.pageConfig.current = 1
      this.search()
    },
    handleSizeChange (size) {
      this.table.pageConfig.size = size
      this.search()
    },
    handleCurrentChange (current) {
      this.table.pageConfig.current = current
      this.search()
    },
    handleDetail (row) {
      this.detailDialog.data = { ...row }
      this.detailDialog.isShow = true
    },
    formatParams (params) {
      if (!params) {
        return '-'
      }
      try {
        return JSON.stringify(JSON.parse(params), null, 2)
      } catch (e) {
        return params
      }
    }
  },
  created () {
    this.search()
  }
}
</script>

<style scoped>
.params-pre {
  margin: 0;
  max-height: 240px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
  line-height: 1.5;
}
</style>
