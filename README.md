# 6b17401ed7
1. 修改server/conf.js中关于微信公众号的配置。
2. 复制定时任务脚本cron-ylb到/etc/cron.d:
    ```cp cron-ylb /etc/cron.d```
3. 如需创建管理员账户，或者修改密码，请登录到服务器，转到server/scripts目录，在命令行运行命令：
  ```node adminUser username password```

4. 安装MongoDB控制台(http://genghisapp.com/)。
	```curl -sSL https://get.rvm.io | bash -s stable```
	```rvm -v``` 重新登陆，检查rvm安装是否成功
	```rvm install ruby``` 安装最新版本ruby
	```gem install genghisapp``` 安装genghisapp
	```genghisapp``` 启动genghisapp
	
	```genghisapp -K``` 终止genghisapp
	
5. 数据导出
	登录到服务器。
	```mongoexport --port 27000 -d ylb -c doctors -o doctors.csv``` 导出doctors collection为csv文件。
	
	
