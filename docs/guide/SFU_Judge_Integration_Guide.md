# SFU Judge Integration Guide

This document is intended for future developers who need to understand and maintain the judge integration in the new project.

It focuses on the **SFU Judge-related setup, workflow, and debugging process** that matter when connecting a new project to the existing judge system.

---

## 1. What this system does

The project does **not** get the final judge result immediately after sending a submission.

The judge workflow is **asynchronous**:

1. The project sends a submission to the SFU Judge server.
2. The judge server immediately responds that the submission is queued.
3. The judge processes the submission in the background.
4. The judge later sends the final result back to the project through a **callback endpoint**.

Because of this design:

- A successful submit request does **not** mean the final verdict is available yet.
- If submissions remain stuck in `PENDING` or `In Queue`, the first thing to check is whether the callback is being sent to the correct place.

---

## 2. High-level architecture

At a high level, the integration works like this:

```text
Project backend (coder)
    -> submit to SFU Judge
SFU Judge
    -> returns immediate queue response
SFU Judge workers process submission asynchronously
    -> callback to project backend
Project backend receives callback
    -> updates submission status/result in database
```

In the current project, the backend should support callback routes such as:

- `/api/judge-callback`
- `/api/m/judge_result` (legacy-compatible route)

The legacy route exists because the older system expected callback traffic there.

---

## 3. Important behavior to remember

### 3.1 The judge is asynchronous

When submitting to the judge endpoint, the response is expected to indicate that the job was accepted into the queue, for example:

```json
{"Status":"In Queue"}
```

This is normal. It does **not** mean the judge result is missing.

The real verdict is expected to arrive later through the callback.

### 3.2 The callback is the critical part

The most important part of this integration is not just sending the submission, but making sure the judge can successfully call back into the project.

Common symptom of callback problems:

- submission request succeeds
- immediate response says queued
- database stays `PENDING`
- no callback log appears in the project backend

In practice, this usually means:

- callback URL is wrong
- judge service needs restart
- network/firewall issue exists
- a required service such as Redis or workers is not running

---

## 4. Judge server locations and configuration

### 4.1 Problem files

The judge problem files are located at:

```text
/home/usr/ablondal/sfu_judge_problems/
```

This folder contains the problem-related files used by the judge.

If there is a problem with a specific judge problem or test data, this is one of the first places to inspect.

---

### 4.2 Apache configuration

The Apache configuration can be checked at:

```text
/etc/apache2/sites-available/judge-api.conf
```

Use this to inspect how the judge API is exposed and whether there are any host or routing-related issues.

---

### 4.3 Systemd configuration folder

Systemd configuration files are in:

```text
/etc/systemd/system
```

Relevant custom files include:

- `judge-gunicorn.service`
- `rq-workers.target`
- `rq-worker@.service`

The worker target starts the actual worker instances automatically.

---

## 5. Main services involved

The judge depends on several services working together.

### 5.1 `judge-gunicorn.service`

This is the main judge API service.

It is responsible for serving the judge application and handling incoming judge API requests.

---

### 5.2 `rq-workers.target`

This target controls the judge workers.

Important note:

- Do **not** manually manage individual workers unless you specifically need to.
- In normal use, start/stop/restart **`rq-workers.target`** rather than the worker instances directly.

The template service `rq-worker@.service` is used underneath to run multiple workers.

---

### 5.3 `redis.service`

Redis is required for the queue system.

If judge services refuse to start, or queued submissions never get processed, check Redis first.

Professor note:

> If something refuses to start, check that `redis.service` is running. It should always be running.

This is an important dependency and is easy to overlook.

---

## 6. Useful systemd commands

### 6.1 Check service status

```bash
sudo systemctl status judge-gunicorn
sudo systemctl status rq-workers.target
sudo systemctl status rq-worker@1
sudo systemctl status rq-worker@2
sudo systemctl status redis
```

Note:

- `rq-workers.target` is a target, not a service, so it requires the `.target` extension.

---

### 6.2 Start services

```bash
sudo systemctl start judge-gunicorn
sudo systemctl start rq-workers.target
sudo systemctl start redis
```

---

### 6.3 Stop services

```bash
sudo systemctl stop judge-gunicorn
sudo systemctl stop rq-workers.target
sudo systemctl stop redis
```

---

### 6.4 Restart services

```bash
sudo systemctl restart judge-gunicorn
sudo systemctl restart rq-workers.target
sudo systemctl restart redis
```

---

### 6.5 Reload systemd after changing unit files

If any systemd files are modified, reload systemd before starting or restarting services:

```bash
sudo systemctl daemon-reload
```

Do not skip this step after changing service definitions.

---

## 7. Networking and firewall checks

To inspect the firewall/networking setup:

```bash
sudo ufw status
```

This is useful if:

- the judge appears healthy locally
- submit requests work
- callbacks never reach the project backend

A firewall or networking rule may be preventing communication.

---

## 8. Expected callback flow in the project

A project integrating with SFU Judge should generally do the following:

### Step 1: Create a submission record locally

Before contacting the judge, create a submission row in the project database.

Typically the initial status should be something like:

- `PENDING`
- `IN_QUEUE`

This local record should include a stable ID that can later be matched when the judge sends the callback.

---

### Step 2: Send the submission to the judge

Send the submission data to the judge submission endpoint.

The immediate response is expected to indicate that the submission was queued, not finished.

---

### Step 3: Wait for judge callback

The judge later calls back into the project backend.

Historically, the legacy system used callback payloads like:

```json
{
  "sid": "...",
  "status": "...",
  "judge_output": "...",
  "score": "...",
  "connection_id": "..."
}
```

Important fields:

- `sid`: used to match the submission in the project database
- `status`: verdict such as AC, WA, TLE, RE, CE, etc.
- `judge_output`: extra details/output from judging
- `score`: score information if applicable
- `connection_id`: legacy-related field; may be present depending on the integration

---

### Step 4: Update the local submission state

After the callback arrives, the project backend should:

- locate the submission using `sid`
- update the final status/verdict
- store relevant output fields
- refresh any history, scoreboard, or UI state as needed

---

## 9. Legacy knowledge from the older system

The older `codeserver` integration expected callback traffic on a route like:

```text
/m/judge_result
```

It also expected a callback payload with fields such as:

- `sid`
- `status`
- `judge_output`
- `score`
- `connection_id`

Because of that history, the new project may keep both:

- a modern callback route
- a legacy-compatible callback alias

This helps reduce integration breakage when the judge still expects the old callback path.

---

## 10. Most common real-world failure mode

The most common integration failure is:

> The submit request succeeds, but the callback is being sent to the wrong host or wrong route.

Symptoms:

- judge submission returns `In Queue`
- no final result ever appears
- backend shows no callback log
- submission remains `PENDING`

This often happens when the callback target is configured to the wrong machine or domain.

For example, if the judge is still pointing to an older host instead of the current project host, everything can appear healthy except the final result never arrives.

When debugging, always verify:

1. which exact host the judge is calling
2. which exact route it is calling
3. whether your backend route is reachable from the judge server

---

## 11. Recommended debugging checklist

When the judge integration is not working, use this order:

### 11.1 Confirm the judge accepted the submission

Check whether the submit request returned a queue response such as:

```json
{"Status":"In Queue"}
```

If not, the problem is in the submission step itself.

---

### 11.2 Check whether callback logs appear in the project backend

If the project backend never logs an incoming callback, the problem is usually outside the application logic.

Focus on:

- callback host
- callback route
- firewall/networking
- judge service status

---

### 11.3 Check judge services

Verify that all critical services are running:

```bash
sudo systemctl status judge-gunicorn
sudo systemctl status rq-workers.target
sudo systemctl status redis
```

If workers are down, jobs will stay queued.

If Redis is down, queue processing may fail entirely.

---

### 11.4 Check Apache and networking

Inspect:

- `/etc/apache2/sites-available/judge-api.conf`
- `sudo ufw status`

These checks help identify routing and firewall issues.

---

### 11.5 Restart services after configuration changes

If something was changed but behavior did not change afterward, make sure the relevant services were actually reloaded/restarted.

Typical sequence:

```bash
sudo systemctl daemon-reload
sudo systemctl restart judge-gunicorn
sudo systemctl restart rq-workers.target
```

---

## 12. Practical notes for future developers

### 12.1 Do not assume synchronous behavior

Do not write project logic that assumes the submit API call returns the final verdict immediately.

The correct design is:

- create local submission record
- submit to judge
- show pending state
- wait for callback
- update UI/status later

---

### 12.2 Logging is essential

Add clear logging for:

- outgoing judge submissions
- callback endpoint hits
- parsed callback payloads
- final database updates

Without callback logs, it is very hard to tell whether the problem is:

- judge-side
- network-side
- route mismatch
- payload parsing
- database update logic

---

### 12.3 Keep a legacy callback route if needed

If the judge or older configuration still expects a legacy callback path, keeping a compatibility endpoint can save a lot of time.

---

### 12.4 If everything looks correct but nothing happens, check restarts

A recurring operational issue is that configuration changes are made, but the relevant services were never restarted.

Always confirm restarts actually happened.

---

## 13. Short summary

The SFU Judge integration is primarily a **queue + worker + callback** system.

The key points to remember are:

- submission is asynchronous
- the callback is the most important part
- Redis is a required dependency
- worker services must be running
- Apache/network configuration may block callbacks
- wrong callback host/route is one of the most common causes of failure

If a submission stays queued or pending, do not only inspect the application code. Also inspect the judge services, callback routing, and network path.

---

## 14. Quick reference

### Important paths

```text
Problem files:
/home/usr/ablondal/sfu_judge_problems/

Apache config:
/etc/apache2/sites-available/judge-api.conf

Systemd config folder:
/etc/systemd/system
```

### Important services

```text
judge-gunicorn.service
rq-workers.target
rq-worker@.service
redis.service
```

### Useful commands

```bash
sudo systemctl status judge-gunicorn
sudo systemctl status rq-workers.target
sudo systemctl status redis
sudo systemctl daemon-reload
sudo systemctl restart judge-gunicorn
sudo systemctl restart rq-workers.target
sudo ufw status
```

---

## 15. Suggested handoff note

If you are the next developer working on this integration, start by verifying these three things before changing code:

1. The judge services are running.
2. The callback host and route are correct.
3. The backend logs show whether callbacks are arriving.

In many cases, the issue is operational rather than purely application logic.
