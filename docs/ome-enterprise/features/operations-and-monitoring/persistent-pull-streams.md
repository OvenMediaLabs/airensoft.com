---
title: Persistent Pull Streams
description: "Persist API-created Pull stream definitions across restarts in OvenMediaEngine Enterprise."
enterprise_only: true
sidebar_position: 125
---

Persistent Pull Streams allow OvenMediaEngine Enterprise to save Pull stream definitions created through the [Stream Creation API](../rest-api/v1/virtual-host/application/stream/README.md#create-stream-pull) and restore them automatically after restart.

This feature is intended for long-lived pull inputs that must survive process restarts without being recreated manually.

## Scope

This persistence flow applies to Pull streams created through the Stream Creation API with `properties.persistent` set to `true`.

It does not describe pull flows driven by `OriginMap` or `OriginMapStore`.

## Create a Persistent Pull Stream

Create the stream through the [Stream Creation API](../rest-api/v1/virtual-host/application/stream/README.md#create-stream-pull), and set `properties.persistent` to `true`:

```http
POST /v1/vhosts/default/apps/app/streams
Authorization: Basic {credentials}
Content-Type: application/json
```

```json
{
  "name": "camera-main",
  "urls": [
    "ovt://origin.example.com:9000/app/camera-main"
  ],
  "properties": {
    "persistent": true,
    "retryCount": 3,
    "noInputFailoverTimeoutMs": 3000,
    "unusedStreamDeletionTimeoutMs": 60000,
    "ignoreRtcpSRTimestamp": false
  }
}
```

## Restore on Restart

During startup, OvenMediaEngine Enterprise restores persistent Pull streams automatically.

The restore order is important:

1. API-created `VirtualHost` and `Application` definitions are loaded from API Storage first.
2. Persistent Pull stream definitions are then loaded from local persistent storage.
3. Each saved Pull stream is recreated from its saved URLs and properties.

This means that if a target `VirtualHost` or `Application` was created through the API and must also survive restart, the API server and [API Storage](api-storage.md) should be enabled as well.

:::info

If a particular Pull stream fails to restore, OvenMediaEngine Enterprise logs the failure and continues restoring the remaining persisted Pull streams. A restore failure does not stop server startup by itself.

:::

## Lifecycle and Cleanup

After it is created, a persistent Pull stream follows the same runtime lifecycle as other Pull streams created through the Stream Creation API.

Persistence affects restart recovery, but it does not make the stream immune to normal runtime deletion paths.

### Normal Restart

On a normal shutdown and restart, the persisted record remains in local persistent storage, and OvenMediaEngine Enterprise attempts to restore the stream on the next startup.

### Delete the Stream Explicitly

If you delete the stream through the Stream API, OvenMediaEngine Enterprise removes both:

* the currently running stream
* the persisted definition in local persistent storage

### Delete the Parent Application or Virtual Host

If the parent `Application` or `VirtualHost` is deleted, the related persisted Pull stream definitions are cleaned up as part of the stream deletion path.

### Same-Name Replacement

If a stream is replaced by a new ingress with the same name, the persisted record is kept so the persistent definition is not removed unintentionally.

### Retry Count Exceeded

If the stream loses its upstream source and reconnection attempts continue to fail until `retryCount` is exceeded, the stream is terminated and deleted.

When that final deletion happens, the persisted definition is also cleaned up, so the stream is not restored again on the next restart.

## Timeout and Retry Behavior

When `persistent` is `true`, the following automatic deletion conditions are ignored:

* `noInputFailoverTimeoutMs`
* `unusedStreamDeletionTimeoutMs`

This means a persistent Pull stream is not deleted only because it has no viewers or because no input packets were received within those timeout windows.

However, persistence does not guarantee that the upstream source is always available. If the source is unreachable during startup or later operation, the stream can still fail to start or recover, and the failure is logged.

If `retryCount` was set when the stream was created, that value is also persisted and reused during restoration. If reconnection attempts exceed that limit, the stream is deleted through the normal Pull stream lifecycle.

## Operational Notes

* The target Pull provider must be enabled in the destination `Application`.
* The local persistence area used by OvenMediaEngine Enterprise must be writable.
* If the destination `VirtualHost` or `Application` is API-created, the API server and API Storage should be enabled so those resources exist before Pull stream restoration runs.

## Corrupted Persistence Data

If persisted Pull stream data exists but cannot be parsed, OvenMediaEngine Enterprise does not overwrite it automatically during later add/remove operations.

This is intentional: the server leaves the existing persisted data untouched to reduce the risk of losing recoverable records.

In this case:

* restore may skip some or all persisted Pull streams
* add/remove operations for persisted Pull streams may be refused
* error logs will indicate that the persisted data could not be parsed

## Troubleshooting

If a persistent Pull stream is not restored after restart, check the following:

1. Confirm that the stream was created with `properties.persistent: true`.
2. Confirm that the target `VirtualHost` and `Application` exist after restart.
3. If the target `VirtualHost` or `Application` was created through the API, confirm that [API Storage](api-storage.md) is enabled and loaded correctly.
4. Confirm that the relevant Pull provider is enabled in the destination `Application`.
5. Confirm that the source URL is still reachable from the OvenMediaEngine host.
6. Check startup logs for restore-related messages and parse errors.

## Related Documents

* [Stream Creation API](../rest-api/v1/virtual-host/application/stream/README.md#create-stream-pull)
* [API Storage](api-storage.md)
* [RTSP Pull](../live-source/rtsp-pull.md)
* [Multicast](../live-source/multicast.md)
