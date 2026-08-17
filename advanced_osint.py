import sys
import json
import requests
import os
import dns.resolver
import whois
from concurrent.futures import ThreadPoolExecutor

# --- CONFIGURATION ---
# The script will function without this, but breach checking will be disabled.
# For enhanced functionality, set this as an environment variable.
HIBP_API_KEY = os.environ.get("HIBP_API_KEY")

# --- MODULE 1: USERNAME FOOTPRINTING ---
def check_username_on_site(site_info, username):
    """
    Checks for the existence of a username on a given site.
    """
    url = site_info["url"].format(username=username)
    headers = {'User-Agent': 'AlphaCore-Recon-System/1.0'}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        error_type = site_info.get("error_type", "string")
        if error_type == "status_code" and response.status_code != 404:
            return {"site": site_info["name"], "url": url, "status": "found"}
        if error_type == "string" and site_info["error_str"] not in response.text:
            return {"site": site_info["name"], "url": url, "status": "found"}
    except requests.RequestException:
        return None
    return None

def scan_username(username):
    """
    Orchestrates the username scan across multiple platforms.
    """
    sites = [
        {"name": "GitHub", "url": "https://github.com/{}", "error_type": "status_code"},
        {"name": "Twitter/X", "url": "https://twitter.com/{}", "error_type": "string", "error_str": "This account doesn’t exist"},
        {"name": "Instagram", "url": "https://www.instagram.com/{}/", "error_type": "string", "error_str": "page isn't available"},
        {"name": "Reddit", "url": "https://www.reddit.com/user/{}", "error_type": "string", "error_str": "nobody on Reddit goes by that name"},
    ]
    results = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(check_username_on_site, site, username) for site in sites]
        for future in futures:
            result = future.result()
            if result:
                results.append(result)
    return {"social_footprints": results}

# --- MODULE 2: EMAIL ANALYSIS ---
def scan_email(email):
    """
    Analyzes an email address for domain validity and optional data breaches.
    """
    results = {}
    domain = email.split('@')[1]
    try:
        mx_records = dns.resolver.resolve(domain, 'MX')
        results['domain_validity'] = {"valid_mx_records": True, "records": [str(r.exchange) for r in mx_records]}
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
        results['domain_validity'] = {"valid_mx_records": False, "records": []}

    # Gracefully handle missing HIBP API key
    if not HIBP_API_KEY:
        results['breaches'] = {"status": "skipped", "message": "HIBP_API_KEY not configured."}
    else:
        headers = {"hibp-api-key": HIBP_API_KEY, "user-agent": "AlphaCore-Recon-System"}
        try:
            response = requests.get(f"https://haveibeenpwned.com/api/v3/breachedaccount/{email}", headers=headers, timeout=15)
            if response.status_code == 200:
                results['breaches'] = {"status": "complete", "pwned": True, "breaches": response.json()}
            elif response.status_code == 404:
                results['breaches'] = {"status": "complete", "pwned": False}
            else:
                results['breaches'] = {"status": "error", "message": f"HIBP API returned status {response.status_code}"}
        except requests.RequestException as e:
            results['breaches'] = {"status": "error", "message": f"Failed to connect to HIBP API: {e}"}
    
    return results

# --- MODULE 3: DOMAIN ANALYSIS ---
def scan_domain(domain):
    """
    Performs a WHOIS lookup on a given domain.
    """
    results = {}
    try:
        w = whois.whois(domain)
        results['whois'] = {
            "registrar": w.registrar, "creation_date": w.creation_date,
            "expiration_date": w.expiration_date, "name_servers": w.name_servers, "emails": w.emails
        }
    except Exception as e:
        results['whois'] = {"error": f"WHOIS lookup failed: {str(e)}"}
    return results

# --- MAIN ORCHESTRATOR ---
def main():
    """
    Determines the query type and executes the appropriate scan module.
    """
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Invalid arguments. Usage: <query_type> <value>"}))
        sys.exit(1)
        
    query_type, query_value = sys.argv[1], sys.argv[2]
    final_result = {"query": query_value, "type": query_type}

    if query_type == "username":
        final_result.update(scan_username(query_value))
    elif query_type == "email":
        final_result.update(scan_email(query_value))
    elif query_type == "domain":
        final_result.update(scan_domain(query_value))
    else:
        final_result = {"error": f"Unsupported query type: {query_type}"}

    print(json.dumps(final_result, indent=2, default=str))

if __name__ == "__main__":
    main()