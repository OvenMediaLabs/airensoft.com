---
title: Getting Started with Web Console
sidebar_position: 50
---

The configuration for the Web Console is managed through an environment variable file. When starting with the `systemctl start ovenstudio` command, it loads the environment variables from the following path:

```bash
/usr/share/ovenmediaengine/ovenstudio/system.env
```

## Configuring `system.env`

The default configuration of the environment variable file is as follows:

```bash
OS_SERVER_PORT=8080

LOG_DIR=/var/log/ovenmediaengine/ovenstudio

JAVA_HOME=/usr/share/ovenmediaengine/ovenstudio/jvm/jdk-17.0.10+7-jre
```


:::info

If you have configured the Host IP, the following additional information is included:

* `OME_HOST_IP=Your.HOST.IP.Address`

:::


### Environment Variables

<table><thead><tr><th width="239">Env</th><th>Default Value</th></tr></thead><tbody><tr><td>OS_SERVER_PORT</td><td>Service port where Web Console will run: `8080`</td></tr><tr><td>LOG_DIR</td><td>Log storage path of Web Console: `/var/log/ovenmediaengine/ovenstudio`</td></tr><tr><td>JAVA_HOME</td><td>JAVA installation path: `/usr/share/ovenmediaengine/ovenstudio/jvm/jdk-17.0.10+7-jre`</td></tr><tr><td>OME_HOST_IP</td><td>Host IP of OvenMediaEngine</td></tr></tbody></table>


:::info

If you prefer to use a different version of Java that you manage, modify the **`JAVA_HOME`** path accordingly and restart the Web Console.

* **JAVA 17+**

:::


## Admin Password

The admin password for the Web Console is managed in a file. If the `.admin-password` file does not exist when the Web Console starts, it will be automatically generated, and the default password will be `ovenstudio`.

```sh
$ cat /usr/share/ovenmediaengine/ovenstudio/conf/.admin-password
ovenstudio
$
```

### Change password

You can directly modify the `.admin-password` file to change the password as follows. The updated password will be applied immediately without restarting the Web Console.

```sh
$ echo 'new-password' > /usr/share/ovenmediaengine/ovenstudio/conf/.admin-password
$ cat /usr/share/ovenmediaengine/ovenstudio/conf/.admin-password
new-password
$
```


:::info

You can also change the password through the UI using options like "[Change Password](web-console-overview/change-password.md)".

:::


## Apply Changes

If the Environment Variables are changed, you must restart the Web Console (ovenstudio) for the changes to take effect. You can restart the Web Console using the following command:

```bash
$ sudo systemctl restart ovenstudio
```
