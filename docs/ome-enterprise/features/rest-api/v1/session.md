---
title: Session
description: "Manage named WebRTC playback sessions in OvenMediaEngine Enterprise through the v1 REST API."
enterprise_only: true
sidebar_position: 159
---

[Session Management](../../workflow-integration-and-external-system-connectivity/session-management-webrtc-only.md) assigns a unique session name to each WebRTC playback ("Session") and lets you manage sessions for operational convenience. The following API lets you list and terminate sessions connected to the Web Publisher:

## List of Sessions

> **Request**

<details>

<summary><span class="http-method http-method-get">GET</span> /v1/vhosts/&#x7B;vhost&#x7D;/apps/&#x7B;app&#x7D;/streams/&#x7B;stream&#x7D;/sessions</summary>

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
    "response": [
        "3925d357-59b3-4b4e-b217-81c9f71e4674"
    ],
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

The given vhost or app or stream name could not be found.

**Body**

```json
{
    "message": "[HTTP] Could not find the stream: [default/#default#app/nonexistent-stream] (404)",
    "statusCode": 404
}
```

</details>

## Force-terminate Session

> **Request**

<details>

<summary><span class="http-method http-method-delete">DELETE</span> /v1/vhosts/&#x7B;vhost&#x7D;/apps/&#x7B;app&#x7D;/streams/&#x7B;stream&#x7D;/sessions/&#x7B;session&#x7D;</summary>

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

The given session name could not be found.

**Body**

```json
{
    "message": "Not Found",
    "response": "Could not find the session",
    "statusCode": 404
}
```

</details>







