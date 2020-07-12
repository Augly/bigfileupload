
import _ from 'lodash'
import SparkMD5 from 'spark-md5'
export class BigFileUpload {
  constructor(configObj = {}) {
    let _configObj = {
      //切片尺寸
      sliceSize: 0.1 * 1024 * 1024,
      //为一个函数接收三个参数(sliceFile,next,error)=>{}，该函数作用于上传文件切片
      uploadFun: (sliceFile, next,error) => { },
      //为一个函数接收两个参数(fileName,hashName)=>{}，此函数通知服务器端该文件所有切片已上传完毕，可以合并
      noticeFun: (fileName, hashName) => { },
      //为一个函数接收两个参数(fileName,hashName)=>{}，此函数验证该文件在服务器端已上传切片数量,该函数返回2个值，uploaded和uploadedList
      verifyFun: (fileName, hashName) => { },
      //为一个函数接收一个参数(progres)=>{}，此函数通知用户已上文件的占比
      progressFun: (progres) => { },
      //接收一个status，表示当前上传状态
      status: (status) => { 

      },
      //接收一个msg，表示错误信息
      errorMsg: (msg) => {
        console.error(msg)
      },
    }
    //默认上传状态
    this._Status = 'load'
    //文件hash值
    this._hash = null
    //文件
    this._file = null
    //待上传文件切片列表
    this._uploadList = []
    //已上传文件切片列表
    this._uploadedList = []
    //该文件的所有切片
    this._chunks = []
    //待上传的文件切片的索引
    this._uploadIndex = 0
    //合并配置项
    this._configObj = _.assign(_configObj, configObj)
    if (_.isNull(this._configObj.uploadFun)) {
      throw '请配置上传切片方法，用于上传文件切片'
    }
    if (!_.isFunction(this._configObj.uploadFun)) {
      throw 'uploadFun必须为一个函数'
    }
    if (_.isNull(this._configObj.noticeFun)) {
      throw '请配置上传全部切片上传完成，通知服务器合并方法'
    }
    if (!_.isFunction(this._configObj.noticeFun)) {
      throw 'noticeFun必须为一个函数'
    }
    if (_.isNull(this._configObj.verifyFun)) {
      throw '请配置验证服务器已经存在的切片列表方法'
    }
    if (!_.isFunction(this._configObj.verifyFun)) {
      throw 'verifyFun必须为一个函数'
    }
  }

  get hash () {
    return this._hash
  }
  get file () {
    return this._file
  }
  get uploadList () {
    return this._uploadList
  }
  get uploadedList () {
    return this._uploadedList
  }
  get chunks () {
    return this._chunks
  }
  get uploadIndex () {
    return this._uploadIndex
  }
  get status () {
    const Status = {
      load: 'load',
      pause: 'pause',
      uploading: 'uploading',
      error: 'error',
      done: 'done',
    }
    return Status[this._Status]
  }
  //继续上传
  continue () {
    this._Status = 'uploading'
    this._configObj.status(this._Status)
    this.next()
  }
  //上传下一个
  next () {
    //如果是处于uploading状态开始上传
    if (this.status === 'uploading') {
      this._Status = 'uploading'
      let isEnd = this.uploadList.length - 1 === this.uploadIndex
      //如果是最后一个文件切片上传成功
      if (isEnd) {
        //状态改为完成，并通知_configObj.status方法，和_configObj.noticeFun方法，_configObj.noticeFun负责通知服务器，让服务器开始合并切片
        this._Status = 'done'
        this._configObj.status(this._Status)
        this._configObj.noticeFun(this.file.name, this.hash)
      } else {
        //把当前上传完的上传切片hash添加到已上传切片列表中
        this._uploadedList.push(this.uploadList[this.uploadIndex].hash)
        //继续上传
        this._uploadIndex++
        let file = this.uploadList[this.uploadIndex]
        //获取已上传切片进度
        let progress = (this.uploadedList / this.chunks).toFixed(2) - 0
        //通知上传进度，此进度非官方进度，此进度为当前已上传切片与总切片比例
        this._configObj.progressFun(progress)
        //上传下一个切片
        this._configObj.uploadFun(file, () => this.next, ()=>error)
      }
    }
  }
  //暂停上传
  pause () {
    if (this.status === 'uploading') {
      this._Status = 'pause'
      this._configObj.status(this._Status)
    }
  }
  //上传失败的话可以主动调用错误方法，通知上传错误
  error () {
    //上传失败，重新上传
    this._Status = 'error'
    this._configObj.status(this._Status)
  }
  static readUploadlist (list, chunklist) {
    if (list.length > 0) {
      const readlist = chunklist.filter(
        (chunk) => list.indexOf(chunk.hash) == -1
      )
      return readlist
    }
    return chunklist
  }
  //重新上传
  again () {
    if (this.status === 'error' || this._Status === 'done') {
      this._Status = 'load'
      this.begin()
    }
  }
  //开始上传
  async begin () {
    if (this.status === 'load') {
      //通知开始上传
      this._configObj.status(this._Status)
      //获取文件切片
      const chunks = await this.createFileChunk(this.file)
      //获取文件hash
      this._hash = await this.calculateHashSample(chunks)
      try {
        //验证文件是否，文件已经存在服务器就返回uploaded为true，不存在则为false，uploadedList为服务器已上传的切片
        const { uploaded, uploadedList } = this._configObj.verifyFun(
          this.file.name,
          this.hash
        )
        if (uploaded) {
          //已经上传过的文件
          this._Status = 'done'
          this._configObj.status(this._Status)
          this._configObj.progressFun(1)
        } else {
          this._chunks = chunks.map((chunk, index) => {
            const chunkName = this.hash + '-' + index
            return {
              fileHash: this.hash,
              chunk: chunk.file,
              index,
              hash: chunkName,
              progress: uploadedList.indexOf(chunkName) > -1 ? 100 : 0,
              size: chunk.file.size,
            }
          })
          this._uploadedList = uploadedList
          this._uploadList = this.readUploadlist(uploadedList, chunks)
          this._Status = 'uploading'
          this._configObj.status(this._Status)
          this.next()
        }
      } catch (error) {
        this.errorMsg('获取已上传文件碎片失败')
      }
    }
  }
  load (file) {
    if (file instanceof File) {
      this._file = file
    } else {
      throw '传入的不是一个file类型'
    }
  }

  async createFileChunk (file) {
    // 生成文件块
    const chunks = []
    const sliceSize = this._configObj.sliceSize
    let cur = 0
    while (cur < file.size) {
      chunks.push({ file: file.slice(cur, cur + sliceSize) })
      cur += sliceSize
    }
    return chunks
  }
  async calculateHashSample (chunks) {
    return new Promise((resolve) => {
      const spark = new SparkMD5.ArrayBuffer()
      const reader = new FileReader()
      reader.readAsArrayBuffer(new Blob(chunks))
      reader.onload = (e) => {
        spark.append(e.target.result)
        resolve(spark.end())
      }
    })
  }
}