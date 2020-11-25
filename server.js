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
  commendErr,
} = require("./config/messg");
const { write } = require("fs");

const SIGN = "1";
const LOGIN = "2";
const QUITE = "3";

const userList = new Map();

//获取在线用户
const getOnlineUser = () => {
  let onlineUser = [];
  for (u of userList) {
    if (u[1].conn) {
      onlineUser.push(u[0]);
    }
  }
  return onlineUser;
};

//发送在线用户信息
const sendUserListInfo = (conn) => {
  let onlineUser = getOnlineUser();
  let userListMesg = `您当前所在房间共有${userList.size}人 其中在线 ${onlineUser.length}人\n:\n`;
  onlineUser.forEach((e) => {
    userListMesg += `${e}   `;
  });
  conn.write(userListMesg + "\n");
};

const addBoult = (conn) => {
  conn.write("\n> ");
};

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
  //显示用户在线情况
  sendUserListInfo(conn);
  addBoult(conn);

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
          addBoult(conn);
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
            addBoult(conn);
            break;
          }
          conn.write(logoutMesg);
          user = null;
          conn.write(welcomeInfo);
          addBoult(conn);
        }
        //列出在线用户
        case "lu":
        case "list-user": {
          sendUserListInfo(conn);
          addBoult(conn);
          break;
        }
      }
      return;
    }

    if (!user) {
      //用户空 进入登陆注册环节
      //强制将用户输入用户名和密码的步骤改为一步

      //注册
      if (data === SIGN) {
        conn.write(signAndLoginInfo);
        addBoult(conn);

        //注册放行
        SIGNFLAG = true;
      }
      // 登陆
      else if (data === LOGIN) {
        conn.write(signAndLoginInfo);
        addBoult(conn);

        // 登陆放行
        LOGINFLAG = true;
      }
      //退出
      else if (data === QUITE) {
        conn.write(quiteMesg);
        conn.destroy();
        return;
      }
      //注册逻辑
      else if (SIGNFLAG) {
        let userInfo = data.split(" ");
        const vali = (userInfo.length != 2) | userList.has(userInfo[0]);

        if (vali) {
          conn.write(signErro);
          setTimeout(() => {
            conn.write(signAndLoginInfo);
            addBoult(conn);
          }, 500);
          return;
        }

        user = new User(userInfo[0], userInfo[1], conn);
        userList.set(user.userName, user);
        conn.write(loginSuccseInfo);
        addBoult(conn);

        SIGNFLAG = false;
      }
      //登陆逻辑
      else if (LOGINFLAG) {
        let userInfo = data.split(" ");
        const valiRuller = userInfo.length != 2;

        if (valiRuller) {
          conn.write(signErro);
          setTimeout(() => {
            conn.write(signAndLoginInfo);
            addBoult(conn);
          }, 500);
          return;
        }

        const valiExist = userList.has(userInfo[0]);
        if (!valiExist) {
          conn.write("用户不存在\n");
          setTimeout(() => {
            conn.write(signAndLoginInfo);
            addBoult(conn);
          }, 500);
          return;
        }

        user = userList.get(userInfo[0]);
        let result = user.login(userInfo[1]);
        if (result) {
          conn.write("登陆成功\n");
          addBoult(conn);
          if (user.conn) {
            user.conn.close();
          }
          user.setConn(conn);
          LOGINFLAG = false;
          return;
        }
        conn.write("登陆失败，帐号或密码错误\n");
        addBoult(conn);

        user = null;
      } else {
        conn.write(commendErr);
        conn.write(welcomeInfo);
        addBoult(conn);
      }
      return;
    }

    //私聊
    const REGEX = /^@([a-zA-Z0-9]+) ([a-zA-Z0-9]+)/;
    let matchResult = REGEX.exec(data);
    if (matchResult) {
      let u = userList.get(matchResult[1]);
      u.sendMsg(user.userName + ":" + matchResult[2] + "\n");
      addBoult(conn);
      return;
    }

    //用户存在 转发消息
    for (u of userList) {
      if (u[1].userName !== user.userName) {
        let mesg = `${user.userName}:${data}\n`;
        u[1].sendMsg(mesg);
        addBoult(conn);
      } else {
        addBoult(conn);
      }
    }
  });

  conn.on("end", () => {
    if (user) {
      console.log(user.userName + userEnd);
      user.setConn(null);
    }
  });
});

server.listen(config.port, config.host);
