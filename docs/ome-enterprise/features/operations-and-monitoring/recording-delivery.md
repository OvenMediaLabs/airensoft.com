---
title: Recording Delivery
enterprise_only: true
sidebar_position: 120
---

Describes how to record a live stream using OvenMediaEngine and transfer the recorded files to Object Storage.

* Setting up OvenMediaEngine and OvenMediaEngine Delivery to enable recording file delivery.
* Using the automatic recording feature of OvenMediaEngine or the recording REST API to start recording and delivering.
* Monitoring the recording delivery status.

## Step 1: Configuring Recording in OvenMediaEngine

Enable the stream recording feature by activating the File Publisher feature of OvenMediaEngine.

#### **Configuration File Path:**

* The File Publisher can be enabled in `/usr/share/ovenmediaengine/conf/Server.xml`.

### **Automatic Recording Settings**

Configure OvenMediaEngine to automatically start recording and delivering as soon as the stream broadcast begins.

#### Example `Server.xml`:

```xml
<Applications>
  <Application>
    <Name>app</Name>
    ...
    <Publishers>
      <FILE>
        <RootPath>/usr/share/ovenmediaengine/records</RootPath>
        <StreamMap>
          <Enable>true</Enable>
          <Path>./record_map.xml</Path>
        </StreamMap>
      </FILE>
    </Publishers>
    ...
  </Application>
</Applications>
```

To enable OvenMediaEngine to automatically record and deliver, define the recording format and Object Storage information in the `FILE.StreamMap.Path` file.

#### Create the `record_map.xml` file as specified in `Server.xml`:

* Path: `/usr/share/ovenmediaengine/conf/record_map.xml`

#### Example `record_map.xml`:

```xml
<RecordInfo>
  <Record>
    <Enable>true</Enable>
    <StreamName>stream</StreamName>
    <FilePath>${VirtualHost}/${Application}/${Stream}-${StartTime:YYYYMMDDhhmmss}_${EndTime:YYYYMMDDhhmmss}.mp4</FilePath>
    <InfoPath>${VirtualHost}/${Application}/${Stream}-${StartTime:YYYYMMDDhhmmss}_${EndTime:YYYYMMDDhhmmss}.xml</InfoPath>
    <Metadata>aws_access_key_id='xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',aws_secret_access_key='xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',endpoint='https://object.storage.com',region='us-east-1',bucket_name='bucket_name',object_dir='my/vod/path/',delete='true'</Metadata>
  </Record>
</RecordInfo>
```

In `Metadata`, set the delivery information in the format `key='value',key='value',...`.

Object Storage Information Format:

```arduino
aws_access_key_id='****',aws_secret_access_key='****',endpoint='https://object.storage.com',region='us-east-1',bucket_name='record-bucket',object_dir='/my/vod/path/',delete='true'
```

* `aws_access_key_id` (required): Specify the access key ID to access Object Storage.
* `aws_secret_access_key` (required): Specify the secret access key to access Object Storage.
* `endpoint` (optional): Specify the connection endpoint of Object Storage. If empty, the AWS S3 endpoint is used.
* `region` (optional): Specify the region of Object Storage. If empty, the default region of AWS S3 is used.
* `bucket_name` (required): Enter the bucket name to which the recorded file will be delivered.
* `object_dir` (required): Specify the path within the bucket to deliver the recorded file.
* `delete` (optional): Specify `true` or `false` for whether to delete the recorded file created in the RootPath of Server.xml after the delivery is complete.

For more details on the recording format, see [OvenMediaEngine Recording](https://ovenmedialabs.com/docs/ome/recording#automated-recording).

### Recording Settings Using REST API

Configure OvenMediaEngine to record and deliver streams using the recording REST API.

(Note: The recording format and Object Storage information can be set when calling the recording start REST API.)

Example `Server.xml`:

```xml
<Applications>
  <Application>
    <Name>app</Name>
    ...
    <Publishers>
      <FILE>
        <RootPath>/usr/share/ovenmediaengine/records</RootPath>
        <FilePath>${VirtualHost}/${Application}/${Stream}-${StartTime:YYYYMMDDhhmmss}_${EndTime:YYYYMMDDhhmmss}.ts</FilePath>
        <InfoPath>${VirtualHost}/${Application}/${Stream}-${StartTime:YYYYMMDDhhmmss}_${EndTime:YYYYMMDDhhmmss}.xml</InfoPath>
      </FILE>
    </Publishers>
    ...
  </Application>
</Applications>
```


:::info

For detailed information about the recording feature, please refer to this document.

[https://ovenmedialabs.com/docs/ome/recording](https://ovenmedialabs.com/docs/ome/recording)

:::


## Step 2: Setting Up and Activating the Delivery Service

### **Delivery Service Settings**

In the delivery service settings, configure the path where OvenMediaEngine generates the recorded files.

Delivery service configuration file path:

* `/usr/share/ovenmediaengine/delivery/conf/config.ini`

Set `RECORD_INFO_FILE_BASE_DIR` to the path where OvenMediaEngine's File Publisher generates the recorded files. (Other settings usually do not need to be changed.)

Example `config.ini`:

```ini
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

### **Activating the Delivery Service**

The delivery service is disabled by default. Activate the delivery service:

```bash
sudo systemctl start ovenmediaengine-delivery
```

## Step 3: Starting Recording and Delivery

### **Using the Automatic Recording Feature**

Start streaming `app/stream`. OvenMediaEngine will automatically start recording and deliver the recorded file to the configured Object Storage.

### **Using the Recording REST API**

Start streaming `app/stream`. Call the recording start REST API for `app/stream` to have OvenMediaEngine start recording. Once recording is complete, the delivery service will deliver the recorded file to Object Storage.

Example of calling the recording start API:

```bash
curl --location 'http://{OME_HOST}:{OME_REST_API_PORT}/v1/vhosts/default/apps/app:startRecord' \
--header 'Authorization: Basic {OME_API_CREDENTIAL}' \
--header 'Content-Type: application/json' \
--data '{
    "id": "unique_id",
    "stream": {
        "name": "stream"
    },
    "metadata": "aws_access_key_id='xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',aws_secret_access_key='xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',endpoint='https://object.storage.com',region='us-east-1',bucket_name='bucket_name',object_dir='my/vod/path/',delete='true'"
}'
```


:::info

You can find the Recording REST API documentation at the following URL.\
[https://ovenmedialabs.com/docs/ome/rest-api/v1/virtualhost/application/recording](https://ovenmedialabs.com/docs/ome/rest-api/v1/virtualhost/application/recording)

:::


### **Monitoring the Delivery Status**

Check the delivery service logs to monitor the delivery status of the recorded file:

```bash
tail -f /var/log/ovenmediaengine/delivery/delivery-daemon.log
```

***

This concludes the guide on using OvenMediaEngine to record live streams and deliver recorded files to Object Storage.
