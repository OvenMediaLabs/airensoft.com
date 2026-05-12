---
title: Proxy Protocol
sidebar_position: 127
---

With this feature, OvenMediaEngine can handle stream input via The PROXY protocol. To enable this feature, activate the `<HAProxyProtocol>` in the `Server.xml` as follows:

```xml
<Server>
...
  <Modules>
    <!-- Enable HAProxyProtocol feature for Cloudflare, default: false -->
    <HAProxyProtocol>
      <Enable>true</Enable>
    </HAProxyProtocol>
... 
```

## Access Control and HAProxy Protocol

You can use the Client Address forwarded via the HAProxy Protocol for Access Control.

### SignedPolicy

When the `real_ip` policy is set in `SignedPolicy`, you can verify the Client Address forwarded through the HAProxy Protocol. The `allow_ip` is the IP of the directly connected client, so you can enhance security by first checking if the connected IP is an allowed proxy server IP.

```json
{
    "url_activate":1399711581,                                    
    "url_expire":1399721581,                                    
    "stream_expire":1399821581,                                    
    "allow_ip":"192.168.100.5/32",
    "real_ip":"111.111.111.111/32"
}
```

When `HAProxyProtocol` is enabled, `SignedPolicy` validates the Client Address forwarded via The Proxy protocol against `real_ip`.


:::info

Detailed User Guide: [https://docs.ovenmediaengine.com/dev/access-control/signedpolicy](https://docs.ovenmediaengine.com/dev/access-control/signedpolicy)

:::


### Admission Webhooks

The Client Address forwarded through the HAProxy Protocol is passed to the Control Server in the `real_ip` field of `AdmissionWebhooks`.

Since the `address` field still contains the IP of the directly connected client, you can enhance security by first checking if this IP is an allowed proxy server IP.

```json
POST /configured/target/url/ HTTP/1.1
Content-Length: 325
Content-Type: application/json
Accept: application/json
X-OME-Signature: f871jd991jj1929jsjd91pqa0amm1
{
  "client": 
  {
    "address": "211.233.58.86",
    "port": 29291,
    "real_ip": "192.0.2.43",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
  },
  "request":
  {
    "direction": "incoming | outgoing",
    "protocol": "webrtc | rtmp | srt | llhls | thumbnail",
    "status": "opening | closing",
    "url": "scheme://host[:port]/app/stream/file?query=value&query2=value2",
    "new_url": "scheme://host[:port]/app/new_stream/file?query=value&query2=value2",
    "time": "2021-05-12T13:45:00.000Z"
  }
}
```

When `HAProxyProtocol` is enabled, `AdmissionWebhooks` sets the Client Address forwarded via The Proxy protocol as the highest priority for the `real_ip` field, over the existing `X-REAL-IP` or `X-FORWARDED-FOR` headers.


:::info

Detailed User Guide: [https://docs.ovenmediaengine.com/dev/access-control/admission-webhooks](https://docs.ovenmediaengine.com/dev/access-control/admission-webhooks)

:::

