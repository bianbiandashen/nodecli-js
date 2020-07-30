const path = require('path')
const { spawn } = require('child_process')


async function main() {
  try {
    await installFrom('https://npm.taobao.org/mirrors')
    console.log('-- 从淘宝镜像下载chrome成功')
  } catch (err) {
    console.log('-- linux环境直接使用./bin/chrome-linux/chrome')
  }
}

function installFrom(url) {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PUPPETEER_DOWNLOAD_HOST: url
    }
    delete env.npm_config_puppeteer_skip_chromium_download
    const child = spawn('node', ['./install.js'], {
      env,
      cwd: path.resolve(__dirname, './node_modules/puppeteer'),
      stdio: 'inherit'
    })
    child.on('exit', err => {
      err === 0 ? resolve() : reject(new Error('下载chrome失败'))
    })
  })
}

main()
