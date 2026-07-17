<template>
  <div class="wrapper">
    <div
      style="margin: 130px auto; background-color: #fff; width:400px; height:330px;padding: 20px; border-radius:10px">
      <div style="height: 60px; line-height: 60px; text-align: center">
        <img
          src="../../assets/logo.png"
          alt=""
          style="width: 20px; position: relative; top: 5px;"
        />
        <b style="color: #303133; font-weight: bold">
          人力资源管理系统
        </b>
      </div>
      <el-form :rules="rules" :model="staff" ref="loginForm">
        <el-form-item prop="code" >
          <el-input size="medium" placeholder="请输入账号"   prefix-icon="el-icon-user"
                    v-model.trim="staff.code"></el-input>
        </el-form-item>
        <el-form-item prop="password" style="margin-top: 20px">
          <el-input size="medium" placeholder="请输入密码"  prefix-icon="el-icon-lock" show-password
                    v-model.trim="staff.password"></el-input>
        </el-form-item>
        <el-form-item   style="margin-top: 20px">
          <el-form-item prop="validateCode" style="display: inline-block" >
            <el-input size="medium" placeholder="请输入验证码" prefix-icon="el-icon-key"
                      v-model.trim="staff.validateCode"></el-input>
          </el-form-item>
            <div class="login-code">
              <img ref="img" src="" @click="getCode" class="login-code-img" alt=""/>
            </div>
        </el-form-item>
        <el-form-item >
          <el-button type="primary" size="medium" style="width:100%" @click="handleLogin">登 录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
<script>
import { login } from '@/api/login'
import { queryByStaffId, queryPermission } from '@/api/menu'
import { setDynamicRoute } from '@/router'
import { setValidateCode } from '@/utils/validateCode'

export default {
  name: 'Login',
  data () {
    return {
      staff: {},
      // 效验规则
      rules: {
        code: [
          { required: true, message: '请输入账号', trigger: 'blur' },
          { min: 3, max: 10, message: '长度在3到10个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 3, max: 10, message: '长度在3到10个字符', trigger: 'blur' }
        ],
        validateCode: [
          { required: true, message: '请输入验证码', trigger: 'blur' }
        ]
      }
    }
  },
  mounted () {
    setValidateCode(this.$refs.img)
  },
  methods: {
    getCode () {
      setValidateCode(this.$refs.img)
    },
    handleLogin () {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          login(this.staff).then(
            response => {
              if (response.code === 200) {
                this.$store.commit('staff/SET_STAFF', response.data)
                this.$store.commit('token/SET_TOKEN', response.token)
                const staffId = response.data.id
                queryByStaffId(staffId).then(menuRes => {
                  if (menuRes.code === 200) {
                    const menuList = menuRes.data
                    menuList.push({
                      id: 0, code: 'home', name: '首页', icon: 's-home', path: '/home', children: []
                    })
                    setDynamicRoute(menuList)
                    this.$store.commit('menu/SET_MENU', menuList)
                  }
                  queryPermission(staffId).then(permRes => {
                    if (permRes.code === 200) {
                      this.$store.commit('permission/SET_PERMISSION', permRes.data)
                    }
                  })
                  this.$message.success('登录成功！')
                  this.$router.push({ path: '/home' })
                })
              } else {
                this.$message.error(response.message)
              }
            }
          )
        } else {
          return false
        }
      })
    }
  }
}
</script>
<style>
.wrapper {
  height: 100vh;
  background-image: linear-gradient(to bottom right, #FC466B, #3f5EFB);
  overflow: hidden;
}

.login-code {
  width: 32%;
  height: 34px;
  float: right;
  img {
    cursor: pointer;
    vertical-align: middle;
  }
}

.login-code-img {
  height: 34px;
}
</style>
