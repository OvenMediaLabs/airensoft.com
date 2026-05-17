---
title: Queues
enterprise_only: true
sidebar_position: 168
---

We provide an API to monitor the status of the Packet/Frame-type queues located in the Provider, Media Router, Transcoder, and Publisher sections.

## Get Queues Status

> **Request**

<details>

<summary><span class="http-method http-method-get">GET</span> /v2/internals/queues</summary>

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
        {
            "avgWaitingTime": 13,
            "drop": 0,
            "id": 100,
            "inputPerSecond": 154,
            "outputPerSecond": 153,
            "peak": 15,
            "size": 1,
            "threshold": 1000,
            "type": "std::shared_ptr<MediaRouteStream>",
            "urn": "mngq:v=#default#app:p=imr:n=aw_0"
        },
        {
            "avgWaitingTime": 31,
            "drop": 0,
            "id": 101,
            "inputPerSecond": 472,
            "outputPerSecond": 472,
            "peak": 74,
            "size": 1,
            "threshold": 1000,
            "type": "std::shared_ptr<MediaRouteStream>",
            "urn": "mngq:v=#default#app:p=omr:n=aw_0"
        },
        {
            "avgWaitingTime": 3,
            "drop": 0,
            "id": 102,
            "inputPerSecond": 467,
            "outputPerSecond": 467,
            "peak": 43,
            "size": 1,
            "threshold": 500,
            "type": "std::shared_ptr<pub::ApplicationWorker::StreamData>",
            "urn": "mngq:v=#default#app:p=pub:n=aw-webrtc0"
        },
        {
            "avgWaitingTime": 4,
            "drop": 0,
            "id": 103,
            "inputPerSecond": 476,
            "outputPerSecond": 476,
            "peak": 44,
            "size": 1,
            "threshold": 500,
            "type": "std::shared_ptr<pub::ApplicationWorker::StreamData>",
            "urn": "mngq:v=#default#app:p=pub:n=aw-llhls0"
        },
        {
            "avgWaitingTime": 3,
            "drop": 0,
            "id": 104,
            "inputPerSecond": 467,
            "outputPerSecond": 467,
            "peak": 43,
            "size": 1,
            "threshold": 500,
            "type": "std::shared_ptr<pub::ApplicationWorker::StreamData>",
            "urn": "mngq:v=#default#app:p=pub:n=aw-ovt0"
        },
        ...
    ]
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

#### Element

<table><thead><tr><th width="156">Element</th><th>Description</th></tr></thead><tbody><tr><td>avgWaitingTime</td><td>The average waiting time.</td></tr><tr><td>drop</td><td>The number of dropped messages.</td></tr><tr><td>id</td><td>A unique identifier.</td></tr><tr><td>inputPerSecond</td><td>The number of incoming messages per second.</td></tr><tr><td>outputPerSecond</td><td>The number of outgoing messages per second.</td></tr><tr><td>peak</td><td>The maximum number of messages reached.</td></tr><tr><td>size</td><td>The current number of messages.</td></tr><tr><td>threshold</td><td>The limit for the number of messages.</td></tr><tr><td>type</td><td>The type of data.</td></tr><tr><td>urn</td><td>The naming convention in URN (Uniform Resource Name) form.</td></tr></tbody></table>

#### Queue Resource Naming (URN) Specification

```
[URN Pattern]
	- mngq:v={VhostName}#{AppName}[s=/{StreamName}]:p={PART}:r={ROLE}
[PART]
	- pvd: provider
	- imr: mediarouter(inbound)
	- trs: transcoder
	- omr: mediarouter(outbound)
	- pub: publisher
[ROLE]
	- filter_{video|audio}
	- encoder_{codec_name}_{trackid}
	- decoder_{codec_name}_{trackid}
	- appworker_[{protocol}]_{id}
	- stremworker_[{protocol}]_{id}
	
<Examples>
	- mngq:v=#default#app:s=stream:p=trs:r=decoer_h264_0
	- mngq:v=#default#app:s=stream:p=trs:r=filter_video
	- mngq:v=#default#app:s=stream:p=trs:r=filter_audio
	- mngq:v=#default#app:s=stream:p=trs:r=encoder_opus_0
	- mngq:v=#default#app:s=stream:p=trs:r=encoder_h264_1
	- mngq:v=#default#app:p=imr:r=indicator
	- mngq:v=#default#app:p=omr:r=appworker
```
