---
title: Session Management (WebRTC Only)
sidebar_position: 136
---

Session Management assigns a unique session name to each WebRTC playback ("Session") and lets you manage sessions for operational convenience.

## Session Identification

By default, the server issues a UUID per WebRTC session. For operations, you can explicitly set the session name by query (`session=xxx`) via the end of the WebRTC playback URL (`ws[s]://...`).

* Example: `ws://ome-host/app/stream/playlist?session=my_session`


:::info

We recommend that if you need traceability in production, you use rule-based session names.

:::


### Duplicate Playback Prevention

If the same session name attempts to play from two or more locations at the same time, the second request is rejected. This policy prevents conflicts and misuse when the same `app/stream` is accessed from multiple places.

## Session Management API

These APIs allow you to list sessions, force-terminate sessions, and inquire session metrics.

### Sessions: List and Terminate API

You can control WebRTC playback using this API. When you identify a problematic session, call the `DELETE` API to force-stop it immediately.
&#x20;For proactive access control, pair Session Management with [Admission Webhooks](https://ovenmedialabs.com/docs/ome/access-control/admission-webhooks).


[session.md](../rest-api/v1/session.md)


### Session Metrics API

You can retrieve real-time metrics per session, including average/peak throughput, total bytes sent, and more.


[session.md](../rest-api/v1/statistics/current/session.md)

