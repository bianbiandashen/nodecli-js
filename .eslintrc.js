module.exports = {
  extends: 'eslint-config-egg',
  // for experimental features support
  parser: 'babel-eslint',
  rules: {
    // always-multiline：多行模式必须带逗号，单行模式不能带逗号
    'comma-dangle': [2, 'never'],
    // 禁止使用分号
    semi: [2, 'never'],
    // 不强制严格模式
    strict: 0,
    // 函数声明跟括号之间要有空格
    'space-before-function-paren': ['error', 'always'],
    // 对象属性或者解构赋值时规范要求
    'object-curly-newline': ['error', { 
      // 对象字面量的配置，要求花括号内必须有换行符
      'ObjectExpression': { 'multiline': true },
      // 对象的解构赋值模式的配置，4个以内属性时，用一行展示
      'ObjectPattern': {'minProperties': 4}  
    }],
    // 不要检测注释中的tag，主要是controller中会有@router，jsdoc认为不是规范关键字
    'jsdoc/check-tag-names': 0
  }
}
