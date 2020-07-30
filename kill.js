'use strict'

const path = require('path')
const util = require('util')

const isWin = process.platform === 'win32'
const osRelated = {
  titleTemplate: isWin ? '\\"title\\":\\"%s\\"' : '"title":"%s"',
  appWorkerPath: isWin ? 'egg-cluster\\lib\\app_worker.js' : 'egg-cluster/lib/app_worker.js',
  agentWorkerPath: isWin ? 'egg-cluster\\lib\\agent_worker.js' : 'egg-cluster/lib/agent_worker.js'
}

const Command = require('../command')
const debug = require('debug')('egg-script:start')
const { execFile } = require('mz/child_process')
const fs = require('mz/fs')
const homedir = require('node-homedir')
const mkdirp = require('mz-modules/mkdirp')
const moment = require('moment')
const sleep = require('mz-modules/sleep')
const spawn = require('child_process').spawn
const utils = require('egg-utils')
class RebootCommand extends Command {
  constructor(rawArgv) {
    super(rawArgv)
    this.usage = 'Usage: egg-scripts kill'
    this.serverBin = path.join(__dirname, '../start-cluster')
    this.options = {
      title: {
        description: 'reboot server',
        type: 'string'
      },
      workers: {
        description: 'numbers of app workers, default to `os.cpus().length`',
        type: 'number',
        alias: ['c', 'cluster'],
        default: process.env.EGG_WORKERS
      },
      port: {
        description: 'listening port, default to `process.env.PORT`',
        type: 'number',
        alias: 'p',
        default: process.env.PORT
      },
      env: {
        description: 'server env, default to `process.env.EGG_SERVER_ENV`',
        default: process.env.EGG_SERVER_ENV
      },
      framework: {
        description: 'specify framework that can be absolute path or npm package',
        type: 'string'
      },
      daemon: {
        description: 'whether run at background daemon mode',
        type: 'boolean'
      },
      stdout: {
        description: 'customize stdout file',
        type: 'string'
      },
      stderr: {
        description: 'customize stderr file',
        type: 'string'
      },
      timeout: {
        description: 'the maximum timeout when app starts',
        type: 'number',
        default: 300 * 1000
      },
      'ignore-stderr': {
        description: 'whether ignore stderr when app starts',
        type: 'boolean'
      },
      node: {
        description: 'customize node command path',
        type: 'string'
      }
    }
  }

  get description() {
    return 'Reboot server'
  }

  * run(context) {
    while (true) {
      const { argv } = context

      this.logger.info(`stopping egg application ${argv.title ? `with --title=${argv.title}` : ''}`)

      // node /Users/tz/Workspaces/eggjs/egg-scripts/lib/start-cluster {"title":"egg-server","workers":4,"port":7001,"baseDir":"/Users/tz/Workspaces/eggjs/test/showcase","framework":"/Users/tz/Workspaces/eggjs/test/showcase/node_modules/egg"}
      let processList = yield this.helper.findNodeProcess(item => {
        const cmd = item.cmd
        return argv.title
          ? cmd.includes('start-cluster') &&
              cmd.includes(util.format(osRelated.titleTemplate, argv.title))
          : cmd.includes('start-cluster')
      })
      let pids = processList.map(x => x.pid)

      if (pids.length) {
        this.logger.info('got master pid %j', pids)
        this.helper.kill(pids)
        // wait for 5s to confirm whether any worker process did not kill by master
        yield sleep('5s')
      } else {
        this.logger.info('can not find active worker exiting bash')
        break
      }

      // node --debug-port=5856 /Users/tz/Workspaces/eggjs/test/showcase/node_modules/_egg-cluster@1.8.0@egg-cluster/lib/agent_worker.js {"framework":"/Users/tz/Workspaces/eggjs/test/showcase/node_modules/egg","baseDir":"/Users/tz/Workspaces/eggjs/test/showcase","port":7001,"workers":2,"plugins":null,"https":false,"key":"","cert":"","title":"egg-server","clusterPort":52406}
      // node /Users/tz/Workspaces/eggjs/test/showcase/node_modules/_egg-cluster@1.8.0@egg-cluster/lib/app_worker.js {"framework":"/Users/tz/Workspaces/eggjs/test/showcase/node_modules/egg","baseDir":"/Users/tz/Workspaces/eggjs/test/showcase","port":7001,"workers":2,"plugins":null,"https":false,"key":"","cert":"","title":"egg-server","clusterPort":52406}
      processList = yield this.helper.findNodeProcess(item => {
        const cmd = item.cmd
        return argv.title
          ? (cmd.includes(osRelated.appWorkerPath) || cmd.includes(osRelated.agentWorkerPath)) &&
              cmd.includes(util.format(osRelated.titleTemplate, argv.title))
          : cmd.includes(osRelated.appWorkerPath) || cmd.includes(osRelated.agentWorkerPath)
      })
      pids = processList.map(x => x.pid)

      if (pids.length) {
        this.logger.info('got worker/agent pids %j that is not killed by master', pids)
        this.helper.kill(pids, 'SIGKILL')
      }

      this.logger.info('stopped')
      yield sleep('3s')
    }
  }
  * getFrameworkPath(params) {
    return utils.getFrameworkPath(params)
  }

  * getFrameworkName(framework) {
    const pkgPath = path.join(framework, 'package.json')
    let name = 'egg'
    try {
      const pkg = require(pkgPath)
      /* istanbul ignore else */
      if (pkg.name) name = pkg.name
    } catch (_) {
      /* istanbul next */
    }
    return name
  }

  * checkStatus({ stderr, timeout, 'ignore-stderr': ignoreStdErr }) {
    let count = 0
    let hasError = false
    let isSuccess = true
    timeout = timeout / 1000
    while (!this.isReady) {
      try {
        const stat = yield fs.stat(stderr)
        if (stat && stat.size > 0) {
          hasError = true
          break
        }
      } catch (_) {
        // nothing
      }

      if (count >= timeout) {
        this.logger.error('Start failed, %ds timeout', timeout)
        isSuccess = false
        break
      }

      yield sleep(1000)
      this.logger.log('Wait Start: %d...', ++count)
    }

    if (hasError) {
      try {
        const args = ['-n', '100', stderr]
        this.logger.error('tail %s', args.join(' '))
        const [stdout] = yield execFile('tail', args)
        this.logger.error('Got error when startup: ')
        this.logger.error(stdout)
      } catch (err) {
        this.logger.error('ignore tail error: %s', err)
      }

      isSuccess = ignoreStdErr
      this.logger.error('Start got error, see %s', stderr)
      this.logger.error('Or use `--ignore-stderr` to ignore stderr at startup.')
    }

    if (!isSuccess) {
      this.child.kill('SIGTERM')
      yield sleep(1000)
      this.exit(1)
    }
  }
}

function* getRotatelog(logfile) {
  yield mkdirp(path.dirname(logfile))

  if (yield fs.exists(logfile)) {
    // format style: .20150602.193100
    const timestamp = moment().format('.YYYYMMDD.HHmmss')
    // Note: rename last log to next start time, not when last log file created
    yield fs.rename(logfile, logfile + timestamp)
  }

  return yield fs.open(logfile, 'a')
}

function stringify(obj, ignore) {
  const result = {}
  Object.keys(obj).forEach(key => {
    if (!ignore.includes(key)) {
      result[key] = obj[key]
    }
  })
  return JSON.stringify(result)
}

module.exports = RebootCommand
