const net = require("net");
const config = require("./config/config");
const User = require("./module/User");
const {
  signAndLoginInfo,
  signErro,
  userEnd,
  loginSuccseInfo,
  helpMesg,
  quiteMesg,
  notLoginMesg,
  welcomeInfo,
} = require("./config/messg");

const userList = new Map();
const server = net.createServer((conn) => {
  conn.setEncoding("utf-8");
  let user = null;

  //流程控制
  let LOGINFLAG = false;
  let SIGNFLAG = false;

  console.log("用户加入");
  if (user) {
    console.log(user.userName);
  }
  conn.write(welcomeInfo);
  conn.on("data", (data) => {
    data = data.trim();

    const commendRegexp = /^:([a-zA-Z0-9]+)/;
    const commendCheckerResult = commendRegexp.exec(data);
    if (commendCheckerResult) {
      switch (commendCheckerResult[1]) {
        //帮助命令
        case "h":
        case "help": {
          conn.write(helpMesg);
          break;
        }
        //退出客户端
        case "quit":
        case "q": {
          conn.write(quiteMesg);
          conn.destroy();
          break;
        }
        //退出登陆
        case "logout":
        case "o": {
          if (!user) {
            conn.write(notLoginMesg);
            conn.write(welcomeInfo);
            break;
          }
          conn.write(logoutMesg);
          user = null;
          conn.write(welcomeInfo);
        }
        //列出在线用户
        case "lu":
        case "list-user": {
          let onlineUser = [];
          for (u of userList) {
            if (u[1].conn) {
              onlineUser.push(u[0]);
            }
          }
          let userListMesg = `您当前所在房间共有${userList.size}人 其中在线 ${onlineUser.length}人\n:\n`;
          onlineUser.forEach((e) => {
            userListMesg += `${e}   `;
          });
          conn.write(userListMesg + "\n");
          break;
        }
      }
      return;
    }

    if (!user) {
      //用户空 进入登陆注册环节
      //强制将用户输入用户名和密码的步骤改为一步

      if (data === "1") {
        conn.write(signAndLoginInfo);
        LOGINFLAG = true;
      } else if (data === "2") {
        conn.write(signAndLoginInfo);
        SIGNFLAG = true;
      } else if (data === "3") {
        conn.write(quiteMesg);
        conn.destroy();
        return;
      } else if (LOGINFLAG) {
        let userInfo = data.split(" ");
        const vali = (userInfo.length != 2) | userList.has(userInfo[0]);

        if (vali) {
          conn.write(signErro);
          setTimeout(() => {
            conn.write(signAndLoginInfo);
          }, 500);
          return;
        }

        user = new User(userInfo[0], userInfo[1], conn);
        userList.set(user.userName, user);
        conn.write(loginSuccseInfo);

        LOGINFLAG = false;
      } else if (SIGNFLAG) {
        let userInfo = data.split(" ");
        const valiRuller = userInfo.length != 2;

        if (valiRuller) {
          conn.write(signErro);
          setTimeout(() => {
            conn.write(signAndLoginInfo);
          }, 500);
          return;
        }

        const valiExist = userList.has(userInfo[0]);
        if (!valiExist) {
          conn.write("用户不存在\n");
          setTimeout(() => {
            conn.write(signAndLoginInfo);
          }, 500);
          return;
        }

        user = userList.get(userInfo[0]);
        let result = user.login(userInfo[1]);
        if (result) {
          conn.write("登陆成功\n");
          if (user.conn) {
            user.conn.close();
          }
          user.setConn(conn);
          SIGNFLAG = false;
          return;
        }
        conn.write("登陆失败，帐号或密码错误\n");

        user = null;
      }
      return;
    }

    //私聊
    const REGEX = /^@([a-zA-Z0-9]+) ([a-zA-Z0-9]+)/;
    let matchResult = REGEX.exec(data);
    if (matchResult) {
      let u = userList.get(matchResult[1]);
      u.sendMsg(user.userName + ":" + matchResult[2] + "\n");
      return;
    }

    //用户存在 转发消息
    for (u of userList) {
      if (u[1].userName !== user.userName) {
        console.log(u[1].userName);
        let mesg = `${user.userName}:${data}\n`;
        u[1].sendMsg(mesg);
      }
    }
    console.log(user.userName + "   " + data);
  });

  conn.on("end", () => {
    if (user) {
      console.log(user.userName + userEnd);
      user.setConn(null);
    }
  });
});

server.listen(config.port, config.host);
