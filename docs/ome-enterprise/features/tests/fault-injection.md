---
title: Fault Injection
enterprise_only: true
sidebar_position: 170
---

The Fault Injection feature is an API that intentionally generates failures in order to verify the system’s stability and error-handling capability. With it, you can induce initialization failures, frame processing failures, and delays for decoder, filter, and encoder that use a specific module, and you can run tests by creating an environment similar to real failure scenarios.

## Enabling Fault Injection

You can configure Fault Injection in `Server.xml` under `<Server><Module>` as follows:

```xml
<Server>
    ...
    <Modules>
        ...
        <FaultInject>
            <Enable>true</Enable>
        </FaultInject>
        ...
    </Modules>
    ...
</Server>
```

## API Interface

### Configuring Fault Injection

You can configure Fault Injection as an array under `transcoder`. When you apply a new configuration, all existing settings are cleared. Likewise, when OvenMediaEngine is restarted, all related settings are reset to their initial state.

> **Request**

<details>

<summary><span class="http-method http-method-post">POST</span> /v2/internals/tests:setFaultInject</summary>

**Header**

```http
Authorization: Basic {credentials}

# Authorization
Credentials for HTTP Basic Authentication created with <AccessToken>
```

**Body**

```json
{
  "transcoder" : [
      { 
         "targetModule" : "default",
         "targetDeviceId" : 0,
         "targetComponent" : "decoder",
         "faultType" : "initFailed",
         "faultRate" : 50
      },        
      { 
         "targetModule" : "openh264",
         "targetDeviceId" : 0,
         "targetComponent" : "filter",
         "faultType" : "processFailed",
         "faultRate" : 2.0
       },    
      { 
         "targetModule" : "nv",
         "targetDeviceId" : 0,
         "targetComponent" : "encoder",
         "faultType" : "lagging",
         "faultRate" : 10.0
       },
      { 
         "targetModule" : "default",
         "targetDeviceId" : 0,
         "targetComponent" : "decoder",
         "faultType" : "processFailed",
         "faultRate" : 2.0
       }
   ]
}
```

</details>

> **Responses**

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

Fault injection module is not enabled in the server configuration

</details>

<details>

<summary><span class="http-method http-method-400">400</span> Bad Request</summary>

Invalid request

</details>

<table><thead><tr><th width="154">Parameter</th><th width="159.5555419921875" align="center">Input Range</th><th>Description</th></tr></thead><tbody><tr><td>`targetModule`</td><td align="center">Codec Module</td><td><p>Specifies the module that will be targeted by Fault Injection.</p><ul><li>`default`, `openh264`, `x264`, `libvpx`, `nv`, `xma`. Please refer to the `name` value in <a href="../rest-api/v2/internals/codecs.md#id-200-ok">v2/internals/codecs</a>.</li></ul></td></tr><tr><td>`targetDeviceId`</td><td align="center"><p>0&#126;</p><p>(Device ID)</p></td><td><p>Specifies the ID assigned to the target module for Fault Injection.</p><ul><li>Please refer to the `id` value in <a href="../rest-api/v2/internals/codecs.md#id-200-ok">v2/internals/codecs</a>.</li></ul></td></tr><tr><td>`targetComponent`</td><td align="center">`decoder`,<br />`encoder`,<br />`filter`</td><td>Specifies the component type of the target module for Fault Injection.</td></tr><tr><td>`faultType`</td><td align="center"><p></p><p>`initFailed`,<br />`processFailed`,<br />`lagging`</p></td><td><p>Specifies the type of fault testing to perform.</p><ul><li>`initFailed`: Reproduces a module initialization failure.</li><li>`processFailed`: Reproduces failures in decoding, filtering, or encoding.</li><li>`lagging`: Reproduces a processing delay (300ms).</li></ul></td></tr><tr><td>`faultRate`</td><td align="center">0.01&#126;100.0</td><td>Specifies the probability (%) that fault testing will occur.</td></tr></tbody></table>

### Disabling Fault Injection

If you do not specify values in the `transcoder` array, all related settings are disabled.

> **Request**

<details>

<summary><span class="http-method http-method-post">POST</span> /v2/internals/tests:setFaultInject</summary>

**Header**

```http
Authorization: Basic {credentials}

# Authorization
Credentials for HTTP Basic Authentication created with <AccessToken>
```

**Body**

```json
{
  "transcoder" : [ ]
}
```

</details>

> **Responses**

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
