const Colors = require("colors");
const welcomeInfo =
  "欢迎加入node聊天室请选择操作\n（1）.注册\n（2）.登陆\n (3) .退出 \n键入 ':help' 获取更多帮助信息\n网络不是法外之地！！！！\n";
const signAndLoginInfo = "请输入用户名和密码用户名和密码用空格隔开\n   ".blue;
const signErro = "输入的用户名或密码无效 或者已经存在同名用户\n".red;
const userEnd = "断开连接\n".red;
const loginSuccseInfo = "注册成功\n".green;
const helpMesg = `
:q         quit                     退出客户端
:help      help                     帮助中心
:o         logout                   退出登陆  
:lu        list user                列出在线用户     
`;

const quiteMesg = "\n您即将退出客户端\n".red;
const notLoginMesg = "\n您未登录\n".red;
const commendErr = "指令错误\n".red;
module.exports = {
  signAndLoginInfo,
  signErro,
  userEnd,
  loginSuccseInfo,
  helpMesg,
  quiteMesg,
  notLoginMesg,
  welcomeInfo,
  commendErr,
};
