#!/bin/sh
sleep 29
echo `restart`
source /etc/profile
SH_DIR="$( cd "$(dirname "$0")" && pwd )"
SCRIPT_DIR=$(dirname "$SH_DIR")
PKG_DIR=$(dirname "$SCRIPT_DIR")
XFRONT_WEB_ROOT=${PKG_DIR}/bin/patrolengine-app # 替换

CPU_NUM=`cat /proc/stat | grep cpu[0-9] -c`
if [ "$CPU_NUM" -le 8 ]; then
WOKRERS=$CPU_NUM
else
WOKRERS=$[CPU_NUM/4]
fi

echo $SH_DIR
echo $SCRIPT_DIR
echo ${nodejslinux64_nodejs_PATH}
echo ${XFRONT_WEB_ROOT}
cd ${XFRONT_WEB_ROOT}/
#执行脚本前，把./node_modules/.bin/egg-scripts中的require('..')改成require('egg-scripts')
sed -i "s/\.\./egg-scripts/g" ./node_modules/.bin/egg-scripts


cp ./reboot.js ./node_modules/egg-scripts/lib/cmd/reboot.js
echo 'root.js copied'
#./node_modules/.bin/egg-scripts stas
./node_modules/.bin/egg-scripts reboot --daemon --node=${nodejslinux64_nodejs_PATH}/node --workers=$WOKRERS --title=patrolengine-app --port=9297 --ignore-stderr #调用egg启动脚本，# 替换
#./node_modules/.bin/egg-scripts start --daemon --title=patrolengine-app --sticky --ignore-stderr --port=36100
exit 0																					#--node 设置egg程序运行的node环境
																						#--daemon 守护进程运行
																						#--title 进程名称
																						#默认创建cpu相同数量的worker可以通过
																						#--workers来设置，其他参数参见官网
