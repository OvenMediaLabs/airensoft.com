---
title: Push Publishing
sidebar_position: 105
---

OvenMediaEngine Enterprise supports Push Publishing function that can restreaming live streams to other systems. The protocol supports widely used protocols such as SRT, RTMP, and MPEG-2 TS.

The `StreamMap` feature has been added, and it now automatically re-streaming based on predefined conditions. You can also use the Rest API to control and monitor it.

## Configuring Push Publishing

### Push Publisher

To use Push Publishing, you need to configure `<Push>` under `<Applications><Publishers>` in `Server.xml`.

```xml
<Applications>
  <Application>
     ...
    <Publishers>
      ... 
      <Push>
         <!-- [Optional] -->
         <StreamMap>
           <Enable>true</Enable>
           <Path>push_info.xml</Path>
         </StreamMap>
         <!-- Connection Timeout -->
         <ConnectionTimeout>1000</ConnectionTimeout>
         <!-- Send Timeout -->
         <SendTimeout>100</SendTimeout>
      </Push>
      ...
    </Publishers>
  </Application>
</Applications>
```


:::info

The RTMP protocol only supports H264 and AAC codecs.

:::


From OvenMediaEngine Enterprise 0.20.2.1-1, the Push Publisher supports the `ConnectionTimeout` and `SendTimeout` options.

<table><thead><tr><th width="249.5555419921875">Element</th><th>Description</th></tr></thead><tbody><tr><td>`ConnectionTimeout`</td><td><p>The maximum allowed wait time when attempting to establish a connection to the server.</p><ul><li>Unit: ms</li></ul></td></tr><tr><td>`SendTimeout`</td><td><p>The maximum allowed wait time when sending data while the connection is established.</p><ul><li>Unit: ms</li></ul></td></tr></tbody></table>

### StreamMap

`<StreamMap>` is used for automatically pushing content based on user-defined conditions. The XML file path should be specified relative to `<ApplicationPath>/conf`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PushInfo>
  <Push>
    <Enable>true</Enable>
    <StreamName>stream_a_*</StreamName>
    <VariantNames>video_h264,audio_aac</VariantNames>
    <Protocol>rtmp</Protocol>
    <Url>rtmp://1.2.3.4:1935/app/${SourceStream}</Url>
    <StreamKey></StreamKey>
    <TimestampMode>ZeroBased</TimestampMode>
  </Push>
  <Push>
    <Enable>true</Enable>
    <StreamName>stream_b_*</StreamName>
    <VariantNames></VariantNames>
    <Protocol>srt</Protocol>
    <Url>srt://1.2.3.4:9999?streamid=srt%3A%2F%2F1.2.3.4%3A9999%2Fapp%2Fstream</Url>
    <TimestampMode>Original</TimestampMode>
  </Push>
  <Push>
    <Enable>false</Enable>
    <StreamName>stream_c_*</StreamName>
    <VariantNames></VariantNames>
    <Protocol>mpegts</Protocol>
    <Url>udp://1.2.3.4:2400</Url>
  </Push>
</PushInfo>
```

#### XML Elements

<table><thead><tr><th width="189.5555419921875">Element</th><th width="137.8887939453125" align="center">Requirement</th><th>Description</th></tr></thead><tbody><tr><td><code>&#x3C;StreamName></code></td><td align="center">Required</td><td><p>Used to match the output stream name.</p><ul><li>Wildcard characters (`*`) are supported.</li></ul></td></tr><tr><td><code>&#x3C;VariantNames></code></td><td align="center">Required</td><td><p>Used to select specific tracks. If <code>&#x3C;VariantNames></code> is not specified, all tracks are transmitted by default.</p><ul><li>Multiple variants can be specified using commas (`,`).</li></ul></td></tr><tr><td><code>&#x3C;Protocol></code></td><td align="center">Required</td><td><p>Supported protocols are `srt`, `mpegts`, and `rtmp`.</p><ul><li>When using `SRT` or `MPEG-TS`, consider the network environment (e.g., firewalls, ports, packet loss, etc.).</li><li>When using `RTMP`, using H.264 + AAC is strongly recommended.</li></ul></td></tr><tr><td><code>&#x3C;Url></code></td><td align="center">Required</td><td><p>Specifies the destination address.</p><ul><li>Macros are supported.</li></ul></td></tr><tr><td><code>&#x3C;StreamKey></code></td><td align="center">Optional</td><td><p>Specifies the stream key when required: `RTMP` </p><ul><li>Macros are supported.</li></ul></td></tr><tr><td><code>&#x3C;TimestampMode></code></td><td align="center"><p>Optional</p><p><sub><em>(Enterprise Only)</em></sub></p></td><td><p>Defines how timestamps are set for outgoing packets. </p><ul><li>`ZeroBased`: Sends timestamps starting from 0 (zero) at the beginning of transmission.</li><li> `Original` (default): Sends timestamps identical to the original stream’s timestamps.</li></ul></td></tr></tbody></table>

#### Macros

To improve automation and operational efficiency, we recommend actively using macros.

<table><thead><tr><th width="249.5555419921875">Macro</th><th>Description</th></tr></thead><tbody><tr><td>$&#x7B;Application&#x7D;</td><td>Application name</td></tr><tr><td>$&#x7B;SourceStream&#x7D;</td><td>Source stream name</td></tr><tr><td>$&#x7B;Stream&#x7D;</td><td>Output stream name</td></tr></tbody></table>

## API Interface

### Start Push Publishing

> **Request**

<details>

<summary><span class="http-method http-method-post">POST</span> /v1/vhosts/&#x7B;vhost&#x7D;/apps/&#x7B;app&#x7D;:startPush</summary>

**Header**

```http
Authorization: Basic {credentials}

# Authorization
    Credentials for HTTP Basic Authentication created with <AccessToken>
```

**Body : SRT**

```json
{
  "id": "{unique_push_id}",
  "stream": {
    "name": "{output_stream_name}",
    "variantNames": []
  },
  "protocol": "srt",
  "url": "srt://{host}[:port]?mode=caller&latency=120000&timeout=500000",
  "streamKey": ""
}

# id (required)
    unique ID to identify the task
    
# stream (required)
    ## name (required)
        output stream name
        
    ## variantNames (optional)
        Array of track names to publsh. 
        This value is Encodes.[Video|Audio|Data].Name in the OutputProfile
        setting.
        
        If empty, all tracks will be sent.

# protocol (required)
    srt
    
# url (required) 
    address of destination.
    options can be set in query-string format.
    
# streamKey (optional)
    not used with mpegts
```

In SRT Push Publisher, only the `caller` connection mode is supported.

**Body : RTMP**


```json
{
  "id": "{unique_push_id}",
  "stream": {
    "name": "{output_stream_name}",
    "variantNames": [ "h264_fhd", "aac" ]
  },
  "protocol": "rtmp",
  "url":"rtmp://{host}[:port]/{app_name}",
  "streamKey":"{stream_name}"
}

# id (required)
    unique ID to identify the task
    
# stream (required)
    ## name (required)
        output stream name
        
    ## variantNames (optional)
        Array of track names to publsh. 
        This value is Encodes.[Video|Audio|Data].Name in the OutputProfile
        setting.
        
        If empty, The first track among video tracks (by ID) and the first 
        track among audio tracks (by ID) are selected automatically.

# protocol (required)
    rtmp
    
# url (required) 
    address of destination
    
# streamKey (required)
    RTMP stream key
```


**Body : MPEG2-TS**

```json
{
  "id": "{unique_push_id}",
  "stream": {
    "name": "{output_stream_name}",
    "variantNames": []
  },
  "protocol": "mpegts",
  "url": "udp://{host}[:port]",
  "streamKey": ""
}

# id (required)
    unique ID to identify the task
    
# stream (required)
    ## name (required)
        output stream name
        
    ## variantNames (optional)
        Array of track names to publsh. 
        This value is Encodes.[Video|Audio|Data].Name in the OutputProfile
        setting.
        
        If empty, all tracks will be sent.

# protocol (required)
    mpegts
    
# url (required) 
    address of destination
    
# streamKey (optional)
    not used with mpegts
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

Please note that `responses` are incorrectly returned in Json array format for version 0.15.3 and earlier.

```json
{
    "statusCode": 200,
    "message": "OK",
    "response": {
        "id": "{unique_push_id}",
        "state": "ready",
            
        "vhost": "default",
        "app": "app",
        "stream": {
            "name": "{output_stream_name}",
            "trackIds": [],
            "variantNames": []
        },
            
        "protocol": "rtmp",
        "url": "rtmp://{host}[:port]/{app_name}",
        "streamKey": "{stream_name}",
            
        "sentBytes": 0,
        "sentTime": 0,
        "sequence": 0,
        "totalsentBytes": 0,
        "totalsentTime": 0,
            
        "createdTime": "2023-03-15T23:02:34.371+09:00",
        "startTime": "1970-01-01T09:00:00.000+09:00",
        "finishTime": "1970-01-01T09:00:00.000+09:00"
    }
}

# statusCode
    Same as HTTP Status Code
# message
    A human-readable description of the response code
# response
    Created push publishing task information
```

</details>

<details>

<summary><span class="http-method http-method-400">400</span> Bad Request</summary>

Invalid request.

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
    "message": "[HTTP] Could not find the application: [vhost/app1] (404)",
    "statusCode": 404
}
```

</details>

<details>

<summary><span class="http-method http-method-409">409</span> Conflict</summary>

duplicate ID

</details>

<table><thead><tr><th width="189.5555419921875">Parameter</th><th width="138.4444580078125" align="center">Requirement</th><th>Description</th></tr></thead><tbody><tr><td>`id`</td><td align="center">Required</td><td><p>A unique ID string used to identify the Push Publishing task.</p><ul><li>Duplicate IDs are not allowed.</li></ul></td></tr><tr><td>`stream`</td><td align="center">Required</td><td>The output target stream information object.</td></tr><tr><td>`stream.name`</td><td align="center">Required</td><td><p>Output stream name. </p><ul><li>Example: `"myStreamOut"`.</li></ul></td></tr><tr><td>`stream.variantNames`</td><td align="center">Optional</td><td><p>A list of track (variant) names to transmit.</p><ul><li>If omitted or empty, the default behavior applies: all tracks are transmitted, or for `RTMP`, the first video track and the first audio track are selected.</li></ul></td></tr><tr><td>`protocol`</td><td align="center">Required</td><td><p>The protocol used for Push Publishing. </p><ul><li>Example: `"srt"`, `"mpegts"`, `"rtmp"`.</li></ul></td></tr><tr><td>`url`</td><td align="center">Required</td><td><p>Destination URL.</p><ul><li>The format differs by protocol, and query string options can be used.</li></ul></td></tr><tr><td>`streamKey`</td><td align="center">Optional</td><td><p>Stream key for RTMP transmission.</p><ul><li>Can be omitted for MPEG-TS transmission.</li></ul></td></tr><tr><td>`timestampMode`</td><td align="center">Optional</td><td><p>Configures the timestamp mode for outgoing packets.</p><ul><li>`ZeroBased`: Sends timestamps starting from 0 (zero) at the beginning of transmission.</li><li> `Original` (default): Sends timestamps identical to the original stream’s timestamps.</li></ul></td></tr></tbody></table>

### Stop Push Publishing

> **Request**

<details>

<summary><span class="http-method http-method-post">POST</span> /v1/vhosts/&#x7B;vhost&#x7D;/apps/&#x7B;app&#x7D;:stopPush</summary>

**Header**

```http
Authorization: Basic {credentials}

# Authorization
    Credentials for HTTP Basic Authentication created with <AccessToken>
```

**Body**


```json
{
    "id": "{unique_push_id}"
}

# id (required)
    unique ID to identify the push publishing task
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
    "statusCode": 200,
    "message": "OK",
}

# statusCode
	Same as HTTP Status Code
# message
	A human-readable description of the response code
```

</details>

<details>

<summary><span class="http-method http-method-400">400</span> Bad Request</summary>

Invalid request.

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

The given vhost/application name or id of recording task could not be found.

**Body**

```json
{
    "message": "[HTTP] Could not find the application: [vhost/app1] (404)",
    "statusCode": 404
}
```

</details>

### Get Push Publishing State

> **Request**

<details>

<summary><span class="http-method http-method-post">POST</span> /v1/vhosts/&#x7B;vhost&#x7D;/apps/&#x7B;app&#x7D;:pushes</summary>

**Header**

```http
Authorization: Basic {credentials}

# Authorization
    Credentials for HTTP Basic Authentication created with <AccessToken>
```

**Body**


```json
{
    "id": "{unique_push_id}"
}

# id (optional)
    unique ID to identify the push publishing task. If no id is given in the request, the full list is returned.
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

The `response` is Json array format.

```json
{
    "statusCode": 200,
    "message": "OK",
    "response": [
        {
            "id": "{unique_push_id}",
            "state": "started",
            
            "vhost": "default",
            "app": "app",
            "stream": {
                "name": "{output_stream_name}",
                "trackIds": [],
                "variantNames": []
            },
            
            "protocol": "rtmp",
            "url": "rtmp://{host}[:port]/{app_name}",
            "streamKey": "{stream_name}",
            
            "sentBytes": 0,
            "sentTime": 0,
            "sequence": 0,
            "totalsentBytes": 0,
            "totalsentTime": 0,
            
            "createdTime": "2023-03-15T23:02:34.371+09:00",
            "startTime": "1970-01-01T09:00:00.000+09:00",
            "finishTime": "1970-01-01T09:00:00.000+09:00"
        },
        {
            "id": "4",
            ...
        }
    ]
}

# statusCode
	Same as HTTP Status Code
# message
	A human-readable description of the response code
# response
	Information of recording tasks. If there is no recording task, 
	response with empty array ("response": [])
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
    "message": "[HTTP] Could not find the application: [vhost/app1] (404)",
    "statusCode": 404
}
```

</details>

#### State of Push Publishing

<table><thead><tr><th width="249.5555419921875">State</th><th>Description</th></tr></thead><tbody><tr><td>ready</td><td>Waiting for the stream to be created.</td></tr><tr><td>connecting</td><td>Connecting to destination</td></tr><tr><td>pushing</td><td>Connected and streaming</td></tr><tr><td>stopping</td><td>Disconnection / stop in progress</td></tr><tr><td>stopped</td><td>Push is disconnected / stopped</td></tr><tr><td>error</td><td>Push encountered an error</td></tr></tbody></table>
