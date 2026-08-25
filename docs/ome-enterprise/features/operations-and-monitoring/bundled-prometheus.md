---
title: Bundled Prometheus
description: "The Prometheus instance shipped with OvenMediaEngine Enterprise — retention, tuning, and how it feeds metrics history to the Web Console."
enterprise_only: true
sidebar_position: 127
---

OvenMediaEngine Enterprise ships with its own Prometheus. It starts alongside the server, scrapes [`/v2/metrics`](openmetrics.md) every 15 seconds, and stores the result so the Web Console can chart how the server behaved over time rather than only what it is doing right now.

Nothing needs to be configured for this to work. At every start the bundled instance reads the API endpoint and `<AccessToken>` out of the same `Server.xml` the server itself uses, so it keeps working after you change any of them — a restart is all it takes. It follows however you bind the API: plaintext, TLS, or both. The Web Console then reads from it automatically.

## What is installed

The package installs a fourth service next to `ovenmediaengine`, `ovenstudio`, and `ovenmediaengine-delivery`:

```bash
sudo systemctl status ovenmediaengine-prometheus
```

Its files live under `/usr/share/ovenmediaengine/prometheus`:

| Path                          | Purpose                                                              |
| ----------------------------- | -------------------------------------------------------------------- |
| `system.env`                  | Retention, listen address, and other tunables. Edit this.            |
| `conf/prometheus.yml`         | Scrape configuration. Edit for advanced changes.                     |
| `conf/targets/ome-local.json` | The local server to scrape. Generated on every start — do not edit.  |
| `conf/access_user`            | Credentials derived from `<AccessToken>`. Generated — do not edit.   |
| `conf/access_token`           | Credentials derived from `<AccessToken>`. Generated — do not edit.   |
| `data/`                       | The time series database.                                            |

`system.env` and `conf/prometheus.yml` are package configuration files, so your changes to them survive upgrades.

On Docker the same layout sits under `/opt/ovenmediaengine/prometheus`, and the settings below are passed as container environment variables instead of through `system.env`.

## Logs

The log is written alongside the other components' logs:

```
/var/log/ovenmediaengine/prometheus/prometheus.log
```

Rotation is handled by `/etc/logrotate.d/ovenmediaengine-prometheus`, installed with the package — Prometheus has no option to write or rotate a log file of its own, so the launcher redirects its output there. In practice the file stays small: start-up writes a couple of dozen lines, and after that only compaction and configuration events are recorded. Scrapes are not logged whether they succeed or fail; a failing scrape shows up as target state instead, which the Web Console surfaces.

To send the log to the systemd journal instead, clear the directory in `system.env` and restart:

```bash
OME_PROMETHEUS_LOG_DIR=
```

```bash
sudo journalctl -u ovenmediaengine-prometheus -f
```

The journal is worth checking either way — the launcher reports what it is scraping, and warns there when it cannot read `<AccessToken>`, before Prometheus itself starts logging.

On Docker the log goes to container output rather than a file, so `docker logs` reaches it.

## Retention

By default the bundled Prometheus keeps **30 days** of metrics, and stops at **5GB** of disk if that comes first.

Both limits apply at once, and on anything but a small server the size limit is the one that bites. Check the table below against your own load: if 30 days of your traffic exceeds 5GB, you will keep the most recent 5GB rather than the full 30 days. Raise the size limit to actually get the window you want.

Retention is also the longest span the Web Console can chart. Selecting a wider range shows only the data that still exists.

Change either limit in `/usr/share/ovenmediaengine/prometheus/system.env`:

```bash
OME_PROMETHEUS_RETENTION_TIME=30d
OME_PROMETHEUS_RETENTION_SIZE=20GB
```

Then restart. Retention is a start-up flag, so reloading the configuration is **not** enough:

```bash
sudo systemctl restart ovenmediaengine-prometheus
```

Keep a size limit even when you have sized for time — it is what protects the disk on a server that turns out busier than the estimate.

### Sizing the disk

Disk use scales with the number of live series, which is driven mostly by the number of streams and their renditions, and secondarily by concurrent viewers. Measured on a running server, roughly:

| Server size                                 | 30 days | Suggested `OME_PROMETHEUS_RETENTION_SIZE` | Suggested `MemoryMax` |
| ------------------------------------------- | ------- | ------------------------------------------ | --------------------- |
| ~10 streams, ~100 concurrent viewers        | ~0.9GB  | 5GB (the default is enough)                | 512MB                 |
| ~50 streams, ~1,000 concurrent viewers      | ~5GB    | 10GB                                       | 1GB                   |
| ~200 streams, ~10,000 concurrent viewers    | ~28GB   | 40GB                                       | 4GB                   |

The service is capped at `MemoryMax=1G`, which suits the middle row. To change it, use a drop-in so the override survives upgrades:

```bash
sudo systemctl edit ovenmediaengine-prometheus
```

```ini
[Service]
MemoryMax=4G
```

Deployments substantially larger than the last row are worth sizing deliberately rather than by the defaults — [contact us](https://ovenmedia.com/ome-consultation) and we will work out the right configuration with you.

## Access

Prometheus listens on `127.0.0.1:9090` and has no authentication of its own. It is bound to loopback for that reason, and it should stay there — the Web Console is the intended way to look at the data, and it is reached through the console's own login.

If you need to reach the Prometheus UI directly, forward the port over SSH rather than changing the bind address:

```bash
ssh -L 9090:127.0.0.1:9090 <user>@<ome-host>
```

Exposing it on a public interface, with `OME_PROMETHEUS_LISTEN=0.0.0.0:9090`, publishes every metric of your server to anyone who can reach the port. Put an authenticating reverse proxy in front if you must.

## Authentication to OvenMediaEngine

Scrapes authenticate with the `<AccessToken>` configured under `<Managers><API>` in `Server.xml`. The launcher reads it at every start and writes the two credential files Prometheus uses, so **changing the token only requires a restart** — the same is true of the API port:

```bash
sudo systemctl restart ovenmediaengine-prometheus
```

### TLS

The scrape follows how `Server.xml` binds the API. If it binds `<Port>`, the scrape uses plain HTTP; if it binds only `<TLSPort>`, the scrape uses HTTPS. When both are bound, plain HTTP is used — the scrape never leaves the host, so TLS adds nothing there.

Certificate verification is deliberately skipped on that connection. It runs over loopback to `127.0.0.1`, which will not match a certificate issued for your server's public name, so verifying it would fail for that reason alone on traffic that never reaches the network.

To scrape somewhere other than the local API, set both `OME_PROMETHEUS_TARGET` and `OME_PROMETHEUS_SCHEME`.

### Access token

One constraint comes from Prometheus rather than from OvenMediaEngine: Basic credentials are always sent as `username:password`, so the token must contain a colon. A token such as `user:secret` works; a single opaque token with no colon — which [`/v2/metrics`](openmetrics.md#authentication) otherwise accepts — cannot be scraped. If your token has no colon, the service logs a warning at start-up and scrapes fail with `401`:

```bash
sudo journalctl -u ovenmediaengine-prometheus | grep WARNING
```

## Settings reference

All settings are read from `/usr/share/ovenmediaengine/prometheus/system.env`, or from the container environment on Docker. All of them require a restart to take effect.

| Variable                        | Default              | Purpose                                                       |
| ------------------------------- | -------------------- | ------------------------------------------------------------- |
| `OME_PROMETHEUS_LISTEN`         | `127.0.0.1:9090`     | Address the HTTP API and UI listen on.                        |
| `OME_PROMETHEUS_RETENTION_TIME` | `30d`                | How long samples are kept.                                    |
| `OME_PROMETHEUS_RETENTION_SIZE` | `5GB`                | Disk backstop.                                                |
| `OME_PROMETHEUS_DATA_DIR`       | `<install>/data`     | Where the time series database is written.                    |
| `OME_PROMETHEUS_LOG_DIR`        | `/var/log/ovenmediaengine/prometheus` | Where the log is written. Empty sends it to the journal. |
| `OME_PROMETHEUS_CONF`           | `<install>/conf/prometheus.yml` | Scrape configuration file.                     |
| `OME_PROMETHEUS_TARGET`         | `127.0.0.1` and the API port from `Server.xml` | The local API to scrape. Set `OME_PROMETHEUS_SCHEME` alongside it. |
| `OME_PROMETHEUS_SCHEME`         | from `Server.xml` | `http` or `https` for the local scrape. |
| `OME_PROMETHEUS_SERVER_XML`     | `<install>/../conf/Server.xml` | `Server.xml` to read the API endpoint and `<AccessToken>` from. |
| `OME_PROMETHEUS_EXTRA_ARGS`     | —                    | Extra Prometheus flags, space separated.                      |

## Docker

The Docker image runs Prometheus as a fourth process, with the same defaults. Two differences matter.

Settings are passed as environment variables:

```bash
docker run -d \
   -e OME_PROMETHEUS_RETENTION_SIZE=20GB \
   ovenmedialabs/ovenmediaengine-enterprise
```

And the database is written inside the container unless you mount a volume, so metrics history is discarded whenever the container is recreated — including on every image upgrade. To keep it:

```bash
docker run -d \
   -v ome-metrics:/opt/ovenmediaengine/prometheus/data \
   ovenmedialabs/ovenmediaengine-enterprise
```

Port 9090 is not published, for the same reason it is bound to loopback in the package installation.

## Turning it off

The Web Console reads its metrics history from this service alone, so stopping it leaves the console's metrics screens empty with a notice explaining why. Live figures elsewhere in the console are unaffected.

```bash
sudo systemctl disable --now ovenmediaengine-prometheus
```

To reclaim the disk it used:

```bash
sudo rm -rf /usr/share/ovenmediaengine/prometheus/data
```
