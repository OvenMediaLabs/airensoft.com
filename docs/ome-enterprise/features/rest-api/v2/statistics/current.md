---
title: Current
enterprise_only: true
sidebar_position: 165
---

Provides statistics about Virtual Host, Application, and Stream.

## Get Statistics of Virtual Host

> **Request**

<details>

<summary><span class="http-method http-method-get">GET</span> /v2/stats/current/vhosts/&#x7B;vhost&#x7D;</summary>

**Header**

```http
Authorization: Basic {credentials}

# Authorization
    Credentials for HTTP Basic Authentication created with <AccessToken>
```

</details>

> **Responses**

<details>

<summary><span class="http-method http-method-200">200</span> Ok</summary>

The request has succeeded

**Header**

```
Content-Type: application/json
```

**Body**

```json
{
    "message": "OK",
    "response": {
        "createdTime": "2025-06-17T18:31:31.787+09:00",
        "lastUpdatedTime": "2025-06-17T18:31:31.787+09:00",
        "providers": {
            "avgThroughputIn": 0,
            "connections": {
                "file": 0,
                "mpegts": 0,
                "multiplex": 0,
                "ovt": 0,
                "rtmp": 0,
                "rtsp": 0,
                "rtsppull": 0,
                "scheduled": 0,
                "srt": 0,
                "webrtc": 0
            },
            "lastRecvTime": "2025-06-17T18:31:31.787+09:00",
            "lastThroughputIn": 0,
            "maxThroughputIn": 0,
            "totalBytesIn": 0
        },
        "publishers": {
            "avgThroughputOut": 0,
            "connections": {
                "file": 0,
                "hlsv3": 0,
                "llhls": 0,
                "ovt": 0,
                "push": 0,
                "srt": 0,
                "thumbnail": 0,
                "webrtc": 0
            },
            "lastSentTime": "2025-06-17T18:31:31.787+09:00",
            "lastThroughputOut": 0,
            "maxThroughputOut": 0,
            "maxTotalConnectionTime": "2025-06-17T18:31:31.787+09:00",
            "maxTotalConnections": 0,
            "totalBytesOut": 0,
            "totalConnections": 0
        }
    },
    "statusCode": 200
}
```

</details>

<details>

<summary><span class="http-method http-method-401">401</span> Unauthorized</summary>

Authentication required

**Header**

```http
WWW-Authenticate: Basic realm=”OvenMediaEngine”
```

**Body**

```json
{
    "message": "[HTTP] Authorization header is required to call API (401)",
    "statusCode": 401
}
```

</details>

<details>

<summary><span class="http-method http-method-404">404</span> Not Found</summary>

The given vhost name could not be found.

**Body**

```json
{
    "message": "[HTTP] Could not find the virtual host: [default1] (404)",
    "statusCode": 404
}
```

</details>

## Get Statistics of Application

> **Request**

<details>

<summary><span class="http-method http-method-get">GET</span> /v2/stats/current/vhosts/&#x7B;vhost&#x7D;/apps/&#x7B;app&#x7D;</summary>

**Header**

```http
Authorization: Basic {credentials}

# Authorization
    Credentials for HTTP Basic Authentication created with <AccessToken>
```

</details>

> **Responses**

<details>

<summary><span class="http-method http-method-200">200</span> Ok</summary>

The request has succeeded

**Header**

```
Content-Type: application/json
```

**Body**

```json
{
    "message": "OK",
    "response": {
        "createdTime": "2025-06-17T18:31:31.788+09:00",
        "lastUpdatedTime": "2025-06-17T18:31:31.788+09:00",
        "providers": {
            "avgThroughputIn": 0,
            "connections": {
                "file": 0,
                "mpegts": 0,
                "multiplex": 0,
                "ovt": 0,
                "rtmp": 0,
                "rtsp": 0,
                "rtsppull": 0,
                "scheduled": 0,
                "srt": 0,
                "webrtc": 0
            },
            "lastRecvTime": "2025-06-17T18:31:31.788+09:00",
            "lastThroughputIn": 0,
            "maxThroughputIn": 0,
            "totalBytesIn": 0
        },
        "publishers": {
            "avgThroughputOut": 0,
            "connections": {
                "file": 0,
                "hlsv3": 0,
                "llhls": 0,
                "ovt": 0,
                "push": 0,
                "srt": 0,
                "thumbnail": 0,
                "webrtc": 0
            },
            "lastSentTime": "2025-06-17T18:31:31.788+09:00",
            "lastThroughputOut": 0,
            "maxThroughputOut": 0,
            "maxTotalConnectionTime": "2025-06-17T18:31:31.788+09:00",
            "maxTotalConnections": 0,
            "totalBytesOut": 0,
            "totalConnections": 0
        }
    },
    "statusCode": 200
}
```

</details>

<details>

<summary><span class="http-method http-method-401">401</span> Unauthorized</summary>

Authentication required

**Header**

```http
WWW-Authenticate: Basic realm=”OvenMediaEngine”
```

**Body**

```json
{
    "message": "[HTTP] Authorization header is required to call API (401)",
    "statusCode": 401
}
```

</details>

<details>

<summary><span class="http-method http-method-404">404</span> Not Found</summary>

The given vhost or application name could not be found.

**Body**

```json
{
    "message": "[HTTP] Could not find the application: [default/app1] (404)",
    "statusCode": 404
}
```

</details>

## Get Statistics of Stream

> **Request**

<details>

<summary><span class="http-method http-method-get">GET</span> /v2/stats/current/vhosts/&#x7B;vhost&#x7D;/apps/&#x7B;app&#x7D;/streams/&#x7B;stream&#x7D;</summary>

**Header**

```http
Authorization: Basic {credentials}

# Authorization
    Credentials for HTTP Basic Authentication created with <AccessToken>
```

</details>

> **Responses**

<details>

<summary><span class="http-method http-method-200">200</span> Ok</summary>

The request has succeeded

**Header**

```
Content-Type: application/json
```

**Body**

```json
{
    "message": "OK",
    "response": {
        "createdTime": "2025-06-17T18:33:21.697+09:00",
        "lastUpdatedTime": "2025-06-17T18:33:24.459+09:00",
        "providers": {
            "avgThroughputIn": 2664424,
            "connections": {
                "file": 0,
                "mpegts": 0,
                "multiplex": 0,
                "ovt": 0,
                "rtmp": 0,
                "rtsp": 0,
                "rtsppull": 0,
                "scheduled": 0,
                "srt": 0,
                "webrtc": 1
            },
            "lastRecvTime": "2025-06-17T18:33:24.459+09:00",
            "lastThroughputIn": 333053,
            "maxThroughputIn": 2664424,
            "totalBytesIn": 855296
        },
        "publishers": {
            "avgThroughputOut": 0,
            "connections": {
                "file": 0,
                "hlsv3": 0,
                "llhls": 0,
                "ovt": 0,
                "push": 0,
                "srt": 0,
                "thumbnail": 0,
                "webrtc": 0
            },
            "lastSentTime": "2025-06-17T18:33:21.697+09:00",
            "lastThroughputOut": 0,
            "maxThroughputOut": 0,
            "maxTotalConnectionTime": "2025-06-17T18:33:21.697+09:00",
            "maxTotalConnections": 0,
            "totalBytesOut": 0,
            "totalConnections": 0
        }
    },
    "statusCode": 200
}
```

</details>

<details>

<summary><span class="http-method http-method-401">401</span> Unauthorized</summary>

Authentication required

**Header**

```http
WWW-Authenticate: Basic realm=”OvenMediaEngine”
```

**Body**

```json
{
    "message": "[HTTP] Authorization header is required to call API (401)",
    "statusCode": 401
}
```

</details>

<details>

<summary><span class="http-method http-method-404">404</span> Not Found</summary>

The given vhost or application or stream name could not be found.

**Body**

```json
{
    "message": "[HTTP] Could not find the stream: [default/#default#app/stream] (404)",
    "statusCode": 404
}
```

</details>
