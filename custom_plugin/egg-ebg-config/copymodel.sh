#!/bin/bash
# get all filename in specified path
path=$1
files=$(ls $path)
for filename in $files
do
 if [[ $filename = *\_public* ]]; then
  aname=$(basename ${filename}.js)
  name=${aname%_*} 
  # name=${filename##*/}
   newname=$name'_'$2'.js'
     echo $name
     echo copy $path'/'$filename to
     echo $path'/'$newname
     cp $path'/'$filename $path'/'$newname
     sed -i  "s/public/$2/g" $path'/'$newname
 else
  echo $path'/'$filename not change
 fi
done
# sleep 5
# source /etc/profile
# SH_DIR="$( cd "$(dirname "$0")" && pwd )"
# SCRIPT_DIR=$(dirname "$SH_DIR")
# XFRONT_WEB_ROOT=$(dirname "$SCRIPT_DIR")
# echo ${nodejslinux64_nodejs_PATH}
# echo ${XFRONT_WEB_ROOT}
# cd ${XFRONT_WEB_ROOT}/
# ./node_modules/.bin/egg-scripts reboot --daemon --node=${nodejslinux64_nodejs_PATH}/node --title=patrolengine-app --port=9297 --ignore-stderr  #停止egg程序  必须要指定title
