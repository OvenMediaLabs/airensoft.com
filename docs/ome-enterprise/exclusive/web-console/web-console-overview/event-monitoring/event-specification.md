---
title: Event Specification
description: "OvenMediaEngine Enterprise event log file (events.log) specification and daily rolling behavior."
sidebar_position: 61
---

## Event Log File

When event logging is enabled, an event log file named `events.log` is created in the directory specified in the [configuration](configuration.md) and performs daily rolling in the format `events.log.YYYYMMDD`.

### Event Log File Example

```json
{"time":"2025-03-26T05:21:46.315+00:00","level":"Info","category":"StreamEvent","type":"StreamCreated","sourceId":"#default#app/push_rtmp","summary":"Stream created. Id: 103, StreamType: Rtmp, SourceUrl: TCP://172.17.0.1:44004"}
{"time":"2025-03-26T05:21:46.316+00:00","level":"Info","category":"StreamEvent","type":"StreamPrepared","sourceId":"#default#app/push_rtmp","summary":"Stream prepared. Id: 103, StreamType: Rtmp, SourceUrl: TCP://172.17.0.1:44004","snapshot":{"createdTime":"2025-03-26T05:21:46.315+00:00","name":"push_rtmp","sourceType":"Rtmp","sourceUrl":"TCP://172.17.0.1:44004","tracks":[{"id":0,"name":"Video","type":"Video","video":{"bitrate":"2500000","bitrateAvg":"0","bitrateConf":"2500000","bitrateLatest":"128503","bypass":false,"codec":"H264","deltaFramesSinceLastKeyFrame":0,"framerate":30.0,"framerateAvg":0.0,"framerateConf":30.0,"framerateLatest":0.0,"hasBframes":false,"height":1080,"keyFrameInterval":1.0,"keyFrameIntervalAvg":1.0,"keyFrameIntervalConf":0.0,"keyFrameIntervalLatest":0.0,"width":1920}},{"audio":{"bitrate":"160000","bitrateAvg":"0","bitrateConf":"160000","bitrateLatest":"-795170153","bypass":false,"channel":2,"codec":"AAC","samplerate":48000},"id":1,"name":"Audio","type":"Audio"},{"id":2,"name":"Data","type":"Data"}]}}
{"time":"2025-03-26T05:21:46.319+00:00","level":"Info","category":"StreamEvent","type":"PushPublishingStarted","sourceId":"#default#app/push_rtmp","summary":"PushPublishing started. Id: JwW9AM, Protocol: rtmp, Url: rtmp://192.168.0.234:52935/app/pushedRtmp, StreamKey: ","snapshot":{"app":"app","createdTime":"2025-03-26T05:21:46.319+00:00","finishTime":"1970-01-01T00:00:00.000+00:00","id":"JwW9AM","isConfig":true,"protocol":"rtmp","sentBytes":0,"sentTime":0,"sequence":0,"startTime":"1970-01-01T00:00:00.000+00:00","state":"ready","stream":{"name":"push_rtmp","trackIds":[],"variantNames":["video_h264_1080p","aac_audio"]},"totalsentBytes":0,"totalsentTime":0,"url":"rtmp://192.168.0.234:52935/app/pushedRtmp","vhost":"default"}}
{"time":"2025-03-26T05:21:47.114+00:00","level":"Info","category":"StreamEvent","type":"StreamCreated","sourceId":"#default#app/pushedRtmp","summary":"Stream created. Id: 104, StreamType: Rtmp, SourceUrl: TCP://172.17.0.1:48218"}
{"time":"2025-03-26T05:21:47.129+00:00","level":"Info","category":"StreamEvent","type":"StreamPrepared","sourceId":"#default#app/pushedRtmp","summary":"Stream prepared. Id: 104, StreamType: Rtmp, SourceUrl: TCP://172.17.0.1:48218","snapshot":{"createdTime":"2025-03-26T05:21:47.114+00:00","name":"pushedRtmp","sourceType":"Rtmp","sourceUrl":"TCP://172.17.0.1:48218","tracks":[{"id":0,"name":"Video","type":"Video","video":{"bitrate":"4906000","bitrateAvg":"0","bitrateConf":"4906000","bitrateLatest":"1059802151","bypass":false,"codec":"H264","deltaFramesSinceLastKeyFrame":0,"framerate":30.0,"framerateAvg":0.0,"framerateConf":30.0,"framerateLatest":0.0,"hasBframes":false,"height":1080,"keyFrameInterval":0.0,"keyFrameIntervalAvg":0.0,"keyFrameIntervalConf":0.0,"keyFrameIntervalLatest":0.0,"width":1920}},{"audio":{"bitrate":"125000","bitrateAvg":"0","bitrateConf":"125000","bitrateLatest":"1059802151","bypass":false,"channel":2,"codec":"AAC","samplerate":48000},"id":1,"name":"Audio","type":"Audio"},{"id":2,"name":"Data","type":"Data"}]}}
```

### Event Log JSON

Event logs record event information in `JSON` format, and the meaning of each field is as follows.

<table><thead><tr><th width="107">Field</th><th width="90">Optional</th><th>Description</th></tr></thead><tbody><tr><td>`time`</td><td>N</td><td>Records the time when the event occurred in ISO 8601 format.</td></tr><tr><td>`level`</td><td>N</td><td>Records the level of the event.</td></tr><tr><td>`category`</td><td>N</td><td>Records the major classification of the event. Major classifications are `Server Events`, `Virtual Host Events`, `Application Events`, `Stream Events`, `Rest API Call Events`, and `Access Control Events`.</td></tr><tr><td>`type`</td><td>N</td><td>Records the type of event. Event types according to event categories can be found in the <a href="event-specification.md#event-categories-and-types">Event Categories and Types</a> section.</td></tr><tr><td>`sourceId`</td><td>N</td><td>Records the ID of the source that generated the event. Source types are `Server`, `Virtual Host`, `Application`, and `Stream`.</td></tr><tr><td>`summary`</td><td>N</td><td>Summarizes the content of the event in one line.</td></tr><tr><td>`cause`</td><td>Y</td><td>Certain events record the cause of the event occurrence.</td></tr><tr><td>`snapshot`</td><td>Y</td><td>Certain events record detailed information at the time of occurrence in `JSON` format.</td></tr></tbody></table>

## Event Levels

Events are classified into the following levels according to severity.

<table><thead><tr><th width="119">Level</th><th>Description</th></tr></thead><tbody><tr><td>`Trace`</td><td>Events for checking the detailed flow of functional operations.</td></tr><tr><td>`Debug`</td><td>Events for checking detailed information about functional operations and state changes.</td></tr><tr><td>`Info`</td><td>Events that occur during general functional operations and state changes (most events).</td></tr><tr><td>`Warning`</td><td>Events that occur in error situations but do not affect functional operation.</td></tr><tr><td>`Error`</td><td>Events that occur during serious problems or functional malfunctions.</td></tr></tbody></table>

## Event Source IDs

An ID expressed in `URI` format that allows you to check the origin of the source that generated the event. The format of the ID may vary depending on the type of source as follows:

<table><thead><tr><th width="119">Source ID</th><th>Description</th></tr></thead><tbody><tr><td>Server</td><td><p>The OvenMediaEngine server ID is stored.</p><ul><li>e.g.: `6add8be3-181f-4c4b-bc4e-xxxxxxxxxxxx`</li></ul><p></p></td></tr><tr><td>Virtual Host</td><td><p>The name of the virtual host is stored.</p><ul><li>e.g.: `default`</li></ul></td></tr><tr><td>Application</td><td><p> `#{virtual_host_name}#{app_name}` format is stored.</p><ul><li>e.g.: `#default#app`</li></ul></td></tr><tr><td>Stream</td><td><p>`#{virtual_host_name}#{app_name}/{stream_name}` format is stored.</p><ul><li>e.g.: `#default#app/stream`</li></ul></td></tr></tbody></table>

## Event Categories and Types

Event logs are classified by category and type.


:::info

Event categories and types for monitoring will be continuously added.

:::


### Server Events (`ServerEvent`)

<table><thead><tr><th width="140">Event Type</th><th width="349">Description</th><th>Event Level</th><th>Snapshot</th></tr></thead><tbody><tr><td>`ServerStarted`</td><td>Server start event (server name, server version)</td><td>Info</td><td>Server configuration information</td></tr><tr><td>`InternalQueueCongestion`</td><td><p>Internal queue congestion (queue information)</p><ul><li>Supported version: 0.18.1.2+</li></ul></td><td>Info</td><td>N/A</td></tr></tbody></table>

### Virtual Host Events (`HostEvent`)

<table><thead><tr><th>Event Type</th><th width="363">Description</th><th>Event Level</th><th>Snapshot</th></tr></thead><tbody><tr><td>`HostCreated`</td><td>New virtual host creation (virtual host name, distribution name)</td><td>Info</td><td>Virtual host details</td></tr><tr><td>`HostDeleted`</td><td>Virtual host deletion (name of deleted virtual host, distribution name)</td><td>Info</td><td>N/A</td></tr></tbody></table>

### Application Events (`AppEvent`)

<table><thead><tr><th>Event Type</th><th width="363">Description</th><th>Event Level</th><th>Snapshot</th></tr></thead><tbody><tr><td>`AppCreated`</td><td>New application creation (application name)</td><td>Info</td><td>Application details</td></tr><tr><td>`AppDeleted`</td><td>Application deletion (deleted application name)</td><td>Info</td><td>N/A</td></tr></tbody></table>

### Stream Events (`StreamEvent`)

<table><thead><tr><th width="266">Event Type (Cause)</th><th width="224">Description</th><th width="129">Event Level</th><th width="129">Snapshot</th></tr></thead><tbody><tr><td>`StreamCreated`</td><td>New stream creation (Stream ID, type, media source)</td><td>Info</td><td>N/A</td></tr><tr><td>`StreamPrepared`</td><td>Stream preparation complete (Stream ID, type, media source)</td><td>Info</td><td>Stream details</td></tr><tr><td>`StreamDeleted`</td><td>Stream deletion (Stream ID, type, media source)</td><td>Info</td><td>N/A</td></tr><tr><td>`StreamCreationFailed` (`DuplicatedStreamName`)</td><td>Stream creation failure due to duplicated stream name (duplicated stream name)</td><td>Error</td><td>N/A</td></tr><tr><td>`AbnormalStreamDetected` (`BFrameDetected`)</td><td>B-Frame detection (track information)</td><td>Warning</td><td>Track information</td></tr><tr><td>`AbnormalStreamDetected` (`AbnormalIncreasedTimestamp`)</td><td>Abnormal timestamp in input stream (track information)</td><td>Warning</td><td>Track information</td></tr><tr><td><p>`AbnormalStreamDetected` </p><p>(`AbnormalFpsDetected`)</p></td><td><p>Abnormal framerate in input stream (track information)</p><ul><li>Supported version: 0.18.1.2+</li></ul></td><td>Warning</td><td>Track information</td></tr><tr><td><p>`AbnormalStreamDetected` </p><p>(`LongKeyFrameIntervalDetected`)</p></td><td><p>Keyframe intervals greater than 4 seconds in input stream (input stream framerate, track information)</p><ul><li>Supported version: 0.18.1.2+</li></ul></td><td>Warning</td><td>Track information</td></tr><tr><td>`ScheduledChannelCreated`</td><td>Scheduled channel creation (`sch` file path)</td><td>Info</td><td>Scheduled channel information</td></tr><tr><td>`ScheduledChannelUpdated`</td><td>Scheduled channel update (`sch` file path)</td><td>Info</td><td>Scheduled channel information</td></tr><tr><td>`ScheduledChannelDeleted`</td><td>Scheduled channel deletion (`sch` file path)</td><td>Info</td><td>N/A</td></tr><tr><td>`ScheduledChannelItemChanged`</td><td>Scheduled channel item change (program, schedule, item information, Fallback status)</td><td>Info</td><td>N/A</td></tr><tr><td><p>`ScheduledChannelPlaybackError`</p><p>(`FailedToPopPacket`)</p></td><td><p>Packet reception failure when playing scheduled channel live item (program, schedule, item information, Fallback status)</p><ul><li>Supported version: 0.18.1.2+</li></ul></td><td>Warning</td><td>N/A</td></tr><tr><td>`MultiplexChannelCreated`</td><td>Multiplex channel creation (`mux` file path)</td><td>Info</td><td>Multiplex channel information</td></tr><tr><td>`MultiplexChannelUpdated`</td><td>Multiplex channel update (`mux` file path)</td><td>Info</td><td>Multiplex channel information</td></tr><tr><td>`MultiplexChannelDeleted`</td><td>Multiplex channel deletion (`mux` file path)</td><td>Info</td><td>N/A</td></tr><tr><td>`RecordingStarted`</td><td>Recording start (recording ID, recording file path)</td><td>Info</td><td>Recording information</td></tr><tr><td>`RecordingStopped`</td><td>Recording stop (recording ID, recording file path)</td><td>Info</td><td>Recording information</td></tr><tr><td>`PushPublishingStarted`</td><td>Push publishing start (push ID, protocol, redistribution URL)</td><td>Info</td><td>Push information</td></tr><tr><td>`PushPublishingStopped`</td><td>Push publishing stop (push ID, protocol, redistribution URL)</td><td>Info</td><td>Push information</td></tr><tr><td>`HLSDumpStarted`</td><td>HLS dump start (dump ID, dump save path)</td><td>Info</td><td>Dump information</td></tr><tr><td>`HLSDumpStopped`</td><td>HLS dump stop (dump ID, dump save path)</td><td>Info</td><td>Dump information</td></tr></tbody></table>

### REST API Events (`RestApiEvent`)

<table><thead><tr><th width="173">Event Type</th><th width="317">Description</th><th>Event Level</th><th>Snapshot</th></tr></thead><tbody><tr><td>`RestApiRequested`</td><td>REST API request (HTTP version, method, path, remote address, `RequestID`)</td><td>Info</td><td>Request body</td></tr><tr><td>`RestApiResponded`</td><td>REST API response (response status code, `RequestID`)</td><td>Info (Error in case of error)</td><td>Response body</td></tr></tbody></table>

### Access Control Events (`AccessControlEvent`)

<table><thead><tr><th width="174">Event Type</th><th width="317">Description</th><th>Event Level</th><th>Snapshot</th></tr></thead><tbody><tr><td>`VerifyingSignedPolicyFailed`</td><td>Signed Policy verification failure (request URL, remote address, error message)</td><td>Error</td><td>N/A</td></tr><tr><td>`VerifyingAdmissionWebhooksFailed`</td><td>Admission Webhooks verification failure (request URL, remote address, error message)</td><td>Error</td><td>Response body, N/A</td></tr></tbody></table>
