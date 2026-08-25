---
title: SEI Insertion
description: "Insert Supplemental Enhancement Information (SEI) into OvenMediaEngine Enterprise live video at frame-level precision."
enterprise_only: true
sidebar_position: 128
---

OvenMediaEngine inserts Supplemental Enhancement Information (SEI) into live streams to deliver custom data with the video at frame-level precision.

## Overview

Two types of SEI can be inserted. Which one you use depends on the data you need to deliver.

<table><thead><tr><th width="200">SEI type</th><th width="180">Configured through</th><th>Description</th></tr></thead><tbody><tr><td><strong>UserDataUnregistered</strong><br/>(type 5)</td><td>Send Event API<br/>XML configuration</td><td>Delivers data you define. The payload follows a predefined format -- UUID, Timestamp, then your data -- which OvenPlayer parses for you.</td></tr><tr><td><strong>PictureTiming</strong><br/>(type 1)</td><td>XML configuration</td><td>Delivers a SMPTE timecode in the field the H.264 specification defines for it. H.264 only.</td></tr></tbody></table>

:::info

`PictureTiming` is configured only in the EventGenerator XML. The Send Event API rejects it with
`400 Bad Request`.

:::

## Inserting SEI UserDataUnregistered

`UserDataUnregistered` (SEI type 5) carries data you define. The payload is wrapped in a
predefined format -- UUID, Timestamp, then your data -- so a consumer such as OvenPlayer can
identify the message and parse it. See [Predefined Payload Format](#predefined-payload-format).

Send one message at a time with the Send Event API, or repeatedly from the EventGenerator XML.

### Using the Send Event API

Use the SendEvent REST API to insert an SEI message into a running stream.

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

<table><thead><tr><th width="191">Parameter</th><th width="100">Required</th><th>Description</th></tr></thead><tbody><tr><td>`eventFormat`</td><td>Y</td><td>Specifies the event format (use `sei` format).</td></tr><tr><td>`eventType`</td><td>N</td><td><p>Specifies the event type.</p><ul><li>Default: `video`</li></ul></td></tr><tr><td>`events`</td><td>Y</td><td>Contains event data values.</td></tr><tr><td>`event.seiType`</td><td>N</td><td><p>Specifies SEI type. Only `UserDataUnregistered` is accepted here.</p><ul><li>Default: `UserDataUnregistered`</li></ul></td></tr><tr><td>`event.data`</td><td>Y</td><td><p>The data to transmit.</p><ul><li>Supports the `${EpochTime}` macro, replaced with the server's epoch time in milliseconds at insertion (e.g., 1747147513056).</li></ul></td></tr></tbody></table>

**Using the `${EpochTime}` Macro**

`${EpochTime}` in `event.data` is expanded when the SEI enters the stream, not when the request is
received, so the value is the insertion time.

```json
{
    "eventFormat": "sei",
    "eventType": "video",
    "events": [
        {
            "seiType": "UserDataUnregistered",
            "data": "Hi! OvenMediaEngine! CurrentTime:${EpochTime}"
        }
    ]
}
```

**Response**

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
{
    "message": "eventFormat(string) and events(array) are required",
    "statusCode": 400
}
```



```json
{
    "message": "eventFormat is not supported: [XXX]",
    "statusCode": 400
}
```



```json
{
    "message": "Could not make events data",
    "statusCode": 400
}
```



```json
{
    "message": "eventType must be string",
    "statusCode": 400
}
```



```json
{
    "message": "eventType is not supported: [XXX]",
    "statusCode": 400
}
```



```json
{
    "message": "Unknown seiType or Invalid format",
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

### Using XML Configuration

For continuous insertion, define the events in an XML file and enable `EventGenerator` in `Server.xml`.

**Server.xml:** Enable EventGenerator by adding `<Application><EventGenerator>`.

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

**Event definition XML:** Create the file at the path given in `Server.xml`. In this example, `send_event_info.xml`.

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

<table><thead><tr><th width="234">Parameter</th><th width="100">Required</th><th>Description</th></tr></thead><tbody><tr><td><code>&#x3C;Enable></code></td><td>Y</td><td><p>Sets activation status to `true` or `false`.</p><ul><li>Default: `false`</li></ul></td></tr><tr><td><code>&#x3C;SourceStreamName></code></td><td>Y</td><td><p>Specifies the target stream name.</p><ul><li>Supports wildcards (`*`).</li></ul></td></tr><tr><td><code>&#x3C;Interval></code></td><td>N</td><td><p>Sets event occurrence interval in milliseconds (ms).</p><ul><li>Omit it (or set 0) to send the event once per stream, at the start.</li></ul></td></tr><tr><td><code>&#x3C;EventFormat></code></td><td>Y</td><td>Specifies event format (use `sei` format).</td></tr><tr><td><code>&#x3C;EventType></code></td><td>N</td><td><p>Specifies the event type.</p><ul><li>Default: `video`</li></ul></td></tr><tr><td><code>&#x3C;Values></code></td><td>Y</td><td>Contains the value of the event data.</td></tr><tr><td><code>&#x3C;Values>&#x3C;SeiType></code></td><td>N</td><td><p>Specifies SEI type.</p><ul><li>Default: `UserDataUnregistered`</li></ul></td></tr><tr><td><code>&#x3C;Values>&#x3C;Data></code></td><td>Y</td><td><p>Specifies custom data to be inserted into SEI.</p><ul><li>Supports the `${EpochTime}` macro, replaced with the server's epoch time in milliseconds at insertion (e.g., 1747147513056).</li></ul></td></tr><tr><td><code>&#x3C;Values>&#x3C;KeyframeOnly></code></td><td>N</td><td><p>Specifies the target for event insertion. If set to `true`, the event will be inserted into the first keyframe after the specified interval has passed (Supported from version 0.18.2.0+).</p><ul><li>Default: `false`</li></ul></td></tr></tbody></table>


:::info

Changes to the event definition XML file are applied without a restart.

:::


### Predefined Payload Format

The payload always carries UUID and Timestamp values ahead of your data:

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

<table><thead><tr><th width="133">Field</th><th width="186">Size (bits)</th><th>Description</th></tr></thead><tbody><tr><td>UUID</td><td>128</td><td>Marks the payload as following this format. Always set to `464d4c47-5241-494e-434f-4c4f-55524201`</td></tr><tr><td>Timestamp</td><td>64</td><td>Epoch time in milliseconds</td></tr><tr><td>Data</td><td>Varies depending on custom data</td><td>Custom data</td></tr></tbody></table>


## Inserting SEI PictureTiming

`PictureTiming` (SEI type 1) writes a SMPTE timecode into the field the H.264 specification
reserves for it, so consumers read hours/minutes/seconds/frames from it directly.

The first stamped picture takes the time of day, and the timecode advances with the media clock
from there, so it does not drift. `<Timezone>` chooses which clock that first reading comes from.

The timecode is written whether the stream is transcoded or passed through.

:::info

**H.264 only.** H.265 moved the clock timestamps to a separate `time_code` SEI (payload type 136),
which is not implemented. On an H.265 track the event is ignored and a warning is logged.

:::

### Using XML Configuration

Set `<SeiType>` to `PictureTiming` in the XML file `<EventGenerator><Path>` points at. Enabling
`EventGenerator` in `Server.xml` is the same as for `UserDataUnregistered` above.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<EventInfo>
  <Event>
    <Enable>true</Enable>
    <SourceStreamName>stream*</SourceStreamName>
    <EventFormat>sei</EventFormat>
    <EventType>video</EventType>
    <Values>
      <SeiType>PictureTiming</SeiType>
      <Timezone>UTC</Timezone>
    </Values>
  </Event>
</EventInfo>
```

<table><thead><tr><th width="234">Parameter</th><th width="100">Required</th><th>Description</th></tr></thead><tbody><tr><td><code>&#x3C;Values>&#x3C;SeiType></code></td><td>Y</td><td>Set to `PictureTiming`.</td></tr><tr><td><code>&#x3C;Values>&#x3C;Timezone></code></td><td>N</td><td>Which clock the timecode starts from. `UTC` (the default), `Local`, or a fixed offset written `+09:00`, `-0500` or `+09`.</td></tr></tbody></table>

:::info

Leave `<Interval>` out. Every picture is stamped, so there is no insertion period to set, and
omitting it sends the event once per stream -- all a timecode needs.

Stamping then continues for the lifetime of the stream. Removing the event or setting
`<Enable>false</Enable>` does **not** affect a stream that is already running; restart it.

:::

### Choosing the Timezone

`<Timezone>` is read once, for the first picture of the stream. Later timecodes come off the media
clock, so the zone only moves the starting point.

<table><thead><tr><th width="234">Value</th><th>Meaning</th></tr></thead><tbody><tr><td><code>UTC</code></td><td>Coordinated Universal Time. The default, and what you get by leaving the element out. `Z` means the same.</td></tr><tr><td><code>Local</code></td><td>The zone the server process runs in, DST included.</td></tr><tr><td><code>+09:00</code></td><td>A fixed offset from UTC. `+0900` and `+09` mean the same, and the widest accepted offset is `+14:00`.</td></tr></tbody></table>

UTC is the default because it does not depend on where the stream runs. `Local` is only as good as
`TZ` on the process: containers often ship no zone, so it resolves to UTC anyway, and two nodes
configured differently stamp the same stream differently.

The sign is required and the minutes are not, so `+09:00`, `+0900` and `+09` are the same value.
`+00:00` is UTC. The widest offset accepted is `+14:00`; a value beyond that, or one that cannot be
read, is rejected when the file is loaded and the event is skipped with a warning naming the XML.

```xml
<Values>
  <SeiType>PictureTiming</SeiType>
  <Timezone>+09:00</Timezone>   <!-- Seoul, Tokyo -->
</Values>
```

A fixed offset does not observe daylight saving. `+09:00` (Seoul, Tokyo), `+05:30` (Mumbai),
`+05:45` (Kathmandu), `-03:00` (Sao Paulo) and `-05:00` (Bogota, Lima) are safe because those zones
do not shift. One that does -- Berlin at `+01:00` in winter and `+02:00` in summer, Los Angeles at
`-08:00` and `-07:00` -- will be an hour out for part of the year, so use `Local` with `TZ` set on
the process, or edit the offset when the zone shifts.

IANA names such as `Asia/Seoul` are rejected: resolving one would mean changing the process-wide
`TZ`, which is not safe while other threads are reading the clock.

The zone is per event and latched: each track reads it when its first picture arrives, so editing
`<Timezone>` afterwards does not move a running timecode.

:::info

SMPTE 12M carries a time of day and no zone, so nothing in the bitstream records which one was
used. A consumer that needs to know has to be told out of band.

:::

### Verifying the Timecode

`ffmpeg` decodes the SEI field by field, the quickest way to confirm what a consumer sees:

```bash
ffmpeg -i <stream_or_file> -c copy -bsf:v trace_headers -f null - 2>&1 | grep -A14 "Picture Timing"
```

```
Picture Timing
  pic_struct                 0000 = 0
  clock_timestamp_flag[0]       1 = 1
  ...
  n_frames               00010100 = 20
  seconds_value            111001 = 57
  minutes_value            110011 = 51
  hours_value               10011 = 19
```

If the `Picture Timing` section never appears, check `pic_struct_present_flag` in the SPS: when it
is 0, `ffmpeg` does not read the timecode.

```bash
ffmpeg -i <stream_or_file> -c copy -bsf:v trace_headers -f null - 2>&1 | grep pic_struct_present_flag
```



## OvenPlayer Integration

OvenPlayer parses the inserted SEI and passes the UUID, Timestamp, and custom data to your application.

:::info

SEI is delivered on WebRTC playback and requires OvenPlayer 0.10.39 or later. See the
[OvenPlayer Github](https://github.com/OvenMediaLabs/OvenPlayer) for installation.

Because of the Web Worker CORS policy, `ovenplayer.js` must be self-hosted, and
`RTCTransformWorker.worker.worker.js` must sit in the same directory as it. Both files are in the
`dist` directory of the release.

:::

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

* Call `OvenPlayer.create()` to create a player in the specified div.
* Specify the stream type and URL in the `sources` array. SEI is only supported in WebRTC streams.
* Enable H.264 Network Abstraction Layer (NAL) parsing with `parseStream.enabled: true`. It is required for SEI processing.

**SEI Data Processing**:

* Register a `player.on('metaData', callback)` listener to process each SEI as it arrives.
* The callback parameter carries the UUID, Timestamp, and custom data.

**metaData Event Callback Parameters**

<table><thead><tr><th width="158">Field</th><th>Description</th></tr></thead><tbody><tr><td>`type`</td><td>Always set to `sei`, indicating this is SEI metadata</td></tr><tr><td>`nalu`</td><td>Uint8Array containing raw Network Abstraction Layer Unit (NALU) data of the SEI</td></tr><tr><td>`sei`</td><td><p>SEI parsing result containing the following sub-fields:</p><ul><li>`type`: SEI type</li><li>`size`: Payload size</li><li>`payload`: Raw SEI payload data (Uint8Array)</li></ul></td></tr><tr><td>`registered`</td><td>Indicates whether the SEI follows the predefined payload format. If true, the following fields are included</td></tr><tr><td>`uuid`</td><td>(when registered=true) Unique identifier carried in the SEI</td></tr><tr><td>`timecode`</td><td>(when registered=true) Timestamp (milliseconds) when the SEI was inserted</td></tr><tr><td>`userdata`</td><td>(when registered=true) Uint8Array containing custom data, parsed according to the application's requirements</td></tr></tbody></table>
