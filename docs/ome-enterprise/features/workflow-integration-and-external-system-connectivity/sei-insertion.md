---
title: SEI Insertion
description: "Insert Supplemental Enhancement Information (SEI) into OvenMediaEngine Enterprise live video at frame-level precision."
enterprise_only: true
sidebar_position: 128
---

OvenMediaEngine can insert Supplemental Enhancement Information (SEI) into live streams to deliver custom data with video content at frame-level precision.

## Overview

* You can insert SEI dynamically through the OvenMediaEngine's Send Event API or continuously through XML configuration.
* When inserting SEI, you can add custom data, and the inserted SEI automatically includes `UUID` and `Timestamp`.
  * The inserted SEI is generated in OvenMediaEngine-specific format containing UUID, Timestamp, and custom data.
* OvenPlayer can receive SEI inserted by OvenMediaEngine and provides functionality to automatically parse the SEI specification defined by OvenMediaEngine.

## Inserting SEI via the Send Event API

### API Interface

You can use OvenMediaEngine's SendEvent REST API to dynamically trigger events that insert SEI into streams.

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
    "eventFormat": "sei",
    "eventType": "video",
    "events": [
        {
            "seiType": "UserDataUnregistered",
            "data": "OvenMediaEngine"
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
      "eventFormat": "sei",
      "eventType": "video",
      "events": [
          {
              "seiType": "UserDataUnregistered",
              "data": "OvenMediaEngine"
          }
      ]
  }
]
```

</details>

<table><thead><tr><th width="191">Parameter</th><th width="100">Required</th><th>Description</th></tr></thead><tbody><tr><td>`eventFormat`</td><td>Y</td><td>Specifies the event format (use `sei` format).</td></tr><tr><td>`eventType`</td><td>N</td><td><p>Specifies the event type.</p><ul><li>Default: `video`</li></ul></td></tr><tr><td>`events`</td><td>Y</td><td>Contains event data values.</td></tr><tr><td>`event.seiType`</td><td>N</td><td><p>Specifies SEI type.</p><ul><li>Default: `UserDataUnregistered`</li></ul></td></tr><tr><td>`event.data`</td><td>Y</td><td>Enter the actual data to be transmitted.</td></tr></tbody></table>

#### Response

<details>

<summary><span class="http-method http-method-200">200</span> Ok</summary>

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

**Header**

```http
Content-Type: application/json
```

**Body**


```json
<strong>{
</strong>    "message": "eventFormat(string) and events(array) are required",
    "statusCode": 400
}
```



```json
<strong>{
</strong>    "message": "eventFormat is not supported: [XXX]",
    "statusCode": 400
}
```



```json
<strong>{
</strong>    "message": "Could not make events data",
    "statusCode": 400
}
```



```json
<strong>{
</strong>    "message": "eventType must be string",
    "statusCode": 400
}
```



```json
<strong>{
</strong>    "message": "eventType is not supported: [XXX]",
    "statusCode": 400
}
```


</details>

<details>

<summary><span class="http-method http-method-500">500</span> Internal Server Error</summary>

**Header**

```http
Content-Type: application/json
```

**Body**

```json
{
    "message": "Could not inject event: [XXX]",
    "statusCode": 500
}
```

</details>

## Inserting SEI through XML Configuration

For scenarios requiring continuous SEI insertion, you can configure this behavior through XML configuration. Create an XML file defining SEI insertion events and enable `EventGenerator` in `Server.xml`.

### Configuration Example

**Server.xml:** You can enable the EventGenerator functionality for SEI insertion by adding `<Application><EventGenerator>`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Server version="8">
  ...
  <VirtualHosts>
    <VirtualHost>
      <Applications>
        <Application>
          ...
          <EventGenerator>
            <Enable>true</Enable>
            <Path>events/send_event_info.xml</Path>
          </EventGenerator>
        </Application>
      </Applications>
    </VirtualHost>
  </VirtualHosts>
</Server>
```

<table><thead><tr><th width="133">Element</th><th width="100">Required</th><th>Description</th></tr></thead><tbody><tr><td><code>&#x3C;Enable></code></td><td>Y</td><td><p>Sets activation status to `true` or `false`.</p><ul><li>Default: `false`</li></ul></td></tr><tr><td><code>&#x3C;Path></code></td><td>Y</td><td>Sets the path to the XML file defining SEI insertion details. If a relative path is specified, the directory containing the `Server.xml` file is used as the base.</td></tr></tbody></table>

**XML Defining SEI Insertion Events:** Create an XML file defining SEI insertion events at the path specified in `Server.xml`. In this example, it's `send_event_info.xml`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<EventInfo>
  <Event>
    <Enable>true</Enable>
    <SourceStreamName>stream*</SourceStreamName>
    <Interval>2000</Interval>
    <EventFormat>sei</EventFormat>
    <EventType>video</EventType>
    <Values>
      <SeiType>UserDataUnregistered</SeiType>
      <Data>Hi! OvenMediaEngine! CurrentTime:${EpochTime}</Data>
      <KeyframeOnly>true</KeyframeOnly>
    </Values>
  </Event>
</EventInfo>
```

<table><thead><tr><th width="234">Parameter</th><th width="100">Required</th><th>Description</th></tr></thead><tbody><tr><td><code>&#x3C;Enable></code></td><td>Y</td><td><p>Sets activation status to `true` or `false`.</p><ul><li>Default: `false`</li></ul></td></tr><tr><td><code>&#x3C;SourceStreamName></code></td><td>Y</td><td><p>Specifies the target stream name.</p><ul><li>It supports wildcards (`*`) for pattern matching.</li></ul></td></tr><tr><td><code>&#x3C;Interval></code></td><td>Y</td><td>Sets event occurrence interval in milliseconds (ms).</td></tr><tr><td><code>&#x3C;EventFormat></code></td><td>Y</td><td>Specifies event format (use `sei` format).</td></tr><tr><td><code>&#x3C;EventType></code></td><td>N</td><td><p>Specifies the event type.</p><ul><li>Default: `video`</li></ul></td></tr><tr><td><code>&#x3C;Values></code></td><td>Y</td><td>Contains the value of the event data.</td></tr><tr><td><code>&#x3C;Values>&#x3C;SeiType></code></td><td>N</td><td><p>Specifies SEI type.</p><ul><li>Default: `UserDataUnregistered`</li></ul></td></tr><tr><td><code>&#x3C;Values>&#x3C;Data></code></td><td>Y</td><td><p>Specifies custom data to be inserted into SEI.</p><ul><li>It supports the macro `${EpochTime}`, which is replaced with the server's current epoch time in milliseconds when transmitted (e.g., 1747147513056).</li></ul></td></tr><tr><td><code>&#x3C;Values>&#x3C;KeyframeOnly></code></td><td>N</td><td><p>Specifies the target for event insertion. If set to `true`, the event will be inserted into the first keyframe after the specified interval has passed (Supported from version 0.18.2.0+).</p><ul><li>Default: `false`</li></ul></td></tr></tbody></table>


:::info

Changes made to the event definition XML file are immediately applied without needing to restart OvenMediaEngine.

:::


## OvenMediaEngine-Specific SEI Payload Format

The payload of SEI generated by OvenMediaEngine always includes UUID and Timestamp values in the following structure:

```
0                   1                   2                   3
0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| uuid_iso_iec_11578(128)                                       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| Timestamp (64)                                                |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| Data (Payload Size - UUID(128) - Timestamp(64))               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| ...                                                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

<table><thead><tr><th width="133">Field</th><th width="186">Size (bits)</th><th>Description</th></tr></thead><tbody><tr><td>UUID</td><td>128</td><td>Indicates that the SEI Payload follows OvenMediaEngine's specification. Always set to `464d4c47-5241-494e-434f-4c4f554201`</td></tr><tr><td>Timestamp</td><td>64</td><td>Epoch time in milliseconds</td></tr><tr><td>Data</td><td>Varies depending on custom data</td><td>Custom data</td></tr></tbody></table>

## Receiving SEI Data

OvenPlayer can parse SEI inserted by OvenMediaEngine and pass the included UUID, Timestamp, and custom data to the application.

### Code Example

```javascript
var player = OvenPlayer.create('player', {
  sources: [
    {
      type: 'webrtc', // Playing WebRTC stream
      file: 'wss://[YOUR_OvenMediaEngine]:3333/app/stream'
    }
  ],
  parseStream: {
    enabled: true // Enable H.264 NAL parsing
  }
});

function toAsciiString(byteArray) {
  return String.fromCharCode.apply(null, byteArray);
}

player.on('metaData', function (metadata) {
  console.log('MetaData:', metadata);
  /* Output:
    {
      type: 'sei',
      nalu: Unit8Array(33),
      sei: {
        type: 5,
        size: 39,
        payload: Unit8Array(39)
      },
      registered: true,
      uuid: '464d4c47-5241-494e-434f-4c4f-55524201',
      timecode: 1739851602778,
      userdata: Unit8Array(15)
    }
  */

  console.log(`Convert user data to string: ${toAsciiString(metadata.userdata)}`);
  /* Output:
    Convert user data to string: OvenMediaEngine
  */
});
```

**Player Initialization**:

* Call `OvenPlayer.create()` function to create a player in the specified div.
* Specify the stream type and URL in the `sources` array. SEI is only supported in WebRTC streams.
* Enable H.264 Network Abstraction Layer (NAL) parsing through `parseStream.enabled: true` setting. This is required for SEI metadata processing.

**SEI Data Processing**:

* Register a `player.on('metaData', callback)` event listener to process SEI whenever it is received.
* You can obtain the UUID, Timestamp, and custom data inserted by OvenMediaEngine from the event callback parameter.

**metaData Event Callback Parameters**

<table><thead><tr><th width="158">Field</th><th>Description</th></tr></thead><tbody><tr><td>`type`</td><td>Always set to `sei`, indicating this is SEI metadata</td></tr><tr><td>`nalu`</td><td>Uint8Array containing raw Network Abstraction Layer Unit (NALU) data of the SEI</td></tr><tr><td>`sei`</td><td><p>SEI parsing result containing the following sub-fields:</p><ul><li>`type`: SEI type</li><li>`size`: Payload size</li><li>`payload`: Raw SEI payload data (Uint8Array)</li></ul></td></tr><tr><td>`registered`</td><td>Indicates whether the SEI was generated in the format defined by OvenMediaEngine. If true, the following additional fields are included</td></tr><tr><td>`uuid`</td><td>(when registered=true) Unique identifier inserted by OvenMediaEngine into the SEI</td></tr><tr><td>`timecode`</td><td>(when registered=true) Timestamp (milliseconds) when the SEI was inserted</td></tr><tr><td>`userdata`</td><td>(when registered=true) Uint8Array containing custom data. This data should be parsed according to the application's requirements</td></tr></tbody></table>

## Appendix: Installing OvenPlayer

OvenPlayer version 0.10.39 and later can receive SEI data included in the video during WebRTC stream playback.

1. OvenPlayer can be downloaded from the [OvenPlayer GitHub](https://github.com/AirenSoft/OvenPlayer/releases/tag/v0.10.39).
2. After extracting the downloaded file, copy all the files in the `dist` directory to your project's library folder:

```
├─.github
├─demo
├─dist
│      ovenplayer.js
│      ovenplayer.js.map
│      RTCTransformWorker.worker.worker.js
│      RTCTransformWorker.worker.worker.js.map
├─docs
├─packages
└─src
```

Key files to copy:

* `ovenplayer.js`: OvenPlayer core library
* `RTCTransformWorker.worker.worker.js`: Worker script for WebRTC processing


:::info

Due to Web Worker CORS policy, `ovenplayer.js` must be self-hosted, and the `RTCTransformWorker.worker.worker.js` file must exist in the same path as `ovenplayer.js`.

:::

