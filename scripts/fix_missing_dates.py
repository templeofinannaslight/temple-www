#!/usr/bin/env python3
"""
Fix posts missing written_date by setting them to 1/1/2021.
"""

import argparse
import os
import sys

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

DEFAULT_DATE = "2021-01-01T00:00:00Z"


def main():
    parser = argparse.ArgumentParser(description="Fix missing written_date fields")
    parser.add_argument(
        "--directus-url", default=os.environ.get("DIRECTUS_URL", "https://content.rso")
    )
    parser.add_argument("--token", default=os.environ.get("DIRECTUS_TOKEN"))
    parser.add_argument("--collection", default="RecoverySky_Blog")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("-k", "--insecure", action="store_true")
    args = parser.parse_args()

    if os.environ.get("NODE_TLS_REJECT_UNAUTHORIZED") == "0":
        args.insecure = True

    verify = not args.insecure
    headers = {"Authorization": f"Bearer {args.token}"}

    # Fetch posts without written_date
    print("Fetching posts without written_date...")
    url = f"{args.directus_url}/items/{args.collection}?filter[written_date][_null]=true&limit=-1"
    resp = requests.get(url, headers=headers, verify=verify)
    resp.raise_for_status()
    posts = resp.json().get("data", [])

    print(f"Found {len(posts)} posts missing written_date")

    updated = 0
    for post in posts:
        title = post.get("title", "")[:40]
        post_id = post.get("id")

        if args.dry_run:
            print(f"  [DRY-RUN] {title} -> 2021-01-01")
            updated += 1
        else:
            try:
                patch_url = f"{args.directus_url}/items/{args.collection}/{post_id}"
                resp = requests.patch(
                    patch_url,
                    json={"written_date": DEFAULT_DATE},
                    headers={**headers, "Content-Type": "application/json"},
                    verify=verify,
                )
                resp.raise_for_status()
                print(f"  [OK] {title} -> 2021-01-01")
                updated += 1
            except Exception as e:
                print(f"  [ERROR] {title}: {e}")

    print(f"\n{'=' * 50}")
    print(f"Updated: {updated}")
    if args.dry_run:
        print("This was a dry run. Run without --dry-run to apply.")


if __name__ == "__main__":
    main()
