---
title: Ad Markers
sidebar_position: 130
---

## CUE-OUT/IN

#### For LL-HLS/HLS

You can dynamically insert Ad Markers into LL-HLS and HLS playlists using the REST API.

When requesting the CUE-OUT event, the following tags will be added to the playlist:

```
#EXT-X-CUE-OUT:DURATION=<time>
…
#EXT-X-CUE-IN
```

<table><thead><tr><th width="175">Element</th><th>Description</th></tr></thead><tbody><tr><td>`#EXT-X-CUE-OUT`,<br />`#EXT-X-CUE-IN`</td><td>`#EXT-X-CUE-OUT` and `#EXT-X-CUE-IN` are a pair, and the entire section between the two tags will be replaced with ad content by the ad server</td></tr><tr><td><code>DURATION=&#x3C;time></code></td><td><code>DURATION=&#x3C;time></code> is required and represents the duration of the ad.</td></tr></tbody></table>

You can request the CUE-IN event to end an inserted ad early. When the event is called, the `#EXT-X-CUE-IN` tag is immediately added to the playlist, and the previously added `#EXT-X-CUE-IN` tag is removed.

### API Interface

**Request**

<details>

<summary><span class="http-method http-method-post">POST</span> /v1/vhosts&#x7B;vhost&#x7D;/apps/&#x7B;app&#x7D;/streams/&#x7B;stream&#x7D;:sendEvent</summary>

**Header**

```http
Authorization: Basic {credentials}

# Authorization
Credentials for HTTP Basic Authentication created with <AccessToken>
```

**Body**

```json
{
  "eventFormat": "cue",
  "events":[
    {
      "cueType": "out", // out | in
      "duration": 60500 // milliseconds, only available when cueType is out
    }
  ]
}
```

</details>

<details>

<summary><span class="http-method http-method-post">POST</span> /v1/vhosts&#x7B;vhost&#x7D;/apps/&#x7B;app&#x7D;/streams/&#x7B;stream&#x7D;:sendEvents</summary>

**Header**

```http
Authorization: Basic {credentials}

# Authorization
Credentials for HTTP Basic Authentication created with <AccessToken>
```

**Body**

```json
[
  {
    "eventFormat": "id3v2",
    "eventType": "video", // "eventTarget": "video" is same
    "events":[
      {
        "frameType": "TXXX",
        "info": "AirenSoft",
        "data": "OvenMediaEngine"
      },
      {
        "frameType": "TIT2",
        "data": "OvenMediaEngine 123"
      }
    ]
  },
  {
    "eventFormat": "cue",
    "events":[
      {
        "cueType": "out", // out | in
        "duration": 60500 // milliseconds, only available when cueType is out
      }
    ]
  }
]
```

</details>

**Responses**

<details>

<summary><span class="http-method http-method-200">200</span> Ok</summary>

The request has succeeded

**Header**

```http
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

<summary><span class="http-method http-method-400">400</span> Bad Request</summary>

Invalid request. Body is not a Json Object or does not have a required value

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

The given vhost name or application name could not be found.

**Body**

```json
{
    "message": "[HTTP] Could not find the application: [default/app2] (404)",
    "statusCode": 404
}
```

</details>

## SCTE-35 Event Insertion

#### For LL-HLS/HLS

Using the REST API, you can insert ad markers into LL-HLS and HLS playlists as `#EXT-X-DATERANGE` tags. `#EXT-X-DATERANGE` specifies ad timing via the SCTE-35 OUT/IN attributes.

#### For SRT Push

Starting with OvenMediaEngine Enterprise 0.20.0.0-1, you can insert SCTE-35 events (`splice_insert()`) not only into LL-HLS and HLS playlists, but also into SRT Push. When you send ad start/end signals (OUT/IN) or other custom events to OvenMediaEngine Enterprise via the `sendEvents` API, the information is inserted into the SRT Push and propagated to other systems.

### Behavior Rule

1. When an `OUT` event is received, an `IN` is automatically scheduled after the specified `duration` (ms) elapses.
2. If an `IN` is inserted before the duration expires, the previously auto-inserted `IN` is removed.


:::warning

Some downstream devices may fail to detect a return from ad break. We recommend sending an `IN` event after an `OUT` event.

:::


### API Interface

**Request**

<details>

<summary><span class="http-method http-method-post">POST</span> /v1/vhosts&#x7B;vhost&#x7D;/apps/&#x7B;app&#x7D;/streams/&#x7B;stream&#x7D;:sendEvent</summary>

**Header**

```http
Authorization: Basic {credentials}

# Authorization
Credentials for HTTP Basic Authentication created with <AccessToken>
```

**Body**

```json
{
  "eventFormat": "scte35",
  "events":[
    {
      "id": {{randomId}}, // required, 32bits unsigned number, auto filled if not present
      "type": "out", // required, out | in
      "duration": 10000 // milliseconds, only available when cueType is out
    }
  ]
}
```

</details>

<details>

<summary><span class="http-method http-method-post">POST</span> /v1/vhosts&#x7B;vhost&#x7D;/apps/&#x7B;app&#x7D;/streams/&#x7B;stream&#x7D;:sendEvents</summary>

**Header**

```http
Authorization: Basic {credentials}

# Authorization
Credentials for HTTP Basic Authentication created with <AccessToken>
```

**Body**

```json
[
  {
    "eventFormat": "scte35",
    "events":[
      {
        "spliceCommand": "spliceInsert",
        "id": {{randomId}}, // required, 32bits unsigned number, auto filled if not present
        "type": "out", // required, out | in
        "duration": 30000 // milliseconds, only available when cueType is out
      }
    ]
  }
]
```

</details>


:::info

You enter `duration` in milliseconds (ms), but it is emitted to the playlist as `PLANNED-DURATION` in seconds (s).

:::


**Responses**

<details>

<summary><span class="http-method http-method-200">200</span> Ok</summary>

The request has succeeded

**Header**

```http
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

<summary><span class="http-method http-method-400">400</span> Bad Request</summary>

Invalid request. Body is not a JSON object or does not have a required value

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

The given vhost name or application name could not be found.

**Body**

```json
{
    "message": "[HTTP] Could not find the application: [default/app2] (404)",
    "statusCode": 404
}
```

</details>

### Example: Successful Event Insertion

#### For LL-HLS/HLS

Below is an LL-HLS playlist sample after injecting an SCTE-35 event:

```
#EXT-X-DATERANGE:ID="123",START-DATE="2025-01-01T09:15:00+00:00",PLANNED-DURATION=10.0,SCTE35-OUT=0xF...
...
#EXT-X-DATERANGE:ID="123",START-DATE="2025-01-01T09:15:00+00:00",SCTE35-IN=0xF
```

<table><thead><tr><th width="175">Element</th><th>Description</th></tr></thead><tbody><tr><td>`SCTE35-OUT`</td><td>SCTE-35 payload indicating the start of the ad break (content → ad).</td></tr><tr><td>`SCTE35-IN`</td><td>SCTE-35 payload indicating the end of the ad break (ad → content).</td></tr><tr><td>`PLANNED-DURATION`</td><td>Ad break duration in seconds. When used with `OUT`, an IN is auto-inserted after this time.</td></tr><tr><td>`ID`</td><td><p>An identifier that ties the OUT/IN to the same break.</p><p>*  32-bit unsigned integer.</p></td></tr><tr><td>`START-DATE`</td><td>Ad start timestamp (ISO-8601).<br />* yyyy-mm-ddThh:mm:ss±UTC</td></tr></tbody></table>

#### For SRT Push

If the OvenMediaEngine Enterprise log shows output similar to the example below, the SCTE-35 event was delivered successfully.

```
[11-03 21:29:02.028] D [SW-Push:2415407] FFmpegWriter | writer.cpp:523  | SCTE-35 Event: SpliceCommandType=5, ID=2025, OutOfNetwork=true, Timestamp=372370 ms, Duration=30000 ms, AutoReturn=false
```
