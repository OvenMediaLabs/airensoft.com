---
title: Session
description: "Query named WebRTC playback session statistics in OvenMediaEngine Enterprise through the v1 REST API."
enterprise_only: true
sidebar_position: 158
---

[Session Management](../../../../workflow-integration-and-external-system-connectivity/session-management-webrtc-only.md) assigns a unique session name to each WebRTC playback ("Session") and lets you manage sessions for operational convenience. The following API retrieves per-session statistics:

## Get Statistics of Session

> **Request**

<details>

<summary><span class="http-method http-method-get">GET</span> /v1/stats/current/vhosts/&#x7B;vhost&#x7D;/apps/&#x7B;app&#x7D;/streams/&#x7B;stream&#x7D;/sessions/&#x7B;session&#x7D;</summary>

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
        "avgThroughputOut": 237284,
        "createdTime": "2025-10-28T12:12:30.567+09:00",
        "lastSentTime": "2025-10-28T12:12:35.504+09:00",
        "lastThroughputOut": 30345,
        "lastUpdatedTime": "2025-10-28T12:12:35.504+09:00",
        "maxThroughputOut": 240793,
        "totalBytesOut": 149971
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
WWW-Authenticate: Basic realm="OvenMediaEngine"
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

The given vhost or app or stream or session name could not be found.

**Body**

```json
{
    "message": "Not Found",
    "response": "Could not find the session",
    "statusCode": 404
}
```

</details>
