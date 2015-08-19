# 6b17401ed7
1. 修改server/conf.js中关于微信公众号的配置。
2. 复制定时任务脚本cron-ylb到/etc/cron.d:
    ```cp cron-ylb /etc/cron.d```
3. 如需创建管理员账户，或者修改密码，请登录到服务器，转到server/scripts目录，在命令行运行命令：
  ```node adminUser username password```
