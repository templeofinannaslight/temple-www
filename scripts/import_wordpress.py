#!/usr/bin/env python3
"""
WordPress to Directus Migration Script

Parses a WordPress WXR export file and uploads posts to a Directus CMS instance.
"""

import argparse
import hashlib
import json
import mimetypes
import os
import re
import sys
import urllib3
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterator
from urllib.parse import urlparse, urljoin

import requests

# Suppress SSL warnings when using --insecure
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# WordPress XML namespaces
NAMESPACES = {
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'wp': 'http://wordpress.org/export/1.2/',
    'dc': 'http://purl.org/dc/elements/1.1/',
    'excerpt': 'http://wordpress.org/export/1.2/excerpt/',
}


@dataclass
class WordPressPost:
    """Represents a parsed WordPress post."""
    wp_id: int
    title: str
    content: str
    date_created: str
    date_updated: str
    status: str
    slug: str
    categories: list[str]
    tags: list[str]


def get_text(element: ET.Element | None) -> str:
    """Safely extract text from an XML element."""
    if element is None:
        return ''
    return element.text or ''


def clean_wordpress_content(content: str) -> str:
    """
    Convert WordPress Gutenberg block format to clean HTML for Directus WYSIWYG.

    Removes all WordPress-specific artifacts:
    - Block comments (<!-- wp:* -->)
    - WordPress classes (wp-*, is-*, size-*, has-*)
    - WordPress wrapper divs
    - Empty attributes

    Args:
        content: Raw WordPress content with block comments

    Returns:
        Clean HTML suitable for Directus WYSIWYG (TinyMCE)
    """
    if not content:
        return ''

    cleaned = content

    # 1. Remove WordPress block comments: <!-- wp:blockname --> and <!-- wp:blockname {"json":...} -->
    cleaned = re.sub(r'<!--\s*/?wp:[a-z-]+(\s+\{[^}]*\})?\s*-->', '', cleaned)

    # 2. Remove WordPress-specific classes from class attributes
    # Pattern matches class="..." and removes wp-*, is-*, size-*, has-* classes
    def clean_classes(match):
        full_attr = match.group(0)
        classes = match.group(1)

        # Split classes and filter out WordPress-specific ones
        class_list = classes.split()
        clean_list = [
            c for c in class_list
            if not (
                c.startswith('wp-') or
                c.startswith('is-') or
                c.startswith('size-') or
                c.startswith('has-') or
                'wp-' in c or
                'wordpress' in c.lower()
            )
        ]

        if clean_list:
            return f'class="{" ".join(clean_list)}"'
        return ''  # Remove empty class attribute

    cleaned = re.sub(r'class="([^"]*)"', clean_classes, cleaned)

    # 3. Remove WordPress embed wrapper divs, keep content
    # <div class="wp-block-embed__wrapper">URL</div> -> URL
    cleaned = re.sub(
        r'<div[^>]*>\s*(https?://[^\s<]+)\s*</div>',
        r'<p>\1</p>',
        cleaned
    )

    # 4. Remove empty class="" attributes left behind
    cleaned = re.sub(r'\s*class=""', '', cleaned)

    # 5. Simplify embed figures - unwrap figure around just a URL paragraph
    # <figure><p>URL</p></figure> -> <p>URL</p>
    cleaned = re.sub(
        r'<figure[^>]*>\s*(<p>https?://[^<]+</p>)\s*</figure>',
        r'\1',
        cleaned
    )

    # 6. Clean up empty/whitespace-only attributes
    cleaned = re.sub(r'\s+alt=""', ' alt=""', cleaned)  # Keep alt="" for accessibility
    cleaned = re.sub(r'\s+(?:id|style|data-\w+)=""', '', cleaned)

    # 7. Clean extra spaces in tags: <figure > -> <figure>
    cleaned = re.sub(r'<(\w+)\s+>', r'<\1>', cleaned)
    cleaned = re.sub(r'\s+/>', '/>', cleaned)  # <img  /> -> <img/>

    # 8. Normalize whitespace between block elements (preserve line breaks)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)  # Max 2 newlines
    cleaned = re.sub(r'>\s*\n\s*\n\s*<', '>\n\n<', cleaned)  # Preserve paragraph breaks
    cleaned = re.sub(r'>\s*\n\s*<', '>\n<', cleaned)  # Single newline between tags

    # 9. Clean inline whitespace (but not newlines)
    cleaned = re.sub(r'[^\S\n]{2,}', ' ', cleaned)  # Multiple spaces -> single (not newlines)

    # 10. Strip leading/trailing whitespace
    cleaned = cleaned.strip()

    return cleaned


# WordPress image URL pattern
WP_IMAGE_PATTERN = re.compile(
    r'https://mikkismess\.wordpress\.com/wp-content/uploads/[^"\'>\s]+'
)


def extract_image_urls(content: str) -> set[str]:
    """Extract all WordPress image URLs from content."""
    urls = set()
    for match in WP_IMAGE_PATTERN.findall(content):
        # Normalize URL: remove query params like ?w=1024 to get original
        url = match.split('?')[0]
        # Clean any trailing XML artifacts
        url = url.rstrip(']}>')
        urls.add(url)
    return urls


def extract_all_image_urls(posts: list[WordPressPost]) -> set[str]:
    """Extract all unique image URLs from all posts."""
    all_urls = set()
    for post in posts:
        all_urls.update(extract_image_urls(post.content))
    return all_urls


def download_image(url: str, session: requests.Session) -> tuple[bytes, str]:
    """
    Download an image from a URL.

    Returns:
        Tuple of (image_bytes, filename)
    """
    response = session.get(url, timeout=30)
    response.raise_for_status()

    # Extract filename from URL
    parsed = urlparse(url)
    filename = Path(parsed.path).name

    return response.content, filename


def upload_image_to_directus(
    image_data: bytes,
    filename: str,
    directus_url: str,
    token: str,
    folder_id: str,
    verify_ssl: bool = True
) -> dict:
    """
    Upload an image to Directus.

    Args:
        image_data: Raw image bytes
        filename: Desired filename
        directus_url: Directus base URL
        token: API token
        folder_id: UUID of target folder
        verify_ssl: Whether to verify SSL certificates

    Returns:
        Directus file response with id and URL info
    """
    url = f"{directus_url}/files"

    # Determine content type from filename
    content_type, _ = mimetypes.guess_type(filename)
    if not content_type:
        content_type = 'application/octet-stream'

    # Important: folder must be added BEFORE file in multipart form
    # File tuple format: (filename, data, content_type)
    files = [
        ('folder', (None, folder_id)),
        ('file', (filename, image_data, content_type)),
    ]

    headers = {
        'Authorization': f'Bearer {token}',
    }

    response = requests.post(url, files=files, headers=headers, verify=verify_ssl)
    response.raise_for_status()
    return response.json()


def migrate_images(
    posts: list[WordPressPost],
    directus_url: str,
    token: str,
    folder_id: str,
    verbose: bool = False,
    verify_ssl: bool = True
) -> dict[str, str]:
    """
    Download all images from WordPress and upload to Directus.

    Returns:
        Mapping of old WordPress URL -> new Directus URL
    """
    all_urls = extract_all_image_urls(posts)
    print(f"Found {len(all_urls)} unique images to migrate")

    url_mapping = {}
    session = requests.Session()

    for i, wp_url in enumerate(sorted(all_urls), 1):
        try:
            # Download from WordPress
            image_data, filename = download_image(wp_url, session)

            # Upload to Directus
            result = upload_image_to_directus(
                image_data, filename, directus_url, token, folder_id, verify_ssl
            )

            # Build new Directus URL
            file_id = result['data']['id']
            new_url = f"{directus_url}/assets/{file_id}"

            url_mapping[wp_url] = new_url
            print(f"[{i}/{len(all_urls)}] ✓ {filename}")

            if verbose:
                print(f"  {wp_url}")
                print(f"  -> {new_url}")

        except Exception as e:
            print(f"[{i}/{len(all_urls)}] ✗ {wp_url}")
            print(f"  Error: {e}")

    return url_mapping


def replace_image_urls(content: str, url_mapping: dict[str, str]) -> str:
    """Replace WordPress image URLs with Directus URLs in content."""
    result = content

    for old_url, new_url in url_mapping.items():
        # Replace exact URL
        result = result.replace(old_url, new_url)

        # Also replace URLs with query params (e.g., ?w=1024)
        # Find all variations of this URL in content
        pattern = re.escape(old_url) + r'(\?[^"\'>\s]*)?'
        result = re.sub(pattern, new_url, result)

    return result


def parse_wordpress_xml(file_path: str) -> Iterator[WordPressPost]:
    """
    Parse a WordPress WXR export file and yield blog posts.

    Args:
        file_path: Path to the WordPress XML export file

    Yields:
        WordPressPost objects for each blog post found
    """
    tree = ET.parse(file_path)
    root = tree.getroot()

    channel = root.find('channel')
    if channel is None:
        raise ValueError("Invalid WordPress export: no channel element found")

    for item in channel.findall('item'):
        # Check if this is a blog post (not attachment, page, etc.)
        post_type = get_text(item.find('wp:post_type', NAMESPACES))
        if post_type != 'post':
            continue

        # Extract post data
        wp_id = int(get_text(item.find('wp:post_id', NAMESPACES)) or 0)
        title = get_text(item.find('title'))
        content = get_text(item.find('content:encoded', NAMESPACES))

        # Parse dates (WordPress format: YYYY-MM-DD HH:MM:SS)
        date_created = get_text(item.find('wp:post_date_gmt', NAMESPACES))
        date_updated = get_text(item.find('wp:post_modified_gmt', NAMESPACES))

        # Map WordPress status to Directus status
        wp_status = get_text(item.find('wp:status', NAMESPACES))
        status = 'published' if wp_status == 'publish' else 'draft'

        slug = get_text(item.find('wp:post_name', NAMESPACES))

        # Extract categories and tags
        categories = []
        tags = []
        for category in item.findall('category'):
            domain = category.get('domain', '')
            name = category.text or ''
            if domain == 'category':
                categories.append(name)
            elif domain == 'post_tag':
                tags.append(name)

        yield WordPressPost(
            wp_id=wp_id,
            title=title,
            content=content,
            date_created=date_created,
            date_updated=date_updated,
            status=status,
            slug=slug,
            categories=categories,
            tags=tags,
        )


def format_datetime_for_directus(wp_datetime: str) -> str | None:
    """
    Convert WordPress datetime to Directus ISO format.

    Args:
        wp_datetime: WordPress datetime string (YYYY-MM-DD HH:MM:SS)

    Returns:
        ISO 8601 formatted datetime string, or None if empty/invalid
    """
    if not wp_datetime:
        return None

    # WordPress uses 0000-00-00 for invalid/missing dates
    if wp_datetime.startswith('0000-00-00'):
        return None

    try:
        dt = datetime.strptime(wp_datetime, '%Y-%m-%d %H:%M:%S')
        return dt.isoformat() + 'Z'
    except ValueError:
        return None


def upload_to_directus(
    post: WordPressPost,
    directus_url: str,
    token: str,
    collection: str = 'Mikkis_Mess',
    url_mapping: dict[str, str] | None = None,
    verify_ssl: bool = True
) -> dict:
    """
    Upload a single post to Directus.

    Args:
        post: The WordPressPost to upload
        directus_url: Base URL of the Directus instance
        token: Directus API bearer token
        collection: Name of the Directus collection
        url_mapping: Optional mapping of old image URLs to new Directus URLs
        verify_ssl: Whether to verify SSL certificates

    Returns:
        Response JSON from Directus API

    Raises:
        requests.HTTPError: If the API request fails
    """
    url = f"{directus_url}/items/{collection}"

    # Clean WordPress block comments from content for Directus WYSIWYG
    clean_content = clean_wordpress_content(post.content)

    # Replace image URLs if mapping provided
    if url_mapping:
        clean_content = replace_image_urls(clean_content, url_mapping)

    payload = {
        'title': post.title,
        'content': clean_content,
        'status': post.status,
    }

    # Add tags if available
    if post.tags:
        payload['tags'] = post.tags

    # Add dates if available
    date_created = format_datetime_for_directus(post.date_created)
    if date_created:
        payload['date_created'] = date_created

    date_updated = format_datetime_for_directus(post.date_updated)
    if date_updated:
        payload['date_updated'] = date_updated

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }

    response = requests.post(url, json=payload, headers=headers, verify=verify_ssl)
    response.raise_for_status()
    return response.json()


def main():
    parser = argparse.ArgumentParser(
        description='Import WordPress posts to Directus CMS'
    )
    parser.add_argument(
        'xml_file',
        help='Path to WordPress WXR export file'
    )
    parser.add_argument(
        '--directus-url',
        default=os.environ.get('DIRECTUS_URL', 'https://content.rso'),
        help='Directus base URL (default: $DIRECTUS_URL or https://content.rso)'
    )
    parser.add_argument(
        '--token',
        default=os.environ.get('DIRECTUS_TOKEN'),
        help='Directus API token (default: $DIRECTUS_TOKEN)'
    )
    parser.add_argument(
        '--collection',
        default='Mikkis_Mess',
        help='Directus collection name (default: Mikkis_Mess)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Parse and display posts without uploading'
    )
    parser.add_argument(
        '--status-filter',
        choices=['all', 'published', 'draft'],
        default='all',
        help='Only import posts with this status (default: all)'
    )
    parser.add_argument(
        '--limit',
        type=int,
        default=0,
        help='Maximum number of posts to import (0 = unlimited)'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Show detailed output'
    )
    parser.add_argument(
        '--migrate-images',
        action='store_true',
        help='Download images from WordPress and upload to Directus'
    )
    parser.add_argument(
        '--folder-id',
        default=os.environ.get('DIRECTUS_FOLDER_ID'),
        help='Directus folder UUID for image uploads (default: $DIRECTUS_FOLDER_ID)'
    )
    parser.add_argument(
        '--insecure', '-k',
        action='store_true',
        help='Disable SSL certificate verification (for self-signed certs)'
    )

    args = parser.parse_args()

    # Check env var for insecure mode
    if os.environ.get('NODE_TLS_REJECT_UNAUTHORIZED') == '0':
        args.insecure = True

    # Validate token requirement for actual uploads
    if not args.dry_run and not args.token:
        print("Error: Directus API token required. Set DIRECTUS_TOKEN env var or use --token")
        sys.exit(1)

    # Validate folder-id requirement for image migration
    if args.migrate_images and not args.folder_id:
        print("Error: --folder-id required for image migration. Set DIRECTUS_FOLDER_ID env var or use --folder-id")
        sys.exit(1)

    # Parse the WordPress export
    print(f"Parsing WordPress export: {args.xml_file}")

    posts = list(parse_wordpress_xml(args.xml_file))
    print(f"Found {len(posts)} blog posts")

    # Filter by status if requested
    if args.status_filter != 'all':
        posts = [p for p in posts if p.status == args.status_filter]
        print(f"After status filter ({args.status_filter}): {len(posts)} posts")

    # Apply limit if requested
    if args.limit > 0:
        posts = posts[:args.limit]
        print(f"Limited to {len(posts)} posts")

    # Migrate images if requested
    url_mapping = {}
    if args.migrate_images and not args.dry_run:
        print(f"\n{'='*50}")
        print("PHASE 1: Migrating images")
        print(f"{'='*50}")
        url_mapping = migrate_images(
            posts,
            args.directus_url,
            args.token,
            args.folder_id,
            args.verbose,
            verify_ssl=not args.insecure
        )
        print(f"\nMigrated {len(url_mapping)} images")
        print(f"\n{'='*50}")
        print("PHASE 2: Importing posts")
        print(f"{'='*50}")

    # Process posts
    success_count = 0
    error_count = 0

    for i, post in enumerate(posts, 1):
        if args.dry_run:
            print(f"\n[{i}/{len(posts)}] {post.title}")
            print(f"  Status: {post.status}")
            print(f"  Created: {post.date_created}")
            clean_content = clean_wordpress_content(post.content)
            image_urls = extract_image_urls(post.content)
            print(f"  Content length: {len(clean_content)} chars (was {len(post.content)} raw)")
            print(f"  Images: {len(image_urls)}")
            if args.verbose:
                print(f"  Slug: {post.slug}")
                print(f"  Categories: {', '.join(post.categories) or 'none'}")
                print(f"  Tags: {', '.join(post.tags) or 'none'}")
                if image_urls:
                    print(f"  Image URLs:")
                    for img_url in sorted(image_urls):
                        print(f"    - {img_url}")
                preview = clean_content[:200].replace('\n', ' ')
                print(f"  Preview: {preview}...")
        else:
            try:
                result = upload_to_directus(
                    post,
                    args.directus_url,
                    args.token,
                    args.collection,
                    url_mapping,
                    verify_ssl=not args.insecure
                )
                success_count += 1
                print(f"[{i}/{len(posts)}] ✓ {post.title}")
                if args.verbose:
                    print(f"  -> ID: {result.get('data', {}).get('id')}")
            except requests.HTTPError as e:
                error_count += 1
                print(f"[{i}/{len(posts)}] ✗ {post.title}")
                print(f"  Error: {e}")
                if args.verbose and hasattr(e, 'response'):
                    print(f"  Response: {e.response.text}")

    # Summary
    print(f"\n{'='*50}")
    if args.dry_run:
        print(f"DRY RUN: Would import {len(posts)} posts")
    else:
        print(f"Import complete: {success_count} succeeded, {error_count} failed")


if __name__ == '__main__':
    main()
