"""Show the current Renovate retry in the pull request description."""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

BOT_ID = 353687181
CONTROL = re.compile(r"(?m)^ *- +\[([ xX])\] +<!-- rebase-check -->[^\r\n]*")
DEFAULT_CONTROL = " - [ ] <!-- rebase-check -->If you want to rebase/retry this PR, check this box"
STATUS = re.compile(r"(?ms)^<!-- nyte-retry:start -->\n.*?^<!-- nyte-retry:end -->\n*")
# A Markdown reference definition is invisible, but Renovate reads the raw marker.
HIDDEN_REQUEST = '[nyte-retry-request]: # "- [x] <!-- rebase-check -->"'


def api(endpoint, body=None):
    """Read a PR or update just its description."""
    args = ["gh", "api", endpoint]
    if body is not None:
        args.extend(["--method", "PATCH", "--input", "-"])
    result = subprocess.run(
        args,
        input=json.dumps({"body": body}) if body is not None else None,
        text=True,
        stdout=subprocess.PIPE,
        check=True,
    )
    return json.loads(result.stdout) if body is None else None


def status_block(text):
    """Mark the status so the next run can replace it without duplicating it."""
    return f"<!-- nyte-retry:start -->\n{text}\n<!-- nyte-retry:end -->"


def main(phase):
    repo = os.environ["TARGET_REPO"]
    number = os.environ["PR_NUMBER"]
    if not re.fullmatch(r"use-nyte/[a-zA-Z0-9._-]+", repo) or not re.fullmatch(r"[1-9][0-9]*", number):
        raise SystemExit("Invalid Nyte pull request")

    endpoint = f"repos/{repo}/pulls/{number}"
    pr = api(endpoint)
    if (
        pr["state"] != "open"
        or pr["user"]["id"] != BOT_ID
        or pr["head"]["repo"]["full_name"] != repo
        or pr["base"]["ref"] != "main"
    ):
        return

    run_url = f'{os.environ["GITHUB_SERVER_URL"]}/{os.environ["GITHUB_REPOSITORY"]}/actions/runs/{os.environ["GITHUB_RUN_ID"]}'
    body = STATUS.sub("", pr.get("body") or "")
    control = CONTROL.search(body)
    if phase == "start":
        if not control or control.group(1).lower() != "x":
            print("The PR is no longer marked for retry.")
            return
        with Path(os.environ["GITHUB_OUTPUT"]).open("a", encoding="utf-8") as output:
            output.write(f'requested=true\nbefore-sha={pr["head"]["sha"]}\n')
        status = status_block(f"**Renovate is retrying this PR.** [View run]({run_url}).\n\n{HIDDEN_REQUEST}")
        updated = body[:control.start()] + status + body[control.end():]
    elif phase == "finish":
        changed = pr["head"]["sha"] != os.environ["BEFORE_SHA"]
        result = f'Branch updated to `{pr["head"]["sha"][:7]}`.' if changed else "No new commit was pushed."
        outcome = os.environ["RENOVATE_OUTCOME"]
        conclusion = "Finished" if outcome == "success" else f"Ended with status `{outcome}`"
        status = status_block(f"**Latest Renovate retry** — {conclusion}. {result} [View run]({run_url}).")
        checkbox = control.group() if control else DEFAULT_CONTROL
        replacement = f"{checkbox}\n\n{status}\n"
        updated = (
            body[:control.start()] + replacement + body[control.end():]
            if control else f"{body.rstrip()}\n\n{replacement}"
        )
    else:
        raise SystemExit("Expected retry phase: start or finish")
    if updated != pr.get("body"):
        api(endpoint, updated)


if __name__ == "__main__":
    main(sys.argv[1])
