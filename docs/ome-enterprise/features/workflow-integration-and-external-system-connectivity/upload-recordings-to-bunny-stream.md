---
title: Upload Recordings to Bunny Stream
enterprise_only: true
sidebar_position: 137
---

This guide explains how to upload live recordings from OvenMediaEngine Enterprise to Bunny Stream to deliver content to users worldwide.


:::info

Bunny Stream is a video streaming service provided by the global CDN company, bunny.net. It offers a single, unified platform for all video infrastructure needs, including uploading, encoding, security, global delivery, and video players.

:::


## Prerequisites

To transfer recorded files, you will need a Video `Library ID` and an `API Key` from Bunny Stream.

Once you create a Video Library in Bunny Stream, you can find the `Video Library ID` and the corresponding `API Key` in the bunny.net dashboard.

For more information on Video `Library ID` and `API Key`, please refer to the official guides provided by bunny.net:

* Quick Start: [https://docs.bunny.net/stream/quickstart](https://docs.bunny.net/stream/quickstart)
* Authentication: [https://docs.bunny.net/stream/authentication](https://docs.bunny.net/stream/authentication)

## How It Works

OvenMediaEngine and OvenMediaEngine Delivery use metadata within the recording info file (.xml) to perform transfers to Bunny Stream.

### Information File Creation

When OvenMediaEngine generates a recording file, it simultaneously creates a recording info file containing the file's details. At this stage, Bunny Stream configuration settings are set in the `MetaData` field.

### Uploading

OvenMediaEngine Delivery monitors this MetaData in real-time. Once a new recording is detected, it initiates the transfer to Bunny Stream based on the information stored in the MetaData.

### MetaData Insertion

MetaData can be inserted either through the OvenMediaEngine recording configuration (Server.xml) or via the REST API when starting a recording.

### MetaData Definition

Uploading information is configured in the `MetaData` field using the `key='value',key='value',...` format.

**Format:**

`service='bunny_stream', api_endpoint='https://video.bunnycdn.com', tus_endpoint='https://video.bunnycdn.com/tusupload', api_key='xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxx-xxxx-xxxx', library_id='123456', collection_id='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', title='video title', delete='false'`&#x20;

* **`service`** (required): Must be set to `bunny_stream` for uploading to Bunny Stream.
* **`api_key`** (required): Enter the Bunny Stream API Key.
* **`library_id`** (required): Enter the Bunny Stream Library ID. Recorded videos will be uploaded to this library.
* **`api_endpoint`** (optional): Enter the Bunny Stream API Endpoint address. The default is `https://video.bunnycdn.com`.
* **`tus_endpoint`** (optional): Enter the Bunny Stream TUS Endpoint address. The default is `https://video.bunnycdn.com/tusupload`.
* **`collection_id`** (optional): Enter a specific Collection ID within the Bunny Stream Library to upload to that collection.
* **`title`** (optional): Specify a filename for the upload. If not specified, the original recording filename will be used.
* **`delete`** (optional): Specify whether to delete the recording file after the uploading is complete. Set to `true` or `false`.

## OvenMediaEngine Configuration

Enable the recording feature by configuring the File Publisher in the OvenMediaEngine configuration file (`Server.xml`). The recording files and recording info files will be saved in the `/usr/share/ovenmediaengine/records` path according to the specified macro format.

#### Configuration File Path

`/usr/share/ovenmediaengine/conf/Server.xml`

#### Configuration Example

```xml
<Applications>
  <Application>
    <Name>app</Name>
    ...
    <Publishers>
      <FILE>
        <RootPath>/usr/share/ovenmediaengine/records</RootPath>
        <FilePath>${VirtualHost}/${Application}/${Stream}-${StartTime:YYYYMMDDhhmmss}_${EndTime:YYYYMMDDhhmmss}.mp4</FilePath>
        <InfoPath>${VirtualHost}/${Application}/${Stream}-${StartTime:YYYYMMDDhhmmss}_${EndTime:YYYYMMDDhhmmss}.xml</InfoPath>
      </FILE>
    </Publishers>
    ...
</Applications>
```


:::info

For more details on OvenMediaEngine's recording feature, please refer to the following documentation.\
[https://ovenmedialabs.com/docs/ome/recording](https://ovenmedialabs.com/docs/ome/recording)

:::


## OvenMediaEngine Delivery Configuration

Configure the path where recording files are generated in the configuration file (`config.ini`) so that OvenMediaEngine Delivery can detect them.

Set the `RECORD_INFO_FILE_BASE_DIR` in the configuration file to the same path as the RootPath specified in the OvenMediaEngine recording configuration.

Once configured, OvenMediaEngine Delivery will detect any new recording files generated in the specified path and upload them to Bunny Stream.

#### Configuration File Path

`/usr/share/ovenmediaengine/delivery/conf/config.ini`

#### Configuration Example

```properties
[DELIVERY]
# database uri
DATABASE_URI = /usr/share/ovenmediaengine/delivery/delivery.db
# log file will saved
LOG_DIR = /var/log/ovenmediaengine/delivery/
# dump base directory
DUMP_INFO_FILE_BASE_DIR = 
# recording base directory
RECORD_INFO_FILE_BASE_DIR = /usr/share/ovenmediaengine/records
```

## Starting a Recording via REST API



### Start Streaming

Broadcast the stream to the following RTMP address:

```
rtmp://{OME_HOST}:{OME_RTMP_PROV_PORT}/app/stream
```



### Start Recording

To begin recording, call the Start Recording REST API.

```bash
curl -X POST 'http://{OME_HOST}:{OME_API_PORT}/v1/vhosts/default/apps/app:startRecord' \
--header 'Authorization: {CREDENTIAL}' \
--header 'Content-Type: application/json' \
--data '{
    "id": "unique_id",
    "stream": {
        "name": "stream"
    },
    "metadata": "service='bunny_stream', api_key='xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxx-xxxx-xxxx', library_id='123456'"
}'
```


:::warning

When requesting a recording, you must include the metadata containing the Bunny Stream service information.

:::




### Stop Recording

To stop a recording, call the Stop Recording REST API.

```bash
curl -X POST 'http://{OME_HOST}:{OME_API_PORT}/v1/vhosts/default/apps/app:stopRecord' \
--header 'Authorization: {CREDENTIALS}' \
--header 'Content-Type: application/json' \
--data '{
    "id": "unique_id"
}'
```



## Checking Uploading Status

Monitor the uploading status of recording files by checking the OvenMediaEngine Delivery log.

```bash
tail -f /var/log/ovenmediaengine/delivery/delivery-daemon.log
```
