# egg-hik-cas

#### 在应用目录执行  `npm i egg-hik-cas --save`

### plugin.js

```
exports.redis = {
  enable: true,
  package: 'egg-redis',
};
exports.sessionRedis = {
  enable: true,
  package: 'egg-session-redis',
};
exports.session = true;
exports.hikcas = {
  enable: true,
  path: 'egg-hik-cas',
};
```


### config.default.js

##### cas 配置文件
```
 config.hikcas = {
    casUrl: 'https://10.2.145.82/portal/cas',
    appUrl: 'http://10.20.81.1:7001',
    appLogin: '/login',
    appHome: '/home',
    casServiceValidateUrl: 'http://10.2.145.82:8001/bic/ssoService/v1',
    // ignore: [ '/index'，‘/home’ ],
  };
  ```

##### egg框架自动开启的csrf认证会阻止核心服务单点登出post请求，所以关闭登出路径的csrf认证


```
config.security = {
    csrf: {
      ignore: config.hikcas.appLogin,
    },
  };
   ```