const os = require("os");
const hikidentify = require(`${genPath()}`);

function genPath() {
    const platform = os.platform();
    const arch = process.arch;
    let scriptBasePath = ``;

    if (platform === 'win32') {
        scriptBasePath = "./lib/windows/hikidentify.node";
    } else if (platform === 'linux') {
        scriptBasePath = `./lib/linux/${arch}/hikidentify.node`;
    }
    return scriptBasePath;
}
/*
    解密
 */
const decryption = val => {
    return hikidentify.decryptData(__dirname, val);
};

/*
    批量解密
 */
const decryptionMulti = val => {
    return hikidentify.decryptMultiData(__dirname, val);
};
/*
    加密
 */
const encryption = val => {
    return hikidentify.encryptData(__dirname, val);
};

/*
    批量加密
 */
const encryptionMulti = val => {
    return hikidentify.encryptMultiData(__dirname, val);
};
/*
    获取无时间戳token
 */
const genToken = val => {
    const str = !val?"":val;
    return hikidentify.apply(__dirname,str);
};
/*
    获取有时间戳token
 */
const genTokenex = val => {
    const str = !val?"":val;
    return hikidentify.applyEx(__dirname,str);
};
/*
    验证无时间戳token
 */
const checkToken = val => {
    let result = hikidentify.check(__dirname, val);
    if (result === 0) {
        return true;
    }
    return false;
};

/*
    验证有时间戳token
 */
const checkTokenex = val => {
    let result = hikidentify.checkEx(__dirname, val, 1200);
    if (result === 0) {
        return true;
    }
    return false;
};

/*
    获取云存储需要的SK加密串
 */
const exportSK = () => {
    return hikidentify.exportSK(__dirname);
};

/*
    获取云存储需要的AK加密串
 */
const exportAK = () => {
    return hikidentify.exportAK(__dirname);
};

module.exports = {
    decryption,
    decryptionMulti,
    encryption,
    encryptionMulti,
    genToken,
    genTokenex,
    checkToken,
    checkTokenex,
    exportSK,
    exportAK
};
