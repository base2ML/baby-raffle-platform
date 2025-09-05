#!/usr/bin/env python3
"""
Tenant Site Builder - Generates customized baby raffle sites
This script builds a tenant-specific site from the template
"""

import os
import json
import shutil
import subprocess
import sys
import argparse
from pathlib import Path
from typing import Dict, Any
import tempfile

def log_info(message: str):
    print(f"ℹ️  {message}")

def log_success(message: str):
    print(f"✅ {message}")

def log_error(message: str):
    print(f"❌ {message}")

def log_warning(message: str):
    print(f"⚠️  {message}")

def replace_placeholders(content: str, config: Dict[str, Any]) -> str:
    """Replace template placeholders with actual tenant configuration"""
    
    replacements = {
        '{{SUBDOMAIN}}': config.get('subdomain', ''),
        '{{SITE_NAME}}': config.get('site_name', ''),
        '{{PARENT_NAMES}}': config.get('parent_names', ''),
        '{{DUE_DATE}}': config.get('due_date', ''),
        '{{VENMO_ACCOUNT}}': config.get('venmo_account', ''),
        '{{PRIMARY_COLOR}}': config.get('primary_color', '#ec4899'),
        '{{SECONDARY_COLOR}}': config.get('secondary_color', '#8b5cf6'),
        '{{DESCRIPTION}}': config.get('description', ''),
        '{{API_BASE_URL}}': config.get('api_base_url', 'https://api.base2ml.com'),
        '{{TENANT_ID}}': config.get('tenant_id', ''),
        '{{SLIDESHOW_IMAGES}}': ', '.join([f'"{img}"' for img in config.get('slideshow_images', [])]),
        '{{LOGO_URL}}': config.get('logo_url', '')
    }
    
    result = content
    for placeholder, value in replacements.items():
        result = result.replace(placeholder, str(value))
    
    return result

def build_tenant_site(tenant_id: str, config: Dict[str, Any], output_dir: str) -> bool:
    """Build a customized tenant site"""
    
    try:
        log_info(f"Building site for tenant: {tenant_id}")
        log_info(f"Subdomain: {config.get('subdomain', 'unknown')}")
        
        # Create temporary build directory
        build_dir = tempfile.mkdtemp(prefix=f"tenant-{tenant_id}-")
        template_dir = Path(__file__).parent
        
        log_info(f"Using build directory: {build_dir}")
        
        # Copy template to build directory
        shutil.copytree(template_dir, f"{build_dir}/site", dirs_exist_ok=True)
        
        os.chdir(f"{build_dir}/site")
        
        # Process all template files
        log_info("Processing template files...")
        
        for root, dirs, files in os.walk("src"):
            for file in files:
                if file.endswith(('.tsx', '.ts', '.js', '.jsx', '.html', '.css')):
                    filepath = os.path.join(root, file)
                    
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Replace placeholders
                    content = replace_placeholders(content, config)
                    
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
        
        # Update package.json with tenant-specific name
        package_json_path = "package.json"
        if os.path.exists(package_json_path):
            with open(package_json_path, 'r') as f:
                package_data = json.load(f)
            
            package_data['name'] = f"baby-raffle-{config.get('subdomain', tenant_id)}"
            
            with open(package_json_path, 'w') as f:
                json.dump(package_data, f, indent=2)
        
        # Create environment file for build
        env_content = f"""
VITE_API_BASE_URL={config.get('api_base_url', 'https://api.base2ml.com')}
VITE_TENANT_ID={tenant_id}
VITE_SUBDOMAIN={config.get('subdomain', '')}
"""
        
        with open('.env.production', 'w') as f:
            f.write(env_content.strip())
        
        # Install dependencies
        log_info("Installing dependencies...")
        result = subprocess.run(['npm', 'install'], capture_output=True, text=True)
        if result.returncode != 0:
            log_error(f"Failed to install dependencies: {result.stderr}")
            return False
        
        # Build the site
        log_info("Building production site...")
        result = subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True)
        if result.returncode != 0:
            log_error(f"Build failed: {result.stderr}")
            return False
        
        # Copy build output to final destination
        if os.path.exists('dist'):
            os.makedirs(output_dir, exist_ok=True)
            shutil.copytree('dist', output_dir, dirs_exist_ok=True)
            log_success(f"Build output copied to: {output_dir}")
        else:
            log_error("Build output directory not found")
            return False
        
        # Cleanup
        shutil.rmtree(build_dir)
        
        log_success(f"Site built successfully for {config.get('subdomain')}.base2ml.com")
        return True
        
    except Exception as e:
        log_error(f"Build failed: {str(e)}")
        return False

def deploy_to_s3(subdomain: str, build_dir: str, bucket_name: str) -> bool:
    """Deploy built site to S3 bucket"""
    
    try:
        log_info(f"Deploying {subdomain} to S3...")
        
        # Create subdomain-specific S3 path
        s3_path = f"s3://{bucket_name}/sites/{subdomain}/"
        
        # Upload files
        result = subprocess.run([
            'aws', 's3', 'sync', build_dir, s3_path, 
            '--delete', '--cache-control', 'max-age=31536000'
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            log_error(f"S3 upload failed: {result.stderr}")
            return False
        
        log_success(f"Site deployed to S3: {s3_path}")
        return True
        
    except Exception as e:
        log_error(f"S3 deployment failed: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Build and deploy tenant baby raffle site')
    parser.add_argument('--tenant-id', required=True, help='Tenant ID')
    parser.add_argument('--config-file', help='JSON config file path')
    parser.add_argument('--config-json', help='JSON config string')
    parser.add_argument('--output-dir', help='Output directory for build')
    parser.add_argument('--deploy-s3', help='S3 bucket name for deployment')
    parser.add_argument('--api-url', default='https://api.base2ml.com', help='API base URL')
    
    args = parser.parse_args()
    
    # Load configuration
    config = {}
    
    if args.config_file:
        with open(args.config_file, 'r') as f:
            config = json.load(f)
    elif args.config_json:
        config = json.loads(args.config_json)
    else:
        # Fetch from API
        import requests
        try:
            response = requests.get(f"{args.api_url}/api/site/config/{args.tenant_id}")
            response.raise_for_status()
            config = response.json()
        except Exception as e:
            log_error(f"Failed to fetch tenant config: {e}")
            sys.exit(1)
    
    # Set default output directory
    if not args.output_dir:
        args.output_dir = f"./builds/{config.get('subdomain', args.tenant_id)}"
    
    # Build the site
    success = build_tenant_site(args.tenant_id, config, args.output_dir)
    
    if not success:
        sys.exit(1)
    
    # Deploy to S3 if requested
    if args.deploy_s3:
        deploy_success = deploy_to_s3(
            config.get('subdomain', args.tenant_id), 
            args.output_dir, 
            args.deploy_s3
        )
        if not deploy_success:
            sys.exit(1)
    
    log_success("Tenant site build completed successfully!")

if __name__ == '__main__':
    main()