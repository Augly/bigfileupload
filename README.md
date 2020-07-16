<!--
 * @Descripttion : 
 * @version      : 
 * @Author       : zero
 * @Date         : 2020-07-12 09:33:59
 * @LastEditors  : zero
 * @LastEditTime : 2020-07-14 11:11:36
--> 
### 安装
```
npm install bigfileupload
```
### 引用
```
important { BigFileUpload } from "bigfileupload"
```
### 配置项
```
option:{
      //切片尺寸
      sliceSize: 0.1 * 1024 * 1024,
      //为一个函数接收三个参数(sliceFile,next,error)=>{}，该函数作用于上传文件切片，调用next()执行下一个，调用error()主动抛出错误，停止上传,
      uploadFun: (sliceFile, next,error) => { },
      //为一个函数接收两个参数(fileName,hashName)=>{}，此函数通知服务器端该文件所有切片已上传完毕，可以合并
      noticeFun: (fileName, hashName) => { },
      //为一个函数接收两个参数(fileName,hashName)=>{}，此函数验证该文件在服务器端已上传切片数量,该函数返回2个值，uploaded为布尔值类型，uploadedList为切片hash值组成的数组组成的数组
      verifyFun: (fileName, hashName) => { },
      //为一个函数接收一个参数(progres)=>{}，此函数通知用户已上文件的占比
      progressFun: (progres) => { },
      //接收一个status，表示当前上传状态
      status: (status) => { },
      //接收一个msg，表示错误信息
      errorMsg: (msg) => {
        console.error(msg)
      },
```
### 创建实例
```
const upload = new BigFileUpload(option)
```
### 方法
```
load(file)：接收需要上传的文件。
//以下方法都在load(file)之后调用
begin()：开始上传
again()：重新上传
pause()：暂停上传
continue()：继续上传
```