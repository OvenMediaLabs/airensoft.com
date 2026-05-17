---
title: API Storage
enterprise_only: true
sidebar_position: 119
---

## **API Storage**

This feature allows you to permanently store`VirtualHost` and `Application` information managed through OvenMediaEngine's [REST API](https://ovenmedialabs.com/docs/ome/rest-api). To enable the API Storage feature, enable `<Managers><API><Storage>` in Server.xml as follows:

```xml
<Server version="8">
	<Managers>
		<API>
			...
			<Storage />
		</API>
	</Managers>
</Server>
```


:::warning

When OvenMediaEngine is restarted after disabling the API Storage feature, all `VirtualHost` and `Application` information created via REST API will be initialized.

:::

