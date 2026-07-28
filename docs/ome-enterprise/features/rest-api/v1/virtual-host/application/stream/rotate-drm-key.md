---
title: Rotate DRM Key
description: "Move an OvenMediaEngine Enterprise DRM protected stream to its next content key through the v1 REST API."
enterprise_only: true
sidebar_position: 154
---

Moves a DRM protected stream to its next content key. The stream picks the key up where the next segment of each track starts, so nothing is cut and viewers keep playing across the change.

The stream has to state a `<KeyRotationPeriod>` in the [DRM info file](../../../../../access-control-and-security/digital-rights-management-drm/README.md). Stating `0` there asks for a stream that changes its key only through this API, while a period above `0` also changes it on its own and this API moves it on in between. A stream that has one key, or whose entry leaves the element out, keeps the key it has and says so in the server log.

> ### Request

<details>

<summary><span class="http-method http-method-post">POST</span> v1/vhosts/&#x7B;vhost&#x7D;/apps/&#x7B;app&#x7D;/streams/&#x7B;stream&#x7D;:rotateDrmKey</summary>

#### Header

```http
Authorization: Basic {credentials}

# Authorization
    Credentials for HTTP Basic Authentication created with <AccessToken>
```

#### Body

```json
{}
```

</details>

> ### Responses

<details>

<summary><span class="http-method http-method-200">200</span> Ok</summary>

The request has succeeded

#### **Header**

```
Content-Type: application/json
```

#### **Body**

```json
{
	"statusCode": 200,
	"message": "OK"
}

# statusCode
	Same as HTTP Status Code
# message
	A human-readable description of the response code
```

</details>

<details>

<summary><span class="http-method http-method-401">401</span> Unauthorized</summary>

Authentication required

#### **Header**

```http
WWW-Authenticate: Basic realm=”OvenMediaEngine”
```

#### **Body**

```json
{
    "message": "[HTTP] Authorization header is required to call API (401)",
    "statusCode": 401
}
```

</details>

<details>

<summary><span class="http-method http-method-404">404</span> Not Found</summary>

The given vhost name, app name or stream name could not be found.

#### **Body**

```json
{
    "statusCode": 404,
    "message": "Could not find stream: [default/app/non-exists] (404)"
}
```

</details>

<details>

<summary><span class="http-method http-method-500">500</span> Internal Server Error</summary>

The stream could not be told to rotate its key.

#### **Body**

```json
{
    "statusCode": 500,
    "message": "Internal Server Error - Could not inject RotateDrmKey event: [default/app/stream] (500)"
}
```

</details>
