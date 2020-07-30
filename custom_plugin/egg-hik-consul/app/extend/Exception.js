class Exception extends Error {

  constructor(msg, code, transaction) {
    super(msg)
    this.message = msg
    this.transaction = transaction
    this.code = code
  }

}
module.exports = Exception
