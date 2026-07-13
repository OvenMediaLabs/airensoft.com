---
title: OpenMetrics
description: "Expose OvenMediaEngine Enterprise runtime metrics in OpenMetrics 1.0.0 format at /v2/metrics."
enterprise_only: true
sidebar_position: 126
---

OvenMediaEngine Enterprise exposes its runtime metrics at `/v2/metrics` in the [OpenMetrics](https://openmetrics.io/) 1.0.0 exposition format. It is a vendor-neutral, pull-based text format that any OpenMetrics-compatible monitoring system can read.

The response is rendered on demand from the live monitoring model and is read-only: scraping never changes collection state.

## Endpoint

`GET /v2/metrics` is served by the API server, on the same host and port as the REST API.

The path narrows what a scrape returns. Labels are always complete (`vhost`, `app`, `stream`, and so on) regardless of the path; the path only decides which series are emitted.

| Path                                                              | Covers                                        |
| ----------------------------------------------------------------- | --------------------------------------------- |
| `/v2/metrics`                                                     | Whole server                                  |
| `/v2/metrics/vhosts/{vhost}`                                      | One virtual host                              |
| `/v2/metrics/vhosts/{vhost}/apps/{app}`                           | One application                               |
| `/v2/metrics/vhosts/{vhost}/apps/{app}/streams/{stream}`          | One stream                                    |
| `/v2/metrics/vhosts/{vhost}/apps/{app}/streams/{stream}/sessions` | One stream, including its per-session metrics |

Only the `.../sessions` path includes per-session metrics by default; at any other path, request them explicitly with `?collect[]=session`. See [Selecting collectors](#selecting-collectors) below.

## Authentication

The endpoint sits behind the API server access token, like the rest of the REST API. Requests authenticate with HTTP Basic auth.

OvenMediaEngine compares the Base64-decoded Basic credential against the configured `<AccessToken>` verbatim. Set `<AccessToken>` in `username:password` form, then authenticate with standard HTTP Basic auth:

```bash
curl -u 'user:password' http://<ome-host>:<api-port>/v2/metrics
```

If `<AccessToken>` contains no colon, it is not a username/password pair; send the token itself as the Base64 credential (`Authorization: Basic <base64 of the AccessToken>`).

## Configuration

The endpoint is available whenever the API manager is enabled. An optional `<OpenMetrics>` block tunes it:

```xml
<Server>
    <Managers>
        <API>
            <AccessToken>user:password</AccessToken>
            <OpenMetrics>
                <Cache>
                    <Enable>true</Enable>
                    <DurationMs>3000</DurationMs>
                </Cache>
            </OpenMetrics>
        </API>
    </Managers>
</Server>
```

- `<Cache>` (optional): scrape-response caching.
  - `<Enable>` (default `true`): set to `false` to render every request fresh and bypass the cache.
  - `<DurationMs>` (default `3000`): how long a cached response stays valid, in milliseconds. Keep it well under your scrape interval.

Keep caching on when several collectors scrape the same endpoint, or the scrape interval is short on a deployment with many streams and sessions: overlapping scrapes within `DurationMs` reuse one render instead of walking the whole model each time. Turn it off when you need exact point-in-time values on every request (for example, manual debugging with `curl`), or when a single, infrequent scraper makes caching pointless.

## Selecting collectors

Metrics are grouped into collectors. Select a subset with repeated query keys (the node_exporter convention). `collect[]` and `exclude[]` are mutually exclusive.

- `?collect[]=traffic&collect[]=stream`: emit only these collectors.
- `?exclude[]=queue`: emit everything except these.

Collector names are lowercase. An unknown name returns `400` with the list of valid names. A request with no selection emits all default collectors.

| Collector    | Emits                                                      | In default scrape |
| ------------ | ---------------------------------------------------------- | ----------------- |
| `core`       | Build info, process start time                             | Always on         |
| `traffic`    | Received/transmitted byte counters                         | Yes               |
| `connection` | Current connection gauges                                  | Yes               |
| `stream`     | Media/track characteristics, source timing, and ingest RTT | Yes               |
| `queue`      | Managed-queue gauges and counters                          | Yes               |
| `push`       | Push/record byte counters and state                        | Yes               |
| `session`    | Per-session byte counter, throughput, and RTT              | No (opt-in)       |

`core` is always emitted regardless of the selection.

`session` is **not** part of the default scrape: per-session series are high-cardinality and churn quickly. Request it explicitly with `?collect[]=session`, or scrape the `.../streams/{stream}/sessions` path.

Per-session series are currently populated for **WebRTC** playback sessions only. Other publishers (LL-HLS, HLS, and so on) are reflected at the stream level (via `traffic`/`connection`) but do not create per-session entries.

### Round-trip time

Two RTT gauges are exposed in seconds, sourced according to how the connection is measured:

- `ome_session_rtt_seconds` (in `session`): RTT to a WebRTC playback subscriber, derived from RTCP Receiver Reports.
- `ome_stream_rtt_seconds` (in `stream`): ingest RTT of a WebRTC/WHIP input stream, derived from STUN binding request/response timing.

A value of `0` means no RTT has been measured yet (for `ome_stream_rtt_seconds`, also for any non-WebRTC input).

Both gauges are refreshed only when the peer drives new traffic: `ome_session_rtt_seconds` on each incoming RTCP Receiver Report, and `ome_stream_rtt_seconds` on each STUN binding response (the peer's ICE connectivity/consent-freshness checks, typically every few seconds).
If the peer goes silent, the gauge holds its last value until the session or stream is torn down and the series disappears - it is not reset to `0`, so treat a non-zero value as "last measured RTT", not necessarily "current".
`ome_stream_rtt_seconds` reflects the candidate pair that produced the most recent binding response, which is normally the nominated pair but may differ while the peer is still probing multiple pairs.

## Compression

If the scraper sends `Accept-Encoding: gzip`, the response is gzip-compressed and returned with `Content-Encoding: gzip`.

## Format notes

The output conforms to OpenMetrics 1.0.0:

- One `# HELP` and `# TYPE` line per metric family.
- Counters end with `_total`; values use base units (`_bytes`, `_seconds`).
- No per-sample timestamps.
- The document is terminated by a single `# EOF` line.

A minimal scrape looks like:

```text
# HELP ome_build_info OvenMediaEngine build information.
# TYPE ome_build_info info
ome_build_info{version="...",git_version="..."} 1
# HELP process_start_time_seconds Start time of the process since unix epoch in seconds.
# TYPE process_start_time_seconds gauge
process_start_time_seconds 1783445283.19
# EOF
```
