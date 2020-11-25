let i = 0;
class User {
  constructor(userName, password, conn) {
    this.userName = userName;
    this.userId = this.createId();
    this.password = password;
    this.conn = conn;
    this.state = "t";
  }
  createId() {
    return i++;
  }
  setConn(conn) {
    this.conn = conn;
  }
  sendMsg(msg) {
    this.conn.write(msg);
  }
  login(password) {
    if (password === this.password) {
      return true;
    }
  }
}

module.exports = User;
