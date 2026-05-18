---
title: Codecs
description: "Query and manage hardware codec devices on OvenMediaEngine Enterprise through the v2 REST API."
enterprise_only: true
sidebar_position: 167
---

For users operating multiple hardware devices, this API supports the following features:

1. Which codecs/modules are available on each hardware device?
2. How much of each device’s encoder and decoder capacity is in use?
3. How much each hardware device is actually being used?

## Get Codecs (List and Usage)

On a host running OvenMediaEngine Enterprise, you can query the HW/SW codecs available per hardware device and see their current usage.

> **Request**

<details>

<summary><span class="http-method http-method-get">GET</span> /v2/internals/codecs</summary>

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
            "busId": "-",
            "displayName": "FFmpeg Video Codecs",
            "id": 0,
            "isDecoder": true,
            "isDefault": true,
            "isEncoder": false,
            "isHwAccel": false,
            "mediaType": "Video",
            "metrics": {
                "active": {
                    "decoder": 0,
                    "encoder": 0
                }
            },
            "module": "default",
            "name": "default:0",
            "supportedCodecs": [
                "H264",
                "H265",
                "VP8"
            ]
        },
        {
            "busId": "-",
            "displayName": "Open Source H.264 Codec",
            "id": 0,
            "isDecoder": false,
            "isDefault": true,
            "isEncoder": true,
            "isHwAccel": false,
            "mediaType": "Video",
            "metrics": {
                "active": {
                    "decoder": 0,
                    "encoder": 0
                }
            },
            "module": "openh264",
            "name": "openh264:0",
            "supportedCodecs": [
                "H264"
            ]
        },
        {
            "busId": "-",
            "displayName": "x264 H.264 Codec",
            "id": 0,
            "isDecoder": false,
            "isDefault": false,
            "isEncoder": true,
            "isHwAccel": false,
            "mediaType": "Video",
            "metrics": {
                "active": {
                    "decoder": 0,
                    "encoder": 0
                }
            },
            "module": "x264",
            "name": "x264:0",
            "supportedCodecs": [
                "H264"
            ]
        },
        {
            "busId": "-",
            "displayName": "WebM VP8/VP9 Codec SDK",
            "id": 0,
            "isDecoder": false,
            "isDefault": true,
            "isEncoder": true,
            "isHwAccel": false,
            "mediaType": "Video",
            "metrics": {
                "active": {
                    "decoder": 0,
                    "encoder": 0
                }
            },
            "module": "libvpx",
            "name": "libvpx:0",
            "supportedCodecs": [
                "VP8"
            ]
        },
        {
            "busId": "-",
            "displayName": "FFmpeg Audio Codecs",
            "id": 0,
            "isDecoder": true,
            "isDefault": true,
            "isEncoder": false,
            "isHwAccel": false,
            "mediaType": "Audio",
            "metrics": {
                "active": {
                    "decoder": 5,
                    "encoder": 0
                }
            },
            "module": "default",
            "name": "default:0",
            "supportedCodecs": [
                "AAC",
                "OPUS"
            ]
        },
        {
            "busId": "-",
            "displayName": "Fraunhofer FDK AAC",
            "id": 0,
            "isDecoder": false,
            "isDefault": true,
            "isEncoder": true,
            "isHwAccel": false,
            "mediaType": "Audio",
            "metrics": {
                "active": {
                    "decoder": 0,
                    "encoder": 0
                }
            },
            "module": "fdkaac",
            "name": "fdkaac:0",
            "supportedCodecs": [
                "AAC"
            ]
        },
        {
            "busId": "-",
            "displayName": "Opus Interactive Audio Codec",
            "id": 0,
            "isDecoder": false,
            "isDefault": true,
            "isEncoder": true,
            "isHwAccel": false,
            "mediaType": "Audio",
            "metrics": {
                "active": {
                    "decoder": 0,
                    "encoder": 5
                }
            },
            "module": "libopus",
            "name": "libopus:0",
            "supportedCodecs": [
                "OPUS"
            ]
        },
        {
            "busId": "-",
            "displayName": "FFmpeg Image Codec",
            "id": 0,
            "isDecoder": false,
            "isDefault": true,
            "isEncoder": true,
            "isHwAccel": false,
            "mediaType": "Video",
            "metrics": {
                "active": {
                    "decoder": 0,
                    "encoder": 0
                }
            },
            "module": "default",
            "name": "default:0",
            "supportedCodecs": [
                "JPEG",
                "PNG",
                "WEBP"
            ]
        },
        {
            "busId": "00000000:3B:00.0",
            "displayName": "NVIDIA GeForce GTX 1050",
            "id": 0,
            "isDecoder": true,
            "isDefault": false,
            "isEncoder": true,
            "isHwAccel": true,
            "mediaType": "Video",
            "metrics": {
                "active": {
                    "decoder": 0,
                    "encoder": 0
                }
            },
            "module": "nv",
            "name": "nv:0",
            "supportedCodecs": [
                "H264",
                "H265"
            ]
        },
        {
            "busId": "00000000:3B:00.0",
            "displayName": "NVIDIA GeForce GTX 1050",
            "id": 0,
            "isDecoder": false,
            "isDefault": false,
            "isEncoder": true,
            "isHwAccel": true,
            "mediaType": "Audio",
            "metrics": {
                "active": {
                    "decoder": 0,
                    "encoder": 0
                }
            },
            "module": "nv",
            "name": "nv:0",
            "supportedCodecs": [
                "WHISPER"
            ]
        },
        {
            "busId": "00000000:AF:00.0",
            "displayName": "NVIDIA RTX 4000 SFF Ada Generation",
            "id": 1,
            "isDecoder": true,
            "isDefault": false,
            "isEncoder": true,
            "isHwAccel": true,
            "mediaType": "Video",
            "metrics": {
                "active": {
                    "decoder": 0,
                    "encoder": 0
                }
            },
            "module": "nv",
            "name": "nv:1",
            "supportedCodecs": [
                "H264",
                "H265"
            ]
        },
        {
            "busId": "00000000:AF:00.0",
            "displayName": "NVIDIA RTX 4000 SFF Ada Generation",
            "id": 1,
            "isDecoder": false,
            "isDefault": false,
            "isEncoder": true,
            "isHwAccel": true,
            "mediaType": "Audio",
            "metrics": {
                "active": {
                    "decoder": 0,
                    "encoder": 0
                }
            },
            "module": "nv",
            "name": "nv:1",
            "supportedCodecs": [
                "WHISPER"
            ]
        },
        {
            "busId": "18:01.0",
            "displayName": "Xilinx Corporation Device 513d",
            "id": 0,
            "isDecoder": true,
            "isDefault": false,
            "isEncoder": true,
            "isHwAccel": true,
            "mediaType": "Video",
            "metrics": {
                "active": {
                    "decoder": 5,
                    "encoder": 4
                }
            },
            "module": "xma",
            "name": "xma:0",
            "supportedCodecs": [
                "H264",
                "H265"
            ]
        }
    ],
    "statusCode": 200
}
```

</details>

<table><thead><tr><th width="156">Element</th><th width="135">Value</th><th>Description</th></tr></thead><tbody><tr><td>busId</td><td>-</td><td>Unique bus identifier of this module or device.</td></tr><tr><td>displayName</td><td>-</td><td>Human-readable display name of this module or device.</td></tr><tr><td>id</td><td>-</td><td>ID assigned to this module or device.</td></tr><tr><td>isDecoder</td><td>ture | false</td><td>Whether this module/device supports decoding.</td></tr><tr><td>isDefault</td><td>ture | false</td><td>Whether this module/device is the default.</td></tr><tr><td>isEncoder</td><td>ture | false</td><td>Whether this module/device supports encoding.</td></tr><tr><td>isHwAccel</td><td>ture | false</td><td>Whether this module/device supports hardware acceleration.</td></tr><tr><td>metrics.active.decoder</td><td>-</td><td>Count of active decoders using this module/device.</td></tr><tr><td>metrics.active.encoder</td><td>-</td><td>Count of active encoders using this module/device.</td></tr><tr><td>module</td><td>-</td><td>Type of the module.</td></tr><tr><td>name</td><td>&#x7B;module&#x7D;:&#x7B;#&#x7D;</td><td>Module name.<br />e.g., nv:0, nv:1, nv:2, ...</td></tr><tr><td>supportedCodecs</td><td>-</td><td>List of codecs supported by this module.</td></tr></tbody></table>

