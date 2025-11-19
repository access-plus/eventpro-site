#!/usr/bin/env python3
"""
Calculate folder hashes for change detection in monorepo for GitLab CI.
"""

import os
import sys
import subprocess
import tempfile
import hashlib
import json
import argparse

def run_command(command: str, check: bool = True) -> tuple:
    """Execute a shell command."""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, check=check)
        return result.returncode == 0, result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return False, e.stderr.strip()

def folder_hash(directory: str) -> str:
    """Calculate SHA256 hash of directory contents."""
    if not os.path.exists(directory):
        return ""
    
    hashes = []
    for root, _, files in os.walk(directory):
        for file in sorted(files):
            file_path = os.path.join(root, file)
            # Skip git files and temporary files
            if '.git' in file_path or file_path.endswith('.tmp'):
                continue
            try:
                with open(file_path, 'rb') as f:
                    file_hash = hashlib.sha256(f.read()).hexdigest()
                    # Include relative path in hash to detect file moves/renames
                    rel_path = os.path.relpath(file_path, directory)
                    hashes.append(f"{rel_path}:{file_hash}")
            except (IOError, OSError):
                continue
    
    if not hashes:
        return ""
    
    combined = ''.join(sorted(hashes)).encode()
    return hashlib.sha256(combined).hexdigest()

def get_gitlab_commits():
    """Determine base and head commits for GitLab CI."""
    # For merge requests
    if os.environ.get('CI_MERGE_REQUEST_IID'):
        base = os.environ.get('CI_MERGE_REQUEST_TARGET_BRANCH_NAME', 'main')
        head = os.environ.get('CI_COMMIT_SHA')
        
        print(f"Merge request detected. Target branch: {base}, Head: {head}")
        
        # Get the actual commit SHA for target branch
        success, base_sha = run_command(f"git rev-parse origin/{base}")
        if success:
            base = base_sha
            print(f"Using origin/{base} as base commit: {base_sha}")
        else:
            print(f"Failed to get origin/{base}, trying fallback...")
            # Fallback: use the commit before this one
            success, base = run_command("git rev-parse HEAD~1")
            if success:
                print(f"Using HEAD~1 as base commit: {base}")
            else:
                print("Warning: Could not determine base commit, using initial commit")
                success, base = run_command("git rev-list --max-parents=0 HEAD")
                if success:
                    print(f"Using initial commit as base: {base}")
    
    # For branch pipelines (push events)
    elif os.environ.get('CI_COMMIT_BEFORE_SHA'):
        base = os.environ.get('CI_COMMIT_BEFORE_SHA')
        head = os.environ.get('CI_COMMIT_SHA')
        
        # Handle initial push to new branch
        if base == '0000000000000000000000000000000000000000':
            success, base = run_command("git rev-list --max-parents=0 HEAD")
    
    # For default branch (main) after merge
    else:
        # Compare with previous commit
        success, base = run_command("git rev-parse HEAD~1")
        if not success:
            # First commit in repository
            success, base = run_command("git rev-list --max-parents=0 HEAD")
        head = os.environ.get('CI_COMMIT_SHA')
    
    return base, head

def get_services_from_config():
    """Extract services from configuration or discover automatically."""
    services = []
    
    # Method 1: Environment variable
    env_services = os.environ.get('SERVICES')
    if env_services:
        services = [s.strip() for s in env_services.split(',')]
    
    # Method 2: Auto-discover service directories
    elif not services:
        for item in os.listdir('.'):
            if (os.path.isdir(item) and 
                (item.startswith('service-') or 
                 os.path.exists(os.path.join(item, 'Dockerfile')) or
                 os.path.exists(os.path.join(item, 'package.json')) or
                 os.path.exists(os.path.join(item, 'pom.xml')))):
                services.append(item)
    
    # Method 3: Fallback to default pattern
    if not services:
        for item in os.listdir('.'):
            if os.path.isdir(item) and item.startswith('service-'):
                services.append(item)
    
    return sorted(services)

def main():
    parser = argparse.ArgumentParser(description='Detect service changes in monorepo')
    parser.add_argument('--services', help='Comma-separated list of services')
    parser.add_argument('--output', choices=['env', 'json'], default='env', 
                       help='Output format: env or json')
    parser.add_argument('--output-file', help='File to write output')
    args = parser.parse_args()
    
    # Get services list
    if args.services:
        services = [s.strip() for s in args.services.split(',')]
    else:
        services = get_services_from_config()
    
    if not services:
        print("Error: No services found or specified")
        sys.exit(1)
    
    print(f"Detected services: {', '.join(services)}")
    
    # Get base and head commits
    base, head = get_gitlab_commits()
    
    if not head:
        print("Error: Could not determine HEAD commit")
        sys.exit(1)
    
    print(f"Comparing changes from {base or 'initial commit'} to {head}")
    
    # Additional debugging for GitLab CI
    if os.environ.get('GITLAB_CI'):
        print("Running in GitLab CI environment")
        print(f"CI_MERGE_REQUEST_IID: {os.environ.get('CI_MERGE_REQUEST_IID', 'NOT_SET')}")
        print(f"CI_MERGE_REQUEST_TARGET_BRANCH_NAME: {os.environ.get('CI_MERGE_REQUEST_TARGET_BRANCH_NAME', 'NOT_SET')}")
        print(f"CI_COMMIT_SHA: {os.environ.get('CI_COMMIT_SHA', 'NOT_SET')}")
    
    # Initialize results
    changes = {}
    hashes = {}
    
    with tempfile.TemporaryDirectory() as temp_dir:
        for service in services:
            base_dir = os.path.join(temp_dir, f"base-{service}")
            head_dir = os.path.join(temp_dir, f"head-{service}")
            
            os.makedirs(base_dir, exist_ok=True)
            os.makedirs(head_dir, exist_ok=True)
            
            # Export git trees
            if base:
                # Try to export service directory from base commit
                run_command(f"git archive {base} {service} 2>/dev/null | tar -x -C {base_dir}", check=False)
            
            # Export service directory from head commit
            run_command(f"git archive {head} {service} 2>/dev/null | tar -x -C {head_dir}", check=False)
            
            # Calculate hashes
            base_hash = folder_hash(base_dir)
            head_hash = folder_hash(head_dir)
            
            # Determine if changed
            if not base:  # No base commit (initial commit)
                changed = bool(head_hash)  # Changed if service exists in HEAD
            else:
                changed = base_hash != head_hash
            
            changes[service] = changed
            hashes[service] = {
                'base': base_hash,
                'head': head_hash
            }
            
            print(f"Service {service}: changed={changed} (base: {base_hash[:8] if base_hash else 'none'}, head: {head_hash[:8] if head_hash else 'none'})")
    
    # Output results
    if args.output == 'json':
        output_data = {
            'changes': changes,
            'hashes': hashes,
            'base_commit': base,
            'head_commit': head
        }
        output_str = json.dumps(output_data, indent=2)
    else:  # env format
        lines = []
        for service, changed in changes.items():
            env_name = service.upper().replace('-', '_')
            lines.append(f"{env_name}_CHANGED={str(changed).lower()}")
        output_str = '\n'.join(lines)
    
    # Write to file if specified
    if args.output_file:
        try:
            with open(args.output_file, 'w') as f:
                f.write(output_str)
            print(f"Output written to {args.output_file}")
            # Verify the file was written correctly
            if os.path.exists(args.output_file):
                print(f"File {args.output_file} exists and has {os.path.getsize(args.output_file)} bytes")
            else:
                print(f"ERROR: File {args.output_file} was not created")
        except Exception as e:
            print(f"ERROR writing to {args.output_file}: {e}")
    
    # Print to stdout
    print("\nFinal output:")
    print(output_str)
    
    # Set GitLab CI job variables (if running in GitLab CI)
    if os.environ.get('GITLAB_CI'):
        for service, changed in changes.items():
            env_var = f"{service.upper().replace('-', '_')}_CHANGED"
            # In GitLab CI, you can use this in subsequent jobs
            print(f"::set-output name={env_var}::{str(changed).lower()}")
            # Also set as environment variable for current job
            os.environ[env_var] = str(changed).lower()

if __name__ == "__main__":
    main()
