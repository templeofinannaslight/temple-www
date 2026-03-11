#!/usr/bin/env python3
"""
Update Directus posts with original WordPress creation dates.

Sets the 'written_date' field to the original WordPress post creation date.
"""

import argparse
import os
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime

import requests
import urllib3

# Suppress SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# WordPress XML namespaces
NAMESPACES = {
    "content": "http://purl.org/rss/1.0/modules/content/",
    "wp": "http://wordpress.org/export/1.2/",
}


def get_text(element, default=""):
    """Safely extract text from an XML element."""
    if element is None:
        return default
    return element.text or default


def parse_wordpress_dates(xml_file: str) -> dict[str, str]:
    """
    Parse WordPress XML and return a mapping of title -> original date (ISO format).

    Returns:
        Dict mapping post title to ISO 8601 date string for Directus
    """
    tree = ET.parse(xml_file)
    root = tree.getroot()
    channel = root.find("channel")

    if channel is None:
        raise ValueError("Invalid WordPress export")

    dates = {}
    for item in channel.findall("item"):
        post_type = get_text(item.find("wp:post_type", NAMESPACES))
        if post_type != "post":
            continue

        title = get_text(item.find("title"))
        date_str = get_text(item.find("wp:post_date_gmt", NAMESPACES))

        if title and date_str and not date_str.startswith("0000"):
            try:
                dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
                # ISO 8601 format for Directus
                iso_date = dt.isoformat() + "Z"
                dates[title] = iso_date
            except ValueError:
                pass

    return dates


def fetch_directus_posts(
    directus_url: str, token: str, collection: str, verify_ssl: bool
) -> list[dict]:
    """Fetch all posts from Directus."""
    url = f"{directus_url}/items/{collection}?limit=-1"
    headers = {"Authorization": f"Bearer {token}"}

    response = requests.get(url, headers=headers, verify=verify_ssl)
    response.raise_for_status()
    return response.json().get("data", [])


def update_post_written_date(
    directus_url: str,
    token: str,
    collection: str,
    post_id: int,
    written_date: str,
    verify_ssl: bool,
) -> dict:
    """Update a post's written_date in Directus."""
    url = f"{directus_url}/items/{collection}/{post_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {"written_date": written_date}

    response = requests.patch(url, json=payload, headers=headers, verify=verify_ssl)
    response.raise_for_status()
    return response.json()


def main():
    parser = argparse.ArgumentParser(
        description="Update Directus posts with original WordPress creation dates"
    )
    parser.add_argument("xml_file", help="Path to WordPress WXR export file")
    parser.add_argument(
        "--directus-url",
        default=os.environ.get("DIRECTUS_URL", "https://content.rso"),
        help="Directus base URL",
    )
    parser.add_argument(
        "--token", default=os.environ.get("DIRECTUS_TOKEN"), help="Directus API token"
    )
    parser.add_argument(
        "--collection", default="RecoverySky_Blog", help="Directus collection name"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Show changes without applying them"
    )
    parser.add_argument(
        "--insecure",
        "-k",
        action="store_true",
        help="Disable SSL certificate verification",
    )

    args = parser.parse_args()

    # Auto-detect insecure mode from env
    if os.environ.get("NODE_TLS_REJECT_UNAUTHORIZED") == "0":
        args.insecure = True

    verify_ssl = not args.insecure

    if not args.token:
        print("Error: Directus token required")
        sys.exit(1)

    # Parse WordPress dates
    print(f"Parsing WordPress dates from: {args.xml_file}")
    wp_dates = parse_wordpress_dates(args.xml_file)
    print(f"Found {len(wp_dates)} posts with dates")

    # Fetch Directus posts
    print(f"\nFetching posts from Directus...")
    posts = fetch_directus_posts(
        args.directus_url, args.token, args.collection, verify_ssl
    )
    print(f"Found {len(posts)} posts in Directus")

    # Update posts
    updated = 0
    skipped = 0
    not_found = 0

    for post in posts:
        title = post.get("title", "")
        post_id = post.get("id")
        written_date = post.get("written_date")

        # Skip if written_date already set
        if written_date:
            skipped += 1
            continue

        # Find matching WordPress date
        if title not in wp_dates:
            not_found += 1
            print(f"  [SKIP] No WP date found: {title[:50]}")
            continue

        original_date = wp_dates[title]

        if args.dry_run:
            print(f"  [DRY-RUN] {title[:40]} -> {original_date[:10]}")
            updated += 1
        else:
            try:
                update_post_written_date(
                    args.directus_url,
                    args.token,
                    args.collection,
                    post_id,
                    original_date,
                    verify_ssl,
                )
                print(f"  [OK] {title[:40]} -> {original_date[:10]}")
                updated += 1
            except Exception as e:
                print(f"  [ERROR] {title[:40]}: {e}")

    # Summary
    print(f"\n{'=' * 50}")
    print(f"Updated: {updated}")
    print(f"Skipped (written_date already set): {skipped}")
    print(f"Not found in WordPress: {not_found}")
    if args.dry_run:
        print("\nThis was a dry run. Use without --dry-run to apply changes.")


if __name__ == "__main__":
    main()
