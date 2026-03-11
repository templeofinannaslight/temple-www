#!/usr/bin/env python3
"""
Backfill tags from WordPress XML to existing Directus posts.
"""

import argparse
import os
import sys
import urllib3
import xml.etree.ElementTree as ET

import requests

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

NAMESPACES = {
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'wp': 'http://wordpress.org/export/1.2/',
}


def get_text(element, default=''):
    if element is None:
        return default
    return element.text or default


def parse_wordpress_tags(xml_file: str) -> dict[str, list[str]]:
    """Parse WordPress XML and return mapping of title -> tags list."""
    tree = ET.parse(xml_file)
    root = tree.getroot()
    channel = root.find('channel')

    if channel is None:
        raise ValueError("Invalid WordPress export")

    tags_map = {}
    for item in channel.findall('item'):
        post_type = get_text(item.find('wp:post_type', NAMESPACES))
        if post_type != 'post':
            continue

        title = get_text(item.find('title'))

        # Extract tags
        tags = []
        for category in item.findall('category'):
            domain = category.get('domain', '')
            if domain == 'post_tag':
                tag_name = category.text or ''
                if tag_name:
                    tags.append(tag_name)

        if title and tags:
            tags_map[title] = tags

    return tags_map


def main():
    parser = argparse.ArgumentParser(description='Backfill tags from WordPress to Directus')
    parser.add_argument('xml_file', help='WordPress XML export file')
    parser.add_argument('--directus-url', default=os.environ.get('DIRECTUS_URL', 'https://content.rso'))
    parser.add_argument('--token', default=os.environ.get('DIRECTUS_TOKEN'))
    parser.add_argument('--collection', default='Mikkis_Mess')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('-k', '--insecure', action='store_true')
    args = parser.parse_args()

    if os.environ.get('NODE_TLS_REJECT_UNAUTHORIZED') == '0':
        args.insecure = True

    verify = not args.insecure
    headers = {'Authorization': f'Bearer {args.token}'}

    # Parse WordPress tags
    print(f"Parsing tags from: {args.xml_file}")
    wp_tags = parse_wordpress_tags(args.xml_file)
    print(f"Found {len(wp_tags)} posts with tags in WordPress")

    # Fetch all Directus posts
    print(f"\nFetching posts from Directus...")
    url = f"{args.directus_url}/items/{args.collection}?limit=-1"
    resp = requests.get(url, headers=headers, verify=verify)
    resp.raise_for_status()
    posts = resp.json().get('data', [])
    print(f"Found {len(posts)} posts in Directus")

    # Update posts
    updated = 0
    skipped = 0
    not_found = 0
    already_has = 0

    for post in posts:
        title = post.get('title', '')
        post_id = post.get('id')
        current_tags = post.get('tags')

        # Skip if already has tags
        if current_tags and len(current_tags) > 0:
            already_has += 1
            continue

        # Find matching WordPress tags
        if title not in wp_tags:
            not_found += 1
            continue

        new_tags = wp_tags[title]

        if args.dry_run:
            print(f"  [DRY-RUN] {title[:40]}")
            print(f"            -> {new_tags}")
            updated += 1
        else:
            try:
                patch_url = f"{args.directus_url}/items/{args.collection}/{post_id}"
                resp = requests.patch(
                    patch_url,
                    json={'tags': new_tags},
                    headers={**headers, 'Content-Type': 'application/json'},
                    verify=verify
                )
                resp.raise_for_status()
                print(f"  [OK] {title[:40]} -> {new_tags}")
                updated += 1
            except Exception as e:
                print(f"  [ERROR] {title[:40]}: {e}")

    print(f"\n{'='*50}")
    print(f"Updated: {updated}")
    print(f"Already had tags: {already_has}")
    print(f"No WP tags found: {not_found}")
    if args.dry_run:
        print("\nThis was a dry run. Run without --dry-run to apply.")


if __name__ == '__main__':
    main()
